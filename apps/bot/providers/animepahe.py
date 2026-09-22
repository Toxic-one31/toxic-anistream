"""AnimePahe-compatible metadata adapter.

This adapter is intentionally metadata-only. Configure a lawful, authorized
provider endpoint through ANIME_PROVIDER_BASE_URL; do not bypass access
controls or download content without permission.
"""

from __future__ import annotations

import os
from typing import Any

import aiohttp

from .base import AnimeProvider, AnimeResult, EpisodeResult


class AnimePaheProvider:
    name = "animepahe"

    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = (base_url or os.getenv("ANIME_PROVIDER_BASE_URL", "")).rstrip("/")
        self.timeout = aiohttp.ClientTimeout(total=20)

    async def _request(self, path: str, params: dict[str, Any]) -> Any:
        if not self.base_url:
            raise RuntimeError("ANIME_PROVIDER_BASE_URL is not configured")
        url = f"{self.base_url}/{path.lstrip('/')}"
        async with aiohttp.ClientSession(timeout=self.timeout) as session:
            async with session.get(url, params=params) as response:
                response.raise_for_status()
                return await response.json()

    async def search(self, query: str) -> list[AnimeResult]:
        payload = await self._request("search", {"q": query})
        items = payload.get("results", payload if isinstance(payload, list) else [])
        return [
            AnimeResult(
                title=str(item.get("title", "Untitled")),
                provider_id=str(item.get("id", item.get("provider_id", ""))),
                url=str(item.get("url", "")),
                image_url=item.get("image_url") or item.get("image"),
            )
            for item in items
            if item.get("id") is not None or item.get("provider_id") is not None
        ]

    async def episodes(self, provider_id: str) -> list[EpisodeResult]:
        payload = await self._request(f"anime/{provider_id}/episodes", {})
        items = payload.get("episodes", payload if isinstance(payload, list) else [])
        return [
            EpisodeResult(
                number=int(item.get("number", item.get("episode", 0))),
                title=str(item.get("title", f"Episode {item.get('number', item.get('episode', 0))}")),
                stream_url=item.get("stream_url"),
                download_url=item.get("download_url"),
            )
            for item in items
            if item.get("number", item.get("episode")) is not None
        ]


__all__ = ["AnimePaheProvider"]
