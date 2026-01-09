import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { switchNetwork, addCustomNetwork, removeCustomNetwork } from '../store/networkSlice';
import { NETWORKS } from '../utils/constants';

export default function NetworksScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { activeChainId, customNetworks } = useSelector((state: RootState) => state.network);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNetwork, setNewNetwork] = useState({
    name: '',
    chainId: '',
    rpcUrl: '',
    symbol: '',
    explorerUrl: '',
  });

  const allNetworks = Object.values(NETWORKS);
  const filteredNetworks = allNetworks.filter(
    (n) =>
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mainnetNetworks = filteredNetworks.filter((n) => !n.isTestnet);
  const testnetNetworks = filteredNetworks.filter((n) => n.isTestnet);

  const handleSelectNetwork = async (chainId: number) => {
    await dispatch(switchNetwork(chainId));
    navigation.goBack();
  };

  const handleAddNetwork = async () => {
    if (!newNetwork.name || !newNetwork.chainId || !newNetwork.rpcUrl || !newNetwork.symbol) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await dispatch(
        addCustomNetwork({
          chainId: parseInt(newNetwork.chainId),
          chainIdHex: '0x' + parseInt(newNetwork.chainId).toString(16),
          name: newNetwork.name,
          symbol: newNetwork.symbol,
          decimals: 18,
          rpcUrls: [newNetwork.rpcUrl],
          explorerUrl: newNetwork.explorerUrl,
          isTestnet: false,
          supportsEIP1559: true,
          isCustom: true,
        })
      ).unwrap();

      setShowAddModal(false);
      setNewNetwork({ name: '', chainId: '', rpcUrl: '', symbol: '', explorerUrl: '' });
      Alert.alert('Success', 'Network added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add network');
    }
  };

  const renderNetworkItem = (network: any) => (
    <TouchableOpacity
      key={network.chainId}
      style={[
        styles.networkItem,
        activeChainId === network.chainId && styles.networkItemActive,
      ]}
      onPress={() => handleSelectNetwork(network.chainId)}
    >
      <View style={styles.networkInfo}>
        <View style={styles.networkHeader}>
          <Text style={styles.networkName}>{network.name}</Text>
          {network.isCustom && (
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>Custom</Text>
            </View>
          )}
        </View>
        <Text style={styles.networkDetails}>
          {network.symbol} | Chain ID: {network.chainId}
        </Text>
      </View>
      {activeChainId === network.chainId && (
        <View style={styles.activeIndicator}>
          <Text style={styles.activeCheck}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search networks..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Featured Networks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured</Text>
          {mainnetNetworks.slice(0, 4).map(renderNetworkItem)}
        </View>

        {/* All Mainnets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mainnet Networks</Text>
          {mainnetNetworks.map(renderNetworkItem)}
        </View>

        {/* Testnets */}
        {testnetNetworks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Networks</Text>
            {testnetNetworks.map(renderNetworkItem)}
          </View>
        )}

        {/* Custom Networks */}
        {customNetworks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Networks</Text>
            {customNetworks.map(renderNetworkItem)}
          </View>
        )}
      </ScrollView>

      {/* Add Network Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ Add Custom Network</Text>
      </TouchableOpacity>

      {/* Add Network Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Network</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Network Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., My Network"
                  placeholderTextColor="#64748b"
                  value={newNetwork.name}
                  onChangeText={(text) => setNewNetwork({ ...newNetwork, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Chain ID *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 1"
                  placeholderTextColor="#64748b"
                  value={newNetwork.chainId}
                  onChangeText={(text) => setNewNetwork({ ...newNetwork, chainId: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>RPC URL *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://..."
                  placeholderTextColor="#64748b"
                  value={newNetwork.rpcUrl}
                  onChangeText={(text) => setNewNetwork({ ...newNetwork, rpcUrl: text })}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Currency Symbol *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., ETH"
                  placeholderTextColor="#64748b"
                  value={newNetwork.symbol}
                  onChangeText={(text) => setNewNetwork({ ...newNetwork, symbol: text })}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Block Explorer URL (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://..."
                  placeholderTextColor="#64748b"
                  value={newNetwork.explorerUrl}
                  onChangeText={(text) => setNewNetwork({ ...newNetwork, explorerUrl: text })}
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddNetwork}>
              <Text style={styles.saveButtonText}>Add Network</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  networkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  networkItemActive: {
    borderColor: '#6366f1',
    backgroundColor: '#312e81',
  },
  networkInfo: {},
  networkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  networkName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginRight: 8,
  },
  customBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  networkDetails: {
    fontSize: 13,
    color: '#64748b',
  },
  activeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCheck: {
    color: '#ffffff',
    fontWeight: '700',
  },
  addButton: {
    margin: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
    maxHeight: '90%',
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
  modalBody: {
    padding: 20,
    maxHeight: 400,
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
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
  },
  saveButton: {
    margin: 20,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
