import { Validator, Delegation, StakingInfo } from '../../types';

interface JsonRpcRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: any[];
}

interface JsonRpcResponse<T = any> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

export class WATTxProvider {
  private rpcUrl: string;
  private requestId: number = 0;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  // Generic RPC call
  private async call<T>(method: string, params: any[] = []): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params,
    };

    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data: JsonRpcResponse<T> = await response.json();

    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }

    return data.result!;
  }

  // === Validator Operations ===

  // List all validators
  async listValidators(minFee?: number, activeOnly: boolean = true): Promise<Validator[]> {
    const params: any[] = [];
    if (minFee !== undefined) params.push(minFee);
    if (activeOnly !== undefined) params.push(activeOnly);

    const result = await this.call<any[]>('listvalidators', params);

    return result.map(v => ({
      id: v.id,
      name: v.name || `Validator ${v.id.substring(0, 8)}`,
      stake: v.stake,
      delegatedStake: v.delegatedStake || v.delegated_stake,
      totalStake: v.totalStake || v.total_stake,
      feeRate: v.feeRate || v.fee_rate,
      delegatorCount: v.delegatorCount || v.delegator_count,
      trustTier: this.getTrustTier(v.uptime),
      uptime: v.uptime,
      rewardMultiplier: v.rewardMultiplier || v.reward_multiplier || 1.0,
      isActive: v.active || v.isActive,
    }));
  }

  // Get specific validator
  async getValidator(validatorId: string): Promise<Validator | null> {
    try {
      const result = await this.call<any>('getvalidator', [validatorId]);

      return {
        id: result.id,
        name: result.name || `Validator ${result.id.substring(0, 8)}`,
        stake: result.stake,
        delegatedStake: result.delegatedStake || result.delegated_stake,
        totalStake: result.totalStake || result.total_stake,
        feeRate: result.feeRate || result.fee_rate,
        delegatorCount: result.delegatorCount || result.delegator_count,
        trustTier: this.getTrustTier(result.uptime),
        uptime: result.uptime,
        rewardMultiplier: result.rewardMultiplier || result.reward_multiplier || 1.0,
        isActive: result.active || result.isActive,
      };
    } catch (error) {
      console.error('Failed to get validator:', error);
      return null;
    }
  }

  // Get validator stats
  async getValidatorStats(): Promise<any> {
    return this.call('getvalidatorstats');
  }

  // Register as validator
  async registerValidator(feeRate: number = 500, name?: string): Promise<string> {
    const params: any[] = [feeRate];
    if (name) params.push(name);

    return this.call<string>('registervalidator', params);
  }

  // Set validator pool fee
  async setValidatorPoolFee(feeRate: number): Promise<string> {
    return this.call<string>('setvalidatorpoolfee', [feeRate]);
  }

  // Get my validator info
  async getMyValidator(): Promise<Validator | null> {
    try {
      const result = await this.call<any>('getmyvalidator');

      return {
        id: result.id,
        name: result.name || 'My Validator',
        stake: result.stake,
        delegatedStake: result.delegatedStake || result.delegated_stake,
        totalStake: result.totalStake || result.total_stake,
        feeRate: result.feeRate || result.fee_rate,
        delegatorCount: result.delegatorCount || result.delegator_count,
        trustTier: this.getTrustTier(result.uptime),
        uptime: result.uptime,
        rewardMultiplier: result.rewardMultiplier || result.reward_multiplier || 1.0,
        isActive: result.active || result.isActive,
      };
    } catch (error) {
      return null;
    }
  }

  // === Delegation Operations ===

  // Delegate stake
  async delegateStake(validatorId: string, amount: string): Promise<string> {
    return this.call<string>('delegatestake', [validatorId, parseFloat(amount)]);
  }

  // Undelegate stake
  async undelegateStake(validatorId: string, amount?: string): Promise<string> {
    const params: any[] = [validatorId];
    if (amount) params.push(parseFloat(amount));

    return this.call<string>('undelegatestake', params);
  }

  // Get my delegations
  async getMyDelegations(): Promise<Delegation[]> {
    const result = await this.call<any[]>('getmydelegations');

    return result.map(d => ({
      validatorId: d.validatorId || d.validator_id,
      validatorName: d.validatorName || d.validator_name || `Validator ${(d.validatorId || d.validator_id).substring(0, 8)}`,
      amount: d.amount,
      pendingRewards: d.pendingRewards || d.pending_rewards || '0',
      status: this.getDelegationStatus(d.status),
      delegationHeight: d.delegationHeight || d.delegation_height,
      lastRewardHeight: d.lastRewardHeight || d.last_reward_height,
      unbondingStartHeight: d.unbondingStartHeight || d.unbonding_start_height,
    }));
  }

  // List delegations for a key
  async listDelegations(keyId: string, type?: string): Promise<Delegation[]> {
    const params: any[] = [keyId];
    if (type) params.push(type);

    const result = await this.call<any[]>('listdelegations', params);

    return result.map(d => ({
      validatorId: d.validatorId || d.validator_id,
      validatorName: d.validatorName || d.validator_name,
      amount: d.amount,
      pendingRewards: d.pendingRewards || d.pending_rewards || '0',
      status: this.getDelegationStatus(d.status),
      delegationHeight: d.delegationHeight || d.delegation_height,
      lastRewardHeight: d.lastRewardHeight || d.last_reward_height,
      unbondingStartHeight: d.unbondingStartHeight || d.unbonding_start_height,
    }));
  }

  // Claim rewards
  async claimRewards(validatorId?: string): Promise<string> {
    const params: any[] = validatorId ? [validatorId] : [];
    return this.call<string>('claimrewards', params);
  }

  // Get pending rewards
  async getPendingRewards(delegatorId: string): Promise<string> {
    return this.call<string>('getpendingrewards', [delegatorId]);
  }

  // === Trust Tier ===

  // Get trust tier info
  async getTrustTierInfo(): Promise<any> {
    return this.call('gettrusttierinfo');
  }

  // === Contract Operations (EVM) ===

  // Call contract (read-only)
  async callContract(
    address: string,
    data: string,
    senderAddress?: string,
    gasLimit?: number,
    amount?: number
  ): Promise<any> {
    const params: any[] = [address, data];
    if (senderAddress) params.push(senderAddress);
    if (gasLimit) params.push(gasLimit);
    if (amount) params.push(amount);

    return this.call('callcontract', params);
  }

  // Create contract
  async createContract(
    bytecode: string,
    gasLimit?: number,
    gasPrice?: number,
    senderAddress?: string
  ): Promise<any> {
    const params: any[] = [bytecode];
    if (gasLimit) params.push(gasLimit);
    if (gasPrice) params.push(gasPrice);
    if (senderAddress) params.push(senderAddress);

    return this.call('createcontract', params);
  }

  // Send to contract (state-changing)
  async sendToContract(
    contractAddress: string,
    data: string,
    amount?: number,
    gasLimit?: number,
    gasPrice?: number,
    senderAddress?: string
  ): Promise<any> {
    const params: any[] = [contractAddress, data];
    if (amount !== undefined) params.push(amount);
    if (gasLimit) params.push(gasLimit);
    if (gasPrice) params.push(gasPrice);
    if (senderAddress) params.push(senderAddress);

    return this.call('sendtocontract', params);
  }

  // === Token Operations (QRC20) ===

  // Get QRC20 token name
  async getTokenName(tokenAddress: string): Promise<string> {
    return this.call<string>('qrc20name', [tokenAddress]);
  }

  // Get QRC20 token symbol
  async getTokenSymbol(tokenAddress: string): Promise<string> {
    return this.call<string>('qrc20symbol', [tokenAddress]);
  }

  // Get QRC20 token decimals
  async getTokenDecimals(tokenAddress: string): Promise<number> {
    return this.call<number>('qrc20decimals', [tokenAddress]);
  }

  // Get QRC20 token total supply
  async getTokenTotalSupply(tokenAddress: string): Promise<string> {
    return this.call<string>('qrc20totalsupply', [tokenAddress]);
  }

  // Get QRC20 token balance
  async getTokenBalance(tokenAddress: string, address: string): Promise<string> {
    return this.call<string>('qrc20balanceof', [tokenAddress, address]);
  }

  // Transfer QRC20 tokens
  async transferTokens(
    tokenAddress: string,
    to: string,
    amount: string
  ): Promise<string> {
    return this.call<string>('qrc20transfer', [tokenAddress, to, amount]);
  }

  // === Standard Wallet Operations ===

  // Get balance
  async getBalance(): Promise<string> {
    return this.call<string>('getbalance');
  }

  // Get new address
  async getNewAddress(label?: string): Promise<string> {
    const params: any[] = label ? [label] : [];
    return this.call<string>('getnewaddress', params);
  }

  // Send to address
  async sendToAddress(
    address: string,
    amount: number,
    comment?: string
  ): Promise<string> {
    const params: any[] = [address, amount];
    if (comment) params.push(comment);

    return this.call<string>('sendtoaddress', params);
  }

  // Get transaction
  async getTransaction(txid: string): Promise<any> {
    return this.call('gettransaction', [txid]);
  }

  // List transactions
  async listTransactions(count?: number, skip?: number): Promise<any[]> {
    const params: any[] = ['*'];
    if (count) params.push(count);
    if (skip) params.push(skip);

    return this.call<any[]>('listtransactions', params);
  }

  // Get staking info
  async getStakingInfo(): Promise<any> {
    return this.call('getstakinginfo');
  }

  // === Helper Methods ===

  private getTrustTier(uptime: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (uptime >= 99.9) return 'platinum';
    if (uptime >= 99) return 'gold';
    if (uptime >= 97) return 'silver';
    return 'bronze';
  }

  private getDelegationStatus(status: number | string): 'pending' | 'active' | 'unbonding' | 'withdrawn' {
    const statusMap: Record<number, 'pending' | 'active' | 'unbonding' | 'withdrawn'> = {
      0: 'pending',
      1: 'active',
      2: 'unbonding',
      3: 'withdrawn',
    };

    if (typeof status === 'number') {
      return statusMap[status] || 'pending';
    }

    return status as any || 'pending';
  }

  // Get complete staking info for user
  async getStakingInfoComplete(): Promise<StakingInfo> {
    const [delegations, validatorInfo, stakingInfo] = await Promise.all([
      this.getMyDelegations().catch(() => []),
      this.getMyValidator().catch(() => null),
      this.getStakingInfo().catch(() => ({})),
    ]);

    const totalStaked = delegations.reduce(
      (sum, d) => sum + parseFloat(d.amount),
      0
    ).toString();

    const totalRewards = delegations.reduce(
      (sum, d) => sum + parseFloat(d.pendingRewards),
      0
    ).toString();

    return {
      totalStaked,
      totalRewards,
      delegations,
      isValidator: !!validatorInfo,
      validatorInfo: validatorInfo || undefined,
    };
  }
}

export default WATTxProvider;
