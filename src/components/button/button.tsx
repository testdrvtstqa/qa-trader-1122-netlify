import classNames from 'classnames';
import React from 'react';
import { Button as QuillButton } from '@deriv-com/quill-ui';
import { LegacyCheck1pxIcon, LegacyPlus2pxIcon } from '@deriv/quill-icons';

export type TButtonCommonProps = {
    alternate: boolean;
    black: boolean;
    blue: boolean;
    green: boolean;
    has_effect: boolean;
    is_button_toggle: boolean;
    is_circular: boolean;
    is_circle: boolean;
    is_disabled: boolean;
    is_loading: boolean;
    is_plus: boolean;
    is_submit_success: boolean;
    large: boolean;
    medium: boolean;
    primary: boolean;
    primary_light: boolean;
    rounded: boolean;
    secondary: boolean;
    small: boolean;
    tertiary: boolean;
    text: string;
    transparent: boolean;
    wide: boolean;
};
export type TButtonProps = React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>> &
    TButtonCommonProps & {
        classNameSpan: string;
        icon: React.ReactNode;
        renderText: (param: React.ReactNode) => React.ReactNode;
        type: 'button' | 'submit' | 'reset';
        wrapperClassName: string;
    };

export type TButtonGroupProps = {
    children: React.ReactNode | React.ReactNode[];
    className?: string;
};

const ButtonGroup = ({ children, className }: TButtonGroupProps) => (
    <div className={classNames('dc-btn__group', className)} style={{ display: 'flex', gap: 8, whiteSpace: 'nowrap' }}>
        {children}
    </div>
);

// Backed by quill-ui's Button behind the legacy props API. The legacy boolean
// flags map onto quill's variant/color/size axes; the dc-btn-* class names are
// kept purely as hooks for vendored stylesheets that position or restyle
// buttons contextually.
const Button = ({
    black,
    blue,
    children,
    className = '',
    classNameSpan,
    green,
    has_effect,
    icon,
    id,
    is_disabled,
    is_loading,
    is_submit_success,
    is_button_toggle,
    is_circle,
    is_circular,
    is_plus,
    large,
    medium,
    onClick,
    rounded,
    tabIndex = 0,
    text,
    wrapperClassName,
    type,
    primary,
    primary_light,
    secondary,
    alternate,
    transparent,
    small,
    tertiary,
    wide,
    renderText,
    // The HTML `color` attribute (from ButtonHTMLAttributes) would collide with
    // quill's variant colour prop — no legacy consumer sets it, so drop it.
    color: _html_color,
    ...props
}: Partial<TButtonProps>) => {
    const classes = classNames(
        'dc-btn',
        {
            'dc-btn__effect': has_effect,
            'dc-btn--primary': primary,
            'dc-btn--black': black,
            'dc-btn--blue': blue,
            'dc-btn--secondary': secondary,
            'dc-btn--tertiary': tertiary,
            'dc-btn--primary__light': primary_light,
            'dc-btn--primary__blue': blue && primary,
            'dc-btn--tertiary__blue': blue && tertiary,
            'dc-btn--alternate': alternate,
            'dc-btn--green': green,
            'dc-btn__rounded': rounded,
            'dc-btn__large': large,
            'dc-btn__medium': medium,
            'dc-btn__small': small,
            'dc-btn__toggle': is_button_toggle,
            'dc-btn__wide': wide,
            'dc-btn--plus': is_plus,
            'dc-btn--circle': is_circle,
            'dc-btn--circular': is_circular,
            'dc-btn--transparent': transparent,
        },
        className
    );
    // Flagless legacy buttons rendered UNFILLED (.dc-btn set no background;
    // surfaces added their own via scss) — map them to quill's transparent
    // tertiary, not to a filled primary. Coral is reserved for the legacy
    // red-filled `primary`; everything else was neutral AND theme-aware, which
    // quill's `black-white` colour matches (its plain `black` tokens are
    // constants with no dark-theme override, so labels vanish on dark).
    const is_filled = primary || primary_light || black || blue || green;
    const variant = secondary || alternate ? 'secondary' : tertiary || transparent || !is_filled ? 'tertiary' : 'primary';
    const color: React.ComponentProps<typeof QuillButton>['color'] = green
        ? 'purchase'
        : (primary || primary_light) && !black && !blue
          ? 'coral'
          : 'black-white';
    const size: React.ComponentProps<typeof QuillButton>['size'] = large ? 'lg' : small ? 'sm' : 'md';
    const capitalized = text ? text[0].toUpperCase() + text.substr(1) : undefined;
    const label =
        capitalized && !is_submit_success
            ? (typeof renderText === 'function' && renderText(capitalized)) || (
                  <span className={classNames('dc-btn__text', classNameSpan)}>{capitalized}</span>
              )
            : undefined;
    const resolved_icon =
        icon ??
        (is_submit_success ? (
            <LegacyCheck1pxIcon fill='var(--color-interactive-active)' iconSize='sm' />
        ) : is_plus ? (
            <LegacyPlus2pxIcon fill='var(--color-text-primary)' iconSize='sm' />
        ) : undefined);

    const button = (
        <QuillButton
            id={id}
            className={classes}
            onClick={onClick}
            disabled={is_disabled}
            isLoading={is_loading}
            tabIndex={tabIndex}
            type={is_submit_success ? 'button' : type || 'submit'}
            variant={variant}
            color={color}
            size={size}
            fullWidth={wide}
            icon={resolved_icon}
            label={label ?? (!text && !is_loading ? children : undefined)}
            {...props}
        />
    );
    const wrapper = <div className={wrapperClassName}>{button}</div>;

    return wrapperClassName ? wrapper : button;
};

Button.Group = ButtonGroup;

export default Button;
