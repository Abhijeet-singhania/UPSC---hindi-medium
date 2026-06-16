"""Central logging setup — all app logs go to stderr (Docker/terminal)."""
from __future__ import annotations

import logging
import os
import sys


def configure_logging(level: str | None = None) -> None:
    """
    Configure root and app loggers for terminal output.
    Level from LOG_LEVEL env or argument (default INFO).
    """
    log_level = (level or os.environ.get("LOG_LEVEL", "INFO")).upper()
    numeric = getattr(logging, log_level, logging.INFO)

    fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    datefmt = "%Y-%m-%d %H:%M:%S"

    # Reset handlers so uvicorn reload doesn't duplicate lines
    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(numeric)

    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter(fmt=fmt, datefmt=datefmt))
    root.addHandler(handler)

    # App + uvicorn access logs at same level
    for name in ("app", "uvicorn", "uvicorn.error", "uvicorn.access"):
        logging.getLogger(name).setLevel(numeric)

    logging.getLogger(__name__).info("Logging configured at %s", log_level)
