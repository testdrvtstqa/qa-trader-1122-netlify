import React from 'react';

import { getUrlBase } from '@deriv/shared';

import { getAppName, getLogoCandidates, getShowAppName } from '@/utils/branding';
import { isPreviewMode } from '@/utils/is-preview-mode';
import {
    getPreviewAppName,
    getPreviewLogo,
    getPreviewShowAppName,
    subscribePreviewAppName,
    subscribePreviewLogo,
    subscribePreviewShowAppName,
} from '@/utils/live-branding-store';

type TBrandLogoProps = {
    size?: number;
};

/**
 * Partner brand mark, shared by the mobile header and the desktop sidebar
 * (mirrors the bot template's LogoMark). Resolution order:
 * 1. Live App Builder preview branding (logo pushed via PREVIEW_BRANDING).
 * 2. The partner logo the BFF ships at public/logo.<ext>, resolved via
 *    brand.config.json platform.logo_path (getLogoCandidates) — the exact
 *    file when a logo ships, nothing when the partner set none. Skipped in
 *    the preview build, which never ships a logo file.
 * 3. A letter badge: first letter of the app name on the brand colour.
 *
 * Name text next to the logo is gated by getShowAppName / preview showAppName.
 * CSS hides the text in the mobile header (desktop-only presentation); the
 * desktop sidebar keeps it visible when enabled.
 */
const BrandLogo = ({ size = 32 }: TBrandLogoProps) => {
    const [preview_logo, setPreviewLogoState] = React.useState<string | null>(getPreviewLogo());
    const [preview_name, setPreviewNameState] = React.useState<string | null>(getPreviewAppName());
    const [preview_show_name, setPreviewShowNameState] = React.useState<boolean>(getPreviewShowAppName());
    const [candidate_index, setCandidateIndex] = React.useState(0);

    React.useEffect(() => subscribePreviewLogo(setPreviewLogoState), []);
    React.useEffect(() => subscribePreviewAppName(setPreviewNameState), []);
    React.useEffect(() => subscribePreviewShowAppName(setPreviewShowNameState), []);

    const candidates = React.useMemo(() => {
        const file_candidates = isPreviewMode() ? [] : getLogoCandidates().map(path => getUrlBase(path));
        return preview_logo ? [preview_logo, ...file_candidates] : file_candidates;
    }, [preview_logo]);

    // Restart probing whenever the candidate list changes (e.g. a new preview logo).
    React.useEffect(() => setCandidateIndex(0), [candidates]);

    const app_name = preview_name || getAppName();
    const show_name = isPreviewMode() ? preview_show_name : getShowAppName();
    const badge_letter = app_name.trim().charAt(0).toUpperCase() || 'A';
    const logo_src = candidate_index < candidates.length ? candidates[candidate_index] : null;

    return (
        <span className='brand-logo'>
            {logo_src ? (
                <img
                    className='brand-logo__img'
                    src={logo_src}
                    alt={app_name}
                    style={{ height: `${size}px`, width: `${size}px`, objectFit: 'contain', borderRadius: '6px' }}
                    onError={() => setCandidateIndex(index => index + 1)}
                />
            ) : (
                <span
                    className='brand-logo__badge'
                    aria-hidden='true'
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: `${size}px`,
                        width: `${size}px`,
                        borderRadius: '8px',
                        backgroundColor: 'var(--brand-red-coral, #ff444f)',
                        color: '#fff',
                        fontSize: `${Math.round(size * 0.56)}px`,
                        fontWeight: 700,
                        lineHeight: 1,
                        flexShrink: 0,
                    }}
                >
                    {badge_letter}
                </span>
            )}
            {show_name && <span className='brand-logo__text'>{app_name}</span>}
        </span>
    );
};

export default BrandLogo;
