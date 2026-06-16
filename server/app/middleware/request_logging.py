"""HTTP request/response logging middleware."""
from __future__ import annotations

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("app.http")

_SKIP_PATHS = {"/health", "/"}


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        method = request.method
        quiet = path in _SKIP_PATHS

        if not quiet:
            logger.info("→ %s %s", method, path)

        start = time.perf_counter()
        try:
            response = await call_next(request)
            ms = (time.perf_counter() - start) * 1000
            if not quiet:
                logger.info(
                    "← %s %s %d (%.0fms)",
                    method,
                    path,
                    response.status_code,
                    ms,
                )
            return response
        except Exception:
            ms = (time.perf_counter() - start) * 1000
            logger.exception("← %s %s FAILED (%.0fms)", method, path, ms)
            raise
