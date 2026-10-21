import { ContractType } from '@trader/Stores/Modules/Trading/Helpers/contract-type';

export const onChangeSymbolAsync = async (symbol: string): Promise<void> => {
    await ContractType.buildContractTypesConfig(symbol);
};
