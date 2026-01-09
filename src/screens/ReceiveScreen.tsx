import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { NETWORKS } from '../utils/constants';
import QRCode from 'react-native-qrcode-svg';

export default function ReceiveScreen() {
  const { activeChainId } = useSelector((state: RootState) => state.network);
  const { currentAccount } = useSelector((state: RootState) => state.wallet);

  const network = NETWORKS[activeChainId];
  const address = currentAccount?.wallets[activeChainId]?.address || '';

  const copyAddress = () => {
    Clipboard.setString(address);
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  const shareAddress = async () => {
    try {
      await Share.share({
        message: address,
        title: `My ${network?.symbol} Address`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Network Info */}
        <View style={styles.networkBadge}>
          <View style={[styles.networkDot, { backgroundColor: network?.isTestnet ? '#fbbf24' : '#22c55e' }]} />
          <Text style={styles.networkName}>{network?.name}</Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <View style={styles.qrWrapper}>
            {address ? (
              <QRCode
                value={address}
                size={200}
                backgroundColor="#ffffff"
                color="#000000"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>No Address</Text>
              </View>
            )}
          </View>
        </View>

        {/* Address Display */}
        <View style={styles.addressSection}>
          <Text style={styles.addressLabel}>Your {network?.symbol} Address</Text>
          <TouchableOpacity style={styles.addressBox} onPress={copyAddress}>
            <Text style={styles.addressText}>{address}</Text>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Only send {network?.symbol} and tokens on {network?.name} to this address.
            Sending other assets may result in permanent loss.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={copyAddress}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>Copy Address</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={shareAddress}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
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
    padding: 24,
    alignItems: 'center',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  networkName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
  },
  qrContainer: {
    marginBottom: 32,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#334155',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    color: '#64748b',
    fontSize: 14,
  },
  addressSection: {
    width: '100%',
    marginBottom: 24,
  },
  addressLabel: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  addressBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addressText: {
    color: '#f8fafc',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#422006',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    color: '#fcd34d',
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
  },
});
