import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import { DERIVATION_PATHS, NETWORKS } from '../../utils/constants';
import { Wallet, WalletAccount, StoredWallet } from '../../types';
import { KeychainService } from './KeychainService';

export class WalletService {
  private static instance: WalletService;
  private keychainService: KeychainService;
  private hdNode: ethers.HDNodeWallet | null = null;
  private currentAccount: WalletAccount | null = null;

  private constructor() {
    this.keychainService = KeychainService.getInstance();
  }

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  // Generate new mnemonic
  generateMnemonic(strength: 128 | 256 = 256): string {
    return bip39.generateMnemonic(strength);
  }

  // Validate mnemonic
  validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }

  // Create wallet from mnemonic
  async createWallet(mnemonic: string, password: string, accountName: string = 'Account 1'): Promise<WalletAccount> {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    // Create HD wallet
    const seed = await bip39.mnemonicToSeed(mnemonic);
    this.hdNode = ethers.HDNodeWallet.fromSeed(seed);

    // Create account with wallets for each supported chain
    const account = this.createAccountFromHD(accountName, 0);

    // Encrypt and store mnemonic
    await this.keychainService.storeMnemonic(mnemonic, password);

    // Store account data
    const storedWallet: StoredWallet = {
      encryptedMnemonic: '', // Stored separately in keychain
      accounts: [account],
      activeAccountId: account.id,
    };

    await this.keychainService.storeWalletData(storedWallet);

    this.currentAccount = account;
    return account;
  }

  // Import wallet from mnemonic
  async importWallet(mnemonic: string, password: string, accountName: string = 'Imported Account'): Promise<WalletAccount> {
    return this.createWallet(mnemonic, password, accountName);
  }

  // Unlock wallet with password
  async unlockWallet(password: string): Promise<boolean> {
    try {
      const mnemonic = await this.keychainService.getMnemonic(password);
      if (!mnemonic) {
        return false;
      }

      const seed = await bip39.mnemonicToSeed(mnemonic);
      this.hdNode = ethers.HDNodeWallet.fromSeed(seed);

      const storedWallet = await this.keychainService.getWalletData();
      if (storedWallet && storedWallet.accounts.length > 0) {
        this.currentAccount = storedWallet.accounts.find(
          a => a.id === storedWallet.activeAccountId
        ) || storedWallet.accounts[0];
      }

      return true;
    } catch (error) {
      console.error('Failed to unlock wallet:', error);
      return false;
    }
  }

  // Lock wallet
  lockWallet(): void {
    this.hdNode = null;
    this.currentAccount = null;
  }

  // Create account from HD node
  private createAccountFromHD(name: string, accountIndex: number): WalletAccount {
    if (!this.hdNode) {
      throw new Error('Wallet not initialized');
    }

    const wallets: Record<number, Wallet> = {};

    // Create wallet for each supported network
    Object.values(NETWORKS).forEach(network => {
      const wallet = this.deriveWalletForChain(network.chainId, accountIndex);
      wallets[network.chainId] = wallet;
    });

    return {
      id: `account-${Date.now()}-${accountIndex}`,
      name,
      wallets,
      createdAt: Date.now(),
    };
  }

  // Derive wallet for specific chain
  private deriveWalletForChain(chainId: number, accountIndex: number): Wallet {
    if (!this.hdNode) {
      throw new Error('Wallet not initialized');
    }

    // Determine derivation path based on chain type
    let basePath = DERIVATION_PATHS.ethereum;
    const network = NETWORKS[chainId];

    if (network) {
      if (network.symbol === 'QTUM' || network.symbol === 'WATTx' || network.symbol === 'tWATTx') {
        basePath = DERIVATION_PATHS.qtum;
      }
    }

    const derivationPath = `${basePath}/${accountIndex}`;
    const derived = this.hdNode.derivePath(derivationPath);

    return {
      address: derived.address,
      publicKey: derived.publicKey,
      derivationPath,
      chainId,
    };
  }

  // Get private key for signing (internal use only)
  async getPrivateKey(chainId: number, password: string): Promise<string | null> {
    try {
      const mnemonic = await this.keychainService.getMnemonic(password);
      if (!mnemonic || !this.currentAccount) {
        return null;
      }

      const seed = await bip39.mnemonicToSeed(mnemonic);
      const hdNode = ethers.HDNodeWallet.fromSeed(seed);

      const wallet = this.currentAccount.wallets[chainId];
      if (!wallet) {
        return null;
      }

      const derived = hdNode.derivePath(wallet.derivationPath);
      return derived.privateKey;
    } catch (error) {
      console.error('Failed to get private key:', error);
      return null;
    }
  }

  // Sign transaction
  async signTransaction(
    chainId: number,
    transaction: ethers.TransactionRequest,
    password: string
  ): Promise<string | null> {
    const privateKey = await this.getPrivateKey(chainId, password);
    if (!privateKey) {
      return null;
    }

    try {
      const wallet = new ethers.Wallet(privateKey);
      const signedTx = await wallet.signTransaction(transaction);
      return signedTx;
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      return null;
    }
  }

  // Sign message
  async signMessage(
    chainId: number,
    message: string,
    password: string
  ): Promise<string | null> {
    const privateKey = await this.getPrivateKey(chainId, password);
    if (!privateKey) {
      return null;
    }

    try {
      const wallet = new ethers.Wallet(privateKey);
      const signature = await wallet.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      return null;
    }
  }

  // Sign typed data (EIP-712)
  async signTypedData(
    chainId: number,
    domain: ethers.TypedDataDomain,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, any>,
    password: string
  ): Promise<string | null> {
    const privateKey = await this.getPrivateKey(chainId, password);
    if (!privateKey) {
      return null;
    }

    try {
      const wallet = new ethers.Wallet(privateKey);
      const signature = await wallet.signTypedData(domain, types, value);
      return signature;
    } catch (error) {
      console.error('Failed to sign typed data:', error);
      return null;
    }
  }

  // Add new account
  async addAccount(name: string): Promise<WalletAccount | null> {
    if (!this.hdNode) {
      return null;
    }

    const storedWallet = await this.keychainService.getWalletData();
    if (!storedWallet) {
      return null;
    }

    const accountIndex = storedWallet.accounts.length;
    const newAccount = this.createAccountFromHD(name, accountIndex);

    storedWallet.accounts.push(newAccount);
    await this.keychainService.storeWalletData(storedWallet);

    return newAccount;
  }

  // Switch active account
  async switchAccount(accountId: string): Promise<boolean> {
    const storedWallet = await this.keychainService.getWalletData();
    if (!storedWallet) {
      return false;
    }

    const account = storedWallet.accounts.find(a => a.id === accountId);
    if (!account) {
      return false;
    }

    storedWallet.activeAccountId = accountId;
    await this.keychainService.storeWalletData(storedWallet);
    this.currentAccount = account;

    return true;
  }

  // Get current account
  getCurrentAccount(): WalletAccount | null {
    return this.currentAccount;
  }

  // Get all accounts
  async getAllAccounts(): Promise<WalletAccount[]> {
    const storedWallet = await this.keychainService.getWalletData();
    return storedWallet?.accounts || [];
  }

  // Get address for chain
  getAddressForChain(chainId: number): string | null {
    if (!this.currentAccount) {
      return null;
    }

    const wallet = this.currentAccount.wallets[chainId];
    return wallet?.address || null;
  }

  // Check if wallet exists
  async hasWallet(): Promise<boolean> {
    return this.keychainService.hasStoredWallet();
  }

  // Export mnemonic (requires password)
  async exportMnemonic(password: string): Promise<string | null> {
    return this.keychainService.getMnemonic(password);
  }

  // Delete wallet (requires password confirmation)
  async deleteWallet(password: string): Promise<boolean> {
    const isValid = await this.keychainService.verifyPassword(password);
    if (!isValid) {
      return false;
    }

    await this.keychainService.clearAll();
    this.hdNode = null;
    this.currentAccount = null;
    return true;
  }

  // Change password
  async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    const mnemonic = await this.keychainService.getMnemonic(oldPassword);
    if (!mnemonic) {
      return false;
    }

    await this.keychainService.storeMnemonic(mnemonic, newPassword);
    return true;
  }
}

export default WalletService.getInstance();
