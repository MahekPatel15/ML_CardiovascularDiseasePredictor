import os
import sys

# Ensure root directory is on sys.path so app and its assets (model.pkl, scaler.pkl, templates) are accessible
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from app import app as fastapi_app

async def app(scope, receive, send):
    """
    Vercel Serverless ASGI Entrypoint.
    Seamlessly normalizes Vercel serverless paths while preserving the original route
    (/, /predictor, /insights, /about, /api/predict, /health, /static/...).
    """
    if scope.get("type") == "http":
        path = scope.get("path", "")

        # If path is pointing to the index entrypoint itself, treat as root '/'
        if path in ("/api/index.py", "/api/index", "/api", "/api/"):
            scope["path"] = "/"
            scope["raw_path"] = b"/"
        elif path.startswith("/api/index.py/"):
            clean = path[13:]
            scope["path"] = clean
            scope["raw_path"] = clean.encode("utf-8")
        elif path.startswith("/api/api/"):
            clean = path[4:]
            scope["path"] = clean
            scope["raw_path"] = clean.encode("utf-8")

    await fastapi_app(scope, receive, send)


