# ChatApp frontend

React 19, Vite, Tailwind CSS and Zustand. The interface is in Turkish.

Run `npm run client` from the repository root for development. Vite serves port
3000 and proxies `/api` and `/socket.io` to the Express service on port 5000.
`npm run build` creates `frontend/dist`, which Express serves in production.

See the [project README](../README.md) for setup, tests and architecture. Shared
styles live in `src/index.css`; session state and socket ownership live in
`src/zustand`. HTTP hooks use `apiFetch` to reject responses from an old session.
