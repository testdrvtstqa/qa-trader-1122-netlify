import { getAppName, getShowAppName } from '../branding';

jest.mock('../../../brand.config.json', () => ({
    platform: {
        name: 'Display Trader',
        show_name: false,
    },
}));

describe('branding helpers', () => {
    const originalEnv = process.env.NEXT_PUBLIC_DERIV_APP_NAME;

    afterEach(() => {
        if (originalEnv === undefined) {
            delete process.env.NEXT_PUBLIC_DERIV_APP_NAME;
        } else {
            process.env.NEXT_PUBLIC_DERIV_APP_NAME = originalEnv;
        }
    });

    it('prefers NEXT_PUBLIC_DERIV_APP_NAME over platform.name', () => {
        process.env.NEXT_PUBLIC_DERIV_APP_NAME = 'Env Trader';
        expect(getAppName()).toBe('Env Trader');
    });

    it('falls back to platform.name when the env var is blank', () => {
        process.env.NEXT_PUBLIC_DERIV_APP_NAME = '   ';
        expect(getAppName()).toBe('Display Trader');
    });

    it('returns show_name from brand config (false for trader default)', () => {
        expect(getShowAppName()).toBe(false);
    });
});
