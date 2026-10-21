/*
 * Configuration values needed in js codes
 *
 * NOTE:
 * Please use the following command to avoid accidentally committing personal changes
 * git update-index --assume-unchanged packages/shared/src/utils/config.js
 *
 */

import { hasOAuthSession } from '@/utils/auth-session';
import { getOtpWsUrl } from '@/utils/otp-ws';

import { getWebSocketURL } from '../brand';

/**
 * Gets account_type with priority: URL parameter > localStorage > derived from the
 * resolved account_id > default 'public'
 * @returns 'real', 'demo', or 'public'
 */
export const getAccountType = (): 'real' | 'demo' | 'public' => {
    const search = window.location.search;
    const search_params = new URLSearchParams(search);
    const accountTypeFromUrl = search_params.get('account_type');

    // First priority: URL parameter
    if (accountTypeFromUrl === 'real' || accountTypeFromUrl === 'demo') {
        window.localStorage.setItem('account_type', accountTypeFromUrl);

        // Remove account_type from URL after processing
        const url = new URL(window.location.href);
        if (url.searchParams.has('account_type')) {
            url.searchParams.delete('account_type');
            window.history.replaceState({}, document.title, url.pathname + url.search);
        }

        return accountTypeFromUrl;
    }

    // Second priority: localStorage
    const storedAccountType = window.localStorage.getItem('account_type');
    if (storedAccountType === 'real' || storedAccountType === 'demo') {
        return storedAccountType;
    }

    // Third priority: derive from the resolved account_id. Since account_id === loginid,
    // its prefix gives the type (virtual `VR*` → demo, otherwise real), mirroring
    // getClientAccountType's `/^VR/` check. Deriving from getAccountId() rather than
    // reading a separate source guarantees the type always matches whichever
    // account_id the app actually uses.
    const account_id = getAccountId();
    if (account_id) {
        const account_type = /^VR/.test(account_id) ? 'demo' : 'real';
        window.localStorage.setItem('account_type', account_type);
        return account_type;
    }

    // Default to public when no account_type parameter or invalid value
    return 'public';
};

/**
 * Gets account_id with priority: URL parameter > localStorage > null.
 *
 * Upstream DTrader also fell back to the shared `.deriv.com` `options_account_id`
 * cookie, so a live session on another Deriv app (home.deriv.com, dtrader.deriv.com)
 * could be adopted without a round-trip. That does not apply here and is actively
 * harmful: a partner app is a separate OAuth client with its own session, so a
 * production Deriv session leaks an account_id belonging to a *different* account
 * and the app opens an authenticated WebSocket for it. The cookie fallback existed
 * only to support homepage → trading-app redirection flows, which the templates
 * never use, so it is removed. This app's own OAuth callback writes `account_id`
 * (src/main.tsx) — that is the only source it should trust.
 *
 * @returns account_id string or null
 */
export const getAccountId = (): string | null => {
    // 1. Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const accountIdFromUrl = urlParams.get('account_id');

    if (accountIdFromUrl) {
        localStorage.setItem('account_id', accountIdFromUrl);
        // Remove from URL after storing
        const url = new URL(window.location.href);
        url.searchParams.delete('account_id');
        window.history.replaceState({}, document.title, url.pathname + url.search);
        return accountIdFromUrl;
    }

    // 2. Check localStorage — written by this app's own OAuth callback.
    const storedAccountId = localStorage.getItem('account_id');
    if (storedAccountId) return storedAccountId;

    return null;
};

/**
 * Clears account_id from localStorage
 */
export const clearAccountId = (): void => {
    localStorage.removeItem('account_id');
};

/**
 * Gets migrated status from localStorage (set during app init via migration-status API)
 * @returns true if user is a fully migrated user
 */
export const getIsMigratedUser = (): boolean => {
    return localStorage.getItem('is_migrated_user') === 'true';
};

/**
 * Gets the complete WebSocket URL with proper endpoint and query params
 * @returns Complete WebSocket URL
 */
export const getCompleteWebSocketURL = async (): Promise<string> => {
    const server = getSocketURL();
    const account_id = getAccountId();
    const account_type = getAccountType();

    // Only connect to demo/real if BOTH account_type and account_id are present
    // Otherwise, connect to public endpoint
    const shouldUseAuthenticatedEndpoint = account_id && (account_type === 'real' || account_type === 'demo');

    let url = `wss://${server}/${shouldUseAuthenticatedEndpoint ? account_type : 'public'}`;

    // Add account_id query param for authenticated endpoints (real/demo)
    if (shouldUseAuthenticatedEndpoint) {
        // White-label OAuth bridge: the cookie-authorized handshake 401s on
        // partner domains, so a one-time authenticated URL is minted per
        // attempt via the OTP endpoint (src/utils/otp-ws.ts). This getter is
        // async purely to await that mint — it is the seam the whole fix hangs
        // on (deriv-api-v2#782).
        //
        // The cookie-authorized fallback below is now conditional: reaching it
        // with an OAuth session present would mean handing the socket a URL
        // that carries no credential on a partner domain, i.e. a guaranteed
        // 401 rather than graceful degradation. A failed mint therefore throws
        // and the caller reschedules, instead of silently connecting
        // unauthenticated — which is precisely the bug this replaced.
        const otp_url = await getOtpWsUrl();
        if (otp_url) return otp_url;
        if (hasOAuthSession()) {
            throw new Error('Failed to mint an authenticated WebSocket URL for the current account');
        }

        url += `?account_id=${account_id}`;
    }

    return url;
};

export const getSocketURL = () => {
    const local_storage_server_url = window.localStorage.getItem('config.server_url');
    if (local_storage_server_url) {
        // Validate it's a reasonable hostname (not a full URL, no protocol)
        if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(local_storage_server_url)) {
            return local_storage_server_url;
        }
        // Clear invalid value
        window.localStorage.removeItem('config.server_url');
    }

    // Get WebSocket server URL from brand config based on environment
    const server_url = getWebSocketURL();

    return server_url;
};

export const getDebugServiceWorker = () => {
    const debug_service_worker_flag = window.localStorage.getItem('debug_service_worker');
    if (debug_service_worker_flag) return !!parseInt(debug_service_worker_flag);

    return false;
};
