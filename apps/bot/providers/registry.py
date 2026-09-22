"""Provider registry for Toxic Anime.

Only adapters that respect applicable copyright, licensing, and provider terms
should be registered here. The Telegram layer consumes normalized contracts.
"""

from collections.abc import Iterable

from .base import AnimeProvider


class ProviderRegistry:
    def __init__(self, providers: Iterable[AnimeProvider] = ()) -> None:
        self._providers: dict[str, AnimeProvider] = {
            provider.name: provider for provider in providers
        }

    def register(self, provider: AnimeProvider) -> None:
        self._providers[provider.name] = provider

    def names(self) -> tuple[str, ...]:
        return tuple(sorted(self._providers))

    def get(self, name: str) -> AnimeProvider | None:
        return self._providers.get(name)

    def default(self) -> AnimeProvider | None:
        return next(iter(self._providers.values()), None)
