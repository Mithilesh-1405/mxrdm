# Northline Wind Desk

Northline Wind Desk is a React and FastAPI decision-support application for UK day-ahead wind procurement. It shows the latest forecast available at the decision cutoff, compares it with national wind actuals, and quantifies uncertainty for procurement planning.

AI tools were used to assist in building this application.

## Project tree

- `frontend/`: React and Vite application with the two operational views.
- `backend/`: FastAPI application, Elexon client, ingestion code, and local snapshot.
- `backend/data/wind_snapshot.sqlite`: January 2026 runtime snapshot.
- `Dockerfile`: Multi-stage frontend build and non-root Python runtime.
- `docker-compose.yml`: Development and production-like Compose profiles.
- `heroku.yml`: Heroku container-stack deployment definition.
- `vercel.json`: Vercel fallback routing configuration.
- `api/index.py`: Vercel Python entrypoint.
- `.github/workflows/ci.yml`: Push validation for backend, frontend, and Docker.

## Local run

Install frontend dependencies:

`npm install --prefix frontend`

Install backend dependencies:

`py -3.11 -m pip install -r backend/requirements.txt`

Start the backend:

`py -3.11 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000`

Start the frontend in another terminal:

`npm run dev --prefix frontend`

Open `http://localhost:5173`.

The Vite development proxy sends `/api` and `/health` requests to port 8000.

## Docker run

Build the production image:

`docker build -t mxrdm .`

Run it on any available port:

`docker run --rm -p 8080:8080 -e PORT=8080 mxrdm`

Open `http://localhost:8080`.

Run the development profile:

`docker compose --profile dev up --build`

Run the production-like profile:

`docker compose --profile prod up --build`

## Tests and checks

`npm run lint --prefix frontend`

`npm test --prefix frontend -- --run`

`npm run build --prefix frontend`

`py -3.11 -m compileall -q backend`

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Same origin | Frontend API base URL |
| `PORT` | `8000` | Uvicorn listening port |
| `STATIC_DIR` | Empty | Built SPA directory served by FastAPI |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed browser origins |
| `DATA_PATH` | `backend/data/wind_snapshot.sqlite` | Local snapshot path |
| `DEFAULT_CUTOFF` | `09:00` | Europe/London decision cutoff |

## API reference

- `GET /health`
- `GET /api/v1/meta`
- `GET /api/v1/forecast/decision-view?delivery_date=YYYY-MM-DD&cutoff=HH:MM`
- `GET /api/v1/accuracy/summary?cutoff=HH:MM&start=YYYY-MM-DD&end=YYYY-MM-DD`
- `GET /api/v1/accuracy/daily`
- `GET /api/v1/accuracy/by-horizon`
- `GET /api/v1/accuracy/error-distribution`

Interactive API documentation is available at `/docs` when the backend is running.

## Data findings and assumptions

The live base URL is `https://data.elexon.co.uk/bmrs/api/v1`. FUELHH accepts `settlementDateFrom`, `settlementDateTo`, and `fuelType=WIND`. WINDFOR accepts `publishDateTimeFrom` and `publishDateTimeTo`. Both return JSON arrays. FUELHH provides 30-minute national wind actuals. WINDFOR provides hourly forecast rows, so ingestion applies each hourly forecast to its hour start and following half-hour slot.

The default decision cutoff is 09:00 Europe/London on the preceding day. Cutoff equality is included. January 2026 is GMT, while all calculations remain timezone-aware for daylight-saving transitions.

Only January 2026 delivery dates are accepted. Missing forecast slots remain missing. The application never invents demand data or silently fills missing values. Runtime reads use the local SQLite snapshot rather than the live API.

Error is actual minus forecast. Positive error means the forecast under-predicted wind and represents additional power procurement risk.

MAE is mean absolute error. RMSE weights larger misses more heavily. Bias is mean signed error. MAPE excludes zero actuals. Normalized MAE is MAE divided by mean actual wind. Safety margin is the empirical quantile of positive error at the selected confidence.

## Deployment

Heroku container deployment:

`heroku login`

`heroku create`

`heroku stack:set container`

`git push heroku main`

Vercel fallback:

`npm install -g vercel`

`vercel login`

`vercel`

The Vercel configuration expects the FastAPI entrypoint at `api/index.py` and builds the frontend from `frontend/`.

Live app: <PASTE_URL_HERE>
