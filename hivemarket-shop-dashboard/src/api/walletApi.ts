import { localURL } from '@/localURL';
import { getToken } from '../../src/services/authStorage';
import { Bank, Wallet } from '../../src/types/Wallet';
import { useCallback, useState } from 'react';

const BASE_URL = `${localURL}/api/wallet`;

async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit,
  timeout = 15000
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ───────────────────────────────
   WALLET API FUNCTIONS
─────────────────────────────── */

export async function getWalletBalance(userId: string): Promise<Wallet> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetchWithTimeout(
    `${BASE_URL}/balance/${userId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}

// walletApi.ts  — update withdrawFromWallet signature
export async function withdrawFromWallet(
  userId: string,
  amount: number,
  bankDetails: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }
) {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetchWithTimeout(`${BASE_URL}/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId, amount, ...bankDetails }),
  });

  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}

/* ───────────────────────────────
   HOOK: BANK VERIFICATION
─────────────────────────────── */

export function useBankVerification() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  const [resolving, setResolving] = useState(false);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const fetchBanks = useCallback(async () => {
    setLoadingBanks(true);

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetchWithTimeout(`${BASE_URL}/banks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setBanks(data);
    } catch (err) {
      console.error('Failed to fetch banks', err);
    } finally {
      setLoadingBanks(false);
    }
  }, []);

  const resolveAccount = useCallback(
    async (accountNumber: string, bankCode: string) => {
      setResolving(true);
      setResolveError(null);
      setResolvedName(null);

      try {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');

        const url = `${BASE_URL}/resolve-account?accountNumber=${accountNumber}&bankCode=${bankCode}`;

        const res = await fetchWithTimeout(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const data = await res.json();

        setResolvedName(data.accountName);
        return data.accountName;
      } catch (err: any) {
        const message =
          err?.message || 'Could not verify this account.';

        setResolveError(message);
        return null;
      } finally {
        setResolving(false);
      }
    },
    []
  );

  const resetResolve = useCallback(() => {
    setResolvedName(null);
    setResolveError(null);
  }, []);

  return {
    banks,
    loadingBanks,
    fetchBanks,
    resolving,
    resolvedName,
    resolveError,
    resolveAccount,
    resetResolve,
  };
}