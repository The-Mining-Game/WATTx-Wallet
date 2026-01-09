import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Web3Provider from '../services/dapp/Web3Provider';
import { NETWORKS } from '../utils/constants';

const { width, height } = Dimensions.get('window');

// Default DApps with WATTxchange as primary
const DEFAULT_DAPPS = [
  {
    name: 'WATTxChange Hub',
    url: 'https://wattxchange.app',
    icon: '⚡',
    description: 'Multi-chain DeFi Hub',
    featured: true,
  },
  {
    name: 'Uniswap',
    url: 'https://app.uniswap.org',
    icon: '🦄',
    description: 'Decentralized Exchange',
  },
  {
    name: 'PancakeSwap',
    url: 'https://pancakeswap.finance',
    icon: '🥞',
    description: 'BSC DEX',
  },
  {
    name: 'Aave',
    url: 'https://app.aave.com',
    icon: '👻',
    description: 'Lending Protocol',
  },
  {
    name: 'OpenSea',
    url: 'https://opensea.io',
    icon: '🌊',
    description: 'NFT Marketplace',
  },
  {
    name: 'Magic Eden',
    url: 'https://magiceden.io',
    icon: '✨',
    description: 'Multi-chain NFTs',
  },
];

export default function DAppBrowserScreen() {
  const webViewRef = useRef<WebView>(null);
  const { activeChainId } = useSelector((state: RootState) => state.network);
  const { currentAccount } = useSelector((state: RootState) => state.wallet);

  const [url, setUrl] = useState('https://wattxchange.app');
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [showHome, setShowHome] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  const network = NETWORKS[activeChainId];
  const currentAddress = currentAccount?.wallets[activeChainId]?.address;

  // Injected Web3 JavaScript
  const injectedJS = Web3Provider.getInjectedJavaScript(activeChainId);

  const handleNavigate = (targetUrl: string) => {
    let finalUrl = targetUrl;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      finalUrl = 'https://' + targetUrl;
    }
    setUrl(finalUrl);
    setShowHome(false);
  };

  const handleMessage = useCallback(async (event: any) => {
    try {
      const request = JSON.parse(event.nativeEvent.data);
      const { id, method, params } = request;

      // Handle approval-required methods
      const needsApproval = [
        'eth_requestAccounts',
        'eth_sendTransaction',
        'eth_signTransaction',
        'personal_sign',
        'eth_sign',
        'eth_signTypedData',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
        'wallet_switchEthereumChain',
        'wallet_addEthereumChain',
        'wallet_watchAsset',
        'wallet_requestPermissions',
      ].includes(method);

      if (needsApproval) {
        setPendingRequest({ id, method, params, origin: url });
        setShowApprovalModal(true);
        return;
      }

      // Handle non-approval methods
      const { result, error } = await Web3Provider.handleRequest(
        { id, method, params, origin: url },
        url,
        async () => true
      );

      const responseScript = Web3Provider.getResponseScript(id, result, error);
      webViewRef.current?.injectJavaScript(responseScript);
    } catch (error) {
      console.error('Web3 message handling error:', error);
    }
  }, [url, activeChainId]);

  const handleApprove = async () => {
    if (!pendingRequest) return;

    const { id, method, params } = pendingRequest;

    const { result, error } = await Web3Provider.handleRequest(
      { id, method, params, origin: url },
      url,
      async () => true
    );

    const responseScript = Web3Provider.getResponseScript(id, result, error);
    webViewRef.current?.injectJavaScript(responseScript);

    setShowApprovalModal(false);
    setPendingRequest(null);
  };

  const handleReject = () => {
    if (!pendingRequest) return;

    const responseScript = Web3Provider.getResponseScript(
      pendingRequest.id,
      null,
      'User rejected the request'
    );
    webViewRef.current?.injectJavaScript(responseScript);

    setShowApprovalModal(false);
    setPendingRequest(null);
  };

  const renderHome = () => (
    <ScrollView style={styles.homeContainer} showsVerticalScrollIndicator={false}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search or enter URL"
          placeholderTextColor="#64748b"
          value={inputUrl}
          onChangeText={setInputUrl}
          onSubmitEditing={() => handleNavigate(inputUrl)}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => handleNavigate(inputUrl)}
        >
          <Text style={styles.searchButtonText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Network Info */}
      <View style={styles.networkInfo}>
        <Text style={styles.networkLabel}>Connected to:</Text>
        <View style={styles.networkBadge}>
          <View style={[styles.networkDot, { backgroundColor: network?.isTestnet ? '#fbbf24' : '#22c55e' }]} />
          <Text style={styles.networkName}>{network?.name || 'Unknown'}</Text>
        </View>
        {currentAddress && (
          <Text style={styles.addressText}>
            {currentAddress.substring(0, 6)}...{currentAddress.substring(38)}
          </Text>
        )}
      </View>

      {/* Featured DApp */}
      <TouchableOpacity
        style={styles.featuredDApp}
        onPress={() => handleNavigate(DEFAULT_DAPPS[0].url)}
      >
        <View style={styles.featuredHeader}>
          <Text style={styles.featuredBadge}>FEATURED</Text>
        </View>
        <Text style={styles.featuredIcon}>{DEFAULT_DAPPS[0].icon}</Text>
        <Text style={styles.featuredName}>{DEFAULT_DAPPS[0].name}</Text>
        <Text style={styles.featuredDescription}>{DEFAULT_DAPPS[0].description}</Text>
        <View style={styles.openButton}>
          <Text style={styles.openButtonText}>Open DeFi Hub</Text>
        </View>
      </TouchableOpacity>

      {/* Popular DApps */}
      <Text style={styles.sectionTitle}>Popular DApps</Text>
      <View style={styles.dappsGrid}>
        {DEFAULT_DAPPS.slice(1).map((dapp, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dappCard}
            onPress={() => handleNavigate(dapp.url)}
          >
            <Text style={styles.dappIcon}>{dapp.icon}</Text>
            <Text style={styles.dappName}>{dapp.name}</Text>
            <Text style={styles.dappDescription} numberOfLines={1}>
              {dapp.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderBrowser = () => (
    <View style={styles.browserContainer}>
      {/* URL Bar */}
      <View style={styles.urlBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => webViewRef.current?.goBack()}
          disabled={!canGoBack}
        >
          <Text style={[styles.navButtonText, !canGoBack && styles.navButtonDisabled]}>
            ←
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => webViewRef.current?.goForward()}
          disabled={!canGoForward}
        >
          <Text style={[styles.navButtonText, !canGoForward && styles.navButtonDisabled]}>
            →
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => webViewRef.current?.reload()}
        >
          <Text style={styles.navButtonText}>↻</Text>
        </TouchableOpacity>

        <View style={styles.urlInputContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.urlText} numberOfLines={1}>
            {url.replace('https://', '').replace('http://', '')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => setShowHome(true)}
        >
          <Text style={styles.homeButtonText}>🏠</Text>
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
        onMessage={handleMessage}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
          setCanGoForward(navState.canGoForward);
          setCurrentTitle(navState.title);
        }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // Mobile-friendly viewport
        contentMode="mobile"
        setBuiltInZoomControls={false}
        setSupportMultipleWindows={false}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingBar}>
          <View style={styles.loadingProgress} />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {showHome ? renderHome() : renderBrowser()}

      {/* Approval Modal */}
      <Modal
        visible={showApprovalModal}
        transparent
        animationType="slide"
        onRequestClose={handleReject}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Permission Request</Text>
            <Text style={styles.modalOrigin}>{new URL(url).hostname}</Text>

            <View style={styles.modalBody}>
              <Text style={styles.modalMethod}>
                {pendingRequest?.method || 'Unknown method'}
              </Text>
              <Text style={styles.modalDescription}>
                {getMethodDescription(pendingRequest?.method)}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={handleReject}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={handleApprove}
              >
                <Text style={styles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getMethodDescription(method?: string): string {
  const descriptions: Record<string, string> = {
    eth_requestAccounts: 'This site wants to connect to your wallet',
    eth_sendTransaction: 'This site wants to send a transaction',
    personal_sign: 'This site wants to sign a message',
    eth_sign: 'This site wants to sign data',
    eth_signTypedData: 'This site wants to sign structured data',
    eth_signTypedData_v3: 'This site wants to sign structured data',
    eth_signTypedData_v4: 'This site wants to sign structured data',
    wallet_switchEthereumChain: 'This site wants to switch networks',
    wallet_addEthereumChain: 'This site wants to add a new network',
    wallet_watchAsset: 'This site wants to add a token to your wallet',
  };
  return descriptions[method || ''] || 'This site is requesting access';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  homeContainer: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#f8fafc',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  networkLabel: {
    color: '#64748b',
    marginRight: 8,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  networkName: {
    color: '#f8fafc',
    fontWeight: '500',
  },
  addressText: {
    color: '#94a3b8',
    marginLeft: 8,
    fontSize: 12,
  },
  featuredDApp: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  featuredHeader: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadge: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 10,
  },
  featuredIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  featuredName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  openButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  openButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 16,
  },
  dappsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  dappCard: {
    width: (width - 44) / 2,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    margin: 6,
    alignItems: 'center',
  },
  dappIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  dappName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  dappDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  browserContainer: {
    flex: 1,
  },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  navButton: {
    padding: 8,
    marginRight: 4,
  },
  navButtonText: {
    fontSize: 20,
    color: '#f8fafc',
  },
  navButtonDisabled: {
    color: '#475569',
  },
  urlInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  lockIcon: {
    marginRight: 8,
  },
  urlText: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 14,
  },
  homeButton: {
    padding: 8,
  },
  homeButtonText: {
    fontSize: 20,
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingBar: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#1e293b',
  },
  loadingProgress: {
    width: '50%',
    height: '100%',
    backgroundColor: '#6366f1',
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
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalOrigin: {
    fontSize: 14,
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalBody: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  modalMethod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#f8fafc',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 16,
    borderRadius: 12,
  },
  rejectButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
  },
  approveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
