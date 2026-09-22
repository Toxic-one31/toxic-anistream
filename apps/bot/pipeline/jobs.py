"""Normalized download job records for the Toxic Anime pipeline."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any


@dataclass
class DownloadJob:
    job_id: str
    user_id: int
    anime_title: str
    episode_number: int
    quality: str
    status: str = "queued"
    source: str = "unknown"
    output_file_id: str | None = None
    error: str | None = None
    created_at: str = ""
    updated_at: str = ""

    def __post_init__(self) -> None:
        now = datetime.now(timezone.utc).isoformat()
        if not self.created_at:
            self.created_at = now
        if not self.updated_at:
            self.updated_at = now

    def update(self, status: str, **fields: Any) -> None:
        self.status = status
        for key, value in fields.items():
            if not hasattr(self, key):
                raise ValueError(f"Unknown download job field: {key}")
            setattr(self, key, value)
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
