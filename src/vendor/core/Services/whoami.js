import { hasOAuthSession } from '@/utils/auth-session';
import { getWhoAmIURL } from '@deriv/shared';

/**
 * Check session validity via REST API whoami endpoint
 * @returns Promise with response data: { success: true } or { error: { code: 401, status: 'Unauthorized' } }
 */
export const checkWhoAmI = async () => {
    // White-label OAuth sessions are Bearer-token based — the session authority
    // is the OAuth session, not the Ory cookie. The whoami endpoint is also
    // cross-origin-blocked on partner domains, so skip the request entirely
    // whenever a session record exists. An expired-but-refreshable token is
    // still an OAuth session: running whoami for it would 401 cookielessly and
    // take the session down with it (deriv-api-v2#782).
    if (hasOAuthSession()) {
        return { success: true, data: {} };
    }

    try {
        const whoamiUrl = getWhoAmIURL();

        const response = await fetch(whoamiUrl, {
            method: 'GET',
            credentials: 'include',
        });

        const data = await response.json();

        // Check for 401 Unauthorized error in response body
        if (data.error && (data.error.code === 401 || data.error.status === 'Unauthorized')) {
            return { error: { code: 401, status: 'Unauthorized' } };
        }

        // Return success response
        return { success: true, data };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[WhoAmI Error]', error);
        // Return error but don't trigger cleanup for network errors
        return { error: { message: error.message } };
    }
};
