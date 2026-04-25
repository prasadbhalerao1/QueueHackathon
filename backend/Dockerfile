FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Run uvicorn on the port provided by Cloud Run
# Force listen on 8080 for Cloud Run stability
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
