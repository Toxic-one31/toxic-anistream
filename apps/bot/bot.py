"""Toxic Anime Bot — Telegram service for the Toxic Anime monorepo."""

import asyncio
import logging
import os
from pathlib import Path

from aiohttp import web
from dotenv import load_dotenv
from pyrogram import Client, filters
from pyrogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from pipeline.quality import QUALITY_OPTIONS, get_quality

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("toxic-anime-bot")

PORT = int(os.getenv("PORT", "8080"))
API_ID = int(os.environ["API_ID"])
API_HASH = os.environ["API_HASH"]
BOT_TOKEN = os.environ["BOT_TOKEN"]
CHANNEL_USERNAME = os.getenv("CHANNEL_USERNAME", "").strip()
DATA_DIR = Path(os.getenv("DATA_DIR", "/tmp/toxic-anime"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

app = Client(
    "toxic_anime_bot",
    api_id=API_ID,
    api_hash=API_HASH,
    bot_token=BOT_TOKEN,
    workdir=str(DATA_DIR),
)

# Temporary session state. Replace with Redis/database persistence when the
# download worker is integrated so selections survive service restarts.
user_quality: dict[int, str] = {}


def menu() -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton("🔎 Search Anime", callback_data="anime:search")],
        [
            InlineKeyboardButton("📥 Downloads", callback_data="bot:downloads"),
            InlineKeyboardButton("📊 Status", callback_data="bot:status"),
        ],
        [InlineKeyboardButton("📚 Help", callback_data="bot:help")],
    ]
    if CHANNEL_USERNAME:
        buttons.insert(
            0,
            [
                InlineKeyboardButton(
                    "📢 Toxic Anime Channel",
                    url=f"https://t.me/{CHANNEL_USERNAME.lstrip('@')}",
                )
            ],
        )
    return InlineKeyboardMarkup(buttons)


def quality_menu() -> InlineKeyboardMarkup:
    """Build the supported 360p–1080p quality selection menu."""
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    f"📱 {option.label}", callback_data=f"quality:{option.key}"
                )
                for option in QUALITY_OPTIONS[:2]
            ],
            [
                InlineKeyboardButton(
                    f"🎬 {option.label}", callback_data=f"quality:{option.key}"
                )
                for option in QUALITY_OPTIONS[2:]
            ],
            [InlineKeyboardButton("↩️ Back", callback_data="bot:help")],
        ]
    )


WELCOME = """☠️ **TOXIC ANIME**

🎬 **Your anime command center**

Search anime • pick episodes • select quality • download

**Quick commands**
• `/anime <title>` — search anime
• `/quality` — select video quality
• `/status` — bot and pipeline status
• `/help` — command guide

_Stay toxic. Watch anime. ⚡_"""

HELP = """☠️ **TOXIC ANIME — HELP**

🔎 `/anime <title>`
Search for an anime title.

🎞️ `/quality`
Choose 360p, 480p, 720p or 1080p.

📊 `/status`
View Telegram, Railway and provider status.

📥 `/downloads`
View the download pipeline status.

**Pipeline**
Search → Anime → Episodes → Quality → Download → Telegram"""


async def health(_: web.Request) -> web.Response:
    return web.json_response(
        {"status": "ok", "service": "toxic-anime-bot", "brand": "Toxic Anime"}
    )


async def root(_: web.Request) -> web.Response:
    return web.json_response(
        {"service": "toxic-anime-bot", "brand": "Toxic Anime", "status": "running"}
    )


async def start_http_server() -> web.AppRunner:
    site_app = web.Application()
    site_app.router.add_get("/", root)
    site_app.router.add_get("/health", health)
    runner = web.AppRunner(site_app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PORT)
    await site.start()
    logger.info("Health server listening on port %s", PORT)
    return runner


def status_text() -> str:
    return """☠️ **TOXIC SYSTEM STATUS**

🟢 Telegram Bot: **ONLINE**
🟢 Railway Service: **ONLINE**
🟡 Anime Provider: **ADAPTER READY**
🟡 Download Pipeline: **INTEGRATION NEXT**

Architecture:
`Telegram → Provider → Episodes → Quality → FFmpeg → Telegram`"""


@app.on_message(filters.command("start"))
async def start_command(_, message):
    await message.reply_text(WELCOME, reply_markup=menu())


@app.on_message(filters.command("help"))
async def help_command(_, message):
    await message.reply_text(HELP, reply_markup=menu())


@app.on_message(filters.command("quality"))
async def quality_command(_, message):
    selected = user_quality.get(message.from_user.id) if message.from_user else None
    suffix = f"\n\nCurrent selection: **{selected}p**" if selected else ""
    await message.reply_text(
        "🎞️ **TOXIC QUALITY SELECTOR**\n\nChoose your target video quality:" + suffix,
        reply_markup=quality_menu(),
    )


@app.on_message(filters.command("status"))
async def status_command(_, message):
    await message.reply_text(status_text(), reply_markup=menu())


@app.on_message(filters.command("downloads"))
async def downloads_command(_, message):
    await message.reply_text(
        "📥 **TOXIC DOWNLOADS**\n\n"
        "The download worker is the next integration stage.\n"
        "Selected quality will be passed to the worker.\n"
        "FFmpeg + aria2 are available in the Railway image.",
        reply_markup=menu(),
    )


@app.on_message(filters.command("anime"))
async def anime_command(_, message):
    parts = (message.text or "").split(maxsplit=1)
    if len(parts) < 2 or not parts[1].strip():
        await message.reply_text("☠️ Try: `/anime One Piece`", reply_markup=menu())
        return
    query = parts[1].strip()
    await message.reply_text(
        f"🔎 **TOXIC SEARCH**\n\nQuery: `{query}`\n\n"
        "🟡 Provider search integration is next.\n"
        "Use `/quality` to prepare your preferred quality.",
        reply_markup=quality_menu(),
    )


@app.on_callback_query()
async def callback_handler(_, callback_query):
    data = callback_query.data or ""
    user_id = callback_query.from_user.id

    if data.startswith("quality:"):
        option = get_quality(data.split(":", 1)[1])
        if option is None:
            await callback_query.answer("Unsupported quality.", show_alert=True)
            return
        user_quality[user_id] = option.key
        await callback_query.message.edit_text(
            f"✅ **QUALITY SELECTED**\n\n"
            f"🎞️ Target quality: **{option.label}**\n"
            f"📐 Maximum height: **{option.max_height}p**\n\n"
            "This selection is ready for the download pipeline.",
            reply_markup=menu(),
        )
        await callback_query.answer(f"{option.label} selected")
        return

    if data == "bot:help":
        await callback_query.message.edit_text(HELP, reply_markup=menu())
    elif data == "bot:status":
        await callback_query.message.edit_text(status_text(), reply_markup=menu())
    elif data == "bot:downloads":
        selected = user_quality.get(user_id, "not selected")
        await callback_query.message.edit_text(
            "📥 **TOXIC DOWNLOADS**\n\n"
            "🟡 Worker integration next.\n"
            f"🎞️ Selected quality: **{selected}p**\n"
            "FFmpeg + aria2: available.",
            reply_markup=menu(),
        )
    elif data == "anime:search":
        await callback_query.answer("Use /anime <title> to search.", show_alert=True)
        return
    await callback_query.answer()


async def main() -> None:
    runner = await start_http_server()
    try:
        await app.start()
        logger.info("☠️ Toxic Anime Bot started")
        await asyncio.Event().wait()
    finally:
        await app.stop()
        await runner.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
