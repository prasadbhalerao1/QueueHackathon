# QueueOS Backend

This is the FastAPI server for the QueueOS project.

## Initial Setup (The Python Equivalent of `npm install`)

1. **Ensure you have Python 3.10+ installed.**
2. **Create a Virtual Environment:**
   ```bash
   python -m venv .venv
   ```
3. **Activate the Virtual Environment:**
   - **Windows (Command Prompt):** `.venv\Scripts\activate.bat`
   - **Windows (PowerShell):** `.\.venv\Scripts\Activate.ps1`
   - **macOS/Linux:** `source .venv/bin/activate`
4. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
5. **Set Up Environment Variables:**
   Ensure your `.env` file is present in the `backend/` directory.

## Running the Development Server (The Equivalent of `npm run dev`)

To start the FastAPI development server with live-reloading enabled, ensure your virtual environment is activated and run:

```bash
uvicorn src.main:app --reload --port 8000
```

* The API will now be available at `http://localhost:8000`.
* You can view the automatically generated interactive Swagger API documentation at `http://localhost:8000/docs`.

## Twilio Webhook Testing
If testing Twilio Webhooks locally, open a new terminal and run:
```bash
npx localtunnel --port 8000
```
Then, update your Twilio Sandbox settings with the generated URL appended with `/api/whatsapp/webhook` (e.g. `https://<your-url>.loca.lt/api/whatsapp/webhook`).
