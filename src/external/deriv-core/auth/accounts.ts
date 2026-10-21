import type { AuthInfo, DerivAccount, OTPResponse } from '../types';
import {
  storeDerivAccounts,
  setActiveLoginId,
  setAccountType,
  clearAllAuthData,
} from './storage';
import { getApiBaseUrl } from '../config/urls';

/**
 * Fetch the list of trading accounts for the authenticated user.
 *
 * Authorization header only — we do not send `Deriv-App-ID`. That header
 * tells the API which app is calling, and it is only needed for Personal
 * Access Tokens, which are not linked to an app. Our token comes from the
 * OAuth `client_id`, so the API already knows the app. Send a PAT without
 * the header and the API returns 401 "Deriv-App-ID header is required for
 * PAT tokens".
 *
 * The OpenAPI spec marks the header as required, but its own description
 * limits it to PAT auth, and the API only checks it for PATs.
 *
 * packages/core does send the header. This difference is on purpose — keep
 * it when you sync that file.
 */
export async function fetchAccounts(
  authInfo: AuthInfo,
  _clientId: string
): Promise<DerivAccount[]> {
  const response = await fetch(`${getApiBaseUrl()}/accounts`, {
    headers: {
      Authorization: `Bearer ${authInfo.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch accounts (${response.status})`);
  }

  const data = await response.json();
  const accounts: DerivAccount[] = data.data;

  storeDerivAccounts(accounts);

  if (accounts.length > 0) {
    const firstAccount = accounts[0];
    setActiveLoginId(firstAccount.account_id);
    setAccountType(firstAccount.account_type);
  }

  return accounts;
}

/**
 * Get a one-time WebSocket URL for an authenticated session.
 *
 * Authorization header only — see fetchAccounts for why we do not send
 * `Deriv-App-ID`. `_clientId` is unused; we keep it so the signature matches
 * packages/core. Callers like utils/otp-ws.ts still pass
 * NEXT_PUBLIC_DERIV_APP_ID, which is fine — please do not "fix" it.
 */
export async function getWebSocketOTP(
  accountId: string,
  authInfo: AuthInfo,
  _clientId: string
): Promise<string> {
  const response = await fetch(`${getApiBaseUrl()}/accounts/${accountId}/otp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authInfo.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get WebSocket OTP (${response.status})`);
  }

  const data: OTPResponse = await response.json();
  return data.data.url;
}

/**
 * Perform logout: clear all auth data.
 * Caller is responsible for closing any open WebSocket connections and resetting UI.
 */
export function logout(): void {
  clearAllAuthData();
}
