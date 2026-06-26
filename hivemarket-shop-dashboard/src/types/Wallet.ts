export type Wallet = {
  balance: number;
  totalEarned: number;
  pendingWithdrawals: number;
};

export interface Bank {
  name: string;
  code: string;
}

export type WalletTransaction = {
  id: string;
  type: 'SELLER_CREDIT' | 'PLATFORM_COMMISSION' | 'WITHDRAWAL';
  amount: number;
  description: string;
  timestamp: string;
};
