import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  fetchValidators,
  fetchStakingInfo,
  delegateStake,
  undelegateStake,
  claimRewards,
} from '../store/stakingSlice';
import { NETWORKS, TRUST_TIERS } from '../utils/constants';
import WATTxStaking from '../services/staking/WATTxStaking';

export default function StakingScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { activeChainId } = useSelector((state: RootState) => state.network);
  const {
    validators,
    myDelegations,
    totalStaked,
    totalRewards,
    isLoading,
  } = useSelector((state: RootState) => state.staking);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'validators' | 'delegations'>('validators');
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [selectedValidator, setSelectedValidator] = useState<any>(null);
  const [delegateAmount, setDelegateAmount] = useState('');

  const network = NETWORKS[activeChainId];
  const supportsStaking = network?.supportsStaking;

  useEffect(() => {
    if (supportsStaking) {
      dispatch(fetchValidators());
      dispatch(fetchStakingInfo());
    }
  }, [dispatch, activeChainId, supportsStaking]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchValidators()),
      dispatch(fetchStakingInfo()),
    ]);
    setRefreshing(false);
  };

  const handleDelegate = async () => {
    if (!selectedValidator || !delegateAmount) return;

    try {
      await dispatch(
        delegateStake({
          validatorId: selectedValidator.id,
          amount: delegateAmount,
        })
      ).unwrap();
      Alert.alert('Success', 'Delegation successful!');
      setShowDelegateModal(false);
      setDelegateAmount('');
      dispatch(fetchStakingInfo());
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleClaimRewards = async () => {
    try {
      await dispatch(claimRewards()).unwrap();
      Alert.alert('Success', 'Rewards claimed!');
      dispatch(fetchStakingInfo());
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700',
      platinum: '#e5e4e2',
    };
    return colors[tier] || '#64748b';
  };

  if (!supportsStaking) {
    return (
      <View style={styles.unsupportedContainer}>
        <Text style={styles.unsupportedIcon}>🔒</Text>
        <Text style={styles.unsupportedTitle}>Staking Not Available</Text>
        <Text style={styles.unsupportedText}>
          Staking is not supported on {network?.name || 'this network'}.
          Switch to WATTx or QTUM to access staking features.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
      }
    >
      {/* Staking Overview */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewRow}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Total Staked</Text>
            <Text style={styles.overviewValue}>
              {parseFloat(totalStaked).toFixed(2)} {network?.symbol}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Pending Rewards</Text>
            <Text style={[styles.overviewValue, styles.rewardsText]}>
              {parseFloat(totalRewards).toFixed(4)} {network?.symbol}
            </Text>
          </View>
        </View>

        {parseFloat(totalRewards) > 0 && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={handleClaimRewards}
            disabled={isLoading}
          >
            <Text style={styles.claimButtonText}>Claim All Rewards</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Trust Tiers Info */}
      <View style={styles.tiersCard}>
        <Text style={styles.tiersTitle}>Trust Tier Rewards</Text>
        <View style={styles.tiersGrid}>
          {Object.entries(TRUST_TIERS).map(([tier, info]) => (
            <View key={tier} style={styles.tierItem}>
              <View style={[styles.tierBadge, { backgroundColor: getTierColor(tier) }]}>
                <Text style={styles.tierBadgeText}>{tier.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.tierName}>{tier}</Text>
              <Text style={styles.tierMultiplier}>{info.multiplier}x</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'validators' && styles.tabActive]}
          onPress={() => setActiveTab('validators')}
        >
          <Text style={[styles.tabText, activeTab === 'validators' && styles.tabTextActive]}>
            Validators ({validators.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'delegations' && styles.tabActive]}
          onPress={() => setActiveTab('delegations')}
        >
          <Text style={[styles.tabText, activeTab === 'delegations' && styles.tabTextActive]}>
            My Delegations ({myDelegations.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'validators' ? (
        <View style={styles.list}>
          {validators.map((validator) => (
            <TouchableOpacity
              key={validator.id}
              style={styles.validatorCard}
              onPress={() => {
                setSelectedValidator(validator);
                setShowDelegateModal(true);
              }}
            >
              <View style={styles.validatorHeader}>
                <View style={styles.validatorInfo}>
                  <Text style={styles.validatorName}>{validator.name}</Text>
                  <View style={[styles.trustBadge, { backgroundColor: getTierColor(validator.trustTier) }]}>
                    <Text style={styles.trustBadgeText}>{validator.trustTier}</Text>
                  </View>
                </View>
                <Text style={styles.validatorFee}>
                  {WATTxStaking.formatFeeRate(validator.feeRate)} fee
                </Text>
              </View>

              <View style={styles.validatorStats}>
                <View style={styles.validatorStat}>
                  <Text style={styles.statLabel}>Total Stake</Text>
                  <Text style={styles.statValue}>
                    {parseFloat(validator.totalStake).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.validatorStat}>
                  <Text style={styles.statLabel}>Uptime</Text>
                  <Text style={styles.statValue}>{validator.uptime.toFixed(1)}%</Text>
                </View>
                <View style={styles.validatorStat}>
                  <Text style={styles.statLabel}>Multiplier</Text>
                  <Text style={styles.statValue}>{validator.rewardMultiplier}x</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.list}>
          {myDelegations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔒</Text>
              <Text style={styles.emptyText}>No Active Delegations</Text>
              <Text style={styles.emptySubtext}>
                Delegate to validators to earn staking rewards
              </Text>
            </View>
          ) : (
            myDelegations.map((delegation, index) => (
              <View key={index} style={styles.delegationCard}>
                <View style={styles.delegationHeader}>
                  <Text style={styles.delegationValidator}>{delegation.validatorName}</Text>
                  <View style={[styles.statusBadge, styles[`status_${delegation.status}`]]}>
                    <Text style={styles.statusText}>{delegation.status}</Text>
                  </View>
                </View>

                <View style={styles.delegationStats}>
                  <View style={styles.delegationStat}>
                    <Text style={styles.statLabel}>Delegated</Text>
                    <Text style={styles.statValue}>
                      {parseFloat(delegation.amount).toFixed(2)} {network?.symbol}
                    </Text>
                  </View>
                  <View style={styles.delegationStat}>
                    <Text style={styles.statLabel}>Rewards</Text>
                    <Text style={[styles.statValue, styles.rewardsText]}>
                      {parseFloat(delegation.pendingRewards).toFixed(4)} {network?.symbol}
                    </Text>
                  </View>
                </View>

                <View style={styles.delegationActions}>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>Add More</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]}>
                    <Text style={styles.actionBtnTextSecondary}>Undelegate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Delegate Modal */}
      <Modal
        visible={showDelegateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDelegateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delegate to Validator</Text>

            {selectedValidator && (
              <View style={styles.selectedValidator}>
                <Text style={styles.selectedValidatorName}>{selectedValidator.name}</Text>
                <Text style={styles.selectedValidatorInfo}>
                  Fee: {WATTxStaking.formatFeeRate(selectedValidator.feeRate)} |
                  Uptime: {selectedValidator.uptime.toFixed(1)}%
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount to Delegate</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#64748b"
                value={delegateAmount}
                onChangeText={setDelegateAmount}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputHint}>Minimum: 1,000 {network?.symbol}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDelegateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleDelegate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Delegate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  unsupportedContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unsupportedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  unsupportedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  unsupportedText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  overviewCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overviewItem: {},
  overviewLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
  },
  rewardsText: {
    color: '#22c55e',
  },
  claimButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 10,
  },
  claimButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tiersCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 16,
  },
  tiersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  tiersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tierItem: {
    alignItems: 'center',
  },
  tierBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tierBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  tierName: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  tierMultiplier: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  validatorCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  validatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  validatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginRight: 8,
  },
  trustBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trustBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
    textTransform: 'uppercase',
  },
  validatorFee: {
    fontSize: 14,
    color: '#94a3b8',
  },
  validatorStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  validatorStat: {},
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  delegationCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  delegationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  delegationValidator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  status_active: {
    backgroundColor: '#14532d',
  },
  status_pending: {
    backgroundColor: '#422006',
  },
  status_unbonding: {
    backgroundColor: '#7c2d12',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f8fafc',
    textTransform: 'capitalize',
  },
  delegationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  delegationStat: {},
  delegationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#475569',
  },
  actionBtnText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  actionBtnTextSecondary: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  selectedValidator: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedValidatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  selectedValidatorInfo: {
    fontSize: 14,
    color: '#94a3b8',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 16,
    borderRadius: 12,
  },
  cancelButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
