/**
 * Consolidated minimal type stubs for the vendored DTrader packages.
 *
 * In upstream DTrader, each package (`api`, `api-v2`, `stores`, …) imported
 * its generated socket/store types from a shared `../types` barrel that sits
 * one level above the package directory (i.e. `src/vendor/types`). That
 * generated file is not part of the vendored tree, so every socket / store
 * symbol referenced across the vendored packages is declared here as a loose
 * `any`-based type so that `tsc --noEmit` can resolve the imports.
 *
 * TYPE-ONLY: this file has no runtime impact (esbuild strips type-only imports).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ------------------------------------------------------------------ */
/* Socket base types (@deriv/api & @deriv/api-v2)                      */
/* ------------------------------------------------------------------ */

export type TSocketEndpointNames = string;
export type TSocketSubscribableEndpointNames = string;
export type TSocketPaginateableEndpointNames = string;

export type TSocketError<T extends TSocketEndpointNames = TSocketEndpointNames> = {
    echo_req: Record<string, unknown>;
    error: {
        code: string;
        message: string;
        // Loosely typed: vendored code reads dynamic fields (e.g. `details.field`).
        details?: Record<string, any>;
        // `subcode` is present on some socket errors upstream.
        subcode?: string;
    };
    msg_type: T;
    req_id?: number;
};

export type TSocketResponse<T extends TSocketEndpointNames = TSocketEndpointNames> = any;
export type TSocketResponseData<T extends TSocketEndpointNames = TSocketEndpointNames> = any;
export type TSocketRequestPayload<T extends TSocketEndpointNames = TSocketEndpointNames> = any;
export type TSocketAcceptableProps<
    T extends TSocketEndpointNames = TSocketEndpointNames,
    O = any,
    P = any
> = any[];
export type TSocketPaginatateableRequestCleaned<T extends TSocketEndpointNames = TSocketEndpointNames> = any;
export type TSocketRequestQueryOptions<T extends TSocketEndpointNames = TSocketEndpointNames> = any;
export type TSocketRequestInfiniteQueryOptions<T extends TSocketEndpointNames = TSocketEndpointNames> = any;
export type TSocketRequestMutationOptions<T extends TSocketEndpointNames = TSocketEndpointNames> = any;

/* ------------------------------------------------------------------ */
/* Endpoint request/response payloads (@deriv/api index re-exports)    */
/* ------------------------------------------------------------------ */

export type TActiveSymbolsRequest = any;
export type TActiveSymbolsResponse = any;
export type TAuthorizeRequest = any;
export type TAuthorizeResponse = any;
export type TAutoContractItem = any;
export type TAutoContractTemplate = any;
export type TAutoGetRequest = any;
export type TAutoGetResponse = any;
export type TAutoListRequest = any;
export type TAutoListResponse = any;
export type TAutoListStrategiesRequest = any;
export type TAutoListStrategiesResponse = any;
export type TAutoPauseRequest = any;
export type TAutoPauseResponse = any;
export type TAutoResumeRequest = any;
export type TAutoResumeResponse = any;
export type TAutoRun = any;
export type TAutoStartRequest = any;
export type TAutoStartResponse = any;
export type TAutoStopReasonCode = any;
export type TAutoStopRequest = any;
export type TAutoStopResponse = any;
export type TAutoStrategyDescriptor = any;
export type TAutoStrategyParameterProperty = any;
export type TAutoStrategyParametersSchema = any;
export type TBalanceRequest = any;
export type TBalanceResponse = any;
export type TBuyContractRequest = any;
export type TBuyContractResponse = any;
export type TCancelAContractRequest = any;
export type TCancelAContractResponse = any;
export type TContractsForSymbolRequest = any;
export type TContractsForSymbolResponse = any;
export type TDerivativesAccount = any;
export type TDerivativesAccountResponse = any;
export type TForgetAllRequest = any;
export type TForgetAllResponse = any;
export type TForgetRequest = any;
export type TForgetResponse = any;
export type TLogOutRequest = any;
export type TLogOutResponse = any;
export type TPortfolioRequest = any;
export type TPortfolioResponse = any;
export type TPriceProposalOpenContractsRequest = any;
export type TPriceProposalOpenContractsResponse = any;
export type TPriceProposalRequest = any;
export type TPriceProposalResponse = any;
export type TProfitTableRequest = any;
export type TProfitTableResponse = any;
export type TSellContractRequest = any;
export type TSellContractResponse = any;
export type TServerTimeRequest = any;
export type TServerTimeResponse = any;
export type TStatementRequest = any;
export type TStatementResponse = any;
export type TTicksHistoryRequest = any;
export type TTicksHistoryResponse = any;
export type TTicksStreamRequest = any;
export type TTicksStreamResponse = any;
export type TTradingTimesRequest = any;
export type TTradingTimesResponse = any;
export type TTransactionsStreamRequest = any;
export type TTransactionsStreamResponse = any;
export type TUpdateContractHistoryRequest = any;
export type TUpdateContractHistoryResponse = any;
export type TUpdateContractRequest = any;
export type TUpdateContractResponse = any;

/* ------------------------------------------------------------------ */
/* Store types (@deriv/stores)                                         */
/* ------------------------------------------------------------------ */

export type TCoreStores = Record<string, any>;
export type TStores = Record<string, any>;
export type TPortfolioPosition = any;
export type TCommonStoreServicesError = any;
