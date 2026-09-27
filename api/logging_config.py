"""
Customer360 Production Structured Logging Configuration
======================================================
Provides structured JSON/formatted logging with request correlation,
timestamping, log levels, and performance latency tracking.
"""

import sys
import time
import logging
import json
from typing import Callable
from starlette.requests import Request
from starlette.responses import Response


class JSONFormatter(logging.Formatter):
    """Formats log records as structured JSON objects for cloud log aggregators."""

    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
        }
        if hasattr(record, "request_id"):
            log_obj["request_id"] = record.request_id
        if hasattr(record, "path"):
            log_obj["path"] = record.path
        if hasattr(record, "method"):
            log_obj["method"] = record.method
        if hasattr(record, "status_code"):
            log_obj["status_code"] = record.status_code
        if hasattr(record, "duration_ms"):
            log_obj["duration_ms"] = record.duration_ms
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)


def setup_logging(log_level: str = "INFO", json_logs: bool = False) -> logging.Logger:
    """Configures root application logger with appropriate formatting."""
    logger = logging.getLogger("customer360")
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    
    # Avoid duplicate handlers on reload
    if logger.handlers:
        return logger

    handler = logging.StreamHandler(sys.stdout)
    if json_logs:
        handler.setFormatter(JSONFormatter())
    else:
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    return logger


logger = setup_logging()
