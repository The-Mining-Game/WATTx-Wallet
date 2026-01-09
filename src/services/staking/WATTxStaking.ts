import { WATTxProvider } from '../blockchain/WATTxProvider';
import { NetworkManager } from '../blockchain/NetworkManager';
import { Validator, Delegation, StakingInfo } from '../../types';
import { APP_CONSTANTS, TRUST_TIERS } from '../../utils/constants';

export class WATTxStakingService {
  private static instance: WATTxStakingService;
  private networkManager: NetworkManager;

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
  }

  static getInstance(): WATTxStakingService {
    if (!WATTxStakingService.instance) {
      WATTxStakingService.instance = new WATTxStakingService();
    }
    return WATTxStakingService.instance;
  }

  private getProvider(chainId?: number): WATTxProvider | null {
    const targetChainId = chainId || this.networkManager.getActiveChainId();
    return this.networkManager.getWATTxProvider(targetChainId);
  }

  // === Validator Operations ===

  // Get all validators
  async getValidators(
    options: {
      maxFee?: number;
      activeOnly?: boolean;
      sortBy?: 'stake' | 'uptime' | 'fee' | 'delegators';
      sortOrder?: 'asc' | 'desc';
    } = {},
    chainId?: number
  ): Promise<Validator[]> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      throw new Error('Staking not supported on this network');
    }

    let validators = await provider.listValidators(options.maxFee, options.activeOnly ?? true);

    // Sort validators
    if (options.sortBy) {
      validators.sort((a, b) => {
        let comparison = 0;

        switch (options.sortBy) {
          case 'stake':
            comparison = parseFloat(b.totalStake) - parseFloat(a.totalStake);
            break;
          case 'uptime':
            comparison = b.uptime - a.uptime;
            break;
          case 'fee':
            comparison = a.feeRate - b.feeRate;
            break;
          case 'delegators':
            comparison = b.delegatorCount - a.delegatorCount;
            break;
        }

        return options.sortOrder === 'asc' ? -comparison : comparison;
      });
    }

    return validators;
  }

  // Get validator by ID
  async getValidator(validatorId: string, chainId?: number): Promise<Validator | null> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      return null;
    }

    return provider.getValidator(validatorId);
  }

  // Get validator statistics
  async getValidatorStats(chainId?: number): Promise<any> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      throw new Error('Staking not supported on this network');
    }

    return provider.getValidatorStats();
  }

  // Register as validator
  async registerAsValidator(
    feeRate: number,
    name?: string,
    chainId?: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      return { success: false, error: 'Staking not supported on this network' };
    }

    // Validate fee rate (0-10000 basis points = 0-100%)
    if (feeRate < 0 || feeRate > 10000) {
      return { success: false, error: 'Fee rate must be between 0 and 10000 basis points' };
    }

    try {
      const txHash = await provider.registerValidator(feeRate, name);
      return { success: true, txHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Update validator fee
  async updateValidatorFee(
    feeRate: number,
    chainId?: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      return { success: false, error: 'Staking not supported on this network' };
    }

    if (feeRate < 0 || feeRate > 10000) {
      return { success: false, error: 'Fee rate must be between 0 and 10000 basis points' };
    }

    try {
      const txHash = await provider.setValidatorPoolFee(feeRate);
      return { success: true, txHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get my validator info
  async getMyValidatorInfo(chainId?: number): Promise<Validator | null> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      return null;
    }

    return provider.getMyValidator();
  }

  // === Delegation Operations ===

  // Delegate stake to validator
  async delegate(
    validatorId: string,
    amount: string,
    chainId?: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      return { success: false, error: 'Staking not supported on this network' };
    }

    // Validate minimum delegation
    const minDelegation = parseFloat(APP_CONSTANTS.STAKING_MIN_DELEGATION);
    if (parseFloat(amount) < minDelegation) {
      return {
        success: false,
        error: `Minimum delegation is ${minDelegation} WATTx`,
      };
    }

    try {
      const txHash = await provider.delegateStake(validatorId, amount);
      return { success: true, txHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Undelegate stake
  async undelegate(
    validatorId: string,
    amount?: string,
    chainId?: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      return { success: false, error: 'Staking not supported on this network' };
    }

    try {
      const txHash = await provider.undelegateStake(validatorId, amount);
      return { success: true, txHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get my delegations
  async getMyDelegations(chainId?: number): Promise<Delegation[]> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      return [];
    }

    return provider.getMyDelegations();
  }

  // Claim rewards
  async claimRewards(
    validatorId?: string,
    chainId?: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      return { success: false, error: 'Staking not supported on this network' };
    }

    try {
      const txHash = await provider.claimRewards(validatorId);
      return { success: true, txHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get pending rewards
  async getPendingRewards(delegatorId: string, chainId?: number): Promise<string> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      return '0';
    }

    try {
      return await provider.getPendingRewards(delegatorId);
    } catch (error) {
      return '0';
    }
  }

  // === Staking Info ===

  // Get complete staking info
  async getStakingInfo(chainId?: number): Promise<StakingInfo> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      return {
        totalStaked: '0',
        totalRewards: '0',
        delegations: [],
        isValidator: false,
      };
    }

    return provider.getStakingInfoComplete();
  }

  // Get trust tier info
  async getTrustTierInfo(chainId?: number): Promise<typeof TRUST_TIERS> {
    const provider = this.getProvider(chainId);
    if (!provider) {
      return TRUST_TIERS;
    }

    try {
      const info = await provider.getTrustTierInfo();
      return info || TRUST_TIERS;
    } catch (error) {
      return TRUST_TIERS;
    }
  }

  // === Utility Methods ===

  // Calculate expected rewards
  calculateExpectedRewards(
    delegationAmount: string,
    validatorFeeRate: number,
    trustMultiplier: number,
    blocksPerYear: number = 31536000 // 1 second blocks
  ): {
    daily: string;
    weekly: string;
    monthly: string;
    yearly: string;
  } {
    const amount = parseFloat(delegationAmount);
    const feePercent = validatorFeeRate / 10000;
    const netMultiplier = trustMultiplier * (1 - feePercent);

    // Approximate reward rate (based on WATTx block reward)
    const baseRewardRate = 0.08333333 / 100000; // Block reward / total stake approximation
    const annualReward = amount * baseRewardRate * blocksPerYear * netMultiplier;

    return {
      daily: (annualReward / 365).toFixed(8),
      weekly: (annualReward / 52).toFixed(8),
      monthly: (annualReward / 12).toFixed(8),
      yearly: annualReward.toFixed(8),
    };
  }

  // Calculate unbonding end time
  calculateUnbondingEndTime(
    unbondingStartHeight: number,
    currentBlockHeight: number,
    blockTimeSeconds: number = 1
  ): Date {
    const unbondingPeriod = APP_CONSTANTS.STAKING_UNBONDING_PERIOD;
    const blocksRemaining = Math.max(
      0,
      unbondingStartHeight + unbondingPeriod - currentBlockHeight
    );
    const secondsRemaining = blocksRemaining * blockTimeSeconds;

    return new Date(Date.now() + secondsRemaining * 1000);
  }

  // Get trust tier for uptime
  getTrustTierForUptime(uptime: number): {
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    multiplier: number;
    nextTier?: { tier: string; requiredUptime: number };
  } {
    if (uptime >= 99.9) {
      return { tier: 'platinum', multiplier: 2.0 };
    }
    if (uptime >= 99) {
      return {
        tier: 'gold',
        multiplier: 1.5,
        nextTier: { tier: 'platinum', requiredUptime: 99.9 },
      };
    }
    if (uptime >= 97) {
      return {
        tier: 'silver',
        multiplier: 1.25,
        nextTier: { tier: 'gold', requiredUptime: 99 },
      };
    }
    return {
      tier: 'bronze',
      multiplier: 1.0,
      nextTier: { tier: 'silver', requiredUptime: 97 },
    };
  }

  // Format fee rate for display
  formatFeeRate(feeRate: number): string {
    return `${(feeRate / 100).toFixed(2)}%`;
  }

  // Parse fee rate from percentage string
  parseFeeRate(percentString: string): number {
    const percent = parseFloat(percentString.replace('%', ''));
    return Math.round(percent * 100);
  }
}

export default WATTxStakingService.getInstance();
