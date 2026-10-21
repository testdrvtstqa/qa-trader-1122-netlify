import { act, fireEvent, render, screen } from '@testing-library/react';

import BrandLogo from '../brand-logo';
import { LOGO_CANDIDATES } from '../../utils/branding';
import { setPreviewShowAppName } from '../../utils/live-branding-store';

let mockLogoCandidates: string[] = [];
jest.mock('../../utils/branding', () => {
    const actual = jest.requireActual('../../utils/branding');
    return {
        ...actual,
        getLogoCandidates: (): string[] => mockLogoCandidates,
        getAppName: (): string => 'Partner Trader',
        getShowAppName: (): boolean => true,
    };
});

jest.mock(
    '@deriv/shared',
    () => ({
        getUrlBase: (path: string) => path,
    }),
    { virtual: true }
);

describe('BrandLogo', () => {
    const originalAppBuild = process.env.NEXT_PUBLIC_APP_BUILD;

    beforeEach(() => {
        mockLogoCandidates = LOGO_CANDIDATES;
        setPreviewShowAppName(true);
    });

    afterEach(() => {
        process.env.NEXT_PUBLIC_APP_BUILD = originalAppBuild;
        setPreviewShowAppName(true);
    });

    it('renders the resolved app name next to the logo', () => {
        render(<BrandLogo />);
        expect(screen.getByText('Partner Trader')).toBeInTheDocument();
    });

    it('renders the logo image (first candidate) by default', () => {
        render(<BrandLogo />);
        expect(screen.getByRole('img')).toHaveAttribute('src', '/logo.png');
    });

    it('falls back to the letter badge after every logo candidate fails', () => {
        render(<BrandLogo />);
        for (let i = 0; i < 4; i++) {
            const img = screen.queryByRole('img');
            if (!img) break;
            fireEvent.error(img);
        }
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('P')).toBeInTheDocument();
    });

    it('skips logo file probing in the preview build and renders the letter badge', () => {
        process.env.NEXT_PUBLIC_APP_BUILD = 'true';
        render(<BrandLogo />);
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('P')).toBeInTheDocument();
    });

    it('hides the name text when preview showAppName is false', () => {
        process.env.NEXT_PUBLIC_APP_BUILD = 'true';
        act(() => {
            setPreviewShowAppName(false);
        });
        render(<BrandLogo />);
        expect(screen.queryByText('Partner Trader')).not.toBeInTheDocument();
    });
});
