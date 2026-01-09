import { ethers } from 'ethers';
import { Web3Request, DAppSession } from '../../types';
import { NetworkManager } from '../blockchain/NetworkManager';
import { WalletService } from '../wallet/WalletService';
import { NETWORKS } from '../../utils/constants';

export class Web3Provider {
  private static instance: Web3Provider;
  private networkManager: NetworkManager;
  private walletService: WalletService;
  private sessions: Map<string, DAppSession> = new Map();
  private pendingRequests: Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private requestId: number = 0;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.walletService = WalletService.getInstance();
  }

  static getInstance(): Web3Provider {
    if (!Web3Provider.instance) {
      Web3Provider.instance = new Web3Provider();
    }
    return Web3Provider.instance;
  }

  // Generate injected JavaScript for WebView
  getInjectedJavaScript(chainId?: number): string {
    const targetChainId = chainId || this.networkManager.getActiveChainId();
    const network = this.networkManager.getNetwork(targetChainId);
    const address = this.walletService.getAddressForChain(targetChainId);

    return `
      (function() {
        if (window.ethereum) return;

        const chainId = '${network?.chainIdHex || '0x1'}';
        let selectedAddress = ${address ? `'${address}'` : 'null'};
        let isConnected = ${!!address};

        const eventListeners = {};

        function emit(event, data) {
          if (eventListeners[event]) {
            eventListeners[event].forEach(cb => {
              try { cb(data); } catch (e) { console.error(e); }
            });
          }
        }

        window.ethereum = {
          isMetaMask: true,
          isWATTxWallet: true,
          chainId: chainId,
          networkVersion: '${targetChainId}',
          selectedAddress: selectedAddress,
          isConnected: () => isConnected,

          request: async function(args) {
            return new Promise((resolve, reject) => {
              const id = Date.now() + Math.random();
              const message = JSON.stringify({
                id: id,
                method: args.method,
                params: args.params || [],
              });

              // Store callback
              window.__web3Callbacks = window.__web3Callbacks || {};
              window.__web3Callbacks[id] = { resolve, reject };

              // Send to React Native
              window.ReactNativeWebView.postMessage(message);

              // Timeout after 60 seconds
              setTimeout(() => {
                if (window.__web3Callbacks[id]) {
                  delete window.__web3Callbacks[id];
                  reject(new Error('Request timeout'));
                }
              }, 60000);
            });
          },

          send: function(method, params) {
            if (typeof method === 'object') {
              return this.request(method);
            }
            return this.request({ method, params });
          },

          sendAsync: function(payload, callback) {
            this.request(payload)
              .then(result => callback(null, { id: payload.id, jsonrpc: '2.0', result }))
              .catch(error => callback(error, null));
          },

          on: function(event, callback) {
            if (!eventListeners[event]) {
              eventListeners[event] = [];
            }
            eventListeners[event].push(callback);
            return this;
          },

          removeListener: function(event, callback) {
            if (eventListeners[event]) {
              const index = eventListeners[event].indexOf(callback);
              if (index > -1) {
                eventListeners[event].splice(index, 1);
              }
            }
            return this;
          },

          removeAllListeners: function(event) {
            if (event) {
              delete eventListeners[event];
            } else {
              Object.keys(eventListeners).forEach(key => delete eventListeners[key]);
            }
            return this;
          },

          // Internal methods for wallet to update state
          _updateChainId: function(newChainId) {
            const oldChainId = chainId;
            window.ethereum.chainId = newChainId;
            window.ethereum.networkVersion = parseInt(newChainId, 16).toString();
            emit('chainChanged', newChainId);
            emit('networkChanged', parseInt(newChainId, 16).toString());
          },

          _updateAccounts: function(accounts) {
            selectedAddress = accounts[0] || null;
            window.ethereum.selectedAddress = selectedAddress;
            isConnected = !!selectedAddress;
            emit('accountsChanged', accounts);
          },

          _handleResponse: function(id, result, error) {
            if (window.__web3Callbacks && window.__web3Callbacks[id]) {
              if (error) {
                window.__web3Callbacks[id].reject(new Error(error));
              } else {
                window.__web3Callbacks[id].resolve(result);
              }
              delete window.__web3Callbacks[id];
            }
          },
        };

        // Legacy web3 support
        window.web3 = {
          currentProvider: window.ethereum,
        };

        // Emit connect event
        if (isConnected) {
          setTimeout(() => {
            emit('connect', { chainId });
          }, 100);
        }

        // Announce provider
        window.dispatchEvent(new Event('ethereum#initialized'));

        // EIP-6963 provider info
        const providerInfo = {
          uuid: 'wattx-wallet-${Date.now()}',
          name: 'WATTx Wallet',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>',
          rdns: 'app.wattxchange.wallet',
        };

        window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
          detail: { info: providerInfo, provider: window.ethereum },
        }));

        window.addEventListener('eip6963:requestProvider', () => {
          window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
            detail: { info: providerInfo, provider: window.ethereum },
          }));
        });

        console.log('WATTx Wallet injected');
      })();
      true;
    `;
  }

  // Handle incoming Web3 request from WebView
  async handleRequest(
    request: Web3Request,
    origin: string,
    onApprovalNeeded: (request: Web3Request, origin: string) => Promise<boolean>
  ): Promise<{ result?: any; error?: string }> {
    const { method, params } = request;
    const chainId = this.networkManager.getActiveChainId();

    try {
      switch (method) {
        case 'eth_requestAccounts':
        case 'eth_accounts': {
          const approved = await onApprovalNeeded(request, origin);
          if (!approved) {
            return { error: 'User rejected the request' };
          }

          const address = this.walletService.getAddressForChain(chainId);
          this.createSession(origin, chainId);
          return { result: address ? [address] : [] };
        }

        case 'eth_chainId': {
          const network = this.networkManager.getNetwork(chainId);
          return { result: network?.chainIdHex || '0x1' };
        }

        case 'net_version': {
          return { result: chainId.toString() };
        }

        case 'eth_getBalance': {
          const [address, block] = params;
          const balance = await this.networkManager.getBalance(address, chainId);
          const balanceWei = ethers.parseEther(balance);
          return { result: '0x' + balanceWei.toString(16) };
        }

        case 'eth_blockNumber': {
          const blockNumber = await this.networkManager.getBlockNumber(chainId);
          return { result: '0x' + blockNumber.toString(16) };
        }

        case 'eth_call': {
          const [txParams, block] = params;
          const provider = this.networkManager.getProvider(chainId);
          if (!provider) {
            return { error: 'No provider for network' };
          }

          const result = await provider.call(txParams);
          return { result };
        }

        case 'eth_estimateGas': {
          const [txParams] = params;
          const provider = this.networkManager.getProvider(chainId);
          if (!provider) {
            return { error: 'No provider for network' };
          }

          const gas = await provider.estimateGas(txParams);
          return { result: '0x' + gas.toString(16) };
        }

        case 'eth_gasPrice': {
          const provider = this.networkManager.getProvider(chainId);
          if (!provider) {
            return { error: 'No provider for network' };
          }

          const feeData = await provider.getFeeData();
          const gasPrice = feeData.gasPrice || BigInt(20000000000);
          return { result: '0x' + gasPrice.toString(16) };
        }

        case 'eth_sendTransaction': {
          const [txParams] = params;

          // Request approval
          const approved = await onApprovalNeeded(request, origin);
          if (!approved) {
            return { error: 'User rejected the request' };
          }

          // This should be handled by the UI to get password and sign
          // For now, return error - the actual signing happens in the app
          return { error: 'Transaction signing handled by wallet UI' };
        }

        case 'eth_signTransaction': {
          const [txParams] = params;

          const approved = await onApprovalNeeded(request, origin);
          if (!approved) {
            return { error: 'User rejected the request' };
          }

          return { error: 'Transaction signing handled by wallet UI' };
        }

        case 'personal_sign':
        case 'eth_sign': {
          const [message, address] = method === 'personal_sign' ? params : [params[1], params[0]];

          const approved = await onApprovalNeeded(request, origin);
          if (!approved) {
            return { error: 'User rejected the request' };
          }

          return { error: 'Message signing handled by wallet UI' };
        }

        case 'eth_signTypedData':
        case 'eth_signTypedData_v3':
        case 'eth_signTypedData_v4': {
          const approved = await onApprovalNeeded(request, origin);
          if (!approved) {
            return { error: 'User rejected the request' };
          }

          return { error: 'Typed data signing handled by wallet UI' };
        }

        case 'wallet_switchEthereumChain': {
          const [{ chainId: requestedChainId }] = params;
          const targetChainId = parseInt(requestedChainId, 16);

          const network = this.networkManager.getNetwork(targetChainId);
          if (!network) {
            return {
              error: JSON.stringify({
                code: 4902,
                message: 'Unrecognized chain ID',
              }),
            };
          }

          const approved = await onApprovalNeeded(request, origin);
          if (!approved) {
            return { error: 'User rejected the request' };
          }

          await this.networkManager.setActiveNetwork(targetChainId);
          return { result: null };
        }

        case 'wallet_addEthereumChain': {
          const [chainConfig] = params;

          const approved = await onApprovalNeeded(request, origin);
          if (!approved) {
            return { error: 'User rejected the request' };
          }

          // Parse and add the network
          const newNetwork = {
            chainId: parseInt(chainConfig.chainId, 16),
            chainIdHex: chainConfig.chainId,
            name: chainConfig.chainName,
            symbol: chainConfig.nativeCurrency?.symbol || 'ETH',
            decimals: chainConfig.nativeCurrency?.decimals || 18,
            rpcUrls: chainConfig.rpcUrls || [],
            explorerUrl: chainConfig.blockExplorerUrls?.[0] || '',
            isTestnet: false,
            supportsEIP1559: true,
            isCustom: true,
          };

          await this.networkManager.addCustomNetwork(newNetwork);
          return { result: null };
        }

        case 'wallet_watchAsset': {
          const approved = await onApprovalNeeded(request, origin);
          if (!approved) {
            return { error: 'User rejected the request' };
          }

          // Token watching handled by wallet UI
          return { result: true };
        }

        case 'wallet_getPermissions': {
          const session = this.sessions.get(origin);
          if (session) {
            return {
              result: session.permissions.map(p => ({
                parentCapability: p,
                caveats: [],
              })),
            };
          }
          return { result: [] };
        }

        case 'wallet_requestPermissions': {
          const approved = await onApprovalNeeded(request, origin);
          if (!approved) {
            return { error: 'User rejected the request' };
          }

          const [{ eth_accounts }] = params;
          if (eth_accounts) {
            const address = this.walletService.getAddressForChain(chainId);
            this.createSession(origin, chainId, ['eth_accounts']);
            return {
              result: [
                {
                  parentCapability: 'eth_accounts',
                  caveats: [],
                },
              ],
            };
          }
          return { result: [] };
        }

        default: {
          // Forward unknown methods to provider
          const provider = this.networkManager.getProvider(chainId);
          if (!provider) {
            return { error: 'No provider for network' };
          }

          try {
            const result = await provider.send(method, params);
            return { result };
          } catch (error: any) {
            return { error: error.message };
          }
        }
      }
    } catch (error: any) {
      console.error('Web3 request error:', error);
      return { error: error.message };
    }
  }

  // Session management
  private createSession(origin: string, chainId: number, permissions: string[] = ['eth_accounts']): DAppSession {
    const session: DAppSession = {
      id: `session-${Date.now()}`,
      origin,
      name: new URL(origin).hostname,
      chainId,
      connectedAt: Date.now(),
      permissions,
    };

    this.sessions.set(origin, session);
    return session;
  }

  getSession(origin: string): DAppSession | undefined {
    return this.sessions.get(origin);
  }

  getAllSessions(): DAppSession[] {
    return Array.from(this.sessions.values());
  }

  disconnectSession(origin: string): boolean {
    return this.sessions.delete(origin);
  }

  disconnectAllSessions(): void {
    this.sessions.clear();
  }

  // Update chain for all sessions
  updateChainForSessions(chainId: number): void {
    this.sessions.forEach((session, origin) => {
      session.chainId = chainId;
    });
  }

  // Get message to inject response
  getResponseScript(requestId: number, result: any, error?: string): string {
    if (error) {
      return `window.ethereum._handleResponse(${requestId}, null, '${error.replace(/'/g, "\\'")}');`;
    }
    return `window.ethereum._handleResponse(${requestId}, ${JSON.stringify(result)}, null);`;
  }

  // Get chain changed script
  getChainChangedScript(chainIdHex: string): string {
    return `window.ethereum._updateChainId('${chainIdHex}');`;
  }

  // Get accounts changed script
  getAccountsChangedScript(accounts: string[]): string {
    return `window.ethereum._updateAccounts(${JSON.stringify(accounts)});`;
  }
}

export default Web3Provider.getInstance();
