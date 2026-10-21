import clsx from 'clsx';
import React from 'react';
import { Skeleton as QuillSkeleton } from '@deriv-com/quill-ui';

type TSkeletonProps = {
    animated?: boolean;
    className?: string;
    rows?: number;
    variant?: (typeof VARIANT)[keyof typeof VARIANT];
    width?: number;
    height?: number;
    gap?: number;
} & React.CSSProperties;

export const VARIANT = {
    ICON: 'icon',
    PARAGRAPH: 'paragraph',
} as const;

// Backed by quill-ui's Skeleton.Square behind the legacy props API. The legacy
// 'skeleton' class is kept as a layout hook (e.g. loading.scss flex-shrink);
// quill supplies the visuals (same surface tokens + pulse animation). 'rounded'
// matches the legacy default radius (--semantic-borderRadius-md = 8px) and is
// overridden by an explicit borderRadius in the CSSProperties spread.
const Skeleton = ({
    animated = true,
    className,
    gap,
    height,
    rows,
    width,
    variant,
    ...css_properties
}: TSkeletonProps) => {
    if (VARIANT.PARAGRAPH && rows) {
        return (
            <div
                className='skeleton-paragraph'
                data-testid='dt_skeleton_paragraph'
                style={{ display: 'flex', flexDirection: 'column', gap: gap ?? 8 }}
            >
                {[...new Array(rows)].map((_, idx) => (
                    <QuillSkeleton.Square
                        key={idx}
                        className={clsx(className, 'skeleton')}
                        data-testid='dt_skeleton'
                        active={animated}
                        rounded
                        width={idx === rows - 1 ? 96 : width}
                        height={height ?? '100%'}
                    />
                ))}
            </div>
        );
    }
    const is_icon = variant === VARIANT.ICON;
    return (
        <QuillSkeleton.Square
            className={clsx(className, 'skeleton', variant)}
            data-testid='dt_skeleton'
            active={animated}
            rounded
            width={width ?? (is_icon ? 'var(--size-generic-md)' : undefined)}
            height={height ?? (is_icon ? 'var(--size-generic-md)' : '100%')}
            style={css_properties}
        />
    );
};

export default Skeleton;
