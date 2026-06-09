# AidePilot

A modern, lightweight API testing client — like Postman and Insomnia, but faster and cleaner.

![AidePilot](https://img.shields.io/badge/version-1.0.0-indigo)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Workspace Management** — Create, rename, delete workspaces; organize requests in folders
- **Request Builder** — Full HTTP method support (GET, POST, PUT, PATCH, DELETE)
- **Body Types** — JSON, Form Data, x-www-form-urlencoded, Raw Text
- **Authentication** — Bearer token support with environment variable interpolation
- **Response Viewer** — Status code, headers, response time, JSON syntax highlighting
- **Environment Variables** — `{{variable}}` syntax in URLs, headers, and body
- **Code Generation** — Export as cURL, Fetch API, or Axios
- **Import/Export** — Share collections as `.aidepilot.json` files
- **Request History** — Auto-saved history per workspace
- **Keyboard Shortcuts** — `Ctrl+Enter` send, `Ctrl+S` save, `Ctrl+T` new tab
- **Desktop App** — Optional Electron packaging

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS |
| State | Zustand |
| HTTP Client | Axios |
| Backend | Node.js + Express |
| Database | SQLite (sql.js — pure JS, no native build required) |
| Desktop | Electron |

## Project Structure

```
aidepilot/
├── backend/
│   ├── src/
│   │   ├── db/           # Database schema & connection
│   │   ├── routes/       # REST API routes
│   │   ├── services/     # HTTP proxy/execution engine
│   │   └── types/        # TypeScript interfaces
│   └── data/             # SQLite database (auto-created)
├── frontend/
│   └── src/
│       ├── components/   # React UI components
│       ├── hooks/        # Custom React hooks
│       ├── services/     # API client layer
│       ├── store/        # Zustand state management
│       ├── types/        # Shared TypeScript types
│       └── utils/        # Helpers & code generation
├── electron/             # Electron main process
└── package.json          # Monorepo root
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone and install dependencies
cd aidepilot
npm install

# Seed example data (JSONPlaceholder API examples)
npm run seed --workspace=backend
```

### Development

```bash
# Start backend (port 3001) + frontend (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Desktop (Electron)

```bash
# Start dev servers + Electron window
npm run electron:dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET/POST/PUT/DELETE | `/api/workspaces` | Workspace CRUD |
| GET | `/api/workspaces/:id/export` | Export collection |
| POST | `/api/workspaces/import` | Import collection |
| GET/POST/PUT/DELETE | `/api/folders` | Folder management |
| GET/POST/PUT/DELETE | `/api/requests` | Request CRUD |
| POST | `/api/requests/execute` | Execute HTTP request |
| POST | `/api/requests/:id/duplicate` | Duplicate request |
| GET/POST/PUT/DELETE | `/api/environments` | Environment variables |
| GET/DELETE | `/api/history` | Request history |

## Database Schema

Tables: `workspaces`, `folders`, `requests`, `request_headers`, `request_params`, `environments`, `history`

See [`backend/src/db/schema.sql`](backend/src/db/schema.sql) for the full schema.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Send request |
| `Ctrl+S` | Save current request |
| `Ctrl+T` | New tab |

## Environment Variables

Create environments in the sidebar **Environments** tab. Use variables in requests:

```
URL:     {{base_url}}/posts/1
Header:  Authorization: Bearer {{api_key}}
Body:    { "token": "{{api_key}}" }
```

## Example Requests

The seed script creates a **Demo Workspace** with JSONPlaceholder API examples:

- GET all posts (with `_limit` query param)
- GET single post
- POST create post
- PUT update post
- DELETE post

## License

MIT
