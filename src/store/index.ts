import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import walletReducer from './walletSlice';
import networkReducer from './networkSlice';
import stakingReducer from './stakingSlice';
import miningReducer from './miningSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['wallet', 'network'], // Only persist these reducers
};

const rootReducer = combineReducers({
  wallet: walletReducer,
  network: networkReducer,
  staking: stakingReducer,
  mining: miningReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
