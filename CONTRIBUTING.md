# 🤝 Contributing to CodeTogether

Thank you for your interest in contributing to **CodeTogether**! We welcome bug reports, documentation enhancements, design improvements, and code contributions from developers of all skill levels.

---

## 📑 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Coding & Design Standards](#coding--design-standards)
- [Commit Conventions](#commit-conventions)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Submitting a Pull Request](#submitting-a-pull-request)

---

## Code of Conduct

We are dedicated to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful, constructive, and collaborative in all communications, issues, and code reviews.

---

## How Can I Contribute?

### 1. Reporting Bugs
- Search existing issues to ensure the bug hasn’t already been reported.
- Open a new issue using a descriptive title.
- Include step-by-step reproduction instructions, expected vs. actual behavior, browser console logs, and environment details.

### 2. Suggesting Enhancements
- Clearly describe the proposed feature and why it would benefit users.
- Outline possible implementation approaches or architectural considerations.

### 3. Submitting Pull Requests
- Keep changes focused and atomic. Avoid combining unrelated fixes into a single PR.
- Ensure all automated tests pass before opening your PR.

---

## Development Workflow

### 1. Prerequisites
- **Node.js**: v20 or higher
- **npm**: v9 or higher
- **Git**: v2.30 or higher

### 2. Initial Setup
```bash
# 1. Fork and clone repository
git clone https://github.com/<your-username>/CodeTogether.git
cd CodeTogether

# 2. Install all dependencies for both client and server
npm run install:all

# 3. Configure local environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3. Running Locally
```bash
# Terminal 1: Backend Server (runs on http://localhost:5000)
npm run dev:server

# Terminal 2: Frontend Client (runs on http://localhost:5173)
npm run dev:client
```

---

## Coding & Design Standards

1. **Language & Frameworks**:
   - Modern JavaScript (ES Modules, JSX). **Do not introduce TypeScript**; keep the project consistent in JavaScript.
   - React 19 component hooks (`useState`, `useEffect`, `useRef`, `useCallback`).
2. **Design Aesthetic**:
   - Maintain the platform's signature **dark navy & cyber-blue palette** (`#0a0f1d`, `#0f172a`, `#1e293b`).
   - Ensure high contrast and accessibility for code editors and navigation.
   - Respect `@media (prefers-reduced-motion)` for all CSS animations.
3. **Linting**:
   - Run the frontend linter:
     ```bash
     npm run lint --prefix client
     ```

---

## Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new user-facing feature (e.g. `feat(workspace): add collapsible file tree`)
- `fix:` A bug fix (e.g. `fix(security): sanitize export file paths`)
- `docs:` Documentation changes (e.g. `docs(api): update WebSocket event schemas`)
- `style:` Formatting or UI polish without changing logic
- `refactor:` Code restructuring that neither fixes a bug nor adds a feature
- `test:` Adding or updating automated tests
- `chore:` Dependency bumps, configuration, or build script updates

---

## Testing & Quality Assurance

Before committing, run the full verification pipeline from the project root:

```bash
# Runs backend test suite (33 tests) and client production build
npm test
```

All 33 tests must pass, and the Vite production build must complete with zero errors.

---

## Submitting a Pull Request

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Commit your changes with meaningful conventional commit messages.
3. Push your branch to your GitHub fork:
   ```bash
   git push origin feat/your-feature-name
   ```
4. Open a Pull Request against `petersisay/CodeTogether:main`.
5. Provide a clear description of your changes, referencing any related issue numbers.
