import {
  MobileScanLot,
  MobileScanItem,
  SyncConnectionConfig,
  MobileSyncMessage,
  PWACredentials,
  NetworkConnectionMode,
} from '../types';
import { ProductRecord } from '../../types';
import { sha256, generateSecureCredentials, createEncryptedPairingPayload } from '../crypto';

const STORAGE_LOTS_KEY = 'estudio_pwa_lots_v2';
const STORAGE_CONFIG_KEY = 'estudio_pwa_sync_config_v2';
const BROADCAST_CHANNEL_NAME = 'estudio_mobile_sync_bus_v2';

const SAMPLE_MOBILE_LOTS: MobileScanLot[] = [
  {
    id: 'lot_mobile_101',
    name: 'Rayon Frais & Traiteur - Audit 23/09',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    operatorName: 'Alexandre R.',
    deviceName: 'iPhone 15 Pro (Safari PWA)',
    deviceType: 'ios',
    status: 'ready',
    targetTemplateId: 'Étiquette Rayon Classique (50x30 mm)',
    syncMethod: 'direct_lan',
    items: [
      {
        id: 'item_m1',
        code: '3250390123456',
        designation: 'Jambon Supérieur Découenne 4 Tranches 160g',
        price: 3.49,
        promoPrice: 2.79,
        quantity: 3,
        facing: 2,
        scannedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        note: 'Sticker promo -20% à apposer',
      },
      {
        id: 'item_m2',
        code: '3250390987654',
        designation: 'Fromage Comté AOP 24 Mois Affinage 200g',
        price: 4.85,
        quantity: 2,
        facing: 1,
        scannedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      {
        id: 'item_m3',
        code: '3250390554433',
        designation: 'Beurre Demi-Sel Moulé Tradition 250g',
        price: 2.25,
        quantity: 4,
        facing: 3,
        scannedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      },
    ],
  },
  {
    id: 'lot_mobile_102',
    name: 'Arrivage Boissons & Jus - Lot #402',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    operatorName: 'Sébastien M.',
    deviceName: 'Terminal Zebra TC21 (Android Native)',
    deviceType: 'native_terminal',
    status: 'received',
    targetTemplateId: 'Étiquette Promotionnelle Rouge (70x40 mm)',
    syncMethod: 'direct_lan',
    items: [
      {
        id: 'item_m4',
        code: '3250390667788',
        designation: "Jus d'Orange Pur Jus Sans Pulpe 1L",
        price: 2.19,
        quantity: 6,
        facing: 2,
        scannedAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
      },
      {
        id: 'item_m5',
        code: '3250390112233',
        designation: 'Limonade Artisanale Citron Bio 75cl',
        price: 1.89,
        quantity: 4,
        facing: 1,
        scannedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      },
    ],
  },
];

class MobileSyncService {
  private lots: MobileScanLot[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Array<(lots: MobileScanLot[]) => void> = [];
  private config: SyncConnectionConfig;

  constructor() {
    this.config = this.loadConfig();
    this.lots = this.loadLots();
    this.initBroadcastChannel();
    // Ensure credentials have SHA-256 token
    if (!this.config.credentials?.sessionToken) {
      this.regenerateCredentials();
    }
  }

  private loadConfig(): SyncConnectionConfig {
    try {
      const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load sync config', e);
    }

    const randomId = 'inst_' + Math.random().toString(36).substring(2, 7);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const hostname = typeof window !== 'undefined' ? window.location.hostname || '192.168.1.45' : '192.168.1.45';
    const port = typeof window !== 'undefined' ? Number(window.location.port) || 3000 : 3000;

    const initialCredentials: PWACredentials = {
      instanceId: randomId,
      instanceName: `Poste Atelier - ${randomId.toUpperCase()}`,
      sessionToken: 'initial_pending_hash',
      authPin: '4829',
      secretSalt: 'salt_' + Math.random().toString(36).substring(2),
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    };

    return {
      instanceId: randomId,
      instanceName: `Poste Atelier - ${randomId.toUpperCase()}`,
      hostAddress: hostname,
      port,
      publicHostUrl: origin,
      connectionMode: 'internet_public', // defaults to universally accessible URL
      credentials: initialCredentials,
      allowLanDiscovery: true,
      allowCellularTunnel: true,
      saveDataOnMetered: true,
    };
  }

  public async regenerateCredentials(): Promise<PWACredentials> {
    const creds = await generateSecureCredentials(this.config.instanceId, this.config.instanceName);
    this.config.credentials = creds;
    this.saveConfig({ credentials: creds });
    return creds;
  }

  public saveConfig(newConfig: Partial<SyncConnectionConfig>) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error(e);
    }
  }

  public getConfig(): SyncConnectionConfig {
    return { ...this.config };
  }

  private loadLots(): MobileScanLot[] {
    try {
      const saved = localStorage.getItem(STORAGE_LOTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load lots', e);
    }
    return SAMPLE_MOBILE_LOTS;
  }

  private persistLots() {
    try {
      localStorage.setItem(STORAGE_LOTS_KEY, JSON.stringify(this.lots));
    } catch (e) {
      console.error('Failed to persist lots', e);
    }
    this.notifyListeners();
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event: MessageEvent<MobileSyncMessage>) => {
          const msg = event.data;
          if (!msg || msg.senderInstanceId === this.config.instanceId) return;

          if (msg.type === 'LOT_PUSH' && msg.payload) {
            this.handleIncomingRemoteLot(msg.payload as MobileScanLot);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization error', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_LOTS_KEY && e.newValue) {
          try {
            this.lots = JSON.parse(e.newValue);
            this.notifyListeners();
          } catch {}
        }
      });
    }
  }

  private handleIncomingRemoteLot(lot: MobileScanLot) {
    const existingIndex = this.lots.findIndex((l) => l.id === lot.id);
    if (existingIndex >= 0) {
      this.lots[existingIndex] = lot;
    } else {
      this.lots.unshift(lot);
    }
    try {
      localStorage.setItem(STORAGE_LOTS_KEY, JSON.stringify(this.lots));
    } catch {}
    this.notifyListeners();
  }

  public subscribe(listener: (lots: MobileScanLot[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getLots());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    const copy = this.getLots();
    this.listeners.forEach((fn) => fn(copy));
  }

  public getLots(): MobileScanLot[] {
    return [...this.lots];
  }

  public getLotById(id: string): MobileScanLot | undefined {
    return this.lots.find((l) => l.id === id);
  }

  public saveLot(lot: MobileScanLot, broadcast: boolean = true) {
    const idx = this.lots.findIndex((l) => l.id === lot.id);
    if (idx >= 0) {
      this.lots[idx] = lot;
    } else {
      this.lots.unshift(lot);
    }
    this.persistLots();

    if (broadcast && this.broadcastChannel) {
      const msg: MobileSyncMessage = {
        type: 'LOT_PUSH',
        payload: lot,
        senderInstanceId: this.config.instanceId,
        timestamp: new Date().toISOString(),
      };
      this.broadcastChannel.postMessage(msg);
    }
  }

  public deleteLot(id: string) {
    this.lots = this.lots.filter((l) => l.id !== id);
    this.persistLots();
  }

  public updateLotStatus(id: string, status: MobileScanLot['status']) {
    const lot = this.getLotById(id);
    if (lot) {
      lot.status = status;
      lot.updatedAt = new Date().toISOString();
      this.saveLot(lot, true);
    }
  }

  /**
   * Converts a MobileScanLot into an array of ProductRecords for label imposition
   */
  public convertLotToProductRecords(lot: MobileScanLot): ProductRecord[] {
    return lot.items.map((item, index) => {
      const record: ProductRecord = {
        id: item.id || `rec_${Date.now()}_${index}`,
        ITEMNAME: item.designation || `Article scanné ${item.code}`,
        SELLING_PRICE: item.price ?? 0,
        PRODUCT_SCAN: item.code,
        PARTNO: item.code,
        PROMOPRICE: item.promoPrice ?? undefined,
        barcode: item.code,
        code: item.code,
        ean: item.code,
        sku: item.code,
        part_number: item.code,
        designation: item.designation || `Article scanné ${item.code}`,
        name: item.designation || `Article scanné ${item.code}`,
        libelle: item.designation || `Article scanné ${item.code}`,
        price: item.price ?? 0,
        prix: item.price ?? 0,
        prix_vente: item.price ?? 0,
        promo_price: item.promoPrice ?? undefined,
        remise_promo: item.promoPrice && item.price
          ? `${Math.round(((item.price - item.promoPrice) / item.price) * 100)}%`
          : undefined,
        unit_price: item.unitPrice || (item.price ? `${item.price.toFixed(2)} € / pièce` : ''),
        copies: item.quantity > 0 ? item.quantity : 1, // Desired label count
        quantity: item.quantity > 0 ? item.quantity : 1,
        facing: item.facing || 1,
        note: item.note || '',
        lot_id: lot.id,
        lot_name: lot.name,
        operator: lot.operatorName,
        scanned_at: item.scannedAt,
      };
      return record;
    });
  }

  /**
   * Resolves the target base URL according to connection mode (Internet Public vs Wi-Fi LAN vs Custom)
   */
  public getTargetHostUrl(mode?: NetworkConnectionMode): string {
    const selectedMode = mode || this.config.connectionMode;

    if (selectedMode === 'wifi_lan') {
      const portStr = this.config.port === 80 || this.config.port === 443 ? '' : `:${this.config.port}`;
      return `http://${this.config.hostAddress}${portStr}`;
    }

    if (selectedMode === 'custom_tunnel') {
      return this.config.publicHostUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    }

    // Default: 'internet_public' (e.g. current Cloud/LAN origin accessible over internet, 4G, 5G, or Wi-Fi)
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  }

  /**
   * Generates a cryptographic SHA-256 encrypted pairing URL with credentials & signature
   */
  public async getCryptedPairingUrl(mode?: NetworkConnectionMode): Promise<{ url: string; signature: string }> {
    const hostUrl = this.getTargetHostUrl(mode);
    return createEncryptedPairingPayload(this.config.credentials, hostUrl);
  }

  /**
   * Export lots bundle
   */
  public exportLotsBundle(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        instance: this.config,
        lots: this.lots,
      },
      null,
      2
    );
  }

  /**
   * Import lots bundle
   */
  public importLotsBundle(jsonString: string): number {
    try {
      const data = JSON.parse(jsonString);
      const incomingLots: MobileScanLot[] = Array.isArray(data) ? data : data.lots || [];
      if (!Array.isArray(incomingLots)) return 0;

      let count = 0;
      incomingLots.forEach((incoming) => {
        if (incoming && incoming.id && incoming.name && Array.isArray(incoming.items)) {
          this.saveLot(incoming, true);
          count++;
        }
      });
      return count;
    } catch (e) {
      console.error('Failed to import lots bundle', e);
      return 0;
    }
  }
}

export const mobileSyncService = new MobileSyncService();
