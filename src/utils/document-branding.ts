import { applyBrandFont, applyPrimaryColor, getAppliedBrandColor } from './apply-branding';
import { getAppName, getLogoCandidates } from './branding';
import { isPreviewMode } from './is-preview-mode';
import brandConfig from '../../brand.config.json';

/**
 * Sets the document title from the resolved app name. The BFF injects the partner app
 * name into .env.production (NEXT_PUBLIC_DERIV_APP_NAME) at deploy time, so the deployed
 * app's tab title reflects the partner brand. In preview, the App Builder's
 * PREVIEW_BRANDING `appName` overrides this afterwards.
 */
export function applyDocumentTitle(): void {
    const name = getAppName();
    if (name) document.title = name;
}

/**
 * Points the favicon <link rel="icon"> at the given href, creating the link if needed.
 */
export function setFaviconHref(href: string, type = 'image/png'): void {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.type = type;
    link.href = href;
}

/**
 * Builds an SVG letter-badge favicon data URI — the first letter of the app name on the
 * partner primary colour, the favicon counterpart of the header LogoMark badge. Used by
 * deployed apps with no public/logo.<ext> and by the preview when the logo is cleared.
 * Mirrors the Next.js templates' lib/build-favicon-uri.ts. Base64 (UTF-8 safe) is used
 * instead of percent-encoded raw SVG so Firefox/Safari don't misparse '#'.
 */
export function buildLetterFaviconUri(appName: string = getAppName()): string {
    const letter = appName.trim().charAt(0).toUpperCase() || 'A';
    // The applied colour first so live preview overrides are honoured. Reading the
    // --brand-primary CSS variable (as the bot does) is wrong here: the trader never
    // sets it on the root element — champion's stock theme declares it there, so the
    // computed value is always Deriv red regardless of the partner's chosen colour.
    const bgColor = getAppliedBrandColor() || brandConfig?.colors?.primary || '#000000';
    const svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
        `<rect width="32" height="32" rx="6" fill="${bgColor}"/>`,
        '<text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"',
        ` fill="white" font-size="20" font-family="sans-serif" font-weight="bold">${letter}</text>`,
        '</svg>',
    ].join('');
    // UTF-8 safe base64 — btoa() alone throws on non-Latin1 first letters.
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Uses the partner logo (public/logo.<ext>, written by the BFF at deploy time) as the
 * favicon when present. The candidates come from brand.config.json platform.logo_path
 * (see getLogoCandidates) — the exact file when a logo ships, none when it doesn't.
 * Each candidate is loaded first so the favicon is only swapped if the file actually
 * exists; if none load, falls back to a letter-badge SVG built from the app name
 * (matching the header LogoMark) rather than leaving the deriv default.
 */
export function applyFaviconFromLogo(): void {
    // The static preview build ships no public/logo.*, so there's nothing to probe — set
    // the letter badge directly (avoiding pointless 404s). A later PREVIEW_BRANDING message
    // overrides it with the App Builder logo, or clears back to the badge (use-preview-branding).
    if (isPreviewMode()) {
        setFaviconHref(buildLetterFaviconUri(), 'image/svg+xml');
        return;
    }

    const candidates = getLogoCandidates();
    const tryCandidate = (index: number): void => {
        if (index >= candidates.length) {
            setFaviconHref(buildLetterFaviconUri(), 'image/svg+xml');
            return;
        }
        const src = candidates[index];
        const img = new Image();
        img.onload = () => setFaviconHref(src);
        img.onerror = () => tryCandidate(index + 1);
        img.src = src;
    };
    tryCandidate(0);
}

/**
 * Loads the partner's configured web font at startup. The BFF writes the chosen
 * font family into brand.config.json (typography.font_family.primary) at deploy
 * time; we load it and apply the family stack to --brand-font-primary. Unknown /
 * custom stacks (e.g. the default system stack) are left as-is.
 */
export function applyBrandFontFromConfig(): void {
    const family = brandConfig?.typography?.font_family?.primary;
    if (family) applyBrandFont(family);
}

/**
 * Applies the partner brand colours from brand.config.json (colors.primary and
 * colors.secondary — the single source of truth, written by the App Builder BFF at
 * deploy time). This runtime call is the ONLY mechanism that carries the partner
 * colours; it applies the same chrome-scoped stylesheet the live preview uses. A
 * subsequent PREVIEW_BRANDING message overrides this.
 *
 * `colors.secondary` is absent for every project created before the App Builder
 * offered a second colour picker, so Fall/Sell falls back to stock cherry there.
 */
export function applyPrimaryColorFromConfig(): void {
    const color = brandConfig?.colors?.primary;
    if (color) applyPrimaryColor(color, brandConfig?.colors?.secondary);
}
