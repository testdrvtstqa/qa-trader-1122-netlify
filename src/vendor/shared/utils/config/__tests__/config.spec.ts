import Cookies from 'js-cookie';

import { hasOAuthSession } from '@/utils/auth-session';
import { getOtpWsUrl } from '@/utils/otp-ws';

import { getAccountId, getAccountType, getCompleteWebSocketURL } from '../config';

jest.mock('@/utils/otp-ws', () => ({
    getOtpWsUrl: jest.fn(),
}));

jest.mock('@/utils/auth-session', () => ({
    hasOAuthSession: jest.fn(),
}));

const mockGetOtpWsUrl = jest.mocked(getOtpWsUrl);
const mockHasOAuthSession = jest.mocked(hasOAuthSession);

/**
 * Guards the account_id resolution order, and specifically that the shared
 * `.deriv.com` `options_account_id` cookie is NOT a source.
 *
 * Upstream DTrader read that cookie so a session on another Deriv app could be
 * adopted without a round-trip. A partner app is a separate OAuth client with
 * its own session, so adopting it means connecting an authenticated WebSocket
 * for an account the user never selected here. Regressing this is a
 * cross-account data leak, not a cosmetic bug — hence the test.
 */
describe('shared/utils/config', () => {
    const setUrl = (search = '') => {
        window.history.replaceState({}, '', `/${search}`);
    };

    beforeEach(() => {
        localStorage.clear();
        Cookies.remove('options_account_id');
        setUrl();
    });

    describe('getAccountId', () => {
        it('ignores the shared options_account_id cookie', () => {
            Cookies.set('options_account_id', 'CR999999');

            expect(getAccountId()).toBeNull();
            // Must not be adopted into localStorage either — that would smuggle the
            // foreign account into every later read.
            expect(localStorage.getItem('account_id')).toBeNull();
        });

        it('reads the account_id this app stored itself', () => {
            localStorage.setItem('account_id', 'CR111111');

            expect(getAccountId()).toBe('CR111111');
        });

        it('prefers an explicit URL parameter and persists it', () => {
            setUrl('?account_id=VRTC222222');

            expect(getAccountId()).toBe('VRTC222222');
            expect(localStorage.getItem('account_id')).toBe('VRTC222222');
        });

        it('returns null with no URL param and nothing stored', () => {
            expect(getAccountId()).toBeNull();
        });
    });

    describe('getAccountType', () => {
        it('stays public when only the shared cookie is present', () => {
            Cookies.set('options_account_id', 'CR999999');

            expect(getAccountType()).toBe('public');
        });
    });

    describe('getCompleteWebSocketURL', () => {
        it('connects to the public endpoint when only the shared cookie is present', async () => {
            Cookies.set('options_account_id', 'CR999999');

            const url = await getCompleteWebSocketURL();

            expect(url).toContain('/public');
            expect(url).not.toContain('account_id=');
            expect(url).not.toContain('CR999999');
            expect(mockGetOtpWsUrl).not.toHaveBeenCalled();
        });

        it('connects to the authenticated endpoint for this app’s own account', async () => {
            localStorage.setItem('account_id', 'CR111111');
            localStorage.setItem('account_type', 'real');

            const url = await getCompleteWebSocketURL();

            expect(url).toContain('/real');
            expect(url).toContain('account_id=CR111111');
        });

        it('keeps the cookie-authorized URL for an account with no OAuth session', async () => {
            localStorage.setItem('account_id', 'CR111111');
            localStorage.setItem('account_type', 'real');
            mockGetOtpWsUrl.mockResolvedValue(null);
            mockHasOAuthSession.mockReturnValue(false);

            await expect(getCompleteWebSocketURL()).resolves.toContain('account_id=CR111111');
        });

        it('fails rather than connecting credential-less when the mint fails', async () => {
            localStorage.setItem('account_id', 'CR111111');
            localStorage.setItem('account_type', 'real');
            mockGetOtpWsUrl.mockResolvedValue(null);
            mockHasOAuthSession.mockReturnValue(true);

            await expect(getCompleteWebSocketURL()).rejects.toThrow(/authenticated WebSocket URL/);
        });

        /**
         * deriv-api-v2#782: the one-time URL used to be minted once at boot and
         * stashed in sessionStorage. The second connection attempt found the
         * stash empty and silently fell back to the cookie-authorized
         * `?account_id=` URL, which carries no credential on a partner domain —
         * so every reconnect failed the handshake for good.
         */
        it('mints a fresh authenticated URL on a second call rather than falling back', async () => {
            localStorage.setItem('account_id', 'CR111111');
            localStorage.setItem('account_type', 'real');
            mockGetOtpWsUrl.mockResolvedValueOnce('wss://minted/first').mockResolvedValueOnce('wss://minted/second');

            await getCompleteWebSocketURL();
            const second = await getCompleteWebSocketURL();

            expect(mockGetOtpWsUrl).toHaveBeenCalledTimes(2);
            expect(second).toBe('wss://minted/second');
            expect(second).not.toContain('account_id=');
        });
    });
});
