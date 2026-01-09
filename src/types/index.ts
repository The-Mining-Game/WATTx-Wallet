// Network Types
export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  symbol: string;
  decimals: number;
  rpcUrls: string[];
  explorerUrl: string;
  explorerApiUrl?: string;
  isTestnet: boolean;
  supportsEIP1559: boolean;
  isCustom?: boolean;
  logoUrl?: string;
  // WATTx/QTUM specific
  supportsStaking?: boolean;
  supportsMining?: boolean;
  supportsInscriptions?: boolean;
  inscriptionType?: 'ordinals' | 'brc20' | 'stamps' | 'runes';
}

// Wallet Types
export interface Wallet {
  address: string;
  publicKey: string;
  derivationPath: string;
  chainId: number;
}

export interface WalletAccount {
  id: string;
  name: string;
  wallets: Record<number, Wallet>; // chainId -> Wallet
  createdAt: number;
}

export interface StoredWallet {
  encryptedMnemonic: string;
  accounts: WalletAccount[];
  activeAccountId: string;
}

// Transaction Types
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasLimit: string;
  gasUsed?: string;
  nonce: number;
  data: string;
  chainId: number;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  blockNumber?: number;
  type?: number;
}

export interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
}

// Token Types
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  logoUrl?: string;
  balance?: string;
  price?: number;
}

export interface NFT {
  contractAddress: string;
  tokenId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  chainId: number;
  metadata?: Record<string, any>;
}

// Staking Types (WATTx)
export interface Validator {
  id: string;
  name: string;
  stake: string;
  delegatedStake: string;
  totalStake: string;
  feeRate: number; // basis points
  delegatorCount: number;
  trustTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  uptime: number; // percentage
  rewardMultiplier: number;
  isActive: boolean;
}

export interface Delegation {
  validatorId: string;
  validatorName: string;
  amount: string;
  pendingRewards: string;
  status: 'pending' | 'active' | 'unbonding' | 'withdrawn';
  delegationHeight: number;
  lastRewardHeight: number;
  unbondingStartHeight?: number;
}

export interface StakingInfo {
  totalStaked: string;
  totalRewards: string;
  delegations: Delegation[];
  isValidator: boolean;
  validatorInfo?: Validator;
}

// Mining Types
export interface MiningPool {
  id: string;
  name: string;
  url: string;
  port: number;
  algorithm: 'gapcoin' | 'randomx' | 'ethash' | 'sha256' | 'scrypt';
  coin: string;
  fee: number;
  isActive: boolean;
}

export interface MiningStats {
  hashrate: number;
  hashrateUnit: string;
  sharesAccepted: number;
  sharesRejected: number;
  earnings: string;
  uptime: number;
  temperature?: number;
  power?: number;
}

export interface MiningConfig {
  enabled: boolean;
  threadCount: number;
  poolId?: string;
  username?: string;
  password?: string;
  intensity: number; // 1-100
  backgroundMining: boolean;
  thermalLimit: number; // celsius
  batteryLimit: number; // percentage
}

// Inscription Types (Ordinals, BRC-20, etc.)
export interface Inscription {
  id: string;
  number: number;
  address: string;
  contentType: string;
  contentLength: number;
  genesisHeight: number;
  genesisTimestamp: number;
  txid: string;
  outputValue: number;
  preview?: string;
  content?: string;
}

export interface BRC20Token {
  ticker: string;
  balance: string;
  availableBalance: string;
  transferableBalance: string;
  inscriptionId: string;
}

export interface InscriptionCollection {
  name: string;
  inscriptions: Inscription[];
  totalCount: number;
}

// dApp Browser Types
export interface DAppSession {
  id: string;
  origin: string;
  name: string;
  icon?: string;
  chainId: number;
  connectedAt: number;
  permissions: string[];
}

export interface Web3Request {
  id: number;
  method: string;
  params: any[];
  origin: string;
}

// Gas Types
export interface GasEstimate {
  low: {
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    estimatedTime: number;
  };
  medium: {
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    estimatedTime: number;
  };
  high: {
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    estimatedTime: number;
  };
}

// App State Types
export interface AppState {
  isLocked: boolean;
  hasWallet: boolean;
  biometricsEnabled: boolean;
  currentNetwork: number;
  theme: 'light' | 'dark' | 'system';
  currency: string;
}
