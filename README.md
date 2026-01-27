# O'Takos Restaurant Dashboard

A full-stack Next.js + Prisma application for managing restaurants (inventory, production, expenses, dashboard, and finance workflows). Primary languages: French (fr) and English (en). Primary currency: GNF.

## Key Features
- Role-based routing and permissions (Manager vs Editor)
- Inventory management with stock movements and production logging
- Expenses workflow with approval and automatic stock adjustments
- Dashboard analytics and projections
- Internationalization (fr/en)
- PostgreSQL + Prisma ORM

## Quickstart (development)
1. Copy env example:
	```bash
	cp .env.example .env
	```
2. Install:
	```bash
	npm ci
	```
3. Generate Prisma client:
	```bash
	npx prisma generate
	```
4. Run migrations (dev):
	```bash
	npx prisma migrate dev
	```
5. Seed database (if applicable):
	```bash
	npm run db:seed
	```
6. Start development server:
	```bash
	npm run dev
	```
7. Open http://localhost:3000

## Build
```bash
npm run build
npm run start
```

## Authentication
Uses NextAuth.js with Prisma adapter. Ensure env vars for OAuth and database are set. See `prisma/schema.prisma` for required User fields.

## Database / Prisma
- Schema: [prisma/schema.prisma](prisma/schema.prisma)
- After any schema change:
  ```bash
  npx prisma generate
  npx prisma migrate dev
  ```

## Internationalization
Project includes English and French translations in `public/locales/en.json` and `public/locales/fr.json`. Use the `useLocale` provider to access locale and translations (see `components/providers/LocaleProvider.tsx`).

## Common Workflows
- Role-based redirects are implemented in pages like `app/page.tsx`, `app/dashboard/settings/page.tsx`, and `app/admin/layout.tsx`.
- Inventory validation and availability checks: `app/api/production/check-availability/route.ts`.

## Testing & Verification
- Run migrations and seed locally before testing inventory/expense flows.
- Verify Manager vs Editor routing: login flows are in `app/login/page.tsx`.

## Contributing
- Create feature branches and open PRs.
- Commit after each phase (DB, API, UI) to create safe rollback points.
- Regenerate Prisma client after schema edits.

## Troubleshooting
- If build/type errors appear, run:
  ```bash
  npm run build
  npx prisma generate
  ```
- For migration issues, check the `.claude` summaries for historical fixes and strategies: `.claude/summaries/`.

## License
See LICENSE.
