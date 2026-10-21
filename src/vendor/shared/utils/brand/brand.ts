// eslint-disable-next-line import/no-relative-packages
import _config_data from '../../../../../brand.config.json';
import { appendLangParam } from '../url/helpers';

/**
 * The vendored DTrader brand utils reference brand-config fields
 * (`brand_domains`, `brand_logo`, `api`, `api_core`, `auth`, `platform.logo`,
 * `platform.help_centre_url`) that are not present in the trimmed template
 * `brand.config.json`. Widen the imported config to a loose shape so `tsc`
 * resolves these accesses. TYPE-ONLY: no runtime impact.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config_data: Record<string, any> = _config_data;

export const getBrandDomains = (): readonly string[] => {
    return config_data.brand_domains;
};

export const getBrandName = () => {
    // White-label: the partner display name (baked by the App Builder at deploy
    // time) is the brand wherever champion shows one — e.g. the document
    // title's "Trade | <brand>" suffix. Prefer the env injection, then
    // platform.name from brand.config.json, then the config placeholder.
    const fromEnv = process.env.NEXT_PUBLIC_DERIV_APP_NAME?.trim();
    if (fromEnv) return fromEnv;
    const fromPlatform = config_data.platform?.name?.trim();
    if (fromPlatform) return fromPlatform;
    return config_data.brand_name;
};

export const getBrandLogo = () => {
    return config_data.brand_logo;
};

/**
 * Production check. The explicit NEXT_PUBLIC_DERIV_ENV build signal wins:
 * hostname detection can never match on a partner's own domain or in the
 * App Builder preview, which silently sent every non-dtrader.deriv.com
 * deployment to the STAGING trading API. Falls back to the upstream
 * hostname-based check when the env var is not set.
 */
export const isProduction = (): boolean => {
    const deriv_env = process.env.NEXT_PUBLIC_DERIV_ENV;
    if (deriv_env === 'production') return true;
    if (deriv_env === 'preview' || deriv_env === 'staging') return false;
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return (config_data.brand_domains as string[]).some(domain => {
        const pattern = new RegExp(`^(www\\.)?(beta-)?dtrader\\.${domain.replaceAll('.', '\\.')}$`, 'i');
        return pattern.test(hostname);
    });
};

export const getBrandHostname = () => {
    const hostname = isProduction() ? config_data.brand_hostname.production : config_data.brand_hostname.staging;
    return substituteDerivDomain(hostname);
};

export const getBrandUrl = () => {
    const hostname = isProduction() ? config_data.brand_hostname.production : config_data.brand_hostname.staging;
    return `https://${substituteDerivDomain(hostname)}`;
};

/**
 * Base URL for the Deriv cashier/onboarding flows (transfer, account creation).
 *
 * These pages are hosted by Deriv, NOT by the partner: they are part of the
 * Deriv account, so they only exist on home.deriv.com. `getBrandUrl()` returns
 * the partner's own `brand_hostname` — for an unconfigured template that is the
 * placeholder `yourbrand.com`, which produced dead links like
 * `https://staging.yourbrand.com/dashboard/transfer?...`.
 *
 * Mirrors the bot template's `getDerivDomain('derivHome')`; `isProduction()`
 * reads the same NEXT_PUBLIC_DERIV_ENV signal the rest of this module uses.
 */
export const getDerivHomeUrl = () => (isProduction() ? 'https://home.deriv.com' : 'https://staging-home.deriv.com');

/**
 * Full transfer (deposit) URL, matching the bot template's route so both
 * templates send users to the same cashier.
 */
export const getTransferUrl = (currency?: string, language?: string) => {
    const currency_param = currency ? `&curr=${currency}` : '';
    const lang_param = language ? `&lang=${language}` : '';
    return `${getDerivHomeUrl()}/dashboard/transfer?acc=options&from=home&source=options${currency_param}${lang_param}`;
};

/**
 * Full real-account onboarding URL (the "Try real" flow).
 */
export const getOnboardingUrl = (language?: string) => {
    const lang_param = language ? `&lang=${language}` : '';
    return `${getDerivHomeUrl()}/dashboard/onboarding/personal-details?source=options${lang_param}`;
};

export const getBrandHomeUrl = (language?: string) => {
    const baseUrl = `${getBrandUrl()}/home`;
    return appendLangParam(baseUrl, language);
};

export const getBrandLoginUrl = (language?: string) => {
    const baseUrl = `${getBrandUrl()}/login`;
    return appendLangParam(baseUrl, language);
};

export const getBrandSignupUrl = (language?: string) => {
    const baseUrl = `${getBrandUrl()}/signup`;
    return appendLangParam(baseUrl, language);
};

export const getPlatformName = () => {
    return config_data.platform.name;
};

export const getPlatformLogo = () => {
    return config_data.platform.logo;
};

export const getDomainName = () => {
    if (typeof window === 'undefined') return '';
    const hostname = window.location.hostname;
    if (!hostname) return '';
    // Split the hostname into parts
    const domainParts = hostname.split('.');

    // Ensure we have at least two parts (SLD and TLD)
    if (domainParts.length >= 2) {
        // Combine the SLD and TLD
        const domain = `${domainParts[domainParts.length - 2]}.${domainParts[domainParts.length - 1]}`;
        return domain;
    }

    return '';
};

/**
 * Replaces "deriv.com" in a URL with the current domain (e.g. deriv.be, deriv.me).
 * Returns the URL unchanged when running on localhost or an unrecognised hostname.
 */
const substituteDerivDomain = (url: string): string => {
    const domain = getDomainName();
    if (!domain || !(config_data.brand_domains as string[]).includes(domain)) return url;
    try {
        // Parse the URL so we only rewrite the hostname — not query params or path segments
        const parsed = new URL(url);
        parsed.hostname = parsed.hostname.replace(/deriv\.com$/, domain);
        return parsed.toString();
    } catch {
        // Fallback for non-absolute strings (e.g. "api-core.deriv.com", "home.deriv.com/dashboard")
        return url.replace(/deriv\.com/, domain);
    }
};

/**
 * Returns the current TLD (e.g. "deriv.be") only when it is a known brand domain.
 * Falls back to "deriv.com" on unrecognised hostnames to keep cookies on a trusted domain.
 */
export const getTrustedDomainName = (): string => {
    const domain = getDomainName();
    return (config_data.brand_domains as string[]).includes(domain) ? domain : 'deriv.com';
};

/**
 * Returns window.location.hostname for use as an OAuth redirect parameter,
 * but only if the current hostname belongs to a known brand domain or a
 * recognised Cloudflare Pages preview deployment.
 * Returns empty string on unrecognised hostnames to prevent open-redirect
 * attacks where an attacker-controlled copy of the app injects a redirect
 * back to their domain after authentication.
 */
const CLOUDFLARE_PAGES_PATTERN = /^[a-zA-Z0-9-]+\.derivatives-trader\.pages\.dev$/;
export const getRedirectHostname = (): string => {
    if (typeof window === 'undefined') return '';
    const hostname = window.location.hostname;
    const domain = getDomainName();
    if ((config_data.brand_domains as string[]).includes(domain)) return hostname;
    if (CLOUDFLARE_PAGES_PATTERN.test(hostname)) return hostname;
    return '';
};

/**
 * Gets the WebSocket server URL with base path
 * @returns WebSocket server URL with base path (e.g., "staging-api-core.deriv.com/options/v1/ws")
 */
export const getWebSocketURL = (): string => {
    const base = isProduction() ? config_data.api_core.production : config_data.api_core.staging;
    return `${substituteDerivDomain(base)}/options/v1/ws`;
};

/**
 * Gets the whoami endpoint URL
 * @returns Whoami endpoint URL (e.g., "https://auth.deriv.com/sessions/whoami")
 */
export const getWhoAmIURL = (): string => {
    const base = isProduction() ? config_data.auth.production : config_data.auth.staging;
    return substituteDerivDomain(`${base}/sessions/whoami`);
};

/**
 * Gets the logout endpoint URL
 * @returns Logout endpoint URL (e.g., "https://auth.deriv.com/self-service/logout/browser")
 */
export const getLogoutURL = (): string => {
    const base = isProduction() ? config_data.auth.production : config_data.auth.staging;
    return substituteDerivDomain(`${base}/self-service/logout/browser`);
};

/**
 * Gets the API Core URL based on environment
 * @returns API Core base URL (without protocol)
 */
export const getApiCoreUrl = (): string => {
    const url = isProduction() ? config_data.api_core.production : config_data.api_core.staging;
    return substituteDerivDomain(url);
};

/**
 * Gets the full API Core URL with protocol
 * @returns Full API Core URL with https://
 */
export const getApiCoreBaseUrl = (): string => {
    return `https://${getApiCoreUrl()}`;
};

/**
 * Gets the API URL for account_list based on environment
 * @returns API base URL (without protocol), e.g. "api.deriv.be"
 */
export const getApiUrl = (): string => {
    const url = isProduction() ? config_data.api.production : config_data.api.staging;
    return substituteDerivDomain(url);
};

/**
 * Gets the full API URL for account_list with protocol
 * @returns Full API URL with https://, e.g. "https://api.deriv.be"
 */
export const getApiBaseUrl = (): string => {
    return `https://${getApiUrl()}`;
};

/**
 * Gets the Help Centre URL
 * @returns Help Centre URL (e.g., "https://trade.deriv.com/help-centre/deriv-trader")
 */
export const getHelpCentreUrl = (): string => {
    return substituteDerivDomain(config_data.platform.help_centre_url);
};
