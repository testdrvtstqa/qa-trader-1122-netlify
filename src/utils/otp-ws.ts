import { getWebSocketOTP } from '@/external/deriv-core';

import { getValidAuthInfo } from './auth-session';

/**
 * White-label OAuth → WebSocket bridge (bot parity).
 *
 * Upstream DTrader authorizes its trading WebSocket with the Ory session
 * cookie (`wss://…/options/v1/ws/{demo|real}?account_id=…`). On a partner
 * domain that cookie never rides along, so the handshake 401s. The bot
 * template instead exchanges the OAuth Bearer token for a one-time
 * authenticated WebSocket URL (`POST /accounts/{id}/otp`).
 *
 * That URL is single use, so it is minted here per connection attempt — the
 * vendored `getCompleteWebSocketURL` (shared config) awaits it just before the
 * socket opens. It is deliberately never persisted: a stashed URL is spent by
 * the first attempt, leaving every reconnect to fall back to a credential-less
 * URL, which is the failure this replaced (deriv-api-v2#782).
 *
 * Returns null when there is no OAuth session (e.g. on Deriv's own domains,
 * where the cookie flow keeps working) or when the mint fails.
 */

/**
 * Mints in flight, keyed by account id. Overlapping reconnect triggers — the
 * 5s timer and the `online` listener — would otherwise each spend an OTP.
 * Mirrors the bot's DerivWSAccountsService, including the short clear delay
 * that keeps the cache from ever serving a spent URL to the next attempt.
 */
const in_flight_mints = new Map<string, Promise<string | null>>();
const IN_FLIGHT_CLEAR_MS = 100;

export const getOtpWsUrl = async (): Promise<string | null> => {
    const account_id = localStorage.getItem('account_id');
    if (!account_id) return null;

    const in_flight = in_flight_mints.get(account_id);
    if (in_flight) return in_flight;

    const mint = (async (): Promise<string | null> => {
        try {
            const auth_info = await getValidAuthInfo();
            if (!auth_info) return null;

            return await getWebSocketOTP(account_id, auth_info, process.env.NEXT_PUBLIC_DERIV_APP_ID || '');
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to mint an authenticated WebSocket URL:', error);
            return null;
        } finally {
            setTimeout(() => {
                in_flight_mints.delete(account_id);
            }, IN_FLIGHT_CLEAR_MS);
        }
    })();

    in_flight_mints.set(account_id, mint);
    return mint;
};
