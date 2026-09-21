"""Toxic Anime Bot — Telegram service for the Toxic Anime monorepo."""

import asyncio
import logging
import os
from pathlib import Path

from aiohttp import web
from dotenv import load_dotenv
from pyrogram import Client, filters
from pyrogram.types import InlineKeyboardButton, InlineKeyboardMarkup

load_dotenv()

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper(),
                    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("toxic-anime-bot")

PORT = int(os.getenv("PORT", "8080"))
API_ID = int(os.environ["API_ID"])
API_HASH = os.environ["API_HASH"]
BOT_TOKEN = os.environ["BOT_TOKEN"]
CHANNEL_USERNAME = os.getenv("CHANNEL_USERNAME", "").strip()
DATA_DIR = Path(os.getenv("DATA_DIR", "/tmp/toxic-anime"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

app = Client("toxic_anime_bot", api_id=API_ID, api_hash=API_HASH,
             bot_token=BOT_TOKEN, workdir=str(DATA_DIR))


def menu() -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton("🔎 Search Anime", callback_data="anime:search")],
        [InlineKeyboardButton("📥 Downloads", callback_data="bot:downloads"),
         InlineKeyboardButton("📊 Status", callback_data="bot:status")],
        [InlineKeyboardButton("📚 Help", callback_data="bot:help")],
    ]
    if CHANNEL_USERNAME:
        buttons.insert(0, [InlineKeyboardButton(
            "📢 Toxic Anime Channel",
            url=f"https://t.me/{CHANNEL_USERNAME.lstrip('@')}"
        )])
    return InlineKeyboardMarkup(buttons)


WELCOME = """☠️ **TOXIC ANIME**

🎬 **Your anime command center**

Search anime • pick episodes • download • track processing

**Quick commands**
• `/anime <title>` — search anime
• `/status` — bot and pipeline status
• `/help` — command guide

_Stay toxic. Watch anime. ⚡_"""

HELP = """☠️ **TOXIC ANIME — HELP**

🔎 `/anime <title>`
Search for an anime title.

📊 `/status`
View Telegram, Railway and provider status.

📥 `/downloads`
View the download pipeline status.

📚 `/help`
Show this menu.

**Pipeline**
Search → Anime → Episodes → Quality → Download → Telegram

Anime providers are isolated behind adapters so the bot can add providers without changing the Telegram UI."""


async def health(_: web.Request) -> web.Response:
    return web.json_response({"status": "ok", "service": "toxic-anime-bot", "brand": "Toxic Anime"})


async def root(_: web.Request) -> web.Response:
    return web.json_response({"service": "toxic-anime-bot", "brand": "Toxic Anime", "status": "running"})


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
`Telegram → Provider → Episodes → FFmpeg → Telegram`"""


@app.on_message(filters.command("start"))
async def start_command(_, message):
    await message.reply_text(WELCOME, reply_markup=menu())


@app.on_message(filters.command("help"))
async def help_command(_, message):
    await message.reply_text(HELP, reply_markup=menu())


@app.on_message(filters.command("status"))
async def status_command(_, message):
    await message.reply_text(status_text(), reply_markup=menu())


@app.on_message(filters.command("downloads"))
async def downloads_command(_, message):
    await message.reply_text(
        "📥 **TOXIC DOWNLOADS**\n\n"
        "The download worker is the next integration stage.\n"
        "FFmpeg + aria2 are already available in the Railway image.",
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
        "🟡 Provider search integration is next.",
        reply_markup=menu(),
    )


@app.on_callback_query()
async def callback_handler(_, callback_query):
    data = callback_query.data or ""
    if data == "bot:help":
        await callback_query.message.edit_text(HELP, reply_markup=menu())
    elif data == "bot:status":
        await callback_query.message.edit_text(status_text(), reply_markup=menu())
    elif data == "bot:downloads":
        await callback_query.message.edit_text(
            "📥 **TOXIC DOWNLOADS**\n\n🟡 Worker integration next.\nFFmpeg + aria2: available.",
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
