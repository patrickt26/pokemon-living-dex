# Cloud collection setup

The cloud account feature is optional. Without its environment variables, the application continues using the existing Dexie/IndexedDB collection exactly as before.

## Supabase project

1. Create a Supabase project.
2. Apply every file in `supabase/migrations` in timestamp order with the Supabase CLI. The continuous-sync migration must be applied after the create and hardening migrations.
3. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key. Never place a secret or service-role key in the frontend.

The browser may contain only the Supabase publishable key. The secret key, legacy `service_role` key, database password and OAuth client secrets must never use a `VITE_` variable or enter the Git repository.

The production Content Security Policy in `vercel.json` allows connections only to the configured Supabase project. If the project changes, update that exact hostname there as part of the same release.

## Authentication URLs

Add these redirect URLs in Supabase Authentication URL Configuration:

- `http://localhost:5173/backup`
- `https://living-dex-companion.vercel.app/backup`
- `https://pokemon-living-dex.vercel.app/backup`

Set the production Site URL to `https://living-dex-companion.vercel.app`. The older `pokemon-living-dex.vercel.app` address remains allow-listed only for compatibility while it is still reachable.

## Google and Discord

Enable Google and Discord in Supabase Authentication Providers. Create the OAuth applications with each provider and configure their callback URL as:

`https://<your-project-ref>.supabase.co/auth/v1/callback`

Provider client secrets belong only in the Supabase dashboard. See the official guides for [Google](https://supabase.com/docs/guides/auth/social-login/auth-google) and [Discord](https://supabase.com/docs/guides/auth/social-login/auth-discord).

## Production security

Before enabling authentication for the public:

- Run Supabase Database Security Advisor and resolve every exposed-table/RLS warning.
- Keep email confirmation enabled and set OTP expiry to 1 hour or less.
- Review Authentication rate limits and enable CAPTCHA when public traffic makes email abuse possible.
- Configure custom SMTP before relying on magic links in production.
- Enable MFA on every Supabase organization administrator account.
- Enable SSL enforcement and restrict database network access when the plan supports it.
- Register only exact production and local redirect URLs; do not use broad wildcard redirects.
- Verify that all migrations, including `20260908213000_harden_cloud_collection.sql` and `20260911150000_add_continuous_collection_sync.sql`, are applied.

The application does not copy a user's name or email into the collection tables or IndexedDB. Those values remain in Supabase Auth and are read from the active session only to identify the connected account in the interface.

## Continuous synchronization

IndexedDB remains the primary store. The first upload to an empty account still requires explicit confirmation, preventing a collection left in a shared browser from being copied to a different account. After that link is established, the app records a per-user cloud revision in local storage and compares deterministic snapshots. Device-only changes are uploaded; cloud-only changes are restored locally. Uploads use an expected revision inside a PostgreSQL transaction so stale clients cannot overwrite newer data.

If both sides changed since their shared revision, synchronization stops without modifying either collection. The account screen asks the user to keep either the device snapshot or the cloud snapshot. Local edits made offline remain available while synchronization is unavailable and are retried when the tab regains focus or the periodic check runs.
