"""Telegram search and episode-selection flow for Toxic Anime Bot."""

from __future__ import annotations

import logging
from collections.abc import Callable

from pyrogram import Client, filters
from pyrogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from providers.base import AnimeResult
from providers.registry import ProviderRegistry
from storage.telegram_channel import TelegramChannelStore

logger = logging.getLogger(__name__)


class SearchFlow:
    """Small in-memory session layer; durable events are written to Telegram storage."""

    def __init__(self, registry: ProviderRegistry, store: TelegramChannelStore) -> None:
        self.registry = registry
        self.store = store
        self.results: dict[int, list[AnimeResult]] = {}

    async def search(self, user_id: int, query: str) -> list[AnimeResult]:
        provider = self.registry.default()
        if provider is None:
            raise RuntimeError("No anime provider is configured")
        results = await provider.search(query)
        self.results[user_id] = results[:8]
        await self.store.set(f"user:{user_id}:last_search", {"query": query, "count": len(results)})
        return self.results[user_id]


def register_search_handlers(
    app: Client,
    registry: ProviderRegistry,
    store: TelegramChannelStore,
) -> SearchFlow:
    flow = SearchFlow(registry, store)

    @app.on_message(filters.command("anime"))
    async def search_command(_, message):
        parts = (message.text or "").split(maxsplit=1)
        if len(parts) < 2 or not parts[1].strip():
            await message.reply_text("☠️ Try: `/anime One Piece`")
            return
        query = parts[1].strip()
        try:
            results = await flow.search(message.from_user.id, query)
        except Exception as exc:  # provider errors must not crash the bot
            logger.warning("Provider search failed: %s", exc)
            await message.reply_text("⚠️ Search is temporarily unavailable. Try again later.")
            return
        if not results:
            await message.reply_text(f"🔎 No results found for `{query}`.")
            return
        buttons = [
            [InlineKeyboardButton(item.title[:60], callback_data=f"anime:pick:{index}")]
            for index, item in enumerate(results)
        ]
        await message.reply_text(
            f"🔎 **TOXIC SEARCH**\n\nResults for: `{query}`",
            reply_markup=InlineKeyboardMarkup(buttons),
        )

    @app.on_callback_query(filters.regex(r"^anime:pick:\d+$"))
    async def pick_anime(_, callback_query):
        user_id = callback_query.from_user.id
        index = int(callback_query.data.rsplit(":", 1)[1])
        results = flow.results.get(user_id, [])
        if index >= len(results):
            await callback_query.answer("Search expired. Search again.", show_alert=True)
            return
        selected = results[index]
        await store.set(
            f"user:{user_id}:selected_anime",
            {"title": selected.title, "provider_id": selected.provider_id},
        )
        provider = registry.default()
        if provider is None:
            await callback_query.answer("No provider configured.", show_alert=True)
            return
        try:
            episodes = await provider.episodes(selected.provider_id)
        except Exception as exc:
            logger.warning("Episode lookup failed: %s", exc)
            await callback_query.message.edit_text("⚠️ Episodes are temporarily unavailable.")
            await callback_query.answer()
            return
        if not episodes:
            await callback_query.message.edit_text("⚠️ No episodes found for this title.")
            await callback_query.answer()
            return
        buttons = [
            [InlineKeyboardButton(f"Episode {episode.number}", callback_data=f"episode:{selected.provider_id}:{episode.number}")]
            for episode in episodes[:50]
        ]
        await callback_query.message.edit_text(
            f"🎬 **{selected.title}**\n\nChoose an episode:",
            reply_markup=InlineKeyboardMarkup(buttons),
        )
        await callback_query.answer()

    @app.on_callback_query(filters.regex(r"^episode:.+:\d+$"))
    async def pick_episode(_, callback_query):
        _, provider_id, number = callback_query.data.split(":", 2)
        user_id = callback_query.from_user.id
        await store.set(
            f"user:{user_id}:selected_episode",
            {"provider_id": provider_id, "episode": int(number)},
        )
        await callback_query.message.edit_text(
            f"✅ **EPISODE SELECTED**\n\nEpisode: **{number}**\n\n"
            "Use `/quality` to choose resolution. Download-worker integration follows next."
        )
        await callback_query.answer("Episode saved")

    return flow
