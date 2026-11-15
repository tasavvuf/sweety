# Sweety — Blood Glucose Tracking Application

Sweety is a full-stack blood glucose management application designed to help individuals monitor daily glucose readings, understand trends over time, and compare monthly summaries. It provides patient-scoped tracking across four standard daily time slots, visualizes trends through dynamic charts, and offers a dedicated doctor portal to inspect reports of authorized patients.

---

## 1. Project Introduction

Managing diabetes or monitoring blood sugar requires consistent record-keeping and clear trend visibility. Manually tracking readings across meals or relying on paper logs makes it difficult to spot recurring spikes or evaluate progress over time.

Sweety addresses this by providing:
- A structured logging system limited to four clinical time slots per day.
- Automated daily, month-to-date, and previous-calendar-month statistical reports (highest, lowest, average, reading counts).
- Visual trend analysis via interactive line, area, and distribution charts.
- Scoped multi-role access so patients maintain full control over their records while permitting approved doctors to review clinical summaries.

---

## 2. Features

### Authentication & Session Management
- **Account Registration**: Create a patient account with email, name, and password.
- **Role-Based Sign-In**: Dedicated login flows for patients and clinic-assigned doctor accounts.
- **Secure Cookie Sessions**: JSON Web Tokens (JWT) stored in `httpOnly`, `sameSite: 'lax'` cookies.
- **Current User Bootstrap**: Automatic session restoration via `GET /api/auth/me`.
- **Protected Routing**: Role-aware frontend route guards directing patients to the dashboard and doctors to clinical reports.

### Glucose Readings
- **Time-Slot Logging**: Exactly four structured daily slots: `Morning`, `After breakfast`, `After lunch`, and `After dinner`.
- **Duplicate Prevention**: Database constraints ensure only one reading can be logged per slot per day.
- **Clinical Range Validation**: Enforces values between 40 mg/dL and 600 mg/dL.
- **Historical Immutability**: Future reading dates are rejected.
- **Reading CRUD**: Create, view, update, and delete daily readings with ownership checks.

### Reports & Analytics
- **Daily Report**: Real-time calculation of highest, lowest, and average glucose levels alongside all individual logs for any selected calendar date.
- **Month-to-Date Report**: Rolling aggregate from the 1st of the month up to the selected date.
- **Previous-Month Report**: Full previous calendar month aggregate for comparison.
- **Interactive Visualizations (Recharts)**:
  - *Daily Glucose Trend*: Line chart plotting readings across the day's time slots.
  - *Monthly Glucose Trend*: Area chart displaying day-by-day averages for the current month.
  - *Reading Distribution*: Bar chart categorizing readings into clinical target buckets (`Below 70`, `70–99`, `100–125`, and `Above 125`).

### History & Pagination
- **Paginated Browsing**: Query historical readings in configurable page sizes (10, 20, 50 records) capped at 50 per page.
- **Filter Controls**: Filter logs by specific slot or custom date ranges (`from` and `to`).

### Doctor Portal
- **Patient Roster**: View accepted patients and pending access requests.
- **Clinical Summaries**: Inspect daily, month-to-date, and previous-month metrics for authorized patients.
- **Recent Readings Table**: Review chronological records of approved patients.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 (SPA)
- **Tooling & Bundler**: Vite 8
- **Routing**: React Router DOM 7
- **Styling**: Tailwind CSS 4 with `@tailwindcss/vite`
- **Charts**: Recharts 3
- **Notifications**: React Toastify 11

### Backend
- **Runtime**: Node.js 20+ (ES Modules)
- **Framework**: Express 5
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcrypt`
- **Validation**: Zod 4
- **API Documentation**: OpenAPI 3.0 via `swagger-ui-express`

### Database
- **Engine**: PostgreSQL (hosted on Supabase)
- **Driver**: `pg` (node-postgres connection pool with custom type parsers for exact calendar date strings)

### Testing
- **Framework**: Vitest 5
- **HTTP Assertions**: Supertest 7

### Infrastructure & Deployment
- **Containerization**: Docker & Docker Compose
- **Web Server & Reverse Proxy**: Nginx Alpine

---

## 4. Project Structure

```
sweety/
├── client/
│   ├── sweety/                   # React frontend application
│   │   ├── public/               # Static assets & icons
│   │   ├── src/
│   │   │   ├── assets/           # UI images & SVG illustrations
│   │   │   ├── components/       # UI components (ReadingForm, AnalyticsCharts, Navbar, etc.)
│   │   │   ├── context/          # AuthContext & session state
│   │   │   ├── pages/            # AuthPage, DashboardPage, HistoryPage, DoctorDashboardPage
│   │   │   ├── services/         # API client (fetch wrapper with credentials)
│   │   │   ├── App.jsx           # App routes & role redirects
│   │   │   ├── index.css         # Tailwind CSS imports
│   │   │   └── main.jsx          # App mount point & ToastContainer
│   │   ├── index.html            # Vite HTML template
│   │   ├── package.json          # Frontend dependencies & scripts
│   │   └── vite.config.js        # Vite config with /api dev proxy
│   ├── Dockerfile                # Multi-stage frontend Docker build
│   ├── nginx.conf                # Nginx reverse proxy & SPA routing config
│   └── .dockerignore             # Frontend Docker build exclusions
├── database/
│   ├── schema.sql                # PostgreSQL DDL (tables, constraints, indexes)
│   └── seed.sql                  # Repeatable demo seed data & test relationships
├── server/
│   ├── src/
│   │   ├── config/               # Database pool, env loader, and OpenAPI spec
│   │   ├── middleware/           # authMiddleware (requireAuth, requireDoctor, requirePatient)
│   │   ├── routes/               # Express route handlers (auth, readings, reports, analytics, doctor)
│   │   ├── app.js                # Express app setup & route mounting
│   │   └── server.js             # HTTP listener & database connection check
│   ├── tests/                    # Integration test suite (Vitest + Supertest)
│   │   ├── auth.test.js
│   │   ├── doctor.test.js
│   │   ├── helpers.js
│   │   ├── pagination.test.js
│   │   ├── readings.test.js
│   │   ├── reports.test.js
│   │   └── setup.js              # Test runner database checks
│   ├── .env.example              # Server environment variable template
│   ├── .env.test.example         # Test database environment template
│   ├── Dockerfile                # Production backend container build
│   ├── package.json              # Backend dependencies & scripts
│   ├── vitest.config.js          # Vitest configuration
│   └── .dockerignore             # Backend Docker build exclusions
├── .env.example                  # Root environment variable template
├── .gitignore                    # Git exclusions
├── docker-compose.yml            # Docker Compose orchestration
└── README.md                     # Project documentation
```

---

## 5. Prerequisites

Before running Sweety locally, ensure you have:
- **Node.js**: `v20.0.0` or higher (Node 20+ LTS recommended)
- **npm**: `v10.0.0` or higher
- **PostgreSQL**: PostgreSQL 14+ instance (a free Supabase project works out of the box)
- **psql CLI**: Required for applying `schema.sql` and `seed.sql`
- **Docker & Docker Compose**: (Optional) For running containerized services

---

## 6. Local Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd sweety
```

### 2. Install backend dependencies
```bash
cd server
npm install
cd ..
```

### 3. Install frontend dependencies
```bash
cd client/sweety
npm install
cd ../..
```

---

## 7. Database Setup

Sweety uses a PostgreSQL database (hosted on Supabase or locally).

### 1. Database Architecture & Relationships

```
┌───────────────────────┐
│       app_users       │
├───────────────────────┤
│ id (PK, UUID)         │◄──────────┐
│ name (VARCHAR)        │           │
│ email (VARCHAR, UNIQUE)           │
│ password_hash (TEXT)  │           │
│ role (patient|doctor) │           │
│ created_at            │           │
└───────────┬───────────┘           │
            │ 1                     │ 1
            │                       │
            │ N (user_id)           │ N (doctor_id / patient_id)
            ▼                       │
┌───────────────────────┐   ┌───────┴───────────────┐
│   glucose_readings    │   │    doctor_patients    │
├───────────────────────┤   ├───────────────────────┤
│ id (PK, UUID)         │   │ id (PK, UUID)         │
│ user_id (FK -> users) │   │ doctor_id (FK->users) │
│ reading_date (DATE)   │   │ patient_id(FK->users) │
│ slot (VARCHAR)        │   │ status (VARCHAR)      │
│ value_mg_dl (INTEGER) │   │ created_at            │
│ created_at            │   └───────────────────────┘
│ updated_at            │
└───────────────────────┘
```

- **`app_users`**: Stores user identity and account roles (`patient`, `doctor`, or `admin`). An index on `LOWER(email)` enforces unique, case-insensitive emails.
- **`glucose_readings`**: Stores blood glucose values. Enforces:
  - `CHECK (value_mg_dl BETWEEN 40 AND 600)`
  - `CHECK (slot IN ('Morning', 'After breakfast', 'After lunch', 'After dinner'))`
  - `UNIQUE (user_id, reading_date, slot)` ensuring only one reading per slot per user per date.
  - Foreign key cascading delete on user removal.
  - Composite index on `(user_id, reading_date)` for fast date filtering.
- **`doctor_patients`**: Relationship table tracking access permissions between doctors and patients (`status`: `'pending'`, `'accepted'`, `'rejected'`).

### 2. Apply Schema

Run `schema.sql` against your PostgreSQL database connection string:
```bash
psql "<DATABASE_URL>" -v ON_ERROR_STOP=1 -f database/schema.sql
```

### 3. Seed Sample Data

The seed script creates two demo patients, two demo doctors, predefined access relationships, and a realistic history of readings spanning this month and the previous month:
```bash
psql "<DATABASE_URL>" -v ON_ERROR_STOP=1 -f database/seed.sql
```

#### Demo User Accounts
All seeded demo accounts share the password: **`SweetyDemo2026!`**

| Name | Email | Role | Access Context |
| :--- | :--- | :--- | :--- |
| **John Doe** | `demo@sweety.com` | Patient | Has readings for current and previous month; access accepted by Dr. Joy Rafi. |
| **Mina Lee** | `mina@sweety.demo` | Patient | Has readings for current and previous month; access accepted by Dr. Leena Akter. |
| **Dr. Joy Rafi** | `joy.rafi@sweety.demo` | Doctor | Accepted access to view John Doe's records. |
| **Dr. Leena Akter** | `leena.akter@sweety.demo` | Doctor | Accepted access to Mina Lee; pending request for John Doe. |

---

## 8. Environment Variables

### Backend Configuration (`server/.env`)

Copy `server/.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```

| Variable | Required | Description | Example Placeholder |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | Port for the Express server (defaults to 3000). | `3000` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string (Supabase transaction pooler or direct URI). | `postgresql://postgres:password@aws-0-region.pooler.supabase.com:5432/postgres` |
| `JWT_SECRET` | **Yes** | Cryptographic secret key used to sign and verify session JWTs (minimum 32 characters). | `replace_with_a_secure_random_secret_at_least_32_characters_long` |
| `NODE_ENV` | Optional | Runtime mode (`development`, `production`, or `test`). In `production`, auth cookies require HTTPS (`secure: true`). | `development` |

### Frontend Configuration (`client/sweety/`)

By default, Vite proxies `/api` requests to `http://localhost:3000` in local development (configured in `client/sweety/vite.config.js`). In production containers, Nginx proxies `/api` to the backend service. Copy `client/sweety/.env.example` to `client/sweety/.env` only if you need to override the API target.

| Variable | Required | Description | Example Placeholder |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Optional | Custom backend API base URL. If unset or empty, the frontend uses relative `/api` paths with the local proxy/Nginx. | `http://localhost:3000` |

---

## 9. Running the Application

### Option A: Local Development (Without Docker)

#### 1. Start the Backend API
In the `server/` directory:
```bash
cd server
npm run dev
```
The server will start on port `3000` (or your configured `PORT`) with nodemon auto-reloading:
```
Connected to PostgreSQL
Server listening on port 3000
```

#### 2. Start the Frontend Application
In a separate terminal, navigate to `client/sweety/`:
```bash
cd client/sweety
npm run dev
```
Vite will launch the local development server at `http://localhost:5173`. Open this URL in your browser to sign in.

---

### Option B: Running with Docker Compose

Docker Compose coordinates both the backend and frontend into isolated production containers.

#### 1. Start Docker Containers
Ensure `server/.env` is configured with your Supabase `DATABASE_URL` and `JWT_SECRET`, then run from the repository root:
```bash
docker compose up --build -d
```

#### 2. Verify Container Health
```bash
docker compose ps
```
Both containers will report `healthy`:
```
NAME              IMAGE              COMMAND                  SERVICE   STATUS
sweety-backend    sweety-server      "node src/server.js"     server    Up (healthy)
sweety-frontend   sweety-client      "nginx -g 'daemon of…"   client    Up (healthy)
```

#### 3. View Logs
```bash
docker compose logs -f
```

#### 4. Stop Containers
```bash
docker compose down
```

---

## 10. API Overview

All API routes (except root, health check, and public auth) require the `auth_token` cookie. Interactive documentation is available via Swagger UI at `http://localhost:3000/api-docs`.

### Public & Health Endpoints
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | None | Welcome message confirming server availability. |
| `GET` | `/health` | None | Health check returning `{ success: true, message: "Sweety API is running" }`. |
| `GET` | `/api-docs` | None | Interactive Swagger UI API documentation. |

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Body / Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/reg` | None | `{ name, email, password }` | Register a new patient account and set the `auth_token` cookie. |
| `POST` | `/api/auth/login` | None | `{ email, password }` | Authenticate an existing account and set the `auth_token` cookie. |
| `GET` | `/api/auth/me` | Cookie | None | Return the currently authenticated user profile. |
| `POST` | `/api/auth/logout` | Cookie | None | Clear the session cookie. |

### Glucose Readings (`/api/readings`)
| Method | Endpoint | Auth | Body / Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/readings` | Patient | `{ reading_date, slot, value_mg_dl }` | Record a glucose measurement. Rejects duplicate slots and future dates. |
| `GET` | `/api/readings` | Patient | Query: `page`, `limit`, `slot`, `from`, `to` | Return paginated historical readings with metadata. |
| `GET` | `/api/readings/:id` | Patient | Path: `id` (UUID) | Retrieve a single reading owned by the authenticated patient. |
| `PUT` | `/api/readings/:id` | Patient | Path: `id`, Body: `{ reading_date, slot, value_mg_dl }` | Update a reading owned by the authenticated patient. |
| `DELETE` | `/api/readings/:id` | Patient | Path: `id` (UUID) | Delete a reading owned by the authenticated patient. |

### Reports (`/api/reports`)
| Method | Endpoint | Auth | Query Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/daily` | Patient | `date=YYYY-MM-DD` | Return daily summary (`highest`, `lowest`, `average`, `total_readings`) and logs. |
| `GET` | `/api/reports/month-to-date` | Patient | `date=YYYY-MM-DD` | Return month-to-date summary from the 1st of the month through the date. |
| `GET` | `/api/reports/previous-month` | Patient | `date=YYYY-MM-DD` | Return statistical aggregate for the entire previous calendar month. |

### Analytics (`/api/analytics`)
| Method | Endpoint | Auth | Query Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/daily` | Patient | `date=YYYY-MM-DD` | Returns readings sorted by slot sequence for daily trend charts. |
| `GET` | `/api/analytics/monthly` | Patient | `date=YYYY-MM-DD` | Returns daily averages for month-to-date trend charts. |
| `GET` | `/api/analytics/distribution` | Patient | `from=YYYY-MM-DD&to=YYYY-MM-DD` | Returns reading counts categorized into 4 clinical buckets. |

### Doctor Endpoints (`/api/doctor`)
| Method | Endpoint | Auth | Body / Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/doctor/patients/request` | Doctor | `{ patient_id }` | Request permission to access a patient's records. |
| `GET` | `/api/doctor/patients` | Doctor | None | List all patients associated with the doctor (accepted and pending). |
| `PATCH` | `/api/doctor/patients/:id/accept` | Patient | Path: `id` (Relationship UUID) | Accept a pending doctor access request. |
| `PATCH` | `/api/doctor/patients/:id/reject` | Patient | Path: `id` (Relationship UUID) | Reject a pending doctor access request. |
| `GET` | `/api/doctor/patients/:id/readings`| Doctor | Path: `id` (Patient UUID), Query: `page`, `limit` | View paginated readings for an accepted patient. |
| `GET` | `/api/doctor/patients/:id/reports` | Doctor | Path: `id` (Patient UUID), Query: `date` | View daily, month-to-date, and previous-month summaries for an accepted patient. |

---

## 11. Authentication and Authorization

Sweety implements cookie-based JWT authentication with strict resource ownership:

1. **Token Delivery**: On login or registration, the server issues an HTTP-only cookie named `auth_token`. Cookies are configured with:
   - `httpOnly: true`: Prevents client-side scripts from reading the token (protecting against XSS token theft).
   - `sameSite: 'lax'`: Protects against Cross-Site Request Forgery (CSRF).
   - `secure: true` (in production): Enforces transmission only over HTTPS.
2. **Custom Cookie Parser**: The server extracts `auth_token` directly from request headers in `server/src/middleware/auth.middleware.js`.
3. **Role Enforcement**: 
   - `requireAuth`: Verifies token signature and expiration.
   - `requireDoctor` & `requirePatient`: Queries the database to verify the user's current account role before allowing access to role-gated endpoints.
4. **Ownership Verification**: All reading mutations (`GET /:id`, `PUT /:id`, `DELETE /:id`) include `WHERE user_id = $authUserId` in their SQL queries. A patient cannot read, edit, or delete another patient's data even if they know the reading UUID.
5. **Doctor-Patient Access Control**: Doctor endpoints check `doctor_patients` for an active relationship where `doctor_id = req.auth.userId`, `patient_id = targetPatientId`, and `status = 'accepted'`. Any unauthorized attempt yields HTTP 403.

---

## 12. Testing

The backend includes an integration test suite built with **Vitest** and **Supertest** covering 18 integration scenarios across 5 test suites:
- `auth.test.js`: Registration, duplicate emails, password verification, token expiration, and role restrictions.
- `readings.test.js`: Reading creation, out-of-bound glucose values (<40 or >600), future date rejection, slot uniqueness, and cross-patient isolation.
- `reports.test.js`: Daily, month-to-date, and previous-month calculations.
- `pagination.test.js`: Page offset calculation and page limit enforcement (capped at 50).
- `doctor.test.js`: Access requests, approval gates, unapproved access denials, and relationship revocation.

### Running the Tests

To protect production and development data, the test runner refuses to execute against the primary `DATABASE_URL`. It requires an isolated test database:

1. Create a dedicated local test database:
   ```bash
   createdb sweety_test
   ```

2. Apply the schema to the test database:
   ```bash
   psql "postgresql://localhost:5432/sweety_test" -v ON_ERROR_STOP=1 -f database/schema.sql
   ```

3. Create `server/.env.test`:
   ```bash
   cp server/.env.test.example server/.env.test
   ```
   Configure `TEST_DATABASE_URL` in `server/.env.test`:
   ```ini
   TEST_DATABASE_URL=postgresql://localhost:5432/sweety_test
   JWT_SECRET=sweety_test_secret_key
   ```

4. Execute the test suite:
   ```bash
   cd server
   npm test
   ```

*Note: The frontend does not currently have automated unit or component tests.*

---

## 13. Docker Architecture

The Docker setup uses a multi-container architecture without background workers or local database containers:

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 User Browser                           │
                  └───────────────────────────┬────────────────────────────┘
                                              │ Port 5173
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │              sweety-frontend (Nginx)                   │
                  │  - Serves compiled React production bundle             │
                  │  - Handles SPA routing (/index.html fallback)          │
                  │  - Proxies /api/ requests to http://server:3000/api/   │
                  └───────────────────────────┬────────────────────────────┘
                                              │ Internal Docker Network
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │              sweety-backend (Node.js)                  │
                  │  - Express 5 REST API                                  │
                  │  - Exposes port 3000 for direct API/Swagger access     │
                  └───────────────────────────┬────────────────────────────┘
                                              │ External SSL Connection
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │              Supabase PostgreSQL Database              │
                  │  - Hosted cloud database                               │
                  │  - Schema, seed data, and connection pooling           │
                  └────────────────────────────────────────────────────────┘
```

- **Database Hosting**: PostgreSQL is hosted remotely on Supabase; no local PostgreSQL container is needed.
- **Excluded Technologies**: Redis, BullMQ, and background job queues were intentionally excluded to maintain a simple, focused architecture.
- **Port Mapping**:
  - `5173:80`: Access the React frontend in your browser at `http://localhost:5173`.
  - `3000:3000`: Direct backend access for Swagger UI at `http://localhost:3000/api-docs` and health checks.

---

## 14. Screenshots / Demonstration

### Patient Dashboard & Analytics
Interactive tracking dashboard displaying daily, month-to-date, and previous-month summary metrics alongside dynamic Recharts visual trends (Line, Area, and Distribution charts).

![Patient Dashboard](docs/screenshots/dashboard.png)

### History & Filters
Paginated reading logs with real-time slot selection, custom date-range filters, and configurable page limits.

![History & Filters](docs/screenshots/history.png)

### Doctor Portal
Clinical overview showing active and pending patient rosters, historical reading records, and comparative report periods for authorized patients.

![Doctor Portal](docs/screenshots/doctor-portal.png)

---

## 15. Known Limitations

During the audit, the following limitations were identified:

1. **Doctor Access Request UI**: While backend endpoints exist for requesting patient access (`POST /api/doctor/patients/request`) and accepting/rejecting invitations (`PATCH /api/doctor/patients/:id/accept`), there is currently no user interface in the frontend for patients to view pending requests or for doctors to send new access invitations by email.
2. **Reading Edits on History Page**: Readings can be edited and deleted on the Dashboard for the selected date, but the History page is currently read-only.
3. **CORS Configuration**: The `cors` package is listed in `server/package.json` but not explicitly mounted in `server/src/app.js`. In local development, Vite proxies API requests, and in Docker, Nginx handles proxying; however, standalone direct cross-origin access requires mounting the CORS middleware.
4. **Registration Route Naming**: The patient registration route is `/api/auth/reg` rather than standard `/api/auth/register`.
5. **No Password Recovery**: There is no self-service password reset or email verification flow.

---

## 16. Notes

### Assumptions

- A user can record up to four glucose readings per day, with exactly one reading for each supported time slot (`Morning`, `After breakfast`, `After lunch`, `After dinner`).
- Glucose values are stored and presented in mg/dL, with clinical sanity bounds enforced between 40 mg/dL and 600 mg/dL.
- Reading dates cannot be in the future.
- Users can only access their own readings unless an explicitly authorized doctor-patient relationship is established in the database.

### Decisions

- **Relational Integrity with PostgreSQL**: PostgreSQL was chosen because reading constraints (`CHECK` ranges, `UNIQUE(user_id, reading_date, slot)`, cascade deletes) are best enforced directly at the database level to prevent invalid clinical data.
- **Hosted Supabase Database**: Using hosted PostgreSQL on Supabase keeps cloud database management decoupled from local/containerized application instances.
- **Server-Side SQL Aggregation**: Reports (daily high/low/average, month-to-date, previous month) are computed directly in SQL using PostgreSQL aggregate functions (`MAX`, `MIN`, `AVG`, `COUNT`) rather than pulling raw datasets into Node.js or React memory.
- **HTTP-Only Cookie Sessions**: Storing JWTs in `httpOnly`, `sameSite: 'lax'` cookies protects tokens from client-side script inspection (XSS) while keeping session management stateless.
- **Reverse Proxy Architecture**: Nginx routes frontend assets and proxies `/api/` calls to the Express container, ensuring both run on the same origin (`http://localhost:5173`) and eliminating cross-site cookie restrictions.
- **PostgreSQL Date Type Parsing**: Configured `pg.types.setTypeParser(1082, (val) => val)` so `reading_date` is consistently handled as a plain `YYYY-MM-DD` string, preventing local midnight timezone shifts from corrupting calendar dates.

### What I would improve with more time

- **Doctor Invitation & Approval Workflow**: Build the UI allowing patients to view and approve/reject pending doctor invitations, and allow doctors to invite patients by email rather than internal UUIDs.
- **Interactive Mutations on History Page**: Allow patients to edit and delete readings directly from the paginated history table instead of navigating to that date on the dashboard.
- **Frontend Automated Testing**: Add unit and component test suites with Vitest and React Testing Library for form validation and auth state management.
- **Full Password Recovery**: Add a secure forgot-password and reset-token workflow.
- **Enhanced Observability**: Introduce structured request logging (e.g. Winston/Pino) and health monitoring for production deployments.
