# Menu Admin Panel — Setup Guide

Your site now has a password-protected admin panel at **`/admin`** for
editing the menu (categories, items, descriptions, prices, badges, and
photos) without touching any code. Changes made in the panel go live on the
site immediately after you click **Save Changes** — no redeploy needed.

## How it works

- `/admin/login.html` — login screen
- `/admin/index.html` — the menu editor
- `/api/*` — small serverless functions (already included, run automatically
  on Vercel) that handle login and reading/writing the menu
- Menu data is stored in **Vercel Blob** storage, so edits persist across
  deployments. Photos you upload in the panel are also stored there.
- If Blob storage isn't set up yet, or nothing has been saved yet, the site
  falls back to the menu bundled in `data/menu-data.json` (the menu you
  already have today), so the public site never breaks.

## One-time setup on Vercel

### 1. Add environment variables
In your Vercel project → **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `ADMIN_USERNAME` | the login username you want, e.g. `admin` |
| `ADMIN_PASSWORD` | a strong password |
| `SESSION_SECRET` | any long random string (e.g. generate one at randomkeygen.com) — this signs the login session, keep it secret |

Apply them to the **Production** environment (and Preview if you want admin
access on preview deployments too).

### 2. Add Vercel Blob storage
1. In your Vercel project, go to the **Storage** tab.
2. Click **Create Database → Blob**.
3. Connect it to this project.

Vercel automatically adds the required token to your project — no extra
env var needed on your end.

### 3. Redeploy
Trigger a new deployment (push a commit, or click **Redeploy** in Vercel) so
the new environment variables and the `/api` and `/admin` folders take
effect.

## Using the panel

1. Go to `https://yourdomain.com/admin` (or `/admin/login.html`).
2. Log in with the username/password you set above.
3. Edit category titles, item names, descriptions, prices, and badges
   directly in the fields.
4. Click **Change Photo** on any item to upload a new photo — it's resized
   automatically so uploads stay small and fast.
5. Use **+ Add Item** / **+ Add Category** / **Delete** to add or remove
   menu entries.
6. Click **Save Changes** at the top. The public menu updates right away.

## Notes & limits

- Sessions last 12 hours, then you'll need to log in again.
- Photo uploads are capped at a few MB after automatic compression — plenty
  for menu photos.
- Only one admin account is supported (shared username/password). If you
  need multiple staff logins later, that's a bigger change — just ask.
- Consider changing `ADMIN_PASSWORD` periodically, especially if staff turn
  over.
