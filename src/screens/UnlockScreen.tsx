import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { unlockWallet } from '../store/walletSlice';
import KeychainService from '../services/wallet/KeychainService';

export default function UnlockScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.wallet);

  const [password, setPassword] = useState('');
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const biometryType = await KeychainService.getBiometryType();
    setBiometricsAvailable(!!biometryType);

    const enabled = await KeychainService.isBiometricsEnabled();
    setBiometricsEnabled(enabled);

    // Auto-prompt biometrics if enabled
    if (enabled) {
      handleBiometricUnlock();
    }
  };

  const handleUnlock = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      await dispatch(unlockWallet(password)).unwrap();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Invalid password');
    }
  };

  const handleBiometricUnlock = async () => {
    try {
      const storedPassword = await KeychainService.authenticateWithBiometrics();
      if (storedPassword) {
        await dispatch(unlockWallet(storedPassword)).unwrap();
      }
    } catch (err: any) {
      console.log('Biometric auth failed or cancelled');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>⚡</Text>
          <Text style={styles.title}>WATTx Wallet</Text>
          <Text style={styles.subtitle}>Enter your password to unlock</Text>
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onSubmitEditing={handleUnlock}
            returnKeyType="done"
          />
        </View>

        {/* Unlock Button */}
        <TouchableOpacity
          style={[styles.unlockButton, isLoading && styles.buttonDisabled]}
          onPress={handleUnlock}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.unlockButtonText}>Unlock</Text>
          )}
        </TouchableOpacity>

        {/* Biometric Button */}
        {biometricsAvailable && biometricsEnabled && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricUnlock}
          >
            <Text style={styles.biometricIcon}>👆</Text>
            <Text style={styles.biometricText}>Use Biometrics</Text>
          </TouchableOpacity>
        )}

        {/* Error */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotButton}>
          <Text style={styles.forgotText}>
            Forgot password? You can restore using your recovery phrase.
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  inputContainer: {
    marginBottom: 16,
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
  unlockButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  unlockButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  biometricButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  biometricIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  biometricText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  forgotText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
});
