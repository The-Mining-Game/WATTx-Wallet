import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MiningPool, MiningStats, MiningConfig } from '../../types';
import { MINING_POOLS } from '../../utils/constants';

const { MiningModule } = NativeModules;
const miningEmitter = MiningModule ? new NativeEventEmitter(MiningModule) : null;

const MINING_CONFIG_KEY = 'wattx_mining_config';
const CUSTOM_POOLS_KEY = 'wattx_custom_pools';

export class MiningService {
  private static instance: MiningService;
  private config: MiningConfig;
  private customPools: MiningPool[] = [];
  private isInitialized: boolean = false;
  private statsListeners: ((stats: MiningStats) => void)[] = [];
  private miningInterval: NodeJS.Timer | null = null;

  private constructor() {
    this.config = {
      enabled: false,
      threadCount: 2,
      intensity: 50,
      backgroundMining: false,
      thermalLimit: 70,
      batteryLimit: 20,
    };
  }

  static getInstance(): MiningService {
    if (!MiningService.instance) {
      MiningService.instance = new MiningService();
    }
    return MiningService.instance;
  }

  // Initialize mining service
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadConfig();
    await this.loadCustomPools();
    this.setupNativeListeners();
    this.isInitialized = true;
  }

  // === Configuration ===

  // Get current config
  getConfig(): MiningConfig {
    return { ...this.config };
  }

  // Update config
  async updateConfig(updates: Partial<MiningConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();

    // Apply changes to native module if mining
    if (this.config.enabled && MiningModule) {
      await MiningModule.updateConfig(
        this.config.threadCount,
        this.config.intensity,
        this.config.thermalLimit,
        this.config.batteryLimit
      );
    }
  }

  // Load config from storage
  private async loadConfig(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(MINING_CONFIG_KEY);
      if (data) {
        this.config = { ...this.config, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Failed to load mining config:', error);
    }
  }

  // Save config to storage
  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(MINING_CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save mining config:', error);
    }
  }

  // === Pool Management ===

  // Get all pools
  getAllPools(): MiningPool[] {
    return [...MINING_POOLS, ...this.customPools];
  }

  // Get pools by algorithm
  getPoolsByAlgorithm(algorithm: string): MiningPool[] {
    return this.getAllPools().filter(p => p.algorithm === algorithm);
  }

  // Get pools by coin
  getPoolsByCoin(coin: string): MiningPool[] {
    return this.getAllPools().filter(
      p => p.coin.toLowerCase() === coin.toLowerCase()
    );
  }

  // Add custom pool
  async addCustomPool(pool: Omit<MiningPool, 'id'>): Promise<MiningPool> {
    const newPool: MiningPool = {
      ...pool,
      id: `custom-${Date.now()}`,
    };

    this.customPools.push(newPool);
    await this.saveCustomPools();
    return newPool;
  }

  // Remove custom pool
  async removeCustomPool(poolId: string): Promise<boolean> {
    const index = this.customPools.findIndex(p => p.id === poolId);
    if (index === -1) return false;

    this.customPools.splice(index, 1);
    await this.saveCustomPools();
    return true;
  }

  // Load custom pools
  private async loadCustomPools(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(CUSTOM_POOLS_KEY);
      if (data) {
        this.customPools = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load custom pools:', error);
    }
  }

  // Save custom pools
  private async saveCustomPools(): Promise<void> {
    try {
      await AsyncStorage.setItem(CUSTOM_POOLS_KEY, JSON.stringify(this.customPools));
    } catch (error) {
      console.error('Failed to save custom pools:', error);
    }
  }

  // === Mining Control ===

  // Start mining
  async startMining(poolId?: string): Promise<{ success: boolean; error?: string }> {
    if (!MiningModule) {
      return { success: false, error: 'Mining not supported on this platform' };
    }

    const targetPoolId = poolId || this.config.poolId;
    if (!targetPoolId) {
      return { success: false, error: 'No pool selected' };
    }

    const pool = this.getAllPools().find(p => p.id === targetPoolId);
    if (!pool) {
      return { success: false, error: 'Pool not found' };
    }

    try {
      await MiningModule.startMining(
        pool.url,
        pool.port,
        this.config.username || '',
        this.config.password || '',
        pool.algorithm,
        this.config.threadCount,
        this.config.intensity
      );

      this.config.enabled = true;
      this.config.poolId = targetPoolId;
      await this.saveConfig();

      this.startStatsPolling();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Stop mining
  async stopMining(): Promise<void> {
    if (MiningModule) {
      await MiningModule.stopMining();
    }

    this.config.enabled = false;
    await this.saveConfig();
    this.stopStatsPolling();
  }

  // Check if mining
  isMining(): boolean {
    return this.config.enabled;
  }

  // === Stats ===

  // Get current stats
  async getStats(): Promise<MiningStats> {
    if (!MiningModule || !this.config.enabled) {
      return {
        hashrate: 0,
        hashrateUnit: 'H/s',
        sharesAccepted: 0,
        sharesRejected: 0,
        earnings: '0',
        uptime: 0,
      };
    }

    try {
      const stats = await MiningModule.getStats();
      return {
        hashrate: stats.hashrate || 0,
        hashrateUnit: stats.hashrateUnit || 'H/s',
        sharesAccepted: stats.sharesAccepted || 0,
        sharesRejected: stats.sharesRejected || 0,
        earnings: stats.earnings || '0',
        uptime: stats.uptime || 0,
        temperature: stats.temperature,
        power: stats.power,
      };
    } catch (error) {
      console.error('Failed to get mining stats:', error);
      return {
        hashrate: 0,
        hashrateUnit: 'H/s',
        sharesAccepted: 0,
        sharesRejected: 0,
        earnings: '0',
        uptime: 0,
      };
    }
  }

  // Subscribe to stats updates
  onStatsUpdate(callback: (stats: MiningStats) => void): () => void {
    this.statsListeners.push(callback);
    return () => {
      const index = this.statsListeners.indexOf(callback);
      if (index !== -1) {
        this.statsListeners.splice(index, 1);
      }
    };
  }

  // Start stats polling
  private startStatsPolling(): void {
    if (this.miningInterval) return;

    this.miningInterval = setInterval(async () => {
      const stats = await this.getStats();
      this.statsListeners.forEach(cb => cb(stats));
    }, 5000);
  }

  // Stop stats polling
  private stopStatsPolling(): void {
    if (this.miningInterval) {
      clearInterval(this.miningInterval);
      this.miningInterval = null;
    }
  }

  // === Native Event Listeners ===

  private setupNativeListeners(): void {
    if (!miningEmitter) return;

    miningEmitter.addListener('onShareAccepted', (event: any) => {
      console.log('Share accepted:', event);
    });

    miningEmitter.addListener('onShareRejected', (event: any) => {
      console.log('Share rejected:', event);
    });

    miningEmitter.addListener('onMiningError', (event: any) => {
      console.error('Mining error:', event.error);
    });

    miningEmitter.addListener('onTemperatureWarning', (event: any) => {
      console.warn('Temperature warning:', event.temperature);
      // Auto-throttle or stop based on config
      if (event.temperature >= this.config.thermalLimit) {
        this.stopMining();
      }
    });

    miningEmitter.addListener('onBatteryLow', (event: any) => {
      console.warn('Battery low:', event.level);
      if (event.level <= this.config.batteryLimit) {
        this.stopMining();
      }
    });
  }

  // === Pool Mining API ===

  // Fetch pool stats from API
  async fetchPoolStats(poolId: string): Promise<any> {
    const pool = this.getAllPools().find(p => p.id === poolId);
    if (!pool) {
      throw new Error('Pool not found');
    }

    // Extract base URL from stratum URL
    const baseUrl = pool.url
      .replace('stratum+tcp://', 'https://')
      .replace('stratum+ssl://', 'https://');

    try {
      const response = await fetch(`${baseUrl}/api/stats`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch pool stats:', error);
      return null;
    }
  }

  // Get worker stats from pool
  async getWorkerStats(
    poolId: string,
    walletAddress: string
  ): Promise<any> {
    const pool = this.getAllPools().find(p => p.id === poolId);
    if (!pool) {
      throw new Error('Pool not found');
    }

    const baseUrl = pool.url
      .replace('stratum+tcp://', 'https://')
      .replace('stratum+ssl://', 'https://');

    try {
      const response = await fetch(
        `${baseUrl}/api/worker/${walletAddress}`
      );
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch worker stats:', error);
      return null;
    }
  }

  // === Utility Methods ===

  // Format hashrate for display
  formatHashrate(hashrate: number): { value: string; unit: string } {
    const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s'];
    let unitIndex = 0;
    let value = hashrate;

    while (value >= 1000 && unitIndex < units.length - 1) {
      value /= 1000;
      unitIndex++;
    }

    return {
      value: value.toFixed(2),
      unit: units[unitIndex],
    };
  }

  // Get recommended thread count
  getRecommendedThreadCount(): number {
    // In React Native, we can't directly get CPU info
    // Default to 2 threads for mobile devices
    return Platform.OS === 'android' ? 2 : 1;
  }

  // Calculate estimated earnings
  calculateEstimatedEarnings(
    hashrate: number,
    networkDifficulty: number,
    blockReward: number,
    poolFee: number = 1
  ): { hourly: number; daily: number; monthly: number } {
    // Simple estimation based on hashrate share
    const shareOfNetwork = hashrate / networkDifficulty;
    const blocksPerHour = 3600; // 1-second blocks
    const hourlyReward = shareOfNetwork * blocksPerHour * blockReward * (1 - poolFee / 100);

    return {
      hourly: hourlyReward,
      daily: hourlyReward * 24,
      monthly: hourlyReward * 24 * 30,
    };
  }
}

export default MiningService.getInstance();
