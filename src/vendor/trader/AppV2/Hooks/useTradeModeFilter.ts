import { useModulesStore } from '@trader/Stores/useModulesStores';

const useTradeModeFilter = () => {
    const { positions } = useModulesStore();
    const { tradeModeFilter, setTradeModeFilter } = positions;

    return { tradeModeFilter, setTradeModeFilter };
};

export default useTradeModeFilter;
