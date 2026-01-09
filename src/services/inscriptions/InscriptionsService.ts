import { Inscription, BRC20Token, InscriptionCollection, NetworkConfig } from '../../types';
import { INSCRIPTION_APIS, NETWORKS } from '../../utils/constants';

export class InscriptionsService {
  private static instance: InscriptionsService;

  private constructor() {}

  static getInstance(): InscriptionsService {
    if (!InscriptionsService.instance) {
      InscriptionsService.instance = new InscriptionsService();
    }
    return InscriptionsService.instance;
  }

  // === Ordinals/Inscriptions ===

  // Get inscriptions for address
  async getInscriptions(
    address: string,
    chainId: number,
    options: {
      offset?: number;
      limit?: number;
      mimeType?: string;
    } = {}
  ): Promise<{ inscriptions: Inscription[]; total: number }> {
    const network = NETWORKS[chainId];
    if (!network?.supportsInscriptions) {
      return { inscriptions: [], total: 0 };
    }

    const { offset = 0, limit = 50, mimeType } = options;

    try {
      // Different API endpoints based on chain
      if (chainId === 1 || chainId === 81 || chainId === 8889) {
        // Ethereum or WATTx - use Hiro Ordinals API or custom endpoint
        return this.fetchOrdinalsFromHiro(address, offset, limit, mimeType, network.isTestnet);
      } else if (chainId === 56) {
        // BSC - use custom BRC20 API
        return this.fetchBSCInscriptions(address, offset, limit);
      } else {
        // Generic fallback
        return this.fetchGenericInscriptions(address, chainId, offset, limit);
      }
    } catch (error) {
      console.error('Failed to fetch inscriptions:', error);
      return { inscriptions: [], total: 0 };
    }
  }

  // Fetch from Hiro Ordinals API (Bitcoin/WATTx)
  private async fetchOrdinalsFromHiro(
    address: string,
    offset: number,
    limit: number,
    mimeType?: string,
    isTestnet: boolean = false
  ): Promise<{ inscriptions: Inscription[]; total: number }> {
    const baseUrl = isTestnet
      ? INSCRIPTION_APIS.ordinals.testnet
      : INSCRIPTION_APIS.ordinals.mainnet;

    let url = `${baseUrl}/inscriptions?address=${address}&offset=${offset}&limit=${limit}`;
    if (mimeType) {
      url += `&mime_type=${encodeURIComponent(mimeType)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    const inscriptions: Inscription[] = (data.results || []).map((item: any) => ({
      id: item.id,
      number: item.number,
      address: item.address,
      contentType: item.content_type,
      contentLength: item.content_length,
      genesisHeight: item.genesis_block_height,
      genesisTimestamp: new Date(item.genesis_timestamp).getTime(),
      txid: item.genesis_tx_id,
      outputValue: item.value,
      preview: item.content_type?.startsWith('image/')
        ? `${baseUrl}/inscriptions/${item.id}/content`
        : undefined,
    }));

    return {
      inscriptions,
      total: data.total || inscriptions.length,
    };
  }

  // Fetch BSC inscriptions (BRC20-style)
  private async fetchBSCInscriptions(
    address: string,
    offset: number,
    limit: number
  ): Promise<{ inscriptions: Inscription[]; total: number }> {
    // BSC inscription API endpoint
    const url = `https://api.bscscan.com/api?module=account&action=tokennfttx&address=${address}&startblock=0&endblock=999999999&sort=desc`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== '1') {
        return { inscriptions: [], total: 0 };
      }

      const inscriptions: Inscription[] = (data.result || [])
        .slice(offset, offset + limit)
        .map((item: any, index: number) => ({
          id: item.hash,
          number: index + offset,
          address: address,
          contentType: 'application/json',
          contentLength: 0,
          genesisHeight: parseInt(item.blockNumber),
          genesisTimestamp: parseInt(item.timeStamp) * 1000,
          txid: item.hash,
          outputValue: 0,
        }));

      return {
        inscriptions,
        total: data.result?.length || 0,
      };
    } catch (error) {
      console.error('Failed to fetch BSC inscriptions:', error);
      return { inscriptions: [], total: 0 };
    }
  }

  // Generic inscriptions fetch
  private async fetchGenericInscriptions(
    address: string,
    chainId: number,
    offset: number,
    limit: number
  ): Promise<{ inscriptions: Inscription[]; total: number }> {
    // Placeholder for other chains
    // Each chain may have its own inscription standard
    return { inscriptions: [], total: 0 };
  }

  // Get single inscription details
  async getInscription(inscriptionId: string, chainId: number): Promise<Inscription | null> {
    const network = NETWORKS[chainId];
    if (!network?.supportsInscriptions) {
      return null;
    }

    try {
      const baseUrl = network.isTestnet
        ? INSCRIPTION_APIS.ordinals.testnet
        : INSCRIPTION_APIS.ordinals.mainnet;

      const response = await fetch(`${baseUrl}/inscriptions/${inscriptionId}`);
      const item = await response.json();

      return {
        id: item.id,
        number: item.number,
        address: item.address,
        contentType: item.content_type,
        contentLength: item.content_length,
        genesisHeight: item.genesis_block_height,
        genesisTimestamp: new Date(item.genesis_timestamp).getTime(),
        txid: item.genesis_tx_id,
        outputValue: item.value,
        preview: item.content_type?.startsWith('image/')
          ? `${baseUrl}/inscriptions/${item.id}/content`
          : undefined,
        content: item.content,
      };
    } catch (error) {
      console.error('Failed to fetch inscription:', error);
      return null;
    }
  }

  // Get inscription content
  async getInscriptionContent(inscriptionId: string, chainId: number): Promise<string | null> {
    const network = NETWORKS[chainId];
    if (!network?.supportsInscriptions) {
      return null;
    }

    try {
      const baseUrl = network.isTestnet
        ? INSCRIPTION_APIS.ordinals.testnet
        : INSCRIPTION_APIS.ordinals.mainnet;

      const response = await fetch(`${baseUrl}/inscriptions/${inscriptionId}/content`);
      return await response.text();
    } catch (error) {
      console.error('Failed to fetch inscription content:', error);
      return null;
    }
  }

  // === BRC-20 Tokens ===

  // Get BRC-20 token balances
  async getBRC20Balances(
    address: string,
    chainId: number
  ): Promise<BRC20Token[]> {
    const network = NETWORKS[chainId];
    if (!network?.supportsInscriptions || network.inscriptionType !== 'brc20') {
      return [];
    }

    try {
      // Use UniSat API for BRC-20
      const response = await fetch(
        `${INSCRIPTION_APIS.brc20.mainnet}/brc20/address/${address}/balance`
      );
      const data = await response.json();

      return (data.data || []).map((item: any) => ({
        ticker: item.ticker,
        balance: item.overallBalance,
        availableBalance: item.availableBalance,
        transferableBalance: item.transferableBalance,
        inscriptionId: item.inscriptionId,
      }));
    } catch (error) {
      console.error('Failed to fetch BRC-20 balances:', error);
      return [];
    }
  }

  // Get BRC-20 token info
  async getBRC20TokenInfo(ticker: string): Promise<any> {
    try {
      const response = await fetch(
        `${INSCRIPTION_APIS.brc20.mainnet}/brc20/ticker/${ticker}/info`
      );
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch BRC-20 token info:', error);
      return null;
    }
  }

  // Get BRC-20 transfer history
  async getBRC20TransferHistory(
    address: string,
    ticker?: string
  ): Promise<any[]> {
    try {
      let url = `${INSCRIPTION_APIS.brc20.mainnet}/brc20/address/${address}/history`;
      if (ticker) {
        url += `?ticker=${ticker}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Failed to fetch BRC-20 history:', error);
      return [];
    }
  }

  // === Collections ===

  // Get inscription collections for address
  async getCollections(
    address: string,
    chainId: number
  ): Promise<InscriptionCollection[]> {
    const { inscriptions, total } = await this.getInscriptions(address, chainId, {
      limit: 1000,
    });

    // Group by content type
    const collections: Map<string, Inscription[]> = new Map();

    inscriptions.forEach(inscription => {
      const type = this.getCollectionType(inscription.contentType);
      if (!collections.has(type)) {
        collections.set(type, []);
      }
      collections.get(type)!.push(inscription);
    });

    return Array.from(collections.entries()).map(([name, items]) => ({
      name,
      inscriptions: items,
      totalCount: items.length,
    }));
  }

  // Get collection type from MIME type
  private getCollectionType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'Images';
    if (mimeType.startsWith('text/')) return 'Text';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType === 'application/json') return 'JSON';
    return 'Other';
  }

  // === Search ===

  // Search inscriptions
  async searchInscriptions(
    query: string,
    chainId: number,
    options: {
      offset?: number;
      limit?: number;
    } = {}
  ): Promise<{ inscriptions: Inscription[]; total: number }> {
    const network = NETWORKS[chainId];
    if (!network?.supportsInscriptions) {
      return { inscriptions: [], total: 0 };
    }

    const { offset = 0, limit = 50 } = options;

    try {
      const baseUrl = network.isTestnet
        ? INSCRIPTION_APIS.ordinals.testnet
        : INSCRIPTION_APIS.ordinals.mainnet;

      // Check if query is an inscription number
      if (/^\d+$/.test(query)) {
        const response = await fetch(
          `${baseUrl}/inscriptions?number=${query}`
        );
        const data = await response.json();

        const inscriptions = (data.results || []).map((item: any) => ({
          id: item.id,
          number: item.number,
          address: item.address,
          contentType: item.content_type,
          contentLength: item.content_length,
          genesisHeight: item.genesis_block_height,
          genesisTimestamp: new Date(item.genesis_timestamp).getTime(),
          txid: item.genesis_tx_id,
          outputValue: item.value,
        }));

        return { inscriptions, total: inscriptions.length };
      }

      // Check if query is an inscription ID
      if (query.length === 64 || query.includes('i')) {
        const inscription = await this.getInscription(query, chainId);
        if (inscription) {
          return { inscriptions: [inscription], total: 1 };
        }
      }

      return { inscriptions: [], total: 0 };
    } catch (error) {
      console.error('Failed to search inscriptions:', error);
      return { inscriptions: [], total: 0 };
    }
  }

  // === Runes (Future) ===

  // Get runes balances
  async getRunesBalances(address: string, chainId: number): Promise<any[]> {
    // Runes protocol support - to be implemented
    return [];
  }

  // === Stamps (Future) ===

  // Get stamps for address
  async getStamps(address: string, chainId: number): Promise<any[]> {
    // Bitcoin Stamps support - to be implemented
    return [];
  }

  // === Utility Methods ===

  // Check if chain supports inscriptions
  supportsInscriptions(chainId: number): boolean {
    const network = NETWORKS[chainId];
    return !!network?.supportsInscriptions;
  }

  // Get inscription type for chain
  getInscriptionType(chainId: number): string | null {
    const network = NETWORKS[chainId];
    return network?.inscriptionType || null;
  }

  // Format inscription number
  formatInscriptionNumber(number: number): string {
    return `#${number.toLocaleString()}`;
  }

  // Get content URL
  getContentUrl(inscriptionId: string, chainId: number): string {
    const network = NETWORKS[chainId];
    const baseUrl = network?.isTestnet
      ? INSCRIPTION_APIS.ordinals.testnet
      : INSCRIPTION_APIS.ordinals.mainnet;

    return `${baseUrl}/inscriptions/${inscriptionId}/content`;
  }

  // Get preview URL
  getPreviewUrl(inscriptionId: string, chainId: number): string {
    const network = NETWORKS[chainId];
    const baseUrl = network?.isTestnet
      ? INSCRIPTION_APIS.ordinals.testnet
      : INSCRIPTION_APIS.ordinals.mainnet;

    return `${baseUrl}/inscriptions/${inscriptionId}/content`;
  }
}

export default InscriptionsService.getInstance();
