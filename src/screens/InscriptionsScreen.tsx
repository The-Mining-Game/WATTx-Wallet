import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { NETWORKS } from '../utils/constants';
import InscriptionsService from '../services/inscriptions/InscriptionsService';
import { Inscription, BRC20Token } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function InscriptionsScreen() {
  const { activeChainId } = useSelector((state: RootState) => state.network);
  const { currentAccount } = useSelector((state: RootState) => state.wallet);

  const [activeTab, setActiveTab] = useState<'ordinals' | 'brc20'>('ordinals');
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [brc20Tokens, setBrc20Tokens] = useState<BRC20Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const network = NETWORKS[activeChainId];
  const address = currentAccount?.wallets[activeChainId]?.address;
  const supportsInscriptions = InscriptionsService.supportsInscriptions(activeChainId);

  useEffect(() => {
    if (supportsInscriptions && address) {
      loadData();
    }
  }, [activeChainId, address, supportsInscriptions]);

  const loadData = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const [inscriptionsData, brc20Data] = await Promise.all([
        InscriptionsService.getInscriptions(address, activeChainId),
        InscriptionsService.getBRC20Balances(address, activeChainId),
      ]);

      setInscriptions(inscriptionsData.inscriptions);
      setBrc20Tokens(brc20Data);
    } catch (error) {
      console.error('Failed to load inscriptions:', error);
    }
    setIsLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!supportsInscriptions) {
    return (
      <View style={styles.unsupportedContainer}>
        <Text style={styles.unsupportedIcon}>📜</Text>
        <Text style={styles.unsupportedTitle}>Inscriptions Not Available</Text>
        <Text style={styles.unsupportedText}>
          Inscriptions are not supported on {network?.name || 'this network'}.
          Switch to a supported chain to view ordinals and BRC-20 tokens.
        </Text>
      </View>
    );
  }

  const renderOrdinals = () => (
    <View style={styles.grid}>
      {inscriptions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyText}>No Inscriptions Found</Text>
          <Text style={styles.emptySubtext}>
            Your ordinals and inscriptions will appear here
          </Text>
        </View>
      ) : (
        inscriptions.map((inscription) => (
          <TouchableOpacity
            key={inscription.id}
            style={styles.inscriptionCard}
          >
            {inscription.contentType?.startsWith('image/') ? (
              <Image
                source={{ uri: inscription.preview }}
                style={styles.inscriptionImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.inscriptionPlaceholder}>
                <Text style={styles.placeholderIcon}>📄</Text>
                <Text style={styles.placeholderType}>
                  {inscription.contentType?.split('/')[1] || 'unknown'}
                </Text>
              </View>
            )}
            <View style={styles.inscriptionInfo}>
              <Text style={styles.inscriptionNumber}>
                {InscriptionsService.formatInscriptionNumber(inscription.number)}
              </Text>
              <Text style={styles.inscriptionType} numberOfLines={1}>
                {inscription.contentType}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderBRC20 = () => (
    <View style={styles.tokenList}>
      {brc20Tokens.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🪙</Text>
          <Text style={styles.emptyText}>No BRC-20 Tokens</Text>
          <Text style={styles.emptySubtext}>
            Your BRC-20 token balances will appear here
          </Text>
        </View>
      ) : (
        brc20Tokens.map((token, index) => (
          <View key={index} style={styles.tokenCard}>
            <View style={styles.tokenHeader}>
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenBadgeText}>{token.ticker}</Text>
              </View>
              <Text style={styles.tokenBalance}>
                {parseFloat(token.balance).toLocaleString()}
              </Text>
            </View>
            <View style={styles.tokenDetails}>
              <View style={styles.tokenDetail}>
                <Text style={styles.detailLabel}>Available</Text>
                <Text style={styles.detailValue}>
                  {parseFloat(token.availableBalance).toLocaleString()}
                </Text>
              </View>
              <View style={styles.tokenDetail}>
                <Text style={styles.detailLabel}>Transferable</Text>
                <Text style={styles.detailValue}>
                  {parseFloat(token.transferableBalance).toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.tokenActions}>
              <TouchableOpacity style={styles.tokenAction}>
                <Text style={styles.tokenActionText}>Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tokenAction, styles.tokenActionSecondary]}>
                <Text style={styles.tokenActionTextSecondary}>History</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Inscriptions</Text>
        <Text style={styles.subtitle}>
          View your ordinals, inscriptions, and BRC-20 tokens
        </Text>
      </View>

      {/* Network Badge */}
      <View style={styles.networkBadge}>
        <Text style={styles.networkText}>
          {network?.name} {network?.inscriptionType && `(${network.inscriptionType})`}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ordinals' && styles.tabActive]}
          onPress={() => setActiveTab('ordinals')}
        >
          <Text style={[styles.tabText, activeTab === 'ordinals' && styles.tabTextActive]}>
            Ordinals ({inscriptions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'brc20' && styles.tabActive]}
          onPress={() => setActiveTab('brc20')}
        >
          <Text style={[styles.tabText, activeTab === 'brc20' && styles.tabTextActive]}>
            BRC-20 ({brc20Tokens.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading inscriptions...</Text>
        </View>
      ) : activeTab === 'ordinals' ? (
        renderOrdinals()
      ) : (
        renderBRC20()
      )}
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
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  networkBadge: {
    marginHorizontal: 16,
    marginBottom: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  networkText: {
    fontSize: 12,
    color: '#94a3b8',
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
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#94a3b8',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  inscriptionCard: {
    width: CARD_WIDTH,
    margin: 6,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
  },
  inscriptionImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#0f172a',
  },
  inscriptionPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  placeholderType: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  inscriptionInfo: {
    padding: 12,
  },
  inscriptionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  inscriptionType: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    width: '100%',
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
    textAlign: 'center',
  },
  tokenList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  tokenCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tokenBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  tokenBalance: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  tokenDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tokenDetail: {},
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f8fafc',
  },
  tokenActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tokenAction: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tokenActionSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#475569',
  },
  tokenActionText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  tokenActionTextSecondary: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
});
