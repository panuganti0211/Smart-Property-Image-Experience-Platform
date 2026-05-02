# Smart Property Image & Experience Platform

Full-stack luxury real estate listings with **async AI image analysis** (room type, features, quality score, improvement tips), **auto cover image** selection, **tags** for search, and a **premium React** UI.

## Stack

| Layer | Choice |
|--------|--------|
| Frontend | React 18 (Vite), React Router, Tailwind CSS, Lucide icons, lightweight UI primitives |
| Backend | Node.js, Express, Multer (upload staging) |
| Database | MongoDB + Mongoose |
| Media | Cloudinary (secure URLs stored on `Property.images`) |
| AI | Google Gemini via `@google/genai`, or **`AI_PROVIDER=mock`** (zero-cost demo, no vision API) |

## Functional coverage (assignment checklist)

1. **Property APIs** — `POST /api/properties` (title, price, location); `GET /api/properties` with **pagination** (`page`, `limit`, `total`, `totalPages`) and **filters** (`location`, `minPrice`, `maxPrice`, `tags` comma-separated); `GET /api/properties/:id`.
2. **Images** — `POST /api/properties/:id/images` (multipart `images`, max 5); URLs persisted on the property document.
3. **AI per image** — room type, key features, quality 0–100, suggestions (lighting/clarity-style tips), tags; merged into property-level tags.
4. **AI description** — short luxury copy from aggregated image summary + tags.
5. **Tags** — normalized snake_case; **filterable** via listing API and UI.
6. **Cover image** — highest `qualityScore` among analyzed images (`pickCoverImage`).
7. **Async processing** — upload returns quickly; analysis runs in background; **pending** jobs **resume on server restart**.
8. **Failure handling** — if every image analysis fails (e.g. quota), `analysisStatus` is **`failed`** (no fake “done” data); UI offers **Retry AI analysis** (`POST /api/properties/:id/reanalyze`).

## Screens (frontend)

- **Listing** — responsive grid, large cover with gradient overlay (price, title, location), filters (location, price range, tags), pagination, skeletons, empty state.
- **Detail** — hero + thumbnail strip + arrows, sticky summary card, AI description, tags, per-image insights; polling while `pending`; friendly copy when `failed`.
- **Add property** — clean form, **drag-and-drop** + file picker, previews, **step progress** (save → upload → AI), human-readable errors; navigates to the new listing after upload so users see live analysis.

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or URI)
- [Cloudinary](https://cloudinary.com/) account (image hosting)
- **Either** `AI_PROVIDER=mock` **(no Gemini key)** for local demos **or** a [Gemini API](https://ai.google.dev/) key when `AI_PROVIDER=gemini`

### No API credits?

Set in `backend/.env`:

```env
AI_PROVIDER=mock
```

Restart the backend. Insights and descriptions are **generated locally** from the image URL hash (same URL → same scores so the UI behaves consistently). **This is not real computer vision.** Switch to `AI_PROVIDER=gemini` plus `GEMINI_API_KEY` when you have quota.

### Install

From the repository root:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Environment

- Copy `backend/.env.example` → `backend/.env` and set at minimum:

  - `MONGO_URI`
  - `AI_PROVIDER` — `mock` (no key) or `gemini` (requires key)
  - If `gemini`: `GEMINI_API_KEY`, `GEMINI_MODEL` (optional; code falls back across common model IDs on 404/429)
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

- Copy `frontend/.env.example` → `frontend/.env` if needed; default API base is `http://localhost:5000/api` (`VITE_API_URL`).

### Run

```bash
npm run dev
```

- API: `http://localhost:5000` (health: `GET /api/health`)
- App: `http://localhost:5173` (or next free Vite port)

## Architecture decisions

- **In-process async jobs** instead of Redis/Bull for the assignment scope: simpler to run and grade; `resumePendingAnalyses()` on boot recovers `pending` rows after crashes.
- **Cloudinary** for durable URLs and CDN-friendly delivery vs. storing binaries in MongoDB.
- **Structured JSON** from the vision model keeps parsing predictable; on failure the service returns **empty fields** (no marketing placeholder copy). If **no** image yields real AI output, `analysisStatus` is **`failed`**.
- **Tag normalization** (`snake_case`, deduped) keeps filter queries consistent with AI output variance.

## Assumptions & trade-offs

- Gemini **free-tier quota** can be `0` for some models/projects; production needs a **paid** or correctly enabled API project ([rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)).
- Re-analysis reuses existing Cloudinary URLs (no re-upload required).
- No separate “edit property” screen (out of scope unless extended); images are added at creation time in the current UX flow.

## API quick reference

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/properties` | Create property |
| GET | `/api/properties` | List + filters + pagination |
| GET | `/api/properties/:id` | Detail |
| POST | `/api/properties/:id/images` | Upload up to 5 images (`images` field) |
| POST | `/api/properties/:id/reanalyze` | Re-run AI on existing images |

## Evaluation mapping

| Criterion | Where it shows up |
|-----------|-------------------|
| Backend structure | `routes` → `controllers` → `models` + `services/aiService.js` |
| Frontend + API integration | `frontend/src/pages/*`, `frontend/src/api/*` |
| AI approach | Async pipeline in `propertyController.js`, Gemini in `aiService.js` |
| Edge cases | Quota/parse failures, `failed` + retry UI, resume pending on startup |
| Clarity | This README + inline logging in controller for uploads/analysis |
