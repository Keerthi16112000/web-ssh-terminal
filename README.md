# Web SSH Terminal

A robust, production-ready browser-based Web SSH Terminal and remote server management platform.

This platform provides a native control plane for managing remote Linux servers, offering secure public-key authentication, real-time command streaming, and interactive shell sessions directly from the browser.

## Features

- **Browser-Native Terminal:** Fully interactive shell sessions using `xterm.js`.
- **Secure Authentication:** Platform access secured via JWTs and password hashing.
- **SSH Connectivity:** Supports password and private-key authentication (with optional passphrase).
- **WebSocket Gateway:** Bidirectional binary and text data streaming over a structured WebSocket protocol.
- **Session Management:** Tracks active sessions, terminates idle connections, and ensures graceful SSH disconnects.
- **Server Registry:** Manage your fleet of servers with structured metadata.
- **Audit Logging:** Tracks critical platform events (logins, session creations) without logging sensitive terminal payloads.

## Technology Stack

- **Backend:** Node.js, TypeScript, Express.js, `ws` (WebSockets), `ssh2` (SSH Client).
- **Frontend:** React, TypeScript, Vite, `xterm.js` for terminal rendering.
- **Database:** SQLite managed via Prisma ORM.
- **Infrastructure:** Docker and Docker Compose.

## Architecture & Security Model

The system enforces a strict boundary between the browser and the SSH target:
1. **No Credentials in Browser:** Private keys and SSH passwords are never exposed to the frontend.
2. **WebSocket Isolation:** The WebSocket server validates session tickets (JWTs) before attaching streams.
3. **Graceful Degradation:** If the browser tab is closed unexpectedly, the backend detects the WebSocket close event and gracefully terminates the underlying SSH connection.

## Local Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (if running locally without Docker)

### Running with Docker

1. Clone the repository and navigate to the project root.
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Start the application:
   ```bash
   docker-compose up --build
   ```
4. Access the platform at `http://localhost:5173`.

### Running Locally (Without Docker)

**Backend:**
```bash
cd server
npm install
npm run build
npm start
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

## Testing
The repository includes configurations for testing. You can run `npm test` inside the `server` directory (once tests are implemented) using mocked `ssh2` infrastructure to validate WebSocket and session logic without requiring external Linux hosts.
