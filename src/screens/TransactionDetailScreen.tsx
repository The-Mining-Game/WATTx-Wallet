import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { NETWORKS } from '../utils/constants';

export default function TransactionDetailScreen() {
  const route = useRoute<any>();
  const { transaction } = route.params || {};
  const { activeChainId } = useSelector((state: RootState) => state.network);

  const network = NETWORKS[activeChainId];

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const openExplorer = () => {
    if (network?.explorerUrl && transaction?.hash) {
      Linking.openURL(`${network.explorerUrl}/tx/${transaction.hash}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#22c55e';
      case 'pending':
        return '#fbbf24';
      case 'failed':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const formatValue = (value: string) => {
    const num = parseFloat(value);
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    return num.toFixed(6);
  };

  if (!transaction) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No transaction data</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(transaction.status) + '20' },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(transaction.status) },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(transaction.status) },
              ]}
            >
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Text>
          </View>

          <Text style={styles.amount}>
            {transaction.from === transaction.to ? '' : '-'}
            {formatValue(transaction.value)} {network?.symbol}
          </Text>

          {transaction.timestamp && (
            <Text style={styles.timestamp}>
              {new Date(transaction.timestamp).toLocaleString()}
            </Text>
          )}
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Transaction Details</Text>

          <DetailRow
            label="Transaction Hash"
            value={transaction.hash}
            onCopy={() => copyToClipboard(transaction.hash, 'Transaction hash')}
          />

          <DetailRow
            label="From"
            value={transaction.from}
            onCopy={() => copyToClipboard(transaction.from, 'From address')}
          />

          <DetailRow
            label="To"
            value={transaction.to}
            onCopy={() => copyToClipboard(transaction.to, 'To address')}
          />

          {transaction.blockNumber && (
            <DetailRow
              label="Block Number"
              value={transaction.blockNumber.toString()}
            />
          )}

          <DetailRow
            label="Nonce"
            value={transaction.nonce.toString()}
          />
        </View>

        {/* Gas Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Gas Information</Text>

          {transaction.gasPrice && (
            <DetailRow
              label="Gas Price"
              value={`${parseInt(transaction.gasPrice) / 1e9} Gwei`}
            />
          )}

          {transaction.maxFeePerGas && (
            <DetailRow
              label="Max Fee Per Gas"
              value={`${parseInt(transaction.maxFeePerGas) / 1e9} Gwei`}
            />
          )}

          <DetailRow
            label="Gas Limit"
            value={transaction.gasLimit}
          />

          {transaction.gasUsed && (
            <DetailRow
              label="Gas Used"
              value={transaction.gasUsed}
            />
          )}
        </View>

        {/* Input Data */}
        {transaction.data && transaction.data !== '0x' && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Input Data</Text>
            <View style={styles.dataContainer}>
              <Text style={styles.dataText} numberOfLines={10}>
                {transaction.data}
              </Text>
            </View>
          </View>
        )}

        {/* Explorer Button */}
        <TouchableOpacity style={styles.explorerButton} onPress={openExplorer}>
          <Text style={styles.explorerButtonText}>View on Explorer</Text>
          <Text style={styles.explorerButtonIcon}>↗</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.detailValueContainer}
        onPress={onCopy}
        disabled={!onCopy}
      >
        <Text style={styles.detailValue} numberOfLines={1}>
          {value}
        </Text>
        {onCopy && <Text style={styles.copyIcon}>📋</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 14,
    color: '#64748b',
  },
  detailsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailValue: {
    fontSize: 14,
    color: '#f8fafc',
    flex: 1,
    fontFamily: 'monospace',
  },
  copyIcon: {
    fontSize: 14,
    marginLeft: 8,
  },
  dataContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
  },
  dataText: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  explorerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  explorerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  explorerButtonIcon: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 8,
  },
});
