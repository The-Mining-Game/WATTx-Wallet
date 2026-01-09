import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NETWORKS } from '../../utils/constants';
import { NetworkConfig, Token, Transaction, GasEstimate } from '../../types';
import { WATTxProvider } from './WATTxProvider';

const CUSTOM_NETWORKS_KEY = 'wattx_custom_networks';
const ACTIVE_NETWORK_KEY = 'wattx_active_network';

export class NetworkManager {
  private static instance: NetworkManager;
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private wattxProviders: Map<number, WATTxProvider> = new Map();
  private customNetworks: Map<number, NetworkConfig> = new Map();
  private activeChainId: number = 1; // Default to Ethereum

  private constructor() {
    this.loadCustomNetworks();
    this.loadActiveNetwork();
  }

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  // Initialize provider for network
  private initProvider(chainId: number): ethers.JsonRpcProvider | null {
    const network = this.getNetwork(chainId);
    if (!network || network.rpcUrls.length === 0) {
      return null;
    }

    const provider = new ethers.JsonRpcProvider(network.rpcUrls[0], {
      chainId: network.chainId,
      name: network.name,
    });

    this.providers.set(chainId, provider);
    return provider;
  }

  // Get provider for chain
  getProvider(chainId: number): ethers.JsonRpcProvider | null {
    if (this.providers.has(chainId)) {
      return this.providers.get(chainId)!;
    }
    return this.initProvider(chainId);
  }

  // Get WATTx provider (for WATTx/QTUM specific operations)
  getWATTxProvider(chainId: number): WATTxProvider | null {
    const network = this.getNetwork(chainId);
    if (!network || !network.supportsStaking) {
      return null;
    }

    if (this.wattxProviders.has(chainId)) {
      return this.wattxProviders.get(chainId)!;
    }

    const provider = new WATTxProvider(network.rpcUrls[0]);
    this.wattxProviders.set(chainId, provider);
    return provider;
  }

  // Get network config
  getNetwork(chainId: number): NetworkConfig | null {
    if (NETWORKS[chainId]) {
      return NETWORKS[chainId];
    }
    if (this.customNetworks.has(chainId)) {
      return this.customNetworks.get(chainId)!;
    }
    return null;
  }

  // Get all networks
  getAllNetworks(): NetworkConfig[] {
    const builtIn = Object.values(NETWORKS);
    const custom = Array.from(this.customNetworks.values());
    return [...builtIn, ...custom];
  }

  // Get active network
  getActiveNetwork(): NetworkConfig | null {
    return this.getNetwork(this.activeChainId);
  }

  // Get active chain ID
  getActiveChainId(): number {
    return this.activeChainId;
  }

  // Set active network
  async setActiveNetwork(chainId: number): Promise<boolean> {
    const network = this.getNetwork(chainId);
    if (!network) {
      return false;
    }

    this.activeChainId = chainId;
    await AsyncStorage.setItem(ACTIVE_NETWORK_KEY, chainId.toString());
    return true;
  }

  // Add custom network
  async addCustomNetwork(network: NetworkConfig): Promise<boolean> {
    try {
      // Validate by trying to connect
      const provider = new ethers.JsonRpcProvider(network.rpcUrls[0]);
      const fetchedChainId = await provider.getNetwork();

      if (Number(fetchedChainId.chainId) !== network.chainId) {
        throw new Error('Chain ID mismatch');
      }

      network.isCustom = true;
      this.customNetworks.set(network.chainId, network);
      await this.saveCustomNetworks();
      return true;
    } catch (error) {
      console.error('Failed to add custom network:', error);
      return false;
    }
  }

  // Remove custom network
  async removeCustomNetwork(chainId: number): Promise<boolean> {
    if (!this.customNetworks.has(chainId)) {
      return false;
    }

    this.customNetworks.delete(chainId);
    this.providers.delete(chainId);
    await this.saveCustomNetworks();
    return true;
  }

  // Get balance
  async getBalance(address: string, chainId?: number): Promise<string> {
    const targetChainId = chainId || this.activeChainId;
    const provider = this.getProvider(targetChainId);

    if (!provider) {
      throw new Error('No provider for network');
    }

    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  // Get token balance
  async getTokenBalance(
    tokenAddress: string,
    walletAddress: string,
    chainId?: number
  ): Promise<string> {
    const targetChainId = chainId || this.activeChainId;
    const provider = this.getProvider(targetChainId);

    if (!provider) {
      throw new Error('No provider for network');
    }

    const erc20Abi = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)',
    ];

    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(walletAddress),
      contract.decimals(),
    ]);

    return ethers.formatUnits(balance, decimals);
  }

  // Get token info
  async getTokenInfo(tokenAddress: string, chainId?: number): Promise<Token | null> {
    const targetChainId = chainId || this.activeChainId;
    const provider = this.getProvider(targetChainId);

    if (!provider) {
      return null;
    }

    try {
      const erc20Abi = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        chainId: targetChainId,
      };
    } catch (error) {
      console.error('Failed to get token info:', error);
      return null;
    }
  }

  // Estimate gas
  async estimateGas(
    transaction: ethers.TransactionRequest,
    chainId?: number
  ): Promise<GasEstimate> {
    const targetChainId = chainId || this.activeChainId;
    const provider = this.getProvider(targetChainId);
    const network = this.getNetwork(targetChainId);

    if (!provider || !network) {
      throw new Error('No provider for network');
    }

    const feeData = await provider.getFeeData();
    const gasLimit = await provider.estimateGas(transaction);

    if (network.supportsEIP1559 && feeData.maxFeePerGas) {
      // EIP-1559 gas estimation
      const baseFee = feeData.maxFeePerGas;
      const priorityFee = feeData.maxPriorityFeePerGas || BigInt(1000000000);

      return {
        low: {
          maxFeePerGas: (baseFee * BigInt(90) / BigInt(100)).toString(),
          maxPriorityFeePerGas: (priorityFee * BigInt(80) / BigInt(100)).toString(),
          estimatedTime: 120,
        },
        medium: {
          maxFeePerGas: baseFee.toString(),
          maxPriorityFeePerGas: priorityFee.toString(),
          estimatedTime: 60,
        },
        high: {
          maxFeePerGas: (baseFee * BigInt(120) / BigInt(100)).toString(),
          maxPriorityFeePerGas: (priorityFee * BigInt(150) / BigInt(100)).toString(),
          estimatedTime: 30,
        },
      };
    } else {
      // Legacy gas estimation
      const gasPrice = feeData.gasPrice || BigInt(20000000000);

      return {
        low: {
          gasPrice: (gasPrice * BigInt(90) / BigInt(100)).toString(),
          estimatedTime: 120,
        },
        medium: {
          gasPrice: gasPrice.toString(),
          estimatedTime: 60,
        },
        high: {
          gasPrice: (gasPrice * BigInt(120) / BigInt(100)).toString(),
          estimatedTime: 30,
        },
      };
    }
  }

  // Send transaction
  async sendTransaction(
    signedTx: string,
    chainId?: number
  ): Promise<ethers.TransactionResponse> {
    const targetChainId = chainId || this.activeChainId;
    const provider = this.getProvider(targetChainId);

    if (!provider) {
      throw new Error('No provider for network');
    }

    return provider.broadcastTransaction(signedTx);
  }

  // Get transaction
  async getTransaction(
    txHash: string,
    chainId?: number
  ): Promise<ethers.TransactionResponse | null> {
    const targetChainId = chainId || this.activeChainId;
    const provider = this.getProvider(targetChainId);

    if (!provider) {
      return null;
    }

    return provider.getTransaction(txHash);
  }

  // Get transaction receipt
  async getTransactionReceipt(
    txHash: string,
    chainId?: number
  ): Promise<ethers.TransactionReceipt | null> {
    const targetChainId = chainId || this.activeChainId;
    const provider = this.getProvider(targetChainId);

    if (!provider) {
      return null;
    }

    return provider.getTransactionReceipt(txHash);
  }

  // Wait for transaction
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1,
    chainId?: number
  ): Promise<ethers.TransactionReceipt | null> {
    const targetChainId = chainId || this.activeChainId;
    const provider = this.getProvider(targetChainId);

    if (!provider) {
      return null;
    }

    return provider.waitForTransaction(txHash, confirmations);
  }

  // Get block number
  async getBlockNumber(chainId?: number): Promise<number> {
    const targetChainId = chainId || this.activeChainId;
    const provider = this.getProvider(targetChainId);

    if (!provider) {
      throw new Error('No provider for network');
    }

    return provider.getBlockNumber();
  }

  // Call contract function
  async callContract(
    contractAddress: string,
    abi: ethers.InterfaceAbi,
    method: string,
    args: any[],
    chainId?: number
  ): Promise<any> {
    const targetChainId = chainId || this.activeChainId;
    const provider = this.getProvider(targetChainId);

    if (!provider) {
      throw new Error('No provider for network');
    }

    const contract = new ethers.Contract(contractAddress, abi, provider);
    return contract[method](...args);
  }

  // Get explorer URL for address
  getExplorerAddressUrl(address: string, chainId?: number): string {
    const targetChainId = chainId || this.activeChainId;
    const network = this.getNetwork(targetChainId);

    if (!network) {
      return '';
    }

    return `${network.explorerUrl}/address/${address}`;
  }

  // Get explorer URL for transaction
  getExplorerTxUrl(txHash: string, chainId?: number): string {
    const targetChainId = chainId || this.activeChainId;
    const network = this.getNetwork(targetChainId);

    if (!network) {
      return '';
    }

    return `${network.explorerUrl}/tx/${txHash}`;
  }

  // Private methods
  private async loadCustomNetworks(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(CUSTOM_NETWORKS_KEY);
      if (data) {
        const networks = JSON.parse(data) as NetworkConfig[];
        networks.forEach(n => this.customNetworks.set(n.chainId, n));
      }
    } catch (error) {
      console.error('Failed to load custom networks:', error);
    }
  }

  private async saveCustomNetworks(): Promise<void> {
    try {
      const networks = Array.from(this.customNetworks.values());
      await AsyncStorage.setItem(CUSTOM_NETWORKS_KEY, JSON.stringify(networks));
    } catch (error) {
      console.error('Failed to save custom networks:', error);
    }
  }

  private async loadActiveNetwork(): Promise<void> {
    try {
      const chainId = await AsyncStorage.getItem(ACTIVE_NETWORK_KEY);
      if (chainId) {
        this.activeChainId = parseInt(chainId, 10);
      }
    } catch (error) {
      console.error('Failed to load active network:', error);
    }
  }
}

export default NetworkManager.getInstance();
