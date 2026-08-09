# Monifa Frontend

React, TypeScript and Vite frontend for the Monifa multi-SSO TOTP authenticator.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The frontend expects the Django API at `VITE_API_BASE_URL`. Production builds use `https://api.monifa.jyonn.space/api` and deploy to GitHub Pages at `https://monifa.jyonn.space`.

## Security model

- Access JWTs stay in memory; rotating refresh JWTs are stored in `localStorage`.
- TOTP secrets are cached in plaintext IndexedDB for unlocked offline access, by explicit product decision.
- Logout clears the current account's local cache.
- API responses containing secrets use `Cache-Control: no-store`.
- The app loads no third-party scripts, fonts, issuer icons or analytics.

This model prioritizes a frictionless offline Web App. XSS or access to the browser profile can expose MFA secrets, so CSP and dependency review are part of the security boundary.

