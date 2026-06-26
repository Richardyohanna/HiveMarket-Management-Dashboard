import React, { useCallback, useEffect, useState } from 'react';
import { getWalletBalance, withdrawFromWallet } from '../../src/api/walletApi';
import { Wallet } from '../../src/types/Wallet';
import { userStore } from '../../src/store/userStore';

export const useWallet = (userId: string) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getWalletBalance(userId);
      setWallet(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wallet');
      console.error('useWallet refetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const withdraw = useCallback(
    async (amount: number) => {
      try {
       // await withdrawFromWallet(userId, amount);
        await refetch();
        return true;
      } catch (err: any) {
        setError(err.message || 'Withdrawal failed');
        console.error('useWallet withdraw error:', err);
        return false;
      }
    },
    [userId, refetch]
  );

  useEffect(() => {
    refetch();

    const unsubscribe = (userStore as any).subscribe(() => {
      refetch();
    });
    return unsubscribe;
  }, [userId, refetch]);

  return { wallet, loading, error, refetch, withdraw };
};
