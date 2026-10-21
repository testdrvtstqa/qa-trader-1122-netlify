import React from 'react';

import { Checkbox as QuillCheckbox } from '@deriv-com/quill-ui';

/**
 * Quill-backed replacement for the legacy dc-checkbox, keeping the legacy
 * props API so consumers stay unchanged. Legacy styling knobs
 * (classNameLabel, label_font_size, label_line_height, greyDisabled,
 * has_error, withTabIndex) have no Quill counterpart and are ignored.
 */
type TCheckBoxProps = Omit<React.HTMLProps<HTMLInputElement>, 'value' | 'label' | 'size'> & {
    className?: string;
    classNameLabel?: string;
    defaultChecked?: boolean;
    disabled?: boolean;
    greyDisabled?: boolean;
    id?: string;
    label: string | React.ReactElement;
    label_font_size?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement> | React.KeyboardEvent<HTMLSpanElement>) => void;
    value?: boolean;
    withTabIndex?: number;
    has_error?: boolean;
    label_line_height?: string;
};

const Checkbox = React.forwardRef<HTMLInputElement, TCheckBoxProps>(
    ({ className, defaultChecked, disabled = false, id, label, name, onChange, value = false }, ref) => (
        <QuillCheckbox
            ref={ref}
            id={id}
            name={name}
            className={className}
            label={label}
            checked={value ?? defaultChecked}
            disabled={disabled}
            onChange={onChange}
        />
    )
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
