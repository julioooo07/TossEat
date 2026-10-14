# Toss Eat frontend

The frontend is a React single-page app built with Vite.

## Local development

```sh
npm install
npm start
```

Vite serves the app at `http://localhost:5173` and proxies `/api` requests to the local backend at `http://localhost:5000`.

## Production build

```sh
npm run build
```

The static site is written to `build/` for Vercel. The SPA rewrite in `vercel.json` lets client-side routes such as `/menu` load directly.

Set `VITE_API_BASE_URL` in Vercel to the public base URL of the deployed backend (for example, `https://your-service.onrender.com`, with no trailing slash). It is a public URL, not a secret. Redeploy after changing it.
