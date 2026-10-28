import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from app.config import settings
from routers.accuracy import router as accuracy_router
from routers.forecast import router as forecast_router
from routers.health import router as health_router

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
app = FastAPI(title="Wind Forecast Decision API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(health_router)
app.include_router(forecast_router)
app.include_router(accuracy_router)


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"error": {"code": "invalid_request", "message": str(exc)}},
    )


if settings.static_dir and settings.static_dir.exists():
    app.mount(
        "/assets", StaticFiles(directory=settings.static_dir / "assets"), name="assets"
    )


@app.get("/{path:path}")
def spa_fallback(path: str) -> Response:
    if path.startswith("api/") or path == "health":
        return JSONResponse(
            status_code=404,
            content={"error": {"code": "not_found", "message": "Route not found"}},
        )
    if settings.static_dir:
        root = settings.static_dir.resolve()
        candidate = (root / path).resolve()
        if candidate.is_relative_to(root) and candidate.is_file():
            return Response(
                candidate.read_bytes(),
                media_type="text/html" if candidate.suffix == ".html" else None,
            )
        index = settings.static_dir / "index.html"
        if index.exists():
            return Response(index.read_bytes(), media_type="text/html")
    return JSONResponse(
        status_code=404,
        content={"error": {"code": "not_found", "message": "Route not found"}},
    )
