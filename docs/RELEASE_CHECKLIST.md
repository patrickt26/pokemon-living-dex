# Release checklist

## Smoke checks

- [ ] First visit displays the onboarding tutorial.
- [ ] National Dex opens and supports Normal/Shiny, ownership and OT filters.
- [ ] Game Dexes preserve each game's ordering and local numbers.
- [ ] Regional Forms and Special Forms support the same filters.
- [ ] Double-click and keyboard shortcuts update a slot quickly.
- [ ] Clear operations show confirmation and offer Undo.
- [ ] JSON and CSV exports download successfully.
- [ ] Backup import preview detects duplicates and invalid files.

## Production checks

- [ ] `corepack pnpm lint`
- [ ] `corepack pnpm typecheck`
- [ ] `corepack pnpm test -- --run`
- [ ] `corepack pnpm build`
- [ ] Verify the PWA manifest and service worker on the deployed origin.
- [ ] Test desktop and mobile layouts over HTTPS.
- [ ] Apply all Supabase migrations in timestamp order.
- [ ] Run Supabase Database Security Advisor and resolve every RLS warning.
- [ ] Confirm that only the publishable key is present in the frontend deployment variables.
- [ ] Confirm exact Auth Site URL and redirect allow-list entries for production.
- [ ] Review Auth rate limits, OTP expiry, custom SMTP and CAPTCHA settings.
- [ ] Verify CSP, HSTS, clickjacking, MIME-sniffing and referrer headers on the deployed origin.
- [ ] Test that two different accounts cannot read one another's cloud collection.
