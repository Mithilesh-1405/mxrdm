# Wind forecast backend

## Run

Install dependencies with `py -3.11 -m pip install -r backend/requirements.txt`.

Refresh the January 2026 snapshot with `py -3.11 backend/scripts/refresh.py refresh`.

Start the API with `py -3.11 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000`.

## API findings

The live base URL is `https://data.elexon.co.uk/bmrs/api/v1`. FUELHH accepts `settlementDateFrom`, `settlementDateTo`, and `fuelType=WIND`. WINDFOR accepts `publishDateTimeFrom` and `publishDateTimeTo`. Both return JSON arrays. FUELHH returned 30-minute generation rows. WINDFOR returned hourly forecast rows, so ingestion expands each hourly value to its hour start and following half-hour slot. Requests are chunked into one-day windows and retried with exponential backoff.

## Assumptions

The default decision cutoff is 09:00 Europe/London on the preceding day. The cutoff is inclusive. January 2026 uses GMT, while timezone-aware conversion remains in place for daylight-saving transitions. The snapshot covers delivery dates from 1 January through 31 January 2026. Runtime API calls use only the local SQLite snapshot.

Positive error means actual wind exceeded forecast wind and represents extra power to procure.
