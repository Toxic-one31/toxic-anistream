"""Quality options shared by Telegram handlers and download workers."""

from dataclasses import dataclass


@dataclass(frozen=True)
class QualityOption:
    key: str
    label: str
    height: int
    max_height: int


QUALITY_OPTIONS: tuple[QualityOption, ...] = (
    QualityOption("360", "360p", 360, 360),
    QualityOption("480", "480p", 480, 480),
    QualityOption("720", "720p", 720, 720),
    QualityOption("1080", "1080p", 1080, 1080),
)


def get_quality(key: str) -> QualityOption | None:
    """Return a supported quality option by its callback key."""
    normalized = str(key).strip().lower().removesuffix("p")
    return next((option for option in QUALITY_OPTIONS if option.key == normalized), None)
