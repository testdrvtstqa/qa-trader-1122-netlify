import { useMemo } from 'react';
import { useStore } from '@deriv/stores';

const useFeatureFlags = () => {
    const { feature_flags } = useStore();

    const result = useMemo(() => {
        const flags = feature_flags.data ?? {};

        return Object.keys(flags).reduce(
            (previous, current) => ({
                ...previous,
                [`is_${current}_enabled`]: Boolean(flags[current]),
            }),
            {} as Record<string, boolean>
        );
    }, [feature_flags.data]);

    return result;
};
export default useFeatureFlags;
