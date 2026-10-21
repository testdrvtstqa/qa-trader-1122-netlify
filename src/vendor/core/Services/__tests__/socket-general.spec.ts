import { hasOAuthSession } from '@/utils/auth-session';

import BinarySocketGeneral from '../socket-general';

jest.mock('@/utils/auth-session', () => ({
    hasOAuthSession: jest.fn(),
}));

jest.mock(
    '@deriv/shared',
    () => ({
        getPropertyValue: jest.fn(),
        getSocketURL: jest.fn(() => 'ws.example.com'),
        mapErrorMessage: jest.fn(),
    }),
    { virtual: true }
);

// Ships ESM only, which jest's CommonJS transform cannot parse here.
jest.mock('@deriv-com/translations', () => ({ localize: (text: string) => text }));

jest.mock('../ws-methods', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        forgetAll: jest.fn(),
        subscribeBalance: jest.fn(),
        setOnReconnect: jest.fn(),
    },
}));

jest.mock(
    '@core/_common/base/server_time',
    () => ({ __esModule: true, default: { init: jest.fn(), get: jest.fn() } }),
    { virtual: true }
);

const mockHasOAuthSession = jest.mocked(hasOAuthSession);

/**
 * deriv-api-v2#782: three WebSocket errors (~15s after the socket dies) used to
 * wipe the stored account credentials unconditionally. On a white-label deploy
 * nothing rehydrates them, so a transient outage turned into a logout the user
 * only discovered on refresh. A connection error is not a logout.
 */
describe('BinarySocketGeneral.onConnectionError', () => {
    const setError = jest.fn();

    const initHandlers = () =>
        BinarySocketGeneral.init({
            client: {},
            common: { setError },
            gtm: {},
        });

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('active_loginid', 'CR111111');
        localStorage.setItem('account_id', 'CR111111');
        localStorage.setItem('account_type', 'real');
    });

    it('leaves the account credentials intact when an OAuth session exists', () => {
        mockHasOAuthSession.mockReturnValue(true);

        initHandlers().onConnectionError();

        expect(localStorage.getItem('active_loginid')).toBe('CR111111');
        expect(localStorage.getItem('account_id')).toBe('CR111111');
        expect(localStorage.getItem('account_type')).toBe('real');
    });

    it('still raises the user-facing connection error', () => {
        mockHasOAuthSession.mockReturnValue(true);

        initHandlers().onConnectionError();

        expect(setError).toHaveBeenCalledWith(true, expect.objectContaining({ message: expect.any(String) }));
    });

    it('clears the credentials when there is no OAuth session', () => {
        mockHasOAuthSession.mockReturnValue(false);

        initHandlers().onConnectionError();

        expect(localStorage.getItem('active_loginid')).toBeNull();
        expect(localStorage.getItem('account_id')).toBeNull();
        expect(localStorage.getItem('account_type')).toBeNull();
    });
});
