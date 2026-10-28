# Northline Wind Desk

Northline Wind Desk is a React and FastAPI decision-support application for UK day-ahead wind procurement. It shows the latest forecast available at the decision cutoff, compares it with national wind actuals, and quantifies uncertainty for procurement planning.

AI tools were used to assist in building this application.

Live app: https://frontend-wheat-three-67.vercel.app

Backend API: https://backend-weld-rho-67.vercel.app

## Architecture

Data moves in one direction: Elexon BMRS API, then an offline refresh script, then a committed SQLite snapshot, then the FastAPI backend, then the React frontend.

- The refresh script is the only component that talks to Elexon. It builds the snapshot ahead of time, so the running application never depends on the live API.
- The backend opens the snapshot read-only and serves versioned endpoints under `/api/v1`.
- Decision-view results are memoized in an in-memory LRU cache of 128 entries, so repeat requests for the same delivery date and cutoff skip the recomputation.
- The Docker image builds the frontend and backend together and serves both from one container. The hosted deployment on Vercel runs them as two separate projects.

## Project tree

- `frontend/`: React and Vite application with the two operational views, Decision View and Forecast Accuracy.
- `frontend/vercel.json`: Rewrites every route to `index.html` so client-side routes such as `/accuracy` survive a page refresh on Vercel.
- `backend/`: FastAPI application, Elexon client, ingestion code, and local snapshot. Python imports start at `app.` and `routers.`, so the backend runs from inside this folder.
- `backend/data/wind_snapshot.sqlite`: January 2026 runtime snapshot, read-only at runtime.
- `Dockerfile`: Multi-stage build. The first stage builds the React app, the second is a Python image that serves the API and the built frontend.
- `docker-compose.yml`: Development and production-like Compose profiles.
- `heroku.yml`: Heroku container-stack deployment definition.
- `.github/workflows/ci.yml`: Push validation for backend, frontend, and Docker.

## Application versions

React - `19.3.1`

Node - `20-alpine`

Python - `3.11`

## Local run

Install frontend dependencies from the repository root:

`npm install`

Install backend dependencies:

`py -3.11 -m pip install -r backend/requirements.txt`

Start the backend from inside the `backend` folder:

`cd backend`

`py -3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8080`

Start the frontend in another terminal, from the repository root:

`npm run dev`

Open `http://localhost:5173`.

The Vite development proxy sends `/api` and `/health` requests to port 8080, so the backend must listen on that port.

## Docker run

The multi-stage build serves both the frontend and backend from one container.

Build the image:

`docker build -t wind-app .`

Run it on any available port:

`docker run --rm -p 8080:8080 -e PORT=8080 wind-app`

Open `http://localhost:8080`.

Run the development profile:

`docker compose --profile dev up --build`


## Tests and checks

`npm run lint`

`npm run build`

`py -3.11 -m compileall -q backend`

## Environment variables

No environment variables are needed to run the application locally or with Docker. Every setting has a working default.

Two variables has been set when deploying the frontend and backend as separate Vercel projects:

| Variable | Set on | Value |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Frontend project | The backend URL |
| `CORS_ORIGINS` | Backend project | The frontend URL|


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

Decision-view results are cached in memory per process. Because the snapshot never changes at runtime, cached results cannot go stale. A restart or redeploy clears the cache, and on Vercel each serverless instance keeps its own cache, so it works as a speed-up and not as shared storage.

Error is actual minus forecast. Negative error means actual wind was lower than forecast, so extra power may need to be bought; positive error means wind was higher than forecast.

MAE is the mean absolute error in MW. Bias is the mean signed error in MW; negative means the forecast over-predicted wind.

## Deployment

### Vercel (live deployment)

Vercel does not run Docker images, so the frontend and backend are deployed as two separate projects from the same repository.
