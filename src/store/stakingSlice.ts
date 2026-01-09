import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Validator, Delegation, StakingInfo } from '../types';
import WATTxStaking from '../services/staking/WATTxStaking';

interface StakingState {
  validators: Validator[];
  myDelegations: Delegation[];
  myValidator: Validator | null;
  totalStaked: string;
  totalRewards: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: StakingState = {
  validators: [],
  myDelegations: [],
  myValidator: null,
  totalStaked: '0',
  totalRewards: '0',
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchValidators = createAsyncThunk(
  'staking/fetchValidators',
  async (options?: { maxFee?: number; activeOnly?: boolean; sortBy?: string }) => {
    return await WATTxStaking.getValidators(options);
  }
);

export const fetchStakingInfo = createAsyncThunk(
  'staking/fetchInfo',
  async (chainId?: number) => {
    return await WATTxStaking.getStakingInfo(chainId);
  }
);

export const delegateStake = createAsyncThunk(
  'staking/delegate',
  async ({ validatorId, amount }: { validatorId: string; amount: string }) => {
    const result = await WATTxStaking.delegate(validatorId, amount);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result;
  }
);

export const undelegateStake = createAsyncThunk(
  'staking/undelegate',
  async ({ validatorId, amount }: { validatorId: string; amount?: string }) => {
    const result = await WATTxStaking.undelegate(validatorId, amount);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result;
  }
);

export const claimRewards = createAsyncThunk(
  'staking/claimRewards',
  async (validatorId?: string) => {
    const result = await WATTxStaking.claimRewards(validatorId);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result;
  }
);

export const registerValidator = createAsyncThunk(
  'staking/registerValidator',
  async ({ feeRate, name }: { feeRate: number; name?: string }) => {
    const result = await WATTxStaking.registerAsValidator(feeRate, name);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result;
  }
);

const stakingSlice = createSlice({
  name: 'staking',
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch validators
      .addCase(fetchValidators.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchValidators.fulfilled, (state, action) => {
        state.isLoading = false;
        state.validators = action.payload;
      })
      .addCase(fetchValidators.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch validators';
      })
      // Fetch staking info
      .addCase(fetchStakingInfo.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchStakingInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myDelegations = action.payload.delegations;
        state.myValidator = action.payload.validatorInfo || null;
        state.totalStaked = action.payload.totalStaked;
        state.totalRewards = action.payload.totalRewards;
      })
      .addCase(fetchStakingInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch staking info';
      })
      // Delegate
      .addCase(delegateStake.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(delegateStake.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(delegateStake.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delegate';
      })
      // Undelegate
      .addCase(undelegateStake.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(undelegateStake.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(undelegateStake.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to undelegate';
      })
      // Claim rewards
      .addCase(claimRewards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(claimRewards.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(claimRewards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to claim rewards';
      })
      // Register validator
      .addCase(registerValidator.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerValidator.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerValidator.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to register as validator';
      });
  },
});

export const { setError, clearError } = stakingSlice.actions;

export default stakingSlice.reducer;
