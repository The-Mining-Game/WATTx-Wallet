import { NetworkConfig, MiningPool } from '../types';

// Network Configurations
export const NETWORKS: Record<number, NetworkConfig> = {
  // WATTx Networks
  81: {
    chainId: 81,
    chainIdHex: '0x51',
    name: 'WATTx Mainnet',
    symbol: 'WATTx',
    decimals: 8,
    rpcUrls: ['http://localhost:3889', 'https://rpc.wattxchange.app'],
    explorerUrl: 'https://wattxscan.io',
    explorerApiUrl: 'https://api.wattxscan.io',
    isTestnet: false,
    supportsEIP1559: false,
    supportsStaking: true,
    supportsMining: true,
    supportsInscriptions: true,
    inscriptionType: 'ordinals',
    logoUrl: 'https://wattxchange.app/logo.png',
  },
  8889: {
    chainId: 8889,
    chainIdHex: '0x22b9',
    name: 'WATTx Testnet',
    symbol: 'tWATTx',
    decimals: 8,
    rpcUrls: ['http://localhost:13889', 'https://testnet-rpc.wattxchange.app'],
    explorerUrl: 'https://testnet.wattxscan.io',
    explorerApiUrl: 'https://testnet-api.wattxscan.io',
    isTestnet: true,
    supportsEIP1559: false,
    supportsStaking: true,
    supportsMining: true,
    supportsInscriptions: true,
    inscriptionType: 'ordinals',
    logoUrl: 'https://wattxchange.app/logo.png',
  },

  // QTUM
  82: {
    chainId: 82,
    chainIdHex: '0x52',
    name: 'QTUM Mainnet',
    symbol: 'QTUM',
    decimals: 8,
    rpcUrls: ['https://janus.qiswap.com/api/'],
    explorerUrl: 'https://qtum.info',
    isTestnet: false,
    supportsEIP1559: false,
    supportsStaking: true,
    logoUrl: 'https://qtum.org/images/qtum-logo.png',
  },

  // Bitnet
  210: {
    chainId: 210,
    chainIdHex: '0xd2',
    name: 'Bitnet',
    symbol: 'BTN',
    decimals: 18,
    rpcUrls: ['https://rpc.bitnet.money'],
    explorerUrl: 'https://explorer.bitnet.money',
    isTestnet: false,
    supportsEIP1559: true,
    logoUrl: 'https://bitnet.money/logo.png',
  },

  // Sonic (Fantom Evolution)
  146: {
    chainId: 146,
    chainIdHex: '0x92',
    name: 'Sonic',
    symbol: 'S',
    decimals: 18,
    rpcUrls: ['https://sonic.drpc.org', 'https://rpc.soniclabs.com'],
    explorerUrl: 'https://sonicscan.org',
    isTestnet: false,
    supportsEIP1559: true,
    logoUrl: 'https://soniclabs.com/logo.png',
  },

  // OctaSpace
  800001: {
    chainId: 800001,
    chainIdHex: '0xc3501',
    name: 'OctaSpace',
    symbol: 'OCTA',
    decimals: 18,
    rpcUrls: ['https://rpc.octa.space'],
    explorerUrl: 'https://explorer.octa.space',
    isTestnet: false,
    supportsEIP1559: false,
    supportsMining: true,
    logoUrl: 'https://octa.space/logo.png',
  },

  // Etho Protocol
  1313114: {
    chainId: 1313114,
    chainIdHex: '0x14095a',
    name: 'Etho Protocol',
    symbol: 'ETHO',
    decimals: 18,
    rpcUrls: ['https://rpc.ethoprotocol.com'],
    explorerUrl: 'https://explorer.ethoprotocol.com',
    isTestnet: false,
    supportsEIP1559: false,
    logoUrl: 'https://ethoprotocol.com/logo.png',
  },

  // Altcoinchain
  2330: {
    chainId: 2330,
    chainIdHex: '0x91a',
    name: 'Altcoinchain',
    symbol: 'ALT',
    decimals: 18,
    rpcUrls: ['https://rpc.altcoinchain.org'],
    explorerUrl: 'https://expedition.altcoinchain.org',
    isTestnet: false,
    supportsEIP1559: false,
    supportsMining: true,
    logoUrl: 'https://altcoinchain.org/logo.png',
  },

  // Ethereum
  1: {
    chainId: 1,
    chainIdHex: '0x1',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    rpcUrls: [
      'https://eth.llamarpc.com',
      'https://ethereum.publicnode.com',
      'https://rpc.ankr.com/eth',
    ],
    explorerUrl: 'https://etherscan.io',
    explorerApiUrl: 'https://api.etherscan.io/api',
    isTestnet: false,
    supportsEIP1559: true,
    supportsInscriptions: true,
    inscriptionType: 'ordinals',
    logoUrl: 'https://ethereum.org/logo.png',
  },

  // BSC
  56: {
    chainId: 56,
    chainIdHex: '0x38',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    decimals: 18,
    rpcUrls: [
      'https://bsc-dataseed.binance.org',
      'https://bsc-dataseed1.defibit.io',
      'https://bsc.publicnode.com',
    ],
    explorerUrl: 'https://bscscan.com',
    explorerApiUrl: 'https://api.bscscan.com/api',
    isTestnet: false,
    supportsEIP1559: false,
    supportsInscriptions: true,
    inscriptionType: 'brc20',
    logoUrl: 'https://bscscan.com/images/svg/brands/bnb.svg',
  },

  // Polygon
  137: {
    chainId: 137,
    chainIdHex: '0x89',
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrls: [
      'https://polygon-rpc.com',
      'https://polygon.llamarpc.com',
      'https://polygon.publicnode.com',
    ],
    explorerUrl: 'https://polygonscan.com',
    explorerApiUrl: 'https://api.polygonscan.com/api',
    isTestnet: false,
    supportsEIP1559: true,
    logoUrl: 'https://polygonscan.com/images/svg/brands/polygon.svg',
  },

  // Arbitrum
  42161: {
    chainId: 42161,
    chainIdHex: '0xa4b1',
    name: 'Arbitrum One',
    symbol: 'ETH',
    decimals: 18,
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.llamarpc.com',
      'https://arbitrum.publicnode.com',
    ],
    explorerUrl: 'https://arbiscan.io',
    explorerApiUrl: 'https://api.arbiscan.io/api',
    isTestnet: false,
    supportsEIP1559: true,
    logoUrl: 'https://arbiscan.io/images/svg/brands/arbitrum.svg',
  },

  // Optimism
  10: {
    chainId: 10,
    chainIdHex: '0xa',
    name: 'Optimism',
    symbol: 'ETH',
    decimals: 18,
    rpcUrls: [
      'https://mainnet.optimism.io',
      'https://optimism.llamarpc.com',
      'https://optimism.publicnode.com',
    ],
    explorerUrl: 'https://optimistic.etherscan.io',
    explorerApiUrl: 'https://api-optimistic.etherscan.io/api',
    isTestnet: false,
    supportsEIP1559: true,
    logoUrl: 'https://optimistic.etherscan.io/images/svg/brands/optimism.svg',
  },

  // Avalanche C-Chain
  43114: {
    chainId: 43114,
    chainIdHex: '0xa86a',
    name: 'Avalanche C-Chain',
    symbol: 'AVAX',
    decimals: 18,
    rpcUrls: [
      'https://api.avax.network/ext/bc/C/rpc',
      'https://avalanche.publicnode.com',
      'https://avalanche.drpc.org',
    ],
    explorerUrl: 'https://snowtrace.io',
    explorerApiUrl: 'https://api.snowtrace.io/api',
    isTestnet: false,
    supportsEIP1559: true,
    logoUrl: 'https://snowtrace.io/images/svg/brands/avalanche.svg',
  },

  // Base
  8453: {
    chainId: 8453,
    chainIdHex: '0x2105',
    name: 'Base',
    symbol: 'ETH',
    decimals: 18,
    rpcUrls: [
      'https://mainnet.base.org',
      'https://base.llamarpc.com',
      'https://base.publicnode.com',
    ],
    explorerUrl: 'https://basescan.org',
    explorerApiUrl: 'https://api.basescan.org/api',
    isTestnet: false,
    supportsEIP1559: true,
    logoUrl: 'https://basescan.org/images/svg/brands/base.svg',
  },

  // Fantom
  250: {
    chainId: 250,
    chainIdHex: '0xfa',
    name: 'Fantom Opera',
    symbol: 'FTM',
    decimals: 18,
    rpcUrls: [
      'https://rpc.ftm.tools',
      'https://fantom.publicnode.com',
      'https://fantom.drpc.org',
    ],
    explorerUrl: 'https://ftmscan.com',
    explorerApiUrl: 'https://api.ftmscan.com/api',
    isTestnet: false,
    supportsEIP1559: false,
    logoUrl: 'https://ftmscan.com/images/svg/brands/fantom.svg',
  },

  // Cronos
  25: {
    chainId: 25,
    chainIdHex: '0x19',
    name: 'Cronos',
    symbol: 'CRO',
    decimals: 18,
    rpcUrls: [
      'https://evm.cronos.org',
      'https://cronos.publicnode.com',
    ],
    explorerUrl: 'https://cronoscan.com',
    explorerApiUrl: 'https://api.cronoscan.com/api',
    isTestnet: false,
    supportsEIP1559: true,
    logoUrl: 'https://cronoscan.com/images/svg/brands/cronos.svg',
  },

  // zkSync Era
  324: {
    chainId: 324,
    chainIdHex: '0x144',
    name: 'zkSync Era',
    symbol: 'ETH',
    decimals: 18,
    rpcUrls: [
      'https://mainnet.era.zksync.io',
      'https://zksync.drpc.org',
    ],
    explorerUrl: 'https://explorer.zksync.io',
    isTestnet: false,
    supportsEIP1559: true,
    logoUrl: 'https://explorer.zksync.io/images/zksync-logo.svg',
  },
};

// Default Mining Pools
export const MINING_POOLS: MiningPool[] = [
  {
    id: 'gapcoin-pool-1',
    name: 'Gapcoin Pool',
    url: 'stratum+tcp://pool.gapcoin.org',
    port: 3385,
    algorithm: 'gapcoin',
    coin: 'GAP',
    fee: 1.0,
    isActive: true,
  },
  {
    id: 'octaspace-pool-1',
    name: 'OctaSpace Official',
    url: 'stratum+tcp://pool.octa.space',
    port: 4444,
    algorithm: 'ethash',
    coin: 'OCTA',
    fee: 1.0,
    isActive: true,
  },
  {
    id: 'wattx-pool-1',
    name: 'WATTx Mining Pool',
    url: 'stratum+tcp://pool.wattxchange.app',
    port: 3333,
    algorithm: 'gapcoin',
    coin: 'WATTx',
    fee: 0.5,
    isActive: true,
  },
  {
    id: 'etho-pool-1',
    name: 'Etho Protocol Pool',
    url: 'stratum+tcp://pool.ethoprotocol.com',
    port: 8008,
    algorithm: 'ethash',
    coin: 'ETHO',
    fee: 1.0,
    isActive: true,
  },
  {
    id: 'alt-pool-1',
    name: 'Altcoinchain Pool',
    url: 'stratum+tcp://pool.altcoinchain.org',
    port: 3333,
    algorithm: 'ethash',
    coin: 'ALT',
    fee: 1.0,
    isActive: true,
  },
];

// BIP44 Derivation Paths
export const DERIVATION_PATHS: Record<string, string> = {
  ethereum: "m/44'/60'/0'/0",
  bitcoin: "m/44'/0'/0'/0",
  qtum: "m/44'/2301'/0'/0",
  wattx: "m/44'/2301'/0'/0", // Same as QTUM base
};

// App Constants
export const APP_CONSTANTS = {
  WALLET_VERSION: '1.0.0',
  MIN_GAS_LIMIT: 21000,
  DEFAULT_GAS_LIMIT: 100000,
  CONTRACT_GAS_LIMIT: 300000,
  STAKING_MIN_DELEGATION: '1000', // WATTx
  STAKING_UNBONDING_PERIOD: 259200, // blocks (~3 days)
  DELEGATION_MATURITY: 500, // blocks
  MINING_UPDATE_INTERVAL: 5000, // ms
  PRICE_UPDATE_INTERVAL: 60000, // ms
  BALANCE_UPDATE_INTERVAL: 30000, // ms
};

// Trust Tiers (WATTx)
export const TRUST_TIERS = {
  bronze: { minUptime: 95, multiplier: 1.0 },
  silver: { minUptime: 97, multiplier: 1.25 },
  gold: { minUptime: 99, multiplier: 1.5 },
  platinum: { minUptime: 99.9, multiplier: 2.0 },
};

// Inscription API Endpoints
export const INSCRIPTION_APIS = {
  ordinals: {
    mainnet: 'https://api.hiro.so/ordinals/v1',
    testnet: 'https://api.testnet.hiro.so/ordinals/v1',
  },
  brc20: {
    mainnet: 'https://api.unisat.io/query-v4',
  },
};

// WATTx Brand Theme Colors
export const THEME = {
  colors: {
    // Primary brand colors
    primary: '#F7931A',
    primaryDark: '#D97B0D',
    accent: '#00D9FF',
    accentDark: '#00B8D9',

    // Background colors
    background: '#1A1A2E',
    backgroundSecondary: '#16213E',
    surface: '#0F3460',
    card: '#16213E',

    // Text colors
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textHint: '#6B6B6B',
    textInverse: '#1A1A2E',

    // Status colors
    success: '#00C853',
    error: '#FF5252',
    warning: '#FFC107',
    info: '#2196F3',

    // Border and divider
    border: '#2A2A4E',
    divider: '#2A2A4E',

    // Special
    transparent: 'transparent',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
