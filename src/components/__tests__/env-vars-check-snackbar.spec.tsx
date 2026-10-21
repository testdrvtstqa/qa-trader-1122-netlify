import React from 'react';

import { render } from '@testing-library/react';

const mock_add_snackbar = jest.fn();
jest.mock('@deriv-com/quill-ui', () => ({
    useSnackbar: () => ({ addSnackbar: mock_add_snackbar }),
}));
jest.mock('@deriv-com/translations', () => ({
    Localize: ({ i18n_default_text }: { i18n_default_text: string }) => <>{i18n_default_text}</>,
}));
jest.mock('@/utils/is-preview-mode', () => ({
    isPreviewMode: jest.fn(() => false),
}));

import { isPreviewMode } from '@/utils/is-preview-mode';
import EnvVarsCheckSnackbar from '../env-vars-check-snackbar';

describe('EnvVarsCheckSnackbar', () => {
    const original_app_id = process.env.NEXT_PUBLIC_DERIV_APP_ID;

    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.NEXT_PUBLIC_DERIV_APP_ID;
    });

    afterAll(() => {
        if (original_app_id === undefined) delete process.env.NEXT_PUBLIC_DERIV_APP_ID;
        else process.env.NEXT_PUBLIC_DERIV_APP_ID = original_app_id;
    });

    it('warns that env vars are not set when the app id is missing', () => {
        render(<EnvVarsCheckSnackbar />);

        expect(mock_add_snackbar).toHaveBeenCalledTimes(1);
        // 'fail' + close button + no delay = persists until closed (quill
        // auto-dismisses 'neutral' snackbars, which would vanish during boot).
        expect(mock_add_snackbar).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'fail', hasCloseButton: true })
        );
        expect(mock_add_snackbar.mock.calls[0][0].delay).toBeUndefined();
    });

    it('stays silent when the app id is configured', () => {
        process.env.NEXT_PUBLIC_DERIV_APP_ID = '12345';

        render(<EnvVarsCheckSnackbar />);

        expect(mock_add_snackbar).not.toHaveBeenCalled();
    });

    it('stays silent inside the App Builder preview iframe', () => {
        (isPreviewMode as jest.Mock).mockReturnValue(true);

        render(<EnvVarsCheckSnackbar />);

        expect(mock_add_snackbar).not.toHaveBeenCalled();
    });
});
