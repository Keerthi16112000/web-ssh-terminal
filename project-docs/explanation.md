# Project Explanation

This document contains internal design decisions, architectural tradeoffs, and explanations of the core flows for the Web SSH Terminal.

## Architecture & Flow

The system is split into an HTTP Control Plane (Express API) and a Data Plane (WebSocket Gateway).

### SSH Lifecycle
1. **Creation:** User requests a new session via HTTP (`POST /api/sessions`). The server validates access to the requested server and creates a database Session record.
2. **Connection:** User opens a WebSocket connection to the gateway, sending the session ID and a JWT token.
3. **Execution:** The backend verifies the token and instantiates a new `ssh2` Client. Once the SSH client emits `ready`, a shell is requested (`xterm-256color`).
4. **Streaming:** 
   - Backend `stdout`/`stderr` from SSH is forwarded as JSON WebSocket payloads (`type: output`).
   - Frontend keystrokes are sent as JSON WebSocket payloads (`type: input`) and piped into the SSH `stdin`.
5. **Termination:** If the SSH connection ends (e.g., typing `exit`), the backend closes the WebSocket. If the WebSocket closes (e.g., closing the browser tab), the backend explicitly calls `.end()` on the SSH stream and client to prevent zombie connections.

## Security Decisions

1. **No direct SSH tunneling:** We do not expose raw TCP streams over WebSockets. We explicitly request a pseudo-terminal shell. This prevents the platform from being used as a generic proxy.
2. **Strict Protocol:** We use JSON payloads over WebSockets (`{ type: 'input', data: 'ls\r' }`). We do not blindly execute commands; we pipe data directly into the active pty session.
3. **Credential Storage:** Private keys are stored in the database but are explicitly excluded (`select: false` equivalent via explicit field selection) in all API responses to prevent leakage to the browser.
4. **Audit Logging:** We log session starts and stops. We intentionally DO NOT log keystrokes or terminal output to avoid capturing passwords, secrets, or sensitive code typed during an SSH session.

## Testing Strategy
- Unit tests will mock the `ssh2` Client and `ClientChannel` to ensure the `SessionManager` cleans up resources properly on various event combinations (`error`, `close`, `end`).
- E2E tests (future improvement) can use a lightweight Alpine Linux Docker container running `sshd` to verify the complete connection flow.

## Future Improvements
- Implement PostgreSQL for horizontal scalability of the control plane.
- Add SSH Key pair generation directly within the platform.
- Add SFTP support for file browsing.
