import React, { useState } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { createWallet } from '../store/walletSlice';
import WalletService from '../services/wallet/WalletService';

export default function ImportWalletScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.wallet);

  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [walletName, setWalletName] = useState('');
  const [wordCount, setWordCount] = useState(0);

  const handleMnemonicChange = (text: string) => {
    setMnemonic(text);
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  };

  const handleImport = async () => {
    // Validate mnemonic
    const cleanMnemonic = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');

    if (!WalletService.validateMnemonic(cleanMnemonic)) {
      Alert.alert('Invalid Phrase', 'Please enter a valid 12 or 24 word recovery phrase.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      await dispatch(
        createWallet({
          mnemonic: cleanMnemonic,
          password,
          name: walletName || 'Imported Wallet',
        })
      ).unwrap();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to import wallet');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Import Wallet</Text>
        <Text style={styles.description}>
          Enter your 12 or 24 word recovery phrase to restore your wallet.
        </Text>

        {/* Mnemonic Input */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Recovery Phrase</Text>
            <Text style={[
              styles.wordCountBadge,
              (wordCount === 12 || wordCount === 24) && styles.wordCountValid
            ]}>
              {wordCount} words
            </Text>
          </View>
          <TextInput
            style={styles.mnemonicInput}
            placeholder="Enter your recovery phrase..."
            placeholderTextColor="#64748b"
            value={mnemonic}
            onChangeText={handleMnemonicChange}
            multiline
            numberOfLines={4}
            autoCapitalize="none"
            autoCorrect={false}
            textAlignVertical="top"
          />
        </View>

        {/* Wallet Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Wallet Name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Imported Wallet"
            placeholderTextColor="#64748b"
            value={walletName}
            onChangeText={setWalletName}
          />
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor="#64748b"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>🔒</Text>
          <Text style={styles.warningText}>
            Your recovery phrase is encrypted and stored securely on this device only.
          </Text>
        </View>

        {/* Import Button */}
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
          onPress={handleImport}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Import Wallet</Text>
          )}
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}
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
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  wordCountBadge: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  wordCountValid: {
    color: '#22c55e',
    backgroundColor: '#14532d',
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
  mnemonicInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 120,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#93c5fd',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});
