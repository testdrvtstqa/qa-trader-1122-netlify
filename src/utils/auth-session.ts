import {
    clearAllAuthData,
    getDerivAccounts,
    getStoredAuthInfo,
    refreshAccessToken,
    type AuthInfo,
} from '@/external/deriv-core';

/**
 * White-label OAuth session helpers.
 *
 * `getAuthInfo()` conflates "is there a session?" with "is the access token
 * still usable?" — it returns null to both once `expires_at` passes. The two
 * questions have different right answers for an expired-but-refreshable
 * session, so they get separate names here (deriv-api-v2#782):
 *
 * - `hasOAuthSession()` — the predicate. True whenever a session record
 *   exists, expired or not. Used by every branch that decides whether this is
 *   a white-label OAuth deploy or a first-party Ory-cookie one.
 * - `getValidAuthInfo()` — the token. Refreshes on use when the access token
 *   is at or near expiry, so a session lasts as long as its refresh token.
 *
 * No proactive refresh timer: the only thing an idle tab needs a valid token
 * for is its next Bearer call, and every Bearer call comes through here.
 */

/** Refresh this far ahead of `expires_at` — margin for the request round-trip. */
const REFRESH_WINDOW_SECONDS = 120;

export const hasOAuthSession = (): boolean => getStoredAuthInfo() !== null;

export const getValidAuthInfo = async (): Promise<AuthInfo | null> => {
    const auth_info = getStoredAuthInfo();
    if (!auth_info) return null;

    const expires_within_window =
        typeof auth_info.expires_at === 'number' &&
        auth_info.expires_at - REFRESH_WINDOW_SECONDS <= Math.floor(Date.now() / 1000);

    if (!expires_within_window) return auth_info;

    // An expired record with no refresh token can never mint again. Leaving it
    // in place makes hasOAuthSession() true forever — getCompleteWebSocketURL
    // would throw on every attempt and onConnectionError would withhold its
    // wipe — so clear it like a rejected refresh and take the unauthenticated
    // path (deriv-api-v2#782).
    if (!auth_info.refresh_token) {
        clearAllAuthData();
        return null;
    }

    try {
        // refreshAccessToken stores the new record itself, and clears the whole
        // session on rejection — so a failure needs no cleanup here, only the
        // null that sends the caller down its unauthenticated path.
        return await refreshAccessToken(auth_info.refresh_token, process.env.NEXT_PUBLIC_DERIV_APP_ID || '');
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to refresh the OAuth access token:', error);
        return null;
    }
};

/**
 * Restore the vendored stores' account keys from the OAuth session.
 *
 * The DTrader stores key their session off localStorage `account_id` /
 * `account_type`, which only this app's OAuth callback writes. Anything that
 * removes them — an older build's connection-error handler, a failure path —
 * leaves a perfectly good session that boots logged out, because nothing
 * rehydrates them from the still-present `auth_info` / `deriv_accounts`.
 * Runs before `initStore` reads them. No-op when there is nothing to restore
 * or an account is already selected.
 */
export const rehydrateAccountKeys = (): void => {
    if (localStorage.getItem('account_id')) return;
    if (!hasOAuthSession()) return;

    const accounts = getDerivAccounts();
    if (!accounts || accounts.length === 0) return;

    const active_loginid = localStorage.getItem('active_loginid');
    const account = accounts.find(acc => acc.account_id === active_loginid) ?? accounts[0];

    localStorage.setItem('account_id', account.account_id);
    localStorage.setItem('account_type', account.account_type);
    // `active_loginid` is removed by the same wipe this recovers from, and the
    // client store reads it (sessionStorage first) when resolving the loginid —
    // restore it to match the selected account, from both storages, as
    // switchAccount/responseAuthorize do.
    localStorage.setItem('active_loginid', account.account_id);
    sessionStorage.setItem('active_loginid', account.account_id);
};
