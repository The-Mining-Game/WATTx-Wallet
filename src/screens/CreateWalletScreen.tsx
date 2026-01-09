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
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { createWallet } from '../store/walletSlice';
import WalletService from '../services/wallet/WalletService';

export default function CreateWalletScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.wallet);

  const [step, setStep] = useState<'generate' | 'backup' | 'verify' | 'password'>('generate');
  const [mnemonic, setMnemonic] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [verifyIndexes, setVerifyIndexes] = useState<number[]>([]);
  const [verifyInputs, setVerifyInputs] = useState<string[]>(['', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [walletName, setWalletName] = useState('');

  useEffect(() => {
    // Generate mnemonic on mount
    const newMnemonic = WalletService.generateMnemonic();
    setMnemonic(newMnemonic);
    setWords(newMnemonic.split(' '));
  }, []);

  const handleBackupConfirm = () => {
    // Generate 3 random indexes to verify
    const indexes: number[] = [];
    while (indexes.length < 3) {
      const rand = Math.floor(Math.random() * 24);
      if (!indexes.includes(rand)) {
        indexes.push(rand);
      }
    }
    indexes.sort((a, b) => a - b);
    setVerifyIndexes(indexes);
    setStep('verify');
  };

  const handleVerify = () => {
    const isValid = verifyIndexes.every(
      (idx, i) => verifyInputs[i].toLowerCase().trim() === words[idx].toLowerCase()
    );

    if (!isValid) {
      Alert.alert('Incorrect', 'The words you entered do not match. Please try again.');
      return;
    }

    setStep('password');
  };

  const handleCreate = async () => {
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
          mnemonic,
          password,
          name: walletName || 'Main Wallet',
        })
      ).unwrap();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create wallet');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'generate':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Your Recovery Phrase</Text>
            <Text style={styles.stepDescription}>
              Write down these 24 words in order. This is the only way to recover your wallet.
            </Text>

            <View style={styles.mnemonicContainer}>
              {words.map((word, index) => (
                <View key={index} style={styles.wordItem}>
                  <Text style={styles.wordIndex}>{index + 1}</Text>
                  <Text style={styles.wordText}>{word}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setStep('backup')}
            >
              <Text style={styles.buttonText}>I've Written It Down</Text>
            </TouchableOpacity>
          </View>
        );

      case 'backup':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Backup Verification</Text>
            <Text style={styles.stepDescription}>
              Please confirm you have backed up your recovery phrase by verifying 3 random words.
            </Text>

            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                Never share your recovery phrase with anyone. Store it in a secure location.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleBackupConfirm}
            >
              <Text style={styles.buttonText}>Continue to Verify</Text>
            </TouchableOpacity>
          </View>
        );

      case 'verify':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Verify Your Backup</Text>
            <Text style={styles.stepDescription}>
              Enter the following words from your recovery phrase:
            </Text>

            {verifyIndexes.map((wordIndex, i) => (
              <View key={i} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Word #{wordIndex + 1}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter word #${wordIndex + 1}`}
                  placeholderTextColor="#64748b"
                  value={verifyInputs[i]}
                  onChangeText={(text) => {
                    const newInputs = [...verifyInputs];
                    newInputs[i] = text;
                    setVerifyInputs(newInputs);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleVerify}
            >
              <Text style={styles.buttonText}>Verify</Text>
            </TouchableOpacity>
          </View>
        );

      case 'password':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Set Password</Text>
            <Text style={styles.stepDescription}>
              Create a strong password to protect your wallet.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Wallet Name (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Main Wallet"
                placeholderTextColor="#64748b"
                value={walletName}
                onChangeText={setWalletName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

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

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Create Wallet</Text>
              )}
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress */}
        <View style={styles.progress}>
          {['generate', 'backup', 'verify', 'password'].map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                step === s && styles.progressDotActive,
                ['backup', 'verify', 'password'].indexOf(step) >= i && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        {renderStep()}
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
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  progressDotActive: {
    backgroundColor: '#6366f1',
    transform: [{ scale: 1.2 }],
  },
  progressDotCompleted: {
    backgroundColor: '#22c55e',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
  },
  mnemonicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  wordItem: {
    width: '33.33%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  wordIndex: {
    fontSize: 12,
    color: '#64748b',
    width: 20,
  },
  wordText: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#422006',
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
    color: '#fcd34d',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
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
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
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
