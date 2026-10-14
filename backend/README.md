# Toss Eat backend

## Run locally

Install dependencies and start the backend with `npm run dev` (Node.js 20 or newer). The local default database is `mongodb://127.0.0.1:27017/hungry_nook`, which requires MongoDB Community Server to be running. MongoDB Compass is a client for the server; it does not host the database.

## Render environment

Set these variables in the Render service:

- `MONGODB_URI`: a MongoDB Community Server connection string that Render can reach. A Community Server running on your personal computer at `localhost` is not reachable from Render. Host the Community Server on a network reachable by Render and secure it with authentication, TLS, and firewall rules.
- `JWT_SECRET`: a unique random secret of at least 32 characters. Rotate any value previously exposed in logs or committed files.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: the admin login credentials. Use a unique, strong password.
- `FRONTEND_URL`: your deployed Vercel site origin, such as `https://your-site.vercel.app`. Multiple allowed origins can be comma-separated.
- `NODE_ENV`: set to `production` if Render does not set it automatically. Render supplies `PORT`.

Deploy with the backend directory as the service root, build command `npm install`, and start command `npm start`.
