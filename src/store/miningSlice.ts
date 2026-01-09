import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MiningPool, MiningStats, MiningConfig } from '../types';
import MiningService from '../services/mining/MiningService';

interface MiningState {
  isEnabled: boolean;
  config: MiningConfig;
  pools: MiningPool[];
  currentPoolId: string | null;
  stats: MiningStats;
  isLoading: boolean;
  error: string | null;
}

const initialState: MiningState = {
  isEnabled: false,
  config: {
    enabled: false,
    threadCount: 2,
    intensity: 50,
    backgroundMining: false,
    thermalLimit: 70,
    batteryLimit: 20,
  },
  pools: [],
  currentPoolId: null,
  stats: {
    hashrate: 0,
    hashrateUnit: 'H/s',
    sharesAccepted: 0,
    sharesRejected: 0,
    earnings: '0',
    uptime: 0,
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const initializeMining = createAsyncThunk(
  'mining/initialize',
  async () => {
    await MiningService.initialize();
    const config = MiningService.getConfig();
    const pools = MiningService.getAllPools();
    return { config, pools };
  }
);

export const startMining = createAsyncThunk(
  'mining/start',
  async (poolId?: string) => {
    const result = await MiningService.startMining(poolId);
    if (!result.success) {
      throw new Error(result.error);
    }
    return poolId || MiningService.getConfig().poolId;
  }
);

export const stopMining = createAsyncThunk(
  'mining/stop',
  async () => {
    await MiningService.stopMining();
    return true;
  }
);

export const updateMiningConfig = createAsyncThunk(
  'mining/updateConfig',
  async (updates: Partial<MiningConfig>) => {
    await MiningService.updateConfig(updates);
    return MiningService.getConfig();
  }
);

export const addCustomPool = createAsyncThunk(
  'mining/addPool',
  async (pool: Omit<MiningPool, 'id'>) => {
    return await MiningService.addCustomPool(pool);
  }
);

export const removePool = createAsyncThunk(
  'mining/removePool',
  async (poolId: string) => {
    const success = await MiningService.removeCustomPool(poolId);
    if (!success) {
      throw new Error('Failed to remove pool');
    }
    return poolId;
  }
);

export const fetchMiningStats = createAsyncThunk(
  'mining/fetchStats',
  async () => {
    return await MiningService.getStats();
  }
);

const miningSlice = createSlice({
  name: 'mining',
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateStats: (state, action: PayloadAction<MiningStats>) => {
      state.stats = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize
      .addCase(initializeMining.fulfilled, (state, action) => {
        state.config = action.payload.config;
        state.pools = action.payload.pools;
        state.isEnabled = action.payload.config.enabled;
        state.currentPoolId = action.payload.config.poolId || null;
      })
      // Start mining
      .addCase(startMining.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startMining.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isEnabled = true;
        state.currentPoolId = action.payload || null;
      })
      .addCase(startMining.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to start mining';
      })
      // Stop mining
      .addCase(stopMining.fulfilled, (state) => {
        state.isEnabled = false;
        state.stats = initialState.stats;
      })
      // Update config
      .addCase(updateMiningConfig.fulfilled, (state, action) => {
        state.config = action.payload;
      })
      // Add pool
      .addCase(addCustomPool.fulfilled, (state, action) => {
        state.pools.push(action.payload);
      })
      // Remove pool
      .addCase(removePool.fulfilled, (state, action) => {
        state.pools = state.pools.filter(p => p.id !== action.payload);
        if (state.currentPoolId === action.payload) {
          state.currentPoolId = null;
        }
      })
      // Fetch stats
      .addCase(fetchMiningStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { setError, clearError, updateStats } = miningSlice.actions;

export default miningSlice.reducer;
