# Monifa · 时符 Frontend

React, TypeScript and Vite frontend for Monifa · 时符, a TOTP authenticator that supports multiple SSO providers.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The frontend expects the Django API at `VITE_API_BASE_URL`. Production builds use `https://api.monifa.jyonn.space` and deploy to GitHub Pages at `https://monifa.jyonn.space`.

## Security model

- Access JWTs stay in memory; rotating refresh JWTs are stored in `localStorage`.
- TOTP secrets are cached in plaintext IndexedDB for unlocked offline access, by explicit product decision.
- Logout clears the current account's local cache.
- API responses containing secrets use `Cache-Control: no-store`.
- The app loads no third-party scripts, fonts, issuer icons or analytics.
- Shared OTP URLs are bearer links: anyone with the URL can read the current code until it expires or is revoked. The URL does not contain the TOTP secret, and creating a replacement invalidates the previous link.

This model prioritizes a frictionless offline Web App. XSS or access to the browser profile can expose MFA secrets, so CSP and dependency review are part of the security boundary.
