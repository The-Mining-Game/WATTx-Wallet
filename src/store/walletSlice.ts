import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WalletAccount, Token, Transaction } from '../types';
import WalletService from '../services/wallet/WalletService';
import NetworkManager from '../services/blockchain/NetworkManager';

interface WalletState {
  isLocked: boolean;
  hasWallet: boolean;
  currentAccount: WalletAccount | null;
  accounts: WalletAccount[];
  balances: Record<number, string>; // chainId -> balance
  tokens: Token[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  isLocked: true,
  hasWallet: false,
  currentAccount: null,
  accounts: [],
  balances: {},
  tokens: [],
  transactions: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const checkWalletExists = createAsyncThunk(
  'wallet/checkExists',
  async () => {
    return await WalletService.hasWallet();
  }
);

export const createWallet = createAsyncThunk(
  'wallet/create',
  async ({ mnemonic, password, name }: { mnemonic: string; password: string; name?: string }) => {
    const account = await WalletService.createWallet(mnemonic, password, name);
    return account;
  }
);

export const unlockWallet = createAsyncThunk(
  'wallet/unlock',
  async (password: string) => {
    const success = await WalletService.unlockWallet(password);
    if (!success) {
      throw new Error('Invalid password');
    }
    const account = WalletService.getCurrentAccount();
    const accounts = await WalletService.getAllAccounts();
    return { account, accounts };
  }
);

export const lockWallet = createAsyncThunk(
  'wallet/lock',
  async () => {
    WalletService.lockWallet();
    return true;
  }
);

export const fetchBalances = createAsyncThunk(
  'wallet/fetchBalances',
  async (_, { getState }) => {
    const state = getState() as { wallet: WalletState };
    const { currentAccount } = state.wallet;

    if (!currentAccount) {
      return {};
    }

    const balances: Record<number, string> = {};
    const chainIds = Object.keys(currentAccount.wallets).map(Number);

    await Promise.all(
      chainIds.map(async (chainId) => {
        try {
          const address = currentAccount.wallets[chainId]?.address;
          if (address) {
            const balance = await NetworkManager.getBalance(address, chainId);
            balances[chainId] = balance;
          }
        } catch (error) {
          console.error(`Failed to fetch balance for chain ${chainId}:`, error);
        }
      })
    );

    return balances;
  }
);

export const addAccount = createAsyncThunk(
  'wallet/addAccount',
  async (name: string) => {
    const account = await WalletService.addAccount(name);
    if (!account) {
      throw new Error('Failed to add account');
    }
    return account;
  }
);

export const switchAccount = createAsyncThunk(
  'wallet/switchAccount',
  async (accountId: string) => {
    const success = await WalletService.switchAccount(accountId);
    if (!success) {
      throw new Error('Failed to switch account');
    }
    const account = WalletService.getCurrentAccount();
    return account;
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addToken: (state, action: PayloadAction<Token>) => {
      const exists = state.tokens.find(
        t => t.address === action.payload.address && t.chainId === action.payload.chainId
      );
      if (!exists) {
        state.tokens.push(action.payload);
      }
    },
    removeToken: (state, action: PayloadAction<{ address: string; chainId: number }>) => {
      state.tokens = state.tokens.filter(
        t => !(t.address === action.payload.address && t.chainId === action.payload.chainId)
      );
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
    },
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex(t => t.hash === action.payload.hash);
      if (index !== -1) {
        state.transactions[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Check wallet exists
      .addCase(checkWalletExists.fulfilled, (state, action) => {
        state.hasWallet = action.payload;
      })
      // Create wallet
      .addCase(createWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasWallet = true;
        state.isLocked = false;
        state.currentAccount = action.payload;
        state.accounts = [action.payload];
      })
      .addCase(createWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create wallet';
      })
      // Unlock wallet
      .addCase(unlockWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unlockWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLocked = false;
        state.currentAccount = action.payload.account;
        state.accounts = action.payload.accounts;
      })
      .addCase(unlockWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to unlock wallet';
      })
      // Lock wallet
      .addCase(lockWallet.fulfilled, (state) => {
        state.isLocked = true;
        state.balances = {};
      })
      // Fetch balances
      .addCase(fetchBalances.fulfilled, (state, action) => {
        state.balances = action.payload;
      })
      // Add account
      .addCase(addAccount.fulfilled, (state, action) => {
        state.accounts.push(action.payload);
      })
      // Switch account
      .addCase(switchAccount.fulfilled, (state, action) => {
        state.currentAccount = action.payload;
        state.balances = {};
      });
  },
});

export const {
  setError,
  clearError,
  addToken,
  removeToken,
  addTransaction,
  updateTransaction,
} = walletSlice.actions;

export default walletSlice.reducer;
