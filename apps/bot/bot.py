"""Toxic Anime Telegram bot service.

This is the Railway service entrypoint. Provider and storage adapters are
kept behind explicit interfaces so the frontend and bot remain decoupled.
"""

import asyncio
import logging
import os

from aiohttp import web
from dotenv import load_dotenv
from pyrogram import Client, filters

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("toxic-anime-bot")

PORT = int(os.getenv("PORT", "8080"))
API_ID = int(os.environ["API_ID"])
API_HASH = os.environ["API_HASH"]
BOT_TOKEN = os.environ["BOT_TOKEN"]

app = Client(
    "toxic_anime_bot",
    api_id=API_ID,
    api_hash=API_HASH,
    bot_token=BOT_TOKEN,
    workdir="/tmp/toxic-anime",
)


async def health(_: web.Request) -> web.Response:
    return web.json_response({"status": "ok", "service": "toxic-anime-bot"})


async def root(_: web.Request) -> web.Response:
    return web.json_response({"service": "toxic-anime-bot", "status": "running"})


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


@app.on_message(filters.command("start"))
async def start_command(_, message):
    await message.reply_text(
        "Welcome to Toxic Anime! 🎬\n\n"
        "The Railway bot service is online. Provider integration is being initialized."
    )


async def main() -> None:
    runner = await start_http_server()
    try:
        await app.start()
        logger.info("Telegram bot started")
        await asyncio.Event().wait()
    finally:
        await app.stop()
        await runner.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
