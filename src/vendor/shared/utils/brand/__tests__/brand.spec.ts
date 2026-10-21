import { getBrandName } from '../brand';

jest.mock('../../../../../../brand.config.json', () => ({
    brand_name: 'Brand Placeholder',
    platform: {
        name: 'Platform Trader',
        show_name: false,
    },
}));

describe('getBrandName', () => {
    const originalEnv = process.env.NEXT_PUBLIC_DERIV_APP_NAME;

    afterEach(() => {
        if (originalEnv === undefined) {
            delete process.env.NEXT_PUBLIC_DERIV_APP_NAME;
        } else {
            process.env.NEXT_PUBLIC_DERIV_APP_NAME = originalEnv;
        }
    });

    it('prefers NEXT_PUBLIC_DERIV_APP_NAME (display name) over platform.name', () => {
        process.env.NEXT_PUBLIC_DERIV_APP_NAME = 'Welcome Brand';
        expect(getBrandName()).toBe('Welcome Brand');
    });

    it('falls back to platform.name when env is blank', () => {
        process.env.NEXT_PUBLIC_DERIV_APP_NAME = '   ';
        expect(getBrandName()).toBe('Platform Trader');
    });
});
