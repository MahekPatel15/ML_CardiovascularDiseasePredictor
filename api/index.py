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
    Intercepts Vercel edge rewrite paths and headers to guarantee seamless routing
    across all frontend templates (/ , /predictor, /insights, /about) and API endpoints (/api/predict).
    """
    if scope.get("type") == "http":
        headers = dict(scope.get("headers", []))
        matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")
        
        path = scope.get("path", "")
        query_string = scope.get("query_string", b"").decode("utf-8")
        
        # If debug=1 is requested, return the exact scope and headers from Vercel
        if "debug=1" in query_string:
            import json
            header_dict = {k.decode("utf-8", "ignore"): v.decode("utf-8", "ignore") for k, v in headers.items()}
            scope_info = {
                "path": path,
                "raw_path": scope.get("raw_path", b"").decode("utf-8", "ignore"),
                "headers": header_dict,
                "query_string": query_string
            }
            body = json.dumps(scope_info, indent=2).encode("utf-8")
            async def debug_send(event):
                pass
            await send({
                "type": "http.response.start",
                "status": 200,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(body)).encode("utf-8"))
                ]
            })
            await send({
                "type": "http.response.body",
                "body": body
            })
            return

        if matched_path:
            scope["path"] = matched_path
            scope["raw_path"] = matched_path.encode("utf-8")
        
        path = scope.get("path", "")
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

