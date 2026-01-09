import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { NETWORKS } from '../utils/constants';
import NetworkManager from '../services/blockchain/NetworkManager';

export default function SendScreen() {
  const navigation = useNavigation<any>();
  const { activeChainId } = useSelector((state: RootState) => state.network);
  const { currentAccount, balances } = useSelector((state: RootState) => state.wallet);

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [gasPrice, setGasPrice] = useState<'low' | 'medium' | 'high'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<any>(null);

  const network = NETWORKS[activeChainId];
  const balance = balances[activeChainId] || '0';
  const address = currentAccount?.wallets[activeChainId]?.address;

  useEffect(() => {
    fetchGasEstimate();
  }, [activeChainId]);

  const fetchGasEstimate = async () => {
    try {
      const estimate = await NetworkManager.estimateGas({
        to: '0x0000000000000000000000000000000000000000',
        value: '0',
      }, activeChainId);
      setEstimatedGas(estimate);
    } catch (error) {
      console.error('Failed to estimate gas:', error);
    }
  };

  const validateAddress = (addr: string): boolean => {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleMaxAmount = () => {
    // Set max balance minus estimated gas
    const maxAmount = parseFloat(balance);
    if (maxAmount > 0) {
      setAmount(maxAmount.toFixed(8));
    }
  };

  const handleSend = async () => {
    if (!recipient) {
      Alert.alert('Error', 'Please enter a recipient address');
      return;
    }

    if (!validateAddress(recipient)) {
      Alert.alert('Error', 'Invalid recipient address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(balance)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setIsLoading(true);

    // TODO: Implement actual transaction sending
    // This would require:
    // 1. Password prompt to get private key
    // 2. Sign transaction
    // 3. Broadcast transaction
    // 4. Wait for confirmation

    Alert.alert(
      'Confirm Transaction',
      `Send ${amount} ${network?.symbol} to ${recipient.substring(0, 10)}...?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setIsLoading(false) },
        {
          text: 'Confirm',
          onPress: async () => {
            // Simulate transaction
            setTimeout(() => {
              setIsLoading(false);
              Alert.alert('Success', 'Transaction sent!', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            }, 2000);
          },
        },
      ]
    );
  };

  const getGasFee = () => {
    if (!estimatedGas) return '0';
    const selectedGas = estimatedGas[gasPrice];
    if (selectedGas?.maxFeePerGas) {
      return (parseInt(selectedGas.maxFeePerGas) / 1e18 * 21000).toFixed(6);
    }
    if (selectedGas?.gasPrice) {
      return (parseInt(selectedGas.gasPrice) / 1e18 * 21000).toFixed(6);
    }
    return '0';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* From */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>From</Text>
          <View style={styles.fromCard}>
            <Text style={styles.fromAddress} numberOfLines={1}>
              {address}
            </Text>
            <Text style={styles.fromBalance}>
              Balance: {parseFloat(balance).toFixed(4)} {network?.symbol}
            </Text>
          </View>
        </View>

        {/* To */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>To</Text>
          <TextInput
            style={styles.input}
            placeholder="Recipient address (0x...)"
            placeholderTextColor="#64748b"
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <View style={styles.amountHeader}>
            <Text style={styles.sectionLabel}>Amount</Text>
            <TouchableOpacity onPress={handleMaxAmount}>
              <Text style={styles.maxButton}>MAX</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.amountContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#64748b"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <Text style={styles.amountSymbol}>{network?.symbol}</Text>
          </View>
        </View>

        {/* Gas Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Network Fee</Text>
          <View style={styles.gasOptions}>
            {(['low', 'medium', 'high'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.gasOption,
                  gasPrice === option && styles.gasOptionActive,
                ]}
                onPress={() => setGasPrice(option)}
              >
                <Text style={[
                  styles.gasOptionLabel,
                  gasPrice === option && styles.gasOptionLabelActive,
                ]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
                <Text style={[
                  styles.gasOptionTime,
                  gasPrice === option && styles.gasOptionTimeActive,
                ]}>
                  ~{estimatedGas?.[option]?.estimatedTime || 60}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.gasEstimate}>
            Estimated fee: {getGasFee()} {network?.symbol}
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>{amount || '0'} {network?.symbol}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Network Fee</Text>
            <Text style={styles.summaryValue}>{getGasFee()} {network?.symbol}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              {(parseFloat(amount || '0') + parseFloat(getGasFee())).toFixed(6)} {network?.symbol}
            </Text>
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  fromCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  fromAddress: {
    fontSize: 14,
    color: '#f8fafc',
    marginBottom: 4,
  },
  fromBalance: {
    fontSize: 12,
    color: '#64748b',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  maxButton: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  amountInput: {
    flex: 1,
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#f8fafc',
  },
  amountSymbol: {
    paddingRight: 16,
    fontSize: 16,
    color: '#64748b',
  },
  gasOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  gasOption: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  gasOptionActive: {
    borderColor: '#6366f1',
    backgroundColor: '#312e81',
  },
  gasOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 4,
  },
  gasOptionLabelActive: {
    color: '#f8fafc',
  },
  gasOptionTime: {
    fontSize: 12,
    color: '#64748b',
  },
  gasOptionTimeActive: {
    color: '#a5b4fc',
  },
  gasEstimate: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  summary: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  summaryValue: {
    fontSize: 14,
    color: '#f8fafc',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginTop: 8,
    paddingTop: 16,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  sendButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
