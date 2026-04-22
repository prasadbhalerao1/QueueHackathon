from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse

class QueueOSException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

def register_exception_handlers(app: FastAPI):
    @app.exception_handler(QueueOSException)
    async def queueos_exception_handler(request: Request, exc: QueueOSException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"status": "error", "message": exc.detail},
        )
        
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": "Internal Server Error"},
        )
