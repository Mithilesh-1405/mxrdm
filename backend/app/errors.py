from fastapi.responses import JSONResponse


def error(code: str, message: str, status: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status, content={"error": {"code": code, "message": message}}
    )
