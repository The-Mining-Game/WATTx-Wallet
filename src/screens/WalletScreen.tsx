import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchBalances } from '../store/walletSlice';
import { NETWORKS } from '../utils/constants';

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentAccount, balances, tokens } = useSelector((state: RootState) => state.wallet);
  const { activeChainId } = useSelector((state: RootState) => state.network);

  const [refreshing, setRefreshing] = useState(false);

  const network = NETWORKS[activeChainId];
  const address = currentAccount?.wallets[activeChainId]?.address;
  const balance = balances[activeChainId] || '0';

  useEffect(() => {
    dispatch(fetchBalances());
  }, [dispatch, activeChainId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchBalances());
    setRefreshing(false);
  };

  const copyAddress = () => {
    if (address) {
      Clipboard.setString(address);
      Alert.alert('Copied', 'Address copied to clipboard');
    }
  };

  const formatBalance = (bal: string): string => {
    const num = parseFloat(bal);
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    return num.toFixed(4);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
      }
    >
      {/* Network Selector */}
      <TouchableOpacity
        style={styles.networkSelector}
        onPress={() => navigation.navigate('Networks')}
      >
        <View style={[styles.networkDot, { backgroundColor: network?.isTestnet ? '#fbbf24' : '#22c55e' }]} />
        <Text style={styles.networkName}>{network?.name || 'Select Network'}</Text>
        <Text style={styles.networkArrow}>▼</Text>
      </TouchableOpacity>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceValue}>
          {formatBalance(balance)} {network?.symbol}
        </Text>
        {/* TODO: Add USD value */}
        <Text style={styles.balanceUsd}>≈ $0.00 USD</Text>

        {/* Address */}
        <TouchableOpacity style={styles.addressContainer} onPress={copyAddress}>
          <Text style={styles.addressText} numberOfLines={1}>
            {address ? `${address.substring(0, 12)}...${address.substring(address.length - 10)}` : 'No address'}
          </Text>
          <Text style={styles.copyIcon}>📋</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Send')}
        >
          <Text style={styles.actionIcon}>↑</Text>
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Receive')}
        >
          <Text style={styles.actionIcon}>↓</Text>
          <Text style={styles.actionText}>Receive</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Main', { screen: 'Staking' })}
        >
          <Text style={styles.actionIcon}>🔒</Text>
          <Text style={styles.actionText}>Stake</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Inscriptions')}
        >
          <Text style={styles.actionIcon}>📜</Text>
          <Text style={styles.actionText}>Inscriptions</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => {
              if (network?.explorerUrl && address) {
                navigation.navigate('Main', {
                  screen: 'Browser',
                  params: { url: `${network.explorerUrl}/address/${address}` },
                });
              }
            }}
          >
            <Text style={styles.quickLinkIcon}>🔍</Text>
            <Text style={styles.quickLinkText}>View on Explorer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('Main', { screen: 'Browser' })}
          >
            <Text style={styles.quickLinkIcon}>⚡</Text>
            <Text style={styles.quickLinkText}>WATTxChange DeFi</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tokens Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tokens</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>+ Add Token</Text>
          </TouchableOpacity>
        </View>

        {tokens.filter(t => t.chainId === activeChainId).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🪙</Text>
            <Text style={styles.emptyText}>No tokens found</Text>
            <Text style={styles.emptySubtext}>Add tokens to track your portfolio</Text>
          </View>
        ) : (
          tokens
            .filter(t => t.chainId === activeChainId)
            .map((token, index) => (
              <View key={index} style={styles.tokenItem}>
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                  <Text style={styles.tokenName}>{token.name}</Text>
                </View>
                <View style={styles.tokenBalance}>
                  <Text style={styles.tokenAmount}>{token.balance || '0'}</Text>
                </View>
              </View>
            ))
        )}
      </View>

      {/* Network Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Info</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Chain ID</Text>
            <Text style={styles.infoValue}>{activeChainId}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Symbol</Text>
            <Text style={styles.infoValue}>{network?.symbol}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{network?.isTestnet ? 'Testnet' : 'Mainnet'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>EIP-1559</Text>
            <Text style={styles.infoValue}>{network?.supportsEIP1559 ? 'Yes' : 'No'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  networkSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  networkName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  networkArrow: {
    color: '#64748b',
    marginLeft: 8,
    fontSize: 10,
  },
  balanceCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    color: '#f8fafc',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  balanceUsd: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 16,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  addressText: {
    color: '#94a3b8',
    fontSize: 14,
    marginRight: 8,
  },
  copyIcon: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 80,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionAction: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  quickLinks: {
    flexDirection: 'row',
    gap: 12,
  },
  quickLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
  },
  quickLinkIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  quickLinkText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 14,
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  tokenInfo: {},
  tokenSymbol: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  tokenName: {
    color: '#64748b',
    fontSize: 12,
  },
  tokenBalance: {},
  tokenAmount: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    width: '50%',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
  },
});
