import React from 'react';

import { useSnackbar } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import { isPreviewMode } from '@/utils/is-preview-mode';

/**
 * Warns (once, on mount) when the OAuth app id isn't configured. On a freshly
 * deployed partner app the second deployment bakes NEXT_PUBLIC_DERIV_APP_ID;
 * until it finishes, Log in / Sign up would fail with a confusing error.
 * Mirrors the bot's app-content warning and the Next.js templates' EnvCheck.
 * Skipped inside the App Builder preview iframe (isPreviewMode), which
 * intentionally runs without env vars.
 */
const EnvVarsCheckSnackbar = () => {
    const { addSnackbar } = useSnackbar();
    const has_warned = React.useRef(false);

    React.useEffect(() => {
        if (has_warned.current || isPreviewMode()) return;
        if (!process.env.NEXT_PUBLIC_DERIV_APP_ID) {
            has_warned.current = true;
            // status 'fail' + close button + no delay = no auto-dismiss timer
            // (quill auto-dismisses 'neutral' snackbars after 4s — this one fires
            // during the boot loading screen and would vanish unseen). It stays
            // until closed, so the user still sees it when they try to log in.
            addSnackbar({
                message: <Localize i18n_default_text='Waiting for environment variables to be set…' />,
                status: 'fail',
                hasCloseButton: true,
                hasFixedHeight: false,
            });
        }
    }, [addSnackbar]);

    return null;
};

export default EnvVarsCheckSnackbar;
