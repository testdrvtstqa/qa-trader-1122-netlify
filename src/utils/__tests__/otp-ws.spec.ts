import type { AuthInfo } from '@/external/deriv-core';
import { getWebSocketOTP } from '@/external/deriv-core';

import { getValidAuthInfo } from '../auth-session';

jest.mock('@/external/deriv-core', () => ({
    getWebSocketOTP: jest.fn(),
}));

jest.mock('../auth-session', () => ({
    getValidAuthInfo: jest.fn(),
}));

const mockGetWebSocketOTP = jest.mocked(getWebSocketOTP);
const mockGetValidAuthInfo = jest.mocked(getValidAuthInfo);

const auth_info: AuthInfo = {
    access_token: 'access-token',
    token_type: 'Bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    scope: 'trade',
    refresh_token: 'refresh-token',
};

/**
 * The one-time WebSocket URL is single use. The bug this guards
 * (deriv-api-v2#782) was a URL minted once at boot and stashed in
 * sessionStorage: every later connection attempt found the stash empty and
 * fell back to a credential-less URL. Every attempt must mint its own.
 */
describe('getOtpWsUrl', () => {
    // The in-flight cache is module state that outlives a single call, so each
    // test gets its own copy of the module rather than inheriting the previous
    // test's pending mint.
    let getOtpWsUrl: () => Promise<string | null>;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('account_id', 'CR111111');
        mockGetValidAuthInfo.mockResolvedValue(auth_info);
        mockGetWebSocketOTP.mockImplementation(() => Promise.resolve('wss://minted/url'));

        jest.isolateModules(() => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            getOtpWsUrl = require('../otp-ws').getOtpWsUrl;
        });
    });

    it('mints a new URL on every sequential call', async () => {
        mockGetWebSocketOTP
            .mockResolvedValueOnce('wss://minted/first')
            .mockResolvedValueOnce('wss://minted/second');

        const first = await getOtpWsUrl();
        // The in-flight cache clears on a 100ms timer (bot parity), so a
        // sequential caller must wait past it to prove it mints again.
        await new Promise(resolve => setTimeout(resolve, 150));
        const second = await getOtpWsUrl();

        expect(mockGetWebSocketOTP).toHaveBeenCalledTimes(2);
        expect(first).toBe('wss://minted/first');
        expect(second).toBe('wss://minted/second');
    });

    it('mints for the account currently selected', async () => {
        await getOtpWsUrl();

        expect(mockGetWebSocketOTP).toHaveBeenCalledWith('CR111111', auth_info, expect.any(String));
    });

    it('returns null when there is no OAuth session', async () => {
        mockGetValidAuthInfo.mockResolvedValue(null);

        await expect(getOtpWsUrl()).resolves.toBeNull();
        expect(mockGetWebSocketOTP).not.toHaveBeenCalled();
    });

    it('returns null when no account is selected', async () => {
        localStorage.removeItem('account_id');

        await expect(getOtpWsUrl()).resolves.toBeNull();
        expect(mockGetWebSocketOTP).not.toHaveBeenCalled();
    });

    it('returns null when the mint fails', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        mockGetWebSocketOTP.mockRejectedValue(new Error('otp endpoint down'));

        await expect(getOtpWsUrl()).resolves.toBeNull();
    });

    it('shares a single mint between concurrent callers', async () => {
        const [first, second] = await Promise.all([getOtpWsUrl(), getOtpWsUrl()]);

        expect(mockGetWebSocketOTP).toHaveBeenCalledTimes(1);
        expect(first).toBe('wss://minted/url');
        expect(second).toBe('wss://minted/url');
    });
});
