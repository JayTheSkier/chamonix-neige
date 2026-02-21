# Chamonix Neige (secure + legacy)

## What changed
- Secure app at `/` (default):
  - Météo-France API key is no longer in browser code.
  - Browser calls local `/api/bera`, server forwards to Météo-France with server-side key.
  - External text rendered in `innerHTML` is escaped before insertion.
- Original app preserved at `/legacy` and `index.legacy.html`.

## Run locally
1. Copy `.env.example` to `.env`.
2. Set `METEOFRANCE_API_KEY` in `.env`.
3. Start server:

```bash
npm start
```

Default server URL: `http://localhost:8080`

## Test from phone (same Wi-Fi)
1. Find your Mac LAN IP (example: `192.168.1.25`).
2. Open on phone:
   - Secure version: `http://<YOUR_IP>:8080/`
   - Legacy version: `http://<YOUR_IP>:8080/legacy`

## Notes
- Keep `.env` private; it is ignored by git.
- Requires Node.js 18+ (for built-in `fetch`).

## Deploy on Vercel (public URL)
1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. In Vercel project settings, add environment variable:
   - `METEOFRANCE_API_KEY` = your Météo-France API key
4. Deploy.

After deploy:
- Secure version: `https://<your-vercel-domain>/`
- Legacy version: `https://<your-vercel-domain>/legacy`
