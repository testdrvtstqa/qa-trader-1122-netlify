# Trader

A full-featured derivatives trading terminal on the Deriv trading API: live
SmartCharts charting, streaming prices, and one-click contract purchase across
Rise/Fall, Accumulators, Multipliers, Turbos, Vanillas, Higher/Lower,
Touch/No Touch, Matches/Differs and Over/Under.

> **Note:** Unlike the Next.js templates in this repo (Rise/Fall, Accumulators,
> Digits), the trader is a **[Rsbuild](https://rsbuild.dev) + React Router**
> single-page app vendored from Deriv's production trading platform. The
> commands, build output, and environment variables below differ accordingly.

## Prerequisites

- Node.js 18.18 or later

## Step 1: Register Your App ID

1. Log in to your Deriv account and go to the [API Token page](https://app.deriv.com/account/api-token) to create a token with the required scopes.
2. Navigate to [App Registration](https://developers.deriv.com/dashboard/) and register a new application.
3. Set the **Redirect URI** to the URL where you will host this app (e.g. `http://localhost:4004` for local development).
4. Copy the **App ID** shown after registration — you will need it in the next step.

## Step 2: Configure `.env`

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_DERIV_APP_ID` | Deriv app id issued for your registered app. Drives OAuth login/sign-up and the authenticated trading WebSocket. Without it, Log in / Sign up stay disabled. |
| `NEXT_PUBLIC_DERIV_ENV` | `production` for live Deriv endpoints; `preview` (or `staging`) for staging. |
| `NEXT_PUBLIC_DERIV_APP_NAME` | Display name used in the header logo badge, document title, and in-app popups (falls back to `brand.config.json` `platform.name`). |
| `NEXT_PUBLIC_DERIV_REFERRAL_LINK` | Affiliate referral link — appended as `affiliate_token` / `utm_campaign` on OAuth (optional). |

> These variables are injected at **build time** via Rsbuild's `source.define`
> (see `rsbuild.config.ts`), so re-build after changing them.

## Step 3: Local Development

```bash
npm install
npm run dev
```

The app is available at `http://localhost:4004`.

## Step 4: Build for Production

```bash
npm run build
```

This produces a static build in the `dist/` directory (Rsbuild output — there is
no `.next`/`out`). Serve the contents of `dist/` from any web server or static
host. SmartCharts engine assets (including the Flutter/CanvasKit chart renderer)
are copied into `dist/js/smartcharts/` during the build.

## Authentication

Login uses the same OAuth 2.0 PKCE flow as the other templates: the Log in
button redirects to Deriv's auth page with your `NEXT_PUBLIC_DERIV_APP_ID`, and
the app exchanges the returned code for tokens on your own origin. No Deriv
cookies are involved, so the app works on any domain you host it on.

The authenticated trading WebSocket is opened with a one-time URL fetched with
the Bearer token. That URL is single use, so the app fetches a new one for
every connection attempt: the first connection, each automatic reconnect, and
each account switch. Nothing is stored between attempts.

The access token is refreshed on use. Before any request that carries the
Bearer token, the app checks whether the token is close to expiring and
refreshes it first, so a session stays connected for as long as its refresh
token is valid. If a refresh is rejected, the app clears the session and
returns to the logged-out state.

## Branding & White-labeling

Branding (logo, primary color, fonts, app name) is driven by
**`brand.config.json`**:

- **Colors / fonts / app name** — edit `brand.config.json`; the values are
  applied at runtime on startup by `src/utils/apply-branding.ts` (no build
  step involved).
- **Primary color scope** — the brand color drives the app chrome (header,
  sidebar, bottom navigation, login button, logo badge) and the trade
  colours: Rise/Buy uses the brand color and Fall/Sell its complementary
  opposite (hue-rotated 180°; monochrome brands fall back to the stock
  cherry sell colour, since greys have no complement), each expanded into
  full light/dark shade ladders. Semantic profit/loss and error colours
  stay stock.
- **Logo** — drop a `public/logo.<png|jpg|jpeg|webp>` to set the header logo;
  it is also used as the favicon. Without it, a letter badge (the app name's
  first letter) is shown.
- **Theme** — a light/dark toggle lives in the sidebar (desktop) and the Menu
  page (mobile).

When assembled by the App Builder, these are configured for you (logo upload,
color, font, and app name are injected at deploy time).

## Project Structure

```
templates/trader/
  index.html            # SPA shell
  rsbuild.config.ts     # Build config (aliases, sass, asset copy)
  brand.config.json     # White-label branding source of truth
  public/               # Static assets served as-is
  src/
    main.tsx            # Entry: OAuth callback seam + store bootstrap
    components/         # Template-owned components (brand logo, …)
    utils/              # Branding, OTP WebSocket bridge, version check
    preview/            # App Builder live-preview bridge (stripped from deploys)
    external/deriv-core # Vendored OAuth/PKCE + accounts client
    vendor/             # Vendored DTrader app (core, trader, shared, api, …)
```
