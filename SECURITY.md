# 🛡️ CodeTogether — Security Policy & Threat Model

**Maintainer**: Peter Sisay ([@petersisay](https://github.com/petersisay))  
**Project**: CodeTogether  
**Version**: 1.0.0  

---

## 📑 Supported Versions

We actively provide security patches and dependency updates for the following versions:

| Version | Supported | Notes |
| :--- | :--- | :--- |
| **`1.0.x`** | :white_check_mark: Yes | Current production release |
| `< 1.0.0` | :x: No | Pre-release and legacy prototypes |

---

## 🚨 Reporting a Vulnerability

We take the security of CodeTogether and our developer community seriously. If you discover a vulnerability or security concern, please follow responsible disclosure guidelines:

1. **Do NOT open a public GitHub issue.**
2. Send an email to the project maintainer with the subject line:
   `[SECURITY] CodeTogether Vulnerability Report`
3. Provide a detailed summary including:
   - Vulnerability classification (e.g. Broken Authentication, Path Traversal, Injection, CSRF).
   - Affected files and endpoints.
   - Step-by-step reproduction instructions or proof-of-concept payload.
   - Suggested remediation (if known).
4. You will receive an initial response acknowledging your report within 48 hours.

---

## 🔒 Security Hardening & Threat Model

CodeTogether incorporates multi-layered defense-in-depth principles:

### 1. Authentication & Identity Safeguards
- **Cryptographic Google ID Token Verification**: Uses Google's official JWKS public keys via `google-auth-library`. Raw client claims are never trusted blindly.
- **Audience & Issuer Enforcement**: Tokens must explicitly match `GOOGLE_CLIENT_ID` and originate from `accounts.google.com`.
- **Mandatory Verified Email**: Accounts require `email_verified: true` in the Google payload.
- **Account Takeover Prevention**: Google sign-in cannot be used to hijack an existing local password-protected account sharing the same email address.
- **Password Salting & Hashing**: Passwords are salt-hashed using `bcryptjs` with 10 salt rounds before storage.

### 2. Authorization & Room Privacy
- **Stateless HMAC-SHA256 JWTs**: All private REST endpoints and Socket.IO handshakes require a verified JWT.
- **Room-Level Access Control**: Private rooms enforce creator and whitelist checks (`isUserAuthorizedForRoom`). Unauthorized callers receive `403 Forbidden` on file modifications and project exports.
- **Socket Channel Protection**: Unauthorized sockets attempting to subscribe to private rooms are blocked and receive `error:unauthorized`.

### 3. Path Traversal & ZIP Injection Defense
- File operations and project exports sanitize all file names.
- Traversal sequences (`../`, `..\`), null bytes, Windows drive roots (`C:\`), and UNC prefixes are stripped.
- Paths are normalized to ensure only safe relative subpaths within the project root can be written or exported.

### 4. Cross-Origin Resource Sharing (CORS)
- REST APIs and WebSocket connections whitelist only authorized production domains (`https://code-together-weld.vercel.app`) and local development ports (`http://localhost:5173`).
- Wildcard CORS (`*`) with credentials is explicitly prohibited.

### 5. Media Stream Security (WebRTC)
- Audio and video media streams are transmitted directly between browsers using **SRTP (Secure Real-time Transport Protocol)** with DTLS key negotiation.
- Media never transits through the application server unencrypted.

---

## 🛠️ Security Best Practices for Self-Hosting

When self-hosting or deploying your own instance of CodeTogether:
1. **Rotate Secrets**: Always generate a high-entropy string of at least 32 characters for `JWT_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. **MongoDB Network Rules**: In production, configure MongoDB Atlas IP Access Lists to permit only your backend hosting provider's egress IPs.
3. **Environment Isolation**: Never commit `.env` files to git repositories. Use platform secret managers (Render Environment Variables, Vercel Environment Variables).
