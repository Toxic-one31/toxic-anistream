"""Provider contracts used by Toxic Anime Bot.

Implementations should return normalized data and must not expose provider
specific response shapes to Telegram handlers.
"""

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class AnimeResult:
    title: str
    provider_id: str
    url: str
    image_url: str | None = None


@dataclass(frozen=True)
class EpisodeResult:
    number: int
    title: str
    stream_url: str | None = None
    download_url: str | None = None


class AnimeProvider(Protocol):
    name: str

    async def search(self, query: str) -> list[AnimeResult]: ...

    async def episodes(self, provider_id: str) -> list[EpisodeResult]: ...
