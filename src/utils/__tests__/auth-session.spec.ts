import type { AuthInfo, DerivAccount } from '@/external/deriv-core';
import { clearAllAuthData, getDerivAccounts, getStoredAuthInfo, refreshAccessToken } from '@/external/deriv-core';

import { getValidAuthInfo, hasOAuthSession, rehydrateAccountKeys } from '../auth-session';

jest.mock('@/external/deriv-core', () => ({
    clearAllAuthData: jest.fn(),
    getDerivAccounts: jest.fn(),
    getStoredAuthInfo: jest.fn(),
    refreshAccessToken: jest.fn(),
}));

const mockClearAllAuthData = jest.mocked(clearAllAuthData);
const mockGetDerivAccounts = jest.mocked(getDerivAccounts);
const mockGetStoredAuthInfo = jest.mocked(getStoredAuthInfo);
const mockRefreshAccessToken = jest.mocked(refreshAccessToken);

const now_seconds = () => Math.floor(Date.now() / 1000);

const makeAuthInfo = (expires_at: number, overrides: Partial<AuthInfo> = {}): AuthInfo => ({
    access_token: 'stored-token',
    token_type: 'Bearer',
    expires_in: 3600,
    expires_at,
    scope: 'trade',
    refresh_token: 'refresh-token',
    ...overrides,
});

const makeAccount = (account_id: string, account_type: 'demo' | 'real'): DerivAccount => ({
    account_id,
    account_type,
    currency: 'USD',
    balance: '0.00',
    group: '',
    status: '',
});

describe('getValidAuthInfo', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('refreshes when the token expires inside the refresh window', async () => {
        mockGetStoredAuthInfo.mockReturnValue(makeAuthInfo(now_seconds() + 30));
        const refreshed = makeAuthInfo(now_seconds() + 3600, { access_token: 'fresh-token' });
        mockRefreshAccessToken.mockResolvedValue(refreshed);

        await expect(getValidAuthInfo()).resolves.toBe(refreshed);
        expect(mockRefreshAccessToken).toHaveBeenCalledWith('refresh-token', expect.any(String));
    });

    it('does not refresh a token that is comfortably valid', async () => {
        const stored = makeAuthInfo(now_seconds() + 3600);
        mockGetStoredAuthInfo.mockReturnValue(stored);

        await expect(getValidAuthInfo()).resolves.toBe(stored);
        expect(mockRefreshAccessToken).not.toHaveBeenCalled();
    });

    it('refreshes a token that has already expired rather than reading it as no session', async () => {
        mockGetStoredAuthInfo.mockReturnValue(makeAuthInfo(now_seconds() - 3600));
        const refreshed = makeAuthInfo(now_seconds() + 3600, { access_token: 'fresh-token' });
        mockRefreshAccessToken.mockResolvedValue(refreshed);

        await expect(getValidAuthInfo()).resolves.toBe(refreshed);
        expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1);
    });

    it('returns null when the refresh is rejected', async () => {
        mockGetStoredAuthInfo.mockReturnValue(makeAuthInfo(now_seconds() - 10));
        mockRefreshAccessToken.mockRejectedValue(new Error('refresh token revoked'));

        await expect(getValidAuthInfo()).resolves.toBeNull();
    });

    it('returns null when there is no stored session', async () => {
        mockGetStoredAuthInfo.mockReturnValue(null);

        await expect(getValidAuthInfo()).resolves.toBeNull();
        expect(mockRefreshAccessToken).not.toHaveBeenCalled();
    });

    it('clears an expired session that has no refresh token, rather than leaving it permanently unrefreshable', async () => {
        mockGetStoredAuthInfo.mockReturnValue(makeAuthInfo(now_seconds() - 10, { refresh_token: '' }));
        // clearAllAuthData removes the record, so the predicate flips with it.
        mockClearAllAuthData.mockImplementation(() => mockGetStoredAuthInfo.mockReturnValue(null));

        await expect(getValidAuthInfo()).resolves.toBeNull();

        expect(mockRefreshAccessToken).not.toHaveBeenCalled();
        expect(mockClearAllAuthData).toHaveBeenCalledTimes(1);
        expect(hasOAuthSession()).toBe(false);
    });

    it('does not clear a session that is still comfortably valid', async () => {
        mockGetStoredAuthInfo.mockReturnValue(makeAuthInfo(now_seconds() + 3600));

        await expect(getValidAuthInfo()).resolves.not.toBeNull();
        expect(mockClearAllAuthData).not.toHaveBeenCalled();
    });
});

describe('hasOAuthSession', () => {
    it('stays true once the access token has passed its expiry', () => {
        mockGetStoredAuthInfo.mockReturnValue(makeAuthInfo(now_seconds() - 3600));

        expect(hasOAuthSession()).toBe(true);
    });

    it('is false when no session record exists', () => {
        mockGetStoredAuthInfo.mockReturnValue(null);

        expect(hasOAuthSession()).toBe(false);
    });
});

describe('rehydrateAccountKeys', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        mockGetStoredAuthInfo.mockReturnValue(makeAuthInfo(now_seconds() + 3600));
        mockGetDerivAccounts.mockReturnValue([makeAccount('VRTC222222', 'demo'), makeAccount('CR111111', 'real')]);
    });

    it('restores the previously active account', () => {
        localStorage.setItem('active_loginid', 'CR111111');

        rehydrateAccountKeys();

        expect(localStorage.getItem('account_id')).toBe('CR111111');
        expect(localStorage.getItem('account_type')).toBe('real');
        expect(sessionStorage.getItem('active_loginid')).toBe('CR111111');
    });

    it('falls back to the first cached account when none is recorded as active', () => {
        rehydrateAccountKeys();

        expect(localStorage.getItem('account_id')).toBe('VRTC222222');
        expect(localStorage.getItem('account_type')).toBe('demo');
        // The client store reads active_loginid (sessionStorage first) when
        // resolving the loginid, so the restore has to write it too.
        expect(localStorage.getItem('active_loginid')).toBe('VRTC222222');
        expect(sessionStorage.getItem('active_loginid')).toBe('VRTC222222');
    });

    it('repoints a stale active_loginid at the fallback account', () => {
        localStorage.setItem('active_loginid', 'CR999999');

        rehydrateAccountKeys();

        expect(localStorage.getItem('account_id')).toBe('VRTC222222');
        expect(localStorage.getItem('active_loginid')).toBe('VRTC222222');
        expect(sessionStorage.getItem('active_loginid')).toBe('VRTC222222');
    });

    it('does nothing without an OAuth session', () => {
        mockGetStoredAuthInfo.mockReturnValue(null);

        rehydrateAccountKeys();

        expect(localStorage.getItem('account_id')).toBeNull();
    });

    it('does nothing without a cached account list', () => {
        mockGetDerivAccounts.mockReturnValue(null);

        rehydrateAccountKeys();

        expect(localStorage.getItem('account_id')).toBeNull();
    });

    it('leaves an account that is already selected untouched', () => {
        localStorage.setItem('account_id', 'CR333333');
        localStorage.setItem('account_type', 'real');

        rehydrateAccountKeys();

        expect(localStorage.getItem('account_id')).toBe('CR333333');
        expect(sessionStorage.getItem('active_loginid')).toBeNull();
        expect(mockGetDerivAccounts).not.toHaveBeenCalled();
    });
});
