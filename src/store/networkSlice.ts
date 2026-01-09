import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { NetworkConfig } from '../types';
import NetworkManager from '../services/blockchain/NetworkManager';
import { NETWORKS } from '../utils/constants';

interface NetworkState {
  activeChainId: number;
  networks: Record<number, NetworkConfig>;
  customNetworks: NetworkConfig[];
  isConnected: boolean;
  blockNumber: number | null;
  gasPrice: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: NetworkState = {
  activeChainId: 81, // Default to WATTx Mainnet
  networks: NETWORKS,
  customNetworks: [],
  isConnected: false,
  blockNumber: null,
  gasPrice: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const switchNetwork = createAsyncThunk(
  'network/switch',
  async (chainId: number) => {
    const success = await NetworkManager.setActiveNetwork(chainId);
    if (!success) {
      throw new Error('Failed to switch network');
    }
    return chainId;
  }
);

export const addCustomNetwork = createAsyncThunk(
  'network/addCustom',
  async (network: NetworkConfig) => {
    const success = await NetworkManager.addCustomNetwork(network);
    if (!success) {
      throw new Error('Failed to add custom network');
    }
    return network;
  }
);

export const removeCustomNetwork = createAsyncThunk(
  'network/removeCustom',
  async (chainId: number) => {
    const success = await NetworkManager.removeCustomNetwork(chainId);
    if (!success) {
      throw new Error('Failed to remove custom network');
    }
    return chainId;
  }
);

export const fetchNetworkInfo = createAsyncThunk(
  'network/fetchInfo',
  async (_, { getState }) => {
    const state = getState() as { network: NetworkState };
    const { activeChainId } = state.network;

    const provider = NetworkManager.getProvider(activeChainId);
    if (!provider) {
      throw new Error('No provider for network');
    }

    const [blockNumber, feeData] = await Promise.all([
      provider.getBlockNumber(),
      provider.getFeeData(),
    ]);

    return {
      blockNumber,
      gasPrice: feeData.gasPrice?.toString() || null,
    };
  }
);

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    updateBlockNumber: (state, action: PayloadAction<number>) => {
      state.blockNumber = action.payload;
    },
    updateGasPrice: (state, action: PayloadAction<string>) => {
      state.gasPrice = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Switch network
      .addCase(switchNetwork.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(switchNetwork.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeChainId = action.payload;
        state.blockNumber = null;
        state.gasPrice = null;
      })
      .addCase(switchNetwork.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to switch network';
      })
      // Add custom network
      .addCase(addCustomNetwork.fulfilled, (state, action) => {
        state.customNetworks.push(action.payload);
        state.networks[action.payload.chainId] = action.payload;
      })
      // Remove custom network
      .addCase(removeCustomNetwork.fulfilled, (state, action) => {
        state.customNetworks = state.customNetworks.filter(
          n => n.chainId !== action.payload
        );
        delete state.networks[action.payload];
      })
      // Fetch network info
      .addCase(fetchNetworkInfo.fulfilled, (state, action) => {
        state.blockNumber = action.payload.blockNumber;
        state.gasPrice = action.payload.gasPrice;
        state.isConnected = true;
      })
      .addCase(fetchNetworkInfo.rejected, (state) => {
        state.isConnected = false;
      });
  },
});

export const {
  setConnected,
  updateBlockNumber,
  updateGasPrice,
  setError,
} = networkSlice.actions;

export default networkSlice.reducer;
