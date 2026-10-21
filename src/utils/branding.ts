import brandConfig from '../../brand.config.json';

// Candidate logo paths, in priority order. Only used as a blind-probe fallback for
// apps assembled by an older BFF that didn't record platform.logo_path in
// brand.config.json (see getLogoCandidates below).
export const LOGO_CANDIDATES = ['/logo.png', '/logo.jpg', '/logo.jpeg', '/logo.webp'];

type PlatformBrand = {
    name?: string;
    show_name?: boolean;
    logo_path?: string | null;
};

function getPlatform(): PlatformBrand | undefined {
    return (brandConfig as { platform?: PlatformBrand } | undefined)?.platform;
}

/**
 * Resolves which logo paths are worth requesting. The BFF records the injected
 * logo's exact public path in brand.config.json at deploy time
 * (platform.logo_path — distinct from platform.logo, the champion icon name):
 * a "/logo.<ext>" string when a logo ships, null when the partner set none —
 * so a logo-less app makes no logo requests at all instead of 404-probing
 * every extension. Apps assembled by an older BFF carry no logo_path field
 * (undefined): fall back to probing all LOGO_CANDIDATES, the old behaviour.
 */
export function getLogoCandidates(): string[] {
    const platform = getPlatform() ?? {};
    if (platform.logo_path === undefined) return LOGO_CANDIDATES;
    return platform.logo_path ? [platform.logo_path] : [];
}

/**
 * Resolves the partner app name for the header / sidebar / title / favicon.
 * Preference: NEXT_PUBLIC_DERIV_APP_NAME → brand.config.json `platform.name`
 * → 'Trader'. Env wins so partners editing `.env` after a source download
 * take effect (App Builder also writes platform.name; env is the override).
 * Configure/OAuth registration name is separate and is not written here.
 */
export function getAppName(): string {
    const fromEnv = process.env.NEXT_PUBLIC_DERIV_APP_NAME?.trim();
    if (fromEnv) return fromEnv;
    const fromConfig = getPlatform()?.name?.trim();
    return fromConfig || 'Trader';
}

/**
 * Whether the brand mark should render the name text next to the logo.
 * Trader has no chrome room for this — App Builder forces show_name false;
 * brand.config.json defaults to false. Treat absent as true only for older
 * assembled apps that never wrote the key.
 */
export function getShowAppName(): boolean {
    return getPlatform()?.show_name !== false;
}
