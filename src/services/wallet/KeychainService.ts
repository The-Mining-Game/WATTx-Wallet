import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoredWallet } from '../../types';

const KEYCHAIN_SERVICE = 'com.wattxwallet.keychain';
const MNEMONIC_KEY = 'wattx_mnemonic';
const WALLET_DATA_KEY = 'wattx_wallet_data';
const BIOMETRICS_KEY = 'wattx_biometrics_enabled';
const PIN_KEY = 'wattx_pin';

export class KeychainService {
  private static instance: KeychainService;

  private constructor() {}

  static getInstance(): KeychainService {
    if (!KeychainService.instance) {
      KeychainService.instance = new KeychainService();
    }
    return KeychainService.instance;
  }

  // Store encrypted mnemonic
  async storeMnemonic(mnemonic: string, password: string): Promise<boolean> {
    try {
      // Encrypt mnemonic with password
      const encryptedData = await this.encrypt(mnemonic, password);

      await Keychain.setGenericPassword(
        MNEMONIC_KEY,
        encryptedData,
        {
          service: KEYCHAIN_SERVICE,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }
      );

      // Store password hash for verification
      const passwordHash = await this.hashPassword(password);
      await AsyncStorage.setItem(`${KEYCHAIN_SERVICE}_pwd_hash`, passwordHash);

      return true;
    } catch (error) {
      console.error('Failed to store mnemonic:', error);
      return false;
    }
  }

  // Retrieve decrypted mnemonic
  async getMnemonic(password: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
      });

      if (!credentials) {
        return null;
      }

      const decrypted = await this.decrypt(credentials.password, password);
      return decrypted;
    } catch (error) {
      console.error('Failed to get mnemonic:', error);
      return null;
    }
  }

  // Store wallet data
  async storeWalletData(walletData: StoredWallet): Promise<boolean> {
    try {
      const data = JSON.stringify(walletData);
      await AsyncStorage.setItem(WALLET_DATA_KEY, data);
      return true;
    } catch (error) {
      console.error('Failed to store wallet data:', error);
      return false;
    }
  }

  // Get wallet data
  async getWalletData(): Promise<StoredWallet | null> {
    try {
      const data = await AsyncStorage.getItem(WALLET_DATA_KEY);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as StoredWallet;
    } catch (error) {
      console.error('Failed to get wallet data:', error);
      return null;
    }
  }

  // Check if wallet exists
  async hasStoredWallet(): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
      });
      return !!credentials;
    } catch (error) {
      return false;
    }
  }

  // Verify password
  async verifyPassword(password: string): Promise<boolean> {
    try {
      const storedHash = await AsyncStorage.getItem(`${KEYCHAIN_SERVICE}_pwd_hash`);
      if (!storedHash) {
        return false;
      }

      const inputHash = await this.hashPassword(password);
      return storedHash === inputHash;
    } catch (error) {
      return false;
    }
  }

  // Enable/disable biometrics
  async setBiometricsEnabled(enabled: boolean, password?: string): Promise<boolean> {
    try {
      if (enabled && password) {
        // Store password with biometrics
        await Keychain.setGenericPassword(
          BIOMETRICS_KEY,
          password,
          {
            service: `${KEYCHAIN_SERVICE}_bio`,
            accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          }
        );
      } else {
        await Keychain.resetGenericPassword({
          service: `${KEYCHAIN_SERVICE}_bio`,
        });
      }

      await AsyncStorage.setItem(BIOMETRICS_KEY, JSON.stringify(enabled));
      return true;
    } catch (error) {
      console.error('Failed to set biometrics:', error);
      return false;
    }
  }

  // Check if biometrics is enabled
  async isBiometricsEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRICS_KEY);
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  }

  // Authenticate with biometrics
  async authenticateWithBiometrics(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: `${KEYCHAIN_SERVICE}_bio`,
        authenticationPrompt: {
          title: 'Authenticate',
          subtitle: 'Use biometrics to unlock your wallet',
          cancel: 'Cancel',
        },
      });

      if (credentials) {
        return credentials.password; // Returns the stored password
      }
      return null;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return null;
    }
  }

  // Check biometrics availability
  async getBiometryType(): Promise<Keychain.BIOMETRY_TYPE | null> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType;
    } catch (error) {
      return null;
    }
  }

  // Store PIN
  async storePin(pin: string, password: string): Promise<boolean> {
    try {
      const encryptedPin = await this.encrypt(pin, password);
      await AsyncStorage.setItem(PIN_KEY, encryptedPin);
      return true;
    } catch (error) {
      console.error('Failed to store PIN:', error);
      return false;
    }
  }

  // Verify PIN
  async verifyPin(pin: string, password: string): Promise<boolean> {
    try {
      const encryptedPin = await AsyncStorage.getItem(PIN_KEY);
      if (!encryptedPin) {
        return false;
      }

      const storedPin = await this.decrypt(encryptedPin, password);
      return pin === storedPin;
    } catch (error) {
      return false;
    }
  }

  // Clear all stored data
  async clearAll(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
      await Keychain.resetGenericPassword({ service: `${KEYCHAIN_SERVICE}_bio` });
      await AsyncStorage.multiRemove([
        WALLET_DATA_KEY,
        BIOMETRICS_KEY,
        PIN_KEY,
        `${KEYCHAIN_SERVICE}_pwd_hash`,
      ]);
    } catch (error) {
      console.error('Failed to clear keychain:', error);
    }
  }

  // Simple encryption (in production, use more robust encryption)
  private async encrypt(data: string, password: string): Promise<string> {
    // Using a simple XOR-based encryption for demonstration
    // In production, use react-native-aes-crypto or similar
    const key = await this.deriveKey(password);
    const encrypted = Buffer.from(data)
      .map((byte, i) => byte ^ key.charCodeAt(i % key.length))
      .toString('base64');
    return encrypted;
  }

  private async decrypt(encryptedData: string, password: string): Promise<string> {
    const key = await this.deriveKey(password);
    const decoded = Buffer.from(encryptedData, 'base64');
    const decrypted = decoded
      .map((byte, i) => byte ^ key.charCodeAt(i % key.length))
      .toString();
    return decrypted;
  }

  private async deriveKey(password: string): Promise<string> {
    // Simple key derivation - in production use PBKDF2
    let key = password;
    for (let i = 0; i < 1000; i++) {
      key = await this.hashPassword(key);
    }
    return key.substring(0, 32);
  }

  private async hashPassword(password: string): Promise<string> {
    // Simple hash - in production use proper crypto
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }
}

export default KeychainService.getInstance();
