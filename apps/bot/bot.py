"""Toxic Anime Bot — Telegram service for the Toxic Anime monorepo.

The bot is intentionally separated from the React frontend and exposes a
small provider boundary so download providers can be added safely.
"""

import asyncio
import logging
import os
from pathlib import Path

from aiohttp import web
from dotenv import load_dotenv
from pyrogram import Client, filters
from pyrogram.types import InlineKeyboardButton, InlineKeyboardMarkup

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
CHANNEL_USERNAME = os.getenv("CHANNEL_USERNAME", "")

DATA_DIR = Path(os.getenv("DATA_DIR", "/data/toxic-anime"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

app = Client(
    "toxic_anime_bot",
    api_id=API_ID,
    api_hash=API_HASH,
    bot_token=BOT_TOKEN,
    workdir=str(DATA_DIR),
)


def menu() -> InlineKeyboardMarkup:
    buttons = [[InlineKeyboardButton("🔎 Search anime", callback_data="anime:search")],
               [InlineKeyboardButton("📚 Help", callback_data="bot:help")]]
    if CHANNEL_USERNAME:
        buttons.insert(0, [InlineKeyboardButton("📢 Toxic Anime Channel", url=f"https://t.me/{CHANNEL_USERNAME.lstrip('@')}")])
    return InlineKeyboardMarkup(buttons)


WELCOME = (
    "☠️ **TOXIC ANIME BOT** 🎬\n\n"
    "Your anime command center.\n"
    "Search titles, choose episodes, and receive download options.\n\n"
    "**Commands**\n"
    "• `/anime <title>` — search anime\n"
    "• `/status` — service status\n"
    "• `/help` — show help\n\n"
    "_Powered by the Toxic Anime monorepo._"
)

HELP = (
    "☠️ **TOXIC ANIME HELP**\n\n"
    "`/anime <title>` — search for a title\n"
    "`/status` — check bot and service status\n"
    "`/help` — display this guide\n\n"
    "Provider downloads and episode selection are connected through the provider adapter layer."
)


async def health(_: web.Request) -> web.Response:
    return web.json_response({"status": "ok", "service": "toxic-anime-bot"})


async def root(_: web.Request) -> web.Response:
    return web.json_response({"service": "toxic-anime-bot", "brand": "Toxic Anime", "status": "running"})


async def start_http_server() -> web.AppRunner:
    site_app = web.Application()
    site_app.router.add_get("/", root)
    site_app.router.add_get("/health", health)
    runner = web.AppRunner(site_app)
    await runner.setup()
    await web.TCPSite(runner, "0.0.0.0", PORT).start()
    logger.info("Health server listening on port %s", PORT)
    return runner


@app.on_message(filters.command("start"))
async def start_command(_, message):
    await message.reply_text(WELCOME, reply_markup=menu())


@app.on_message(filters.command("help"))
async def help_command(_, message):
    await message.reply_text(HELP, reply_markup=menu())


@app.on_message(filters.command("status"))
async def status_command(_, message):
    await message.reply_text(
        "☠️ **TOXIC SYSTEM STATUS**\n\n"
        "🟢 Telegram bot: online\n"
        "🟢 Railway health server: online\n"
        "🟡 Anime provider: adapter pending\n"
        "🟡 Download pipeline: adapter pending"
    )


@app.on_message(filters.command("anime"))
async def anime_command(_, message):
    query = message.text.split(maxsplit=1)[1].strip() if len(message.text.split(maxsplit=1)) > 1 else ""
    if not query:
        await message.reply_text("☠️ Send a title like: `/anime One Piece`")
        return
    await message.reply_text(
        f"🔎 **Toxic Search**\n\nQuery: `{query}`\n\n"
        "The provider adapter is ready for the AnimePahe search implementation."
    )


@app.on_callback_query()
async def callback_handler(_, callback_query):
    if callback_query.data == "bot:help":
        await callback_query.message.edit_text(HELP, reply_markup=menu())
    elif callback_query.data == "anime:search":
        await callback_query.answer("Use /anime <title>", show_alert=True)
    else:
        await callback_query.answer()


async def main() -> None:
    runner = await start_http_server()
    try:
        await app.start()
        logger.info("Toxic Anime Bot started")
        await asyncio.Event().wait()
    finally:
        await app.stop()
        await runner.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
