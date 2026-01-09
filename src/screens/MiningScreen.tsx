import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  initializeMining,
  startMining,
  stopMining,
  updateMiningConfig,
  fetchMiningStats,
} from '../store/miningSlice';
import { NETWORKS } from '../utils/constants';
import MiningService from '../services/mining/MiningService';

export default function MiningScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { activeChainId } = useSelector((state: RootState) => state.network);
  const {
    isEnabled,
    config,
    pools,
    currentPoolId,
    stats,
    isLoading,
  } = useSelector((state: RootState) => state.mining);

  const [showPoolModal, setShowPoolModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

  const network = NETWORKS[activeChainId];
  const supportsMining = network?.supportsMining;

  useEffect(() => {
    dispatch(initializeMining());
  }, [dispatch]);

  useEffect(() => {
    if (isEnabled) {
      const interval = setInterval(() => {
        dispatch(fetchMiningStats());
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [dispatch, isEnabled]);

  const handleToggleMining = async () => {
    if (isEnabled) {
      await dispatch(stopMining());
    } else {
      if (!currentPoolId) {
        Alert.alert('Select Pool', 'Please select a mining pool first.');
        setShowPoolModal(true);
        return;
      }
      await dispatch(startMining(currentPoolId));
    }
  };

  const handleSelectPool = async (poolId: string) => {
    setSelectedPoolId(poolId);
    await dispatch(updateMiningConfig({ poolId }));
    setShowPoolModal(false);

    if (isEnabled) {
      await dispatch(stopMining());
      await dispatch(startMining(poolId));
    }
  };

  const handleUpdateThreads = async (threads: number) => {
    await dispatch(updateMiningConfig({ threadCount: threads }));
  };

  const { value: hashrateValue, unit: hashrateUnit } = MiningService.formatHashrate(stats.hashrate);
  const currentPool = pools.find(p => p.id === currentPoolId);

  return (
    <ScrollView style={styles.container}>
      {/* Mining Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View>
            <Text style={styles.statusTitle}>Mining Status</Text>
            <Text style={[styles.statusText, isEnabled && styles.statusActive]}>
              {isEnabled ? 'Active' : 'Stopped'}
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggleMining}
            trackColor={{ false: '#334155', true: '#4ade80' }}
            thumbColor="#ffffff"
            disabled={isLoading}
          />
        </View>

        {isEnabled && (
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{hashrateValue}</Text>
              <Text style={styles.statLabel}>{hashrateUnit}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.sharesAccepted}</Text>
              <Text style={styles.statLabel}>Accepted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.sharesRejected}</Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.earnings}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>
        )}

        {stats.temperature && (
          <View style={styles.tempWarning}>
            <Text style={styles.tempIcon}>🌡️</Text>
            <Text style={styles.tempText}>
              Device Temperature: {stats.temperature}°C
            </Text>
          </View>
        )}
      </View>

      {/* Pool Selection */}
      <TouchableOpacity
        style={styles.poolSelector}
        onPress={() => setShowPoolModal(true)}
      >
        <View style={styles.poolInfo}>
          <Text style={styles.poolLabel}>Mining Pool</Text>
          <Text style={styles.poolName}>
            {currentPool?.name || 'Select a pool'}
          </Text>
          {currentPool && (
            <Text style={styles.poolDetails}>
              {currentPool.algorithm} | {currentPool.fee}% fee
            </Text>
          )}
        </View>
        <Text style={styles.poolArrow}>▶</Text>
      </TouchableOpacity>

      {/* Mining Settings */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Mining Settings</Text>

        {/* Thread Count */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>CPU Threads</Text>
          <View style={styles.threadSelector}>
            {[1, 2, 3, 4].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.threadButton,
                  config.threadCount === num && styles.threadButtonActive,
                ]}
                onPress={() => handleUpdateThreads(num)}
              >
                <Text
                  style={[
                    styles.threadButtonText,
                    config.threadCount === num && styles.threadButtonTextActive,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Intensity Slider (simplified) */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Intensity: {config.intensity}%</Text>
          <View style={styles.intensityBar}>
            <View style={[styles.intensityFill, { width: `${config.intensity}%` }]} />
          </View>
        </View>

        {/* Background Mining */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Background Mining</Text>
          <Switch
            value={config.backgroundMining}
            onValueChange={(value) =>
              dispatch(updateMiningConfig({ backgroundMining: value }))
            }
            trackColor={{ false: '#334155', true: '#4ade80' }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Thermal Limit */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>
            Thermal Limit: {config.thermalLimit}°C
          </Text>
        </View>

        {/* Battery Limit */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>
            Stop at Battery: {config.batteryLimit}%
          </Text>
        </View>
      </View>

      {/* Mining Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>About Mobile Mining</Text>
        <Text style={styles.infoText}>
          Mining on mobile devices is primarily for educational purposes.
          Due to limited computing power, earnings will be minimal.
          Monitor device temperature and battery usage carefully.
        </Text>
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Extended mining may cause increased battery wear and device heat.
          </Text>
        </View>
      </View>

      {/* Pool Selection Modal */}
      <Modal
        visible={showPoolModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPoolModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Mining Pool</Text>
              <TouchableOpacity onPress={() => setShowPoolModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.poolList}>
              {pools.map((pool) => (
                <TouchableOpacity
                  key={pool.id}
                  style={[
                    styles.poolItem,
                    currentPoolId === pool.id && styles.poolItemActive,
                  ]}
                  onPress={() => handleSelectPool(pool.id)}
                >
                  <View style={styles.poolItemInfo}>
                    <Text style={styles.poolItemName}>{pool.name}</Text>
                    <Text style={styles.poolItemDetails}>
                      {pool.coin} | {pool.algorithm} | {pool.fee}% fee
                    </Text>
                  </View>
                  {currentPoolId === pool.id && (
                    <Text style={styles.poolItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.addPoolButton}>
              <Text style={styles.addPoolButtonText}>+ Add Custom Pool</Text>
            </TouchableOpacity>
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
  statusCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
  },
  statusActive: {
    color: '#22c55e',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  tempWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#422006',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  tempIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  tempText: {
    color: '#fcd34d',
    fontSize: 14,
  },
  poolSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  poolInfo: {},
  poolLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  poolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  poolDetails: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  poolArrow: {
    color: '#64748b',
    fontSize: 16,
  },
  settingsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  threadSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  threadButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  threadButtonActive: {
    backgroundColor: '#6366f1',
  },
  threadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  threadButtonTextActive: {
    color: '#ffffff',
  },
  intensityBar: {
    width: 100,
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  intensityFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 12,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#422006',
    padding: 12,
    borderRadius: 8,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#fcd34d',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  modalClose: {
    fontSize: 24,
    color: '#64748b',
  },
  poolList: {
    maxHeight: 400,
  },
  poolItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  poolItemActive: {
    backgroundColor: '#0f172a',
  },
  poolItemInfo: {},
  poolItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  poolItemDetails: {
    fontSize: 12,
    color: '#64748b',
  },
  poolItemCheck: {
    fontSize: 20,
    color: '#22c55e',
  },
  addPoolButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  addPoolButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6366f1',
    textAlign: 'center',
  },
});
