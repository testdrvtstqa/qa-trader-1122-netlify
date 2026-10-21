import * as React from 'react';

import { ToggleSwitch as QuillToggleSwitch } from '@deriv-com/quill-ui';

/**
 * Quill-backed replacement for the legacy dc-toggle-switch, keeping the legacy
 * props API so consumers stay unchanged. Legacy styling knobs
 * (classNameButton/classNameLabel) have no Quill counterpart and are ignored.
 */
type TToggleSwitch = {
    className?: string;
    classNameButton?: string;
    classNameLabel?: string;
    handleToggle: () => void;
    id: string;
    is_enabled: boolean;
    name?: string;
};

const ToggleSwitch = ({ className, handleToggle, id, is_enabled }: TToggleSwitch) => (
    <QuillToggleSwitch id={id} className={className} checked={is_enabled} onChange={handleToggle} />
);

export default ToggleSwitch;
