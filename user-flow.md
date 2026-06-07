# Doscom C2 Framework — User Flow Documentation

## Overview

Doscom C2 is a Rust-based Command-and-Control framework with three actors:

| Actor | Description |
|-------|-------------|
| **Operator** | Human attacker using the Web UI |
| **Server** | Axum backend on `:8080`, PostgreSQL, TCP listener on `:31229` |
| **Agent/Implant** | Linux or Windows binary running on the target machine |

---

## Flow 1: Operator Authentication

```
Operator Browser
    │
    ├─► GET /login  →  React Login page renders
    │
    ├─► POST /api/login { username, password }
    │       │
    │       ├─ [FAIL] 401 → Error shown, stay on /login
    │       │
    │       └─ [SUCCESS] 200 → session_token cookie set (24h, HttpOnly)
    │                           → Redirect to /  (Dashboard)
    │
    └─► GET /api/auth/status  (on every protected page load)
            ├─ authenticated: true  →  render page
            └─ authenticated: false →  redirect to /login
```

**Key files:**
- `server/src/auth.rs` — Argon2 password verify, session creation
- `server/c2-doscom/src/pages/login/Login.tsx` — Login UI
- `server/c2-doscom/src/contexts/AuthContext.tsx` — Frontend auth state

---

## Flow 2: Agent Deployment & Registration

```
[Operator] builds or generates implant binary
    │
    ├── Option A: Manual build
    │   └── cargo build --release --bin client   (Linux)
    │       cargo build --release --bin windows_client  (Windows)
    │
    └── Option B: Payload Generator (Web UI)
        └── POST /api/payload/generate
            { ip, port, anti_debug, anti_vm, suicide, os_target }
            → Server patches C2 URL into source
            → runs cargo build --release (cross-compile if Windows)
            → streams binary back as download

[Agent binary] executed on target machine
    │
    ├─ 1. Daemonize (Linux only: fork to background, stdio → /dev/null)
    ├─ 2. Hide process (Linux: /proc bind-mount, requires root)
    ├─ 3. Anti-analysis checks (if compiled with features):
    │       anti_debug → TracerPid + ptrace check
    │       anti_vm    → CPUID hypervisor bit, DMI, MAC OUI, uptime, temp files
    │       suicide    → self-delete binary if detected
    │
    ├─ 4. POST /api/register
    │       payload: Message { msg_type: "ClientRegister", ClientInfo }
    │       ClientInfo: { id(uuid), hostname, username, os, arch, ip,
    │                     country_info, cpu_brand, cpu_freq, cores,
    │                     memory, disk_total, disk_avail, connected_at }
    │       Server: upserts into agents table, logs CLIENT_CONNECT
    │       Response: 200 OK
    │
    └─ 5. Enter polling loop:
            ├─ Every 30s: POST /api/heartbeat  → updates last_seen in DB
            └─ Every 2s:  GET  /api/commands/{client_id}  → fetch pending cmds
```

**Key files:**
- `client/src/main.rs` — Linux agent entry & loop
- `windows_client/src/main.rs` — Windows agent entry
- `client/src/check.rs` / `windows_client/src/check.rs` — Anti-analysis
- `client/src/client_info.rs` — System info collection
- `server/src/handlers/api.rs` — `handle_register`, `handle_heartbeat`
- `common/src/message.rs` — Message types & ClientInfo struct

---

## Flow 3: Operator Dashboard (`/`)

```
Operator navigates to /
    │
    ├─► GET /api/clients/display
    │       Response: { clients[], online_clients_count,
    │                   admin_clients_count, os_types_count, total_clients }
    │       (agent "online" if now() - last_seen < 60s)
    │
    ├─ Dashboard renders:
    │   ├─ Stats cards: total agents, online count, OS distribution
    │   ├─ Agent table: hostname, username, IP, OS, last_seen, status
    │   └─ Quick action: click agent row → navigate to /infected-agents/:id
    │
    └─► (Optional) DELETE /api/clients/{id}  → remove agent from DB
```

**Key files:**
- `server/c2-doscom/src/pages/dashboard/Dashboard.tsx`
- `server/src/handlers/api.rs` — `handle_get_clients_display`, `handle_delete_client`

---

## Flow 4: Agent Detail — Command Execution (`/infected-agents/:id`)

```
Operator opens agent detail page
    │
    ├─► GET /api/clients  (load agent info)
    │
    ├─ [Tab: Command Execution]
    │   Operator types command (e.g. "whoami", "cat /etc/passwd")
    │   │
    │   ├─► POST /api/clients/{id}/commands
    │   │       { client_id, command, args: [], message_id, shellcode: null }
    │   │       Server: pushes to in-memory command queue
    │   │       Logs: COMMAND_EXECUTE → audit_logs
    │   │
    │   │  [Agent polling loop - every 2s]
    │   ├─► GET /api/commands/{client_id}
    │   │       Server: returns & clears command queue
    │   │       Agent: executes via sh -c (Linux) or cmd.exe /c (Windows)
    │   │
    │   ├─► POST /api/command_result
    │   │       payload: Message { EncryptedCommandResponse }
    │   │       encrypted with AES-256-GCM (shared key)
    │   │       decrypted: { command, stdout, stderr, exit_code, executed_at }
    │   │       Server: stores in memory result buffer, logs COMMAND_RESULT
    │   │
    │   └─► GET /api/clients/{id}/results  (UI polls for results)
    │           Response: [ { command, stdout, stderr, exit_code, executed_at } ]
    │           UI: renders output in terminal-style panel
    │
    └─ [Tab: Command Execution — Encryption Detail]
        All command results are AES-256-GCM encrypted
        Key: shared between server config & agent compile-time constant
        Agent URL: encrypted at compile-time via cryptify::encrypt_string!
```

**Key files:**
- `client/src/command_executor.rs` — Agent command execution
- `windows_client/src/command_executor.rs` — Windows command execution
- `common/src/crypto.rs` — AES-256-GCM encrypt/decrypt
- `server/src/handlers/api.rs` — `handle_send_command`, `handle_command_result`, `handle_get_commands`
- `server/src/managers/client_manager.rs` — In-memory command queue & result buffer

---

## Flow 5: Agent Detail — Reverse Shell (`/infected-agents/:id`)

> ⚠️ Currently marked as **broken** in features.md

```
Operator clicks "Start Reverse Shell"
    │
    ├─► POST /api/clients/{id}/reverse_shell
    │       Server:
    │         1. Starts TCP listener on port 31229
    │         2. Queues "REVERSE_SHELL" command with shellcode (base64)
    │         3. Logs WS_START
    │       Response: { success, message, server_ip, port: 31229 }
    │
    │  [Agent - next poll cycle]
    ├─► GET /api/commands/{client_id}
    │       Receives: { command: "REVERSE_SHELL", shellcode: "<base64>" }
    │       Agent: executes shellcode → connects back to server:31229
    │       Server logs: WS_CONNECT
    │
    ├─► GET /ws/shell/{connection_id}  (Operator browser WebSocket upgrade)
    │       ┌─────────────────────────────────────────────┐
    │       │  Operator (browser) ←──── WS text frames ───── Server          │
    │       │     keystrokes ──────────── WS text frames ──→ Server          │
    │       │                              │                                   │
    │       │                         TCP :31229  ←──→  Agent shell          │
    │       └─────────────────────────────────────────────┘
    │
    └─► POST /api/reverse_shells/{id}/close  →  terminate TCP connection
            Logs: WS_DISCONNECT
```

**Key files:**
- `server/src/reverse_shell_listener.rs` — TCP listener & WS bridge
- `server/src/managers/shell_manager.rs` — Active shell connection registry
- `client/src/shell.rs` / `windows_client/src/shell.rs` — Shellcode execution
- `server/src/handlers/api.rs` — `handle_reverse_shell`, `handle_ws_shell`

---

## Flow 6: Agent Detail — File Manager (`/infected-agents/:id`)

```
[Browse Directory]
    Operator enters path (e.g. /home/user)
    │
    ├─► POST /api/files/list { client_id, path, recursive: false }
    │       Server: queues FileOperation(ListDir) → agent
    │       Agent: reads directory, sends back entries
    │       POST /api/file_operation_response/{client_id}
    │       Server: logs FILE_LIST, returns to UI
    │       Response: { entries: [ {name, path, is_dir, size, permissions, owner} ] }
    │
[Download File]
    Operator clicks filename
    │
    ├─► GET /api/files/download/{path}?client_id={id}
    │       Server: queues DownloadFileInit → agent
    │       Agent: reads file in chunks → POST file_operation_response (each chunk)
    │       Server: streams binary to operator browser (chunked, 15s timeout/chunk)
    │       Logs: FILE_DOWNLOAD → audit_logs
    │
[Upload File]
    Operator drags file or clicks upload
    │
    ├─► POST /api/files/upload/{path}?client_id={id}
    │       Request body: raw file bytes
    │       Server: splits into chunks → queues UploadFileChunk commands
    │       Agent: receives chunks → reassembles → writes to disk
    │       Server: logs FILE_UPLOAD
    │
[Delete File/Directory]
    Operator selects item, clicks delete
    │
    └─► POST /api/files/delete { client_id, path }
            Server: queues DeletePath → agent
            Agent: removes file/dir, responds via file_operation_response
            Server: logs FILE_DELETE
            Response: { success: true, message: "Path deleted successfully." }
```

**Key files:**
- `server/src/handlers/file.rs` — All file operation HTTP handlers
- `client/src/file_manager.rs` — Agent file upload/download chunking
- `windows_client/src/file_manager.rs` — Windows file manager
- `common/src/message.rs` — FileOperationCommand, UploadFileInit/Chunk, DownloadFileInit/Chunk

---

## Flow 7: Operator Notes (`/notes`)

```
Operator navigates to /notes
    │
    ├─► GET /api/notes  →  list all notes (sorted by created_at)
    │
    ├─ [Create Note]
    │   Operator fills title + content, clicks Save
    │   └─► POST /api/notes { title, content }
    │           Response: created Note object (with new UUID)
    │
    ├─ [Edit Note]
    │   Operator edits existing note
    │   └─► PUT /api/notes/{id} { title, content }
    │           Response: 200 OK
    │
    └─ [Delete Note]
        └─► DELETE /api/notes/{id}
                Response: 200 OK | 404 Not Found
```

**Key files:**
- `server/c2-doscom/src/pages/notes/Notes.tsx`
- `server/src/handlers/api.rs` — `handle_get_notes`, `handle_create_note`, `handle_update_note`, `handle_delete_note`

---

## Flow 8: System Logs (`/system-logs`)

```
Operator navigates to /system-logs
    │
    ├─► GET /api/logs
    │       Response: [ { id, event_type, client_id, username,
    │                      details, ip_address, created_at } ]
    │       Ordered: newest first
    │
    ├─ UI renders log table with event_type badges:
    │     CLIENT_CONNECT / CLIENT_DISCONNECT / CLIENT_DELETE
    │     COMMAND_EXECUTE / COMMAND_RESULT
    │     FILE_LIST / FILE_DOWNLOAD / FILE_UPLOAD / FILE_DELETE
    │     AUTH_FAILURE / SESSION_CREATE / SESSION_EXPIRE
    │     WS_START / WS_CONNECT / WS_DISCONNECT
    │     ERROR
    │
    └─ [Clear Logs]
        └─► POST /api/logs/clear
                Truncates audit_logs table
                Response: { success: true, message: "Logs cleared successfully" }
```

**Key files:**
- `server/c2-doscom/src/pages/systemlogs/SystemLogs.tsx`
- `server/src/audit.rs` — `log_event()` called throughout all handlers
- `server/src/handlers/api.rs` — `handle_get_logs`, `handle_clear_logs`

---

## Flow 9: Payload Generator (`/payload-generator`)

```
Operator navigates to /payload-generator
    │
    ├─ Form inputs:
    │     C2 IP / Host  (e.g. 192.168.1.100)
    │     C2 Port       (e.g. 8080)
    │     OS Target     [ linux | windows ]
    │     Features:     [ ] anti_debug   [ ] anti_vm   [ ] suicide
    │
    ├─► POST /api/payload/generate
    │       { ip, port, anti_debug, anti_vm, suicide, os_target }
    │       Server:
    │         1. Patches C2 URL into agent source code placeholder
    │         2. Sets cargo features flags based on options
    │         3. Runs: cargo build --release
    │              Linux:   --target x86_64-unknown-linux-musl
    │              Windows: --target x86_64-pc-windows-gnu
    │         4. Streams compiled binary back
    │
    └─ Browser: downloads binary
            Linux:   implant_client  (static ELF, < 10MB stripped)
            Windows: implant.exe     (PE, no console window)
```

**Key files:**
- `server/c2-doscom/src/pages/generator/PayloadGenerator.tsx`
- `server/src/handlers/api.rs` — `handle_generate_payload`
- `common/src/config.rs` — URL placeholder patching logic

---

## Complete Communication Matrix

| Source | Destination | Protocol | Endpoint | Auth |
|--------|-------------|----------|----------|------|
| Agent | Server | HTTP POST | `/api/register` | None |
| Agent | Server | HTTP POST | `/api/heartbeat` | None |
| Agent | Server | HTTP GET | `/api/commands/{id}` | None |
| Agent | Server | HTTP POST | `/api/command_result` | None |
| Agent | Server | HTTP POST | `/api/file_operation_response/{id}` | None |
| Agent | Server | TCP | `:31229` | None (reverse shell) |
| Operator | Server | HTTP POST | `/api/login` | Credentials |
| Operator | Server | HTTP GET/POST/PUT/DELETE | `/api/*` | Session Cookie |
| Operator | Server | WebSocket | `/ws/shell/{id}` | Session Cookie |
| Server | Operator | HTTP | All responses | — |
| Server | Agent | HTTP (queued) | Commands via `/api/commands` poll | — |

---

## Data & State Persistence

| Data | Storage | Notes |
|------|---------|-------|
| Agent registry | PostgreSQL `agents` table | Persistent across restarts |
| Audit logs | PostgreSQL `audit_logs` table | Persistent across restarts |
| Notes | PostgreSQL `notes` table | Persistent across restarts |
| Operator users | PostgreSQL `users` table | Argon2-hashed passwords |
| Command queues | In-memory (`client_manager.rs`) | **Lost on server restart** |
| Command results | In-memory (`client_manager.rs`) | **Lost on server restart** |
| Session tokens | In-memory (`auth.rs`) | **Lost on server restart** |
| Active shells | In-memory (`shell_manager.rs`) | **Lost on server restart** |

---

## Security Flow (Encryption & Auth)

```
Compile time:
    Agent C2 URL → cryptify::encrypt_string!() → baked into binary

Runtime (agent → server):
    Command results:
        stdout/stderr → AES-256-GCM encrypt (key: server_config.encryption_key)
        → POST /api/command_result as EncryptedCommandResponse

Runtime (operator → server):
    POST /api/login → Argon2 verify → session_token cookie (HttpOnly, 24h)
    All /api/* requests → Tower middleware checks session_token
    Unauthenticated → 401 redirect to /login

Network:
    TLS NOT implemented natively
    → Deploy behind nginx/caddy with HTTPS for production
    CORS: restricted to localhost:5173 and localhost:4173 (Vite dev)
```

---

## Agent Lifecycle State Machine

```
            ┌─────────────┐
            │  Deployed   │  (binary on target)
            └──────┬──────┘
                   │ startup checks pass (anti_debug/anti_vm)
                   ▼
            ┌─────────────┐
            │  Registers  │  POST /api/register
            └──────┬──────┘
                   │ 200 OK
                   ▼
    ┌──────────────────────────────┐
    │         Active Loop          │
    │  • heartbeat every 30s       │
    │  • poll commands every 2s    │
    │  • execute & respond         │
    └──────────────┬───────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
    last_seen > 60s      Manual DELETE
         │                    │
         ▼                    ▼
    ┌─────────┐         ┌──────────┐
    │ Offline │         │ Deleted  │
    │ (DB row │         │(removed  │
    │  stays) │         │ from DB) │
    └─────────┘         └──────────┘
         │
    Agent reconnects
    POST /api/heartbeat
    → 404 (unknown)
    → re-registers
```

---

## Planned / Next Features (from features.md)

| Feature | Status | Notes |
|---------|--------|-------|
| Fix Reverse Shell | 🔴 Broken | Top priority |
| Windows Agent | 🟡 In progress | `windows_client` exists |
| Dropper (stager) | 📋 Planned | Minimal first-stage, downloads main agent |
| Multi-user dashboard | 📋 Planned | Currently single admin |
| Post-exploitation modules | 📋 Planned | Cred harvest, pivoting, LPE, persistence |
| Multi-stage delivery (ELF/EXE/DLL) | 📋 Planned | |
| TOFU (Trust On First Use) | 📋 Planned | Key exchange model |
