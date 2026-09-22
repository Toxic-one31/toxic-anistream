"""Provider implementations for Toxic Anime Bot."""

from .animepahe import AnimePaheProvider
from .base import AnimeProvider, AnimeResult, EpisodeResult
from .registry import ProviderRegistry

__all__ = [
    "AnimePaheProvider",
    "AnimeProvider",
    "AnimeResult",
    "EpisodeResult",
    "ProviderRegistry",
]
