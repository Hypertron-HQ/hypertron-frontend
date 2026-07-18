# Hypertron Frontend

Standalone Next.js frontend for Hypertron.

## Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Prisma

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Add your local environment variables in `.env`.

3. Start the development server:

```bash
npm run dev
```

For local HTTPS development, use:

```bash
npm run dev:https
```

## Scripts

- `npm run dev` starts the local development server
- `npm run dev:https` starts the local server with experimental HTTPS
- `npm run build` generates Prisma client and builds the app
- `npm run start` runs the production server
- `npm run lint` runs the Next.js linter

## Notes

- This repository is the standalone frontend extracted from the original `hypertron` repository.
- Generated folders like `.next` and `node_modules` are intentionally not committed.
