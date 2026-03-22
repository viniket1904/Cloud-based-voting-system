# Cloud Based Voting System — Final Year Project

A full-stack online voting system where voters register with **email, mobile, name, voter ID, Aadhar number, and a selfie** (one account per Aadhar and per voter ID). The **Voting Commission (admin)** creates elections and notifies voters by email. Voters log in and cast **exactly one vote per election**, after **face verification** (matched to registration selfie). Admin can **declare results** so voters can view party-wise vote counts.

## Features

- **Voter registration**: Email, mobile, name, voter ID, Aadhar (12 digits), **selfie upload** (face stored for verification). One user per Aadhar and per voter ID.
- **Voter login**: Email + password.
- **Face verification**: At vote time, the voter must verify their face (camera capture); it is matched with the selfie from registration. Only then can the vote be cast.
- **Admin (Voting Commission)**:
  - Create elections (name, description, start/end dates).
  - Add parties to each election.
  - Notify all registered voters by email when an election is created.
  - Set election status: draft → active (voting open) → ended.
  - **Declare results**: After an election ends, admin can declare results; then voters can view party-wise vote counts.
- **Voting**: Voters see active elections, open an election, choose one party, verify face, and cast one vote. One vote per user per election (enforced in DB and API).
- **Security**: JWT auth; passwords hashed with bcrypt; face descriptor stored and compared at vote time.

## Tech Stack

- **Backend**: Node.js, Express, SQLite (better-sqlite3), JWT, bcryptjs, nodemailer
- **Frontend**: React (Vite), React Router, face-api.js (face detection/descriptor for verification)

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example`):

```bash
copy .env.example .env
```

Edit `.env` and set:

- `JWT_SECRET` — any long random string for production
- For email notifications: `SMTP_USER`, `SMTP_PASS` (e.g. Gmail app password), and optionally `SMTP_HOST`, `SMTP_PORT`, `FRONTEND_URL`

Start the server:

```bash
npm run dev
```

API runs at **http://localhost:5000**. On first run, the database and a default admin user are created:

- **Email**: `admin@voting.gov`
- **Password**: `admin123`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** and proxies `/api` to the backend.

## Usage

1. **Voters**: Register at `/register` (email, mobile, name, voter ID, Aadhar, password, **and capture a selfie**). Then log in at `/login` and go to **Elections** to see active elections. To vote: select a party, then **verify your face** (camera); once matched to your registration selfie, the vote is cast. One vote per election.
2. **Admin**: Log in with `admin@voting.gov` / `admin123`. Go to **Admin** to create elections, add parties, click **Notify voters by email**, set the election to **Active**, and after it ends click **Declare results** so voters can view results. Use **View results** to see party-wise vote counts.
3. **One vote per user**: Enforced by unique `(election_id, user_id)` in the `votes` table and API checks. Face verification required at vote time.

## API Overview

- `POST /api/auth/register` — Register voter (body must include `face_descriptor`: 128-d array from selfie)
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user (requires auth)
- `POST /api/auth/verify-face` — Verify face at vote time; body `{ descriptor }`; returns short-lived `face_verification_token` (requires auth)
- `GET /api/elections` — List elections (optional `?status=active`); includes `results_declared`
- `GET /api/elections/:id` — Get election with parties
- `GET /api/elections/:id/results` — Get party-wise vote counts (public if results declared; admin always)
- `GET /api/elections/:id/my-vote` — Check if current user already voted (requires auth)
- `POST /api/elections` — Create election (admin)
- `PATCH /api/elections/:id` — Update election (status, `results_declared`, etc.) (admin)
- `POST /api/elections/:id/parties` — Add party (admin)
- `POST /api/elections/:id/notify` — Email all voters (admin)
- `POST /api/votes` — Cast vote `{ election_id, party_id, face_verification_token }` (requires auth + valid face token; one per user per election)

## Project Structure

```
Cloud Based Voting System/
├── backend/
│   ├── db/
│   │   ├── schema.js      # DB init and tables
│   │   └── voting.db      # SQLite DB (created on first run)
│   ├── middleware/
│   │   └── auth.js        # JWT auth and admin check
│   ├── routes/
│   │   ├── auth.js        # Register (with face_descriptor), login, me, verify-face
│   │   ├── elections.js   # CRUD elections, parties, notify, results, my-vote
│   │   └── votes.js       # Cast vote (requires face_verification_token)
│   ├── services/
│   │   └── email.js       # Send election notification emails
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api.js         # API client
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── SelfieCapture.jsx   # Camera + face-api.js for selfie/verify
│   │   │   └── ElectionResults.jsx
│   │   ├── utils/
│   │   │   └── faceApi.js          # face-api.js load models, get descriptor
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Vote.jsx
│   │   │   └── Admin.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Notes

- **Face verification**: Uses face-api.js in the browser; models load from CDN (justadudewhohacks/face-api.js-models). Camera access is required for registration (selfie) and voting (verify). One face descriptor (128-d) is stored per voter and compared at vote time.
- Email sending works only when SMTP is configured in `.env`. Without it, "Notify voters" still runs but emails are not sent (see backend console).
- **Admin** does not need to register with a selfie; the default admin is created without face data and cannot vote.
- For production: use HTTPS, a strong `JWT_SECRET`, and a proper database (e.g. PostgreSQL) if needed.
