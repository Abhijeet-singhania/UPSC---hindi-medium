"""
In-memory status tracker for the study-material upload/ingestion job.
Mirrors ca_ingestion_status.py — same pattern so the Admin UI can poll it.
Poll via GET /api/v1/ai/admin/upload-status
"""
from __future__ import annotations

import threading
from datetime import datetime, timezone
from typing import Any, Literal

Status = Literal["idle", "running", "completed", "failed"]

_lock = threading.Lock()
_state: dict[str, Any] = {
    "status": "idle",
    "file": None,
    "started_at": None,
    "finished_at": None,
    "logs": [],
    "result": None,
    "error": None,
}

_MAX_LOG_LINES = 200


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def reset(file_name: str) -> None:
    with _lock:
        _state["status"] = "running"
        _state["file"] = file_name
        _state["started_at"] = _now_iso()
        _state["finished_at"] = None
        _state["logs"] = []
        _state["result"] = None
        _state["error"] = None


def append_log(level: str, message: str) -> None:
    entry = {"ts": _now_iso(), "level": level, "message": message}
    with _lock:
        _state["logs"].append(entry)
        if len(_state["logs"]) > _MAX_LOG_LINES:
            _state["logs"] = _state["logs"][-_MAX_LOG_LINES:]


def complete(result: dict[str, Any] | None = None) -> None:
    with _lock:
        _state["status"] = "completed"
        _state["finished_at"] = _now_iso()
        _state["result"] = result


def fail(error: str) -> None:
    with _lock:
        _state["status"] = "failed"
        _state["finished_at"] = _now_iso()
        _state["error"] = error


def get_snapshot() -> dict[str, Any]:
    with _lock:
        return {
            "status": _state["status"],
            "file": _state["file"],
            "started_at": _state["started_at"],
            "finished_at": _state["finished_at"],
            "logs": list(_state["logs"]),
            "result": _state["result"],
            "error": _state["error"],
        }
