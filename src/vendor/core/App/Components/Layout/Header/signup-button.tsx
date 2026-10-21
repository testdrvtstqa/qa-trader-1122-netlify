import React from 'react';
import { observer } from 'mobx-react-lite';
import PropTypes from 'prop-types';

import { Button } from '@deriv/components';
import { redirectToSignUp } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { useTranslations } from '@deriv-com/translations';

interface SignUpButtonProps {
    className?: string;
}

const SignUpButton = observer(({ className }: SignUpButtonProps) => {
    const { localize } = useTranslations();
    const { common } = useStore();

    const handleSignUpClick = () => {
        redirectToSignUp(common.current_language);
    };

    return (
        <Button
            id='dt_signup_button'
            className={className}
            has_effect
            text={localize('Sign up')}
            onClick={handleSignUpClick}
            primary
        />
    );
});

(SignUpButton as { propTypes?: unknown }).propTypes = {
    className: PropTypes.string,
};

export { SignUpButton };
