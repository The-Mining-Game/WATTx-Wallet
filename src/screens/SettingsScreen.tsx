import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { lockWallet } from '../store/walletSlice';
import KeychainService from '../services/wallet/KeychainService';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentAccount } = useSelector((state: RootState) => state.wallet);
  const { activeChainId } = useSelector((state: RootState) => state.network);

  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const type = await KeychainService.getBiometryType();
    setBiometricsAvailable(!!type);

    const enabled = await KeychainService.isBiometricsEnabled();
    setBiometricsEnabled(enabled);
  };

  const handleToggleBiometrics = async (value: boolean) => {
    if (value) {
      // Need password to enable biometrics
      Alert.prompt(
        'Enable Biometrics',
        'Enter your password to enable biometric authentication',
        async (password) => {
          if (password) {
            const success = await KeychainService.setBiometricsEnabled(true, password);
            if (success) {
              setBiometricsEnabled(true);
              Alert.alert('Success', 'Biometric authentication enabled');
            } else {
              Alert.alert('Error', 'Failed to enable biometrics');
            }
          }
        },
        'secure-text'
      );
    } else {
      await KeychainService.setBiometricsEnabled(false);
      setBiometricsEnabled(false);
    }
  };

  const handleLockWallet = () => {
    dispatch(lockWallet());
  };

  const handleBackupWallet = () => {
    Alert.prompt(
      'Backup Wallet',
      'Enter your password to view recovery phrase',
      async (password) => {
        if (password) {
          const mnemonic = await KeychainService.getMnemonic(password);
          if (mnemonic) {
            Alert.alert(
              'Recovery Phrase',
              mnemonic,
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert('Error', 'Invalid password');
          }
        }
      },
      'secure-text'
    );
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.accountInfo}>
            <View style={styles.accountAvatar}>
              <Text style={styles.avatarText}>
                {currentAccount?.name?.charAt(0) || 'W'}
              </Text>
            </View>
            <View>
              <Text style={styles.accountName}>{currentAccount?.name || 'Wallet'}</Text>
              <Text style={styles.accountAddress}>
                {currentAccount?.wallets[activeChainId]?.address?.substring(0, 12)}...
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.card}>
          {biometricsAvailable && (
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Biometric Authentication</Text>
                <Text style={styles.settingDescription}>
                  Use fingerprint or face to unlock
                </Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={handleToggleBiometrics}
                trackColor={{ false: '#334155', true: '#4ade80' }}
                thumbColor="#ffffff"
              />
            </View>
          )}

          <TouchableOpacity style={styles.settingRow} onPress={handleBackupWallet}>
            <View>
              <Text style={styles.settingLabel}>Backup Recovery Phrase</Text>
              <Text style={styles.settingDescription}>
                View your 24-word recovery phrase
              </Text>
            </View>
            <Text style={styles.settingArrow}>▶</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Change Password</Text>
              <Text style={styles.settingDescription}>
                Update your wallet password
              </Text>
            </View>
            <Text style={styles.settingArrow}>▶</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handleLockWallet}>
            <View>
              <Text style={styles.settingLabel}>Lock Wallet</Text>
              <Text style={styles.settingDescription}>
                Lock now and require password
              </Text>
            </View>
            <Text style={styles.settingArrow}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Network Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Networks')}
          >
            <View>
              <Text style={styles.settingLabel}>Manage Networks</Text>
              <Text style={styles.settingDescription}>
                Add or remove blockchain networks
              </Text>
            </View>
            <Text style={styles.settingArrow}>▶</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Connected Sites</Text>
              <Text style={styles.settingDescription}>
                Manage dApp connections
              </Text>
            </View>
            <Text style={styles.settingArrow}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => handleOpenLink('https://wattxchange.app')}
          >
            <View>
              <Text style={styles.settingLabel}>WATTxChange DeFi Hub</Text>
              <Text style={styles.settingDescription}>
                Visit our multi-chain DeFi platform
              </Text>
            </View>
            <Text style={styles.settingArrow}>▶</Text>
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingDescription}>1.0.0</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Terms of Service</Text>
            </View>
            <Text style={styles.settingArrow}>▶</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <Text style={styles.settingArrow}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Alert.alert(
                'Delete Wallet',
                'This will permanently delete your wallet. Make sure you have backed up your recovery phrase.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      // Handle wallet deletion
                    },
                  },
                ]
              );
            }}
          >
            <View>
              <Text style={[styles.settingLabel, styles.dangerText]}>Delete Wallet</Text>
              <Text style={styles.settingDescription}>
                Remove wallet from this device
              </Text>
            </View>
            <Text style={styles.settingArrow}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ⚡ by WATTx Team</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  accountAddress: {
    fontSize: 14,
    color: '#64748b',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingLabel: {
    fontSize: 16,
    color: '#f8fafc',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  settingArrow: {
    color: '#64748b',
    fontSize: 12,
  },
  dangerTitle: {
    color: '#ef4444',
  },
  dangerText: {
    color: '#ef4444',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
  },
});
