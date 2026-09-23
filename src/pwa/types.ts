export interface PWACredentials {
  instanceId: string;
  instanceName: string;
  sessionToken: string; // Cryptographic SHA-256 session token
  authPin: string; // 4-digit or 6-digit access PIN
  secretSalt: string;
  issuedAt: string;
  expiresAt: string;
}

export interface MobileScanItem {
  id: string;
  code: string; // Barcode, EAN13, Code128, QR Code, or Part Number
  designation?: string;
  price?: number;
  promoPrice?: number;
  unitPrice?: string;
  quantity: number; // Desired number of printed labels
  facing?: number;
  targetTemplateId?: string; // Optional gabarit override
  note?: string;
  scannedAt: string;
}

export interface MobileScanLot {
  id: string;
  name: string; // e.g., "Rayon Épicerie - Réassort Lundi"
  createdAt: string;
  updatedAt: string;
  operatorName: string;
  deviceName: string;
  deviceType: 'ios' | 'android' | 'pwa' | 'native_terminal';
  status: 'draft' | 'ready' | 'received' | 'spooled' | 'archived';
  targetTemplateId?: string; // Default template for this lot
  items: MobileScanItem[];
  sharedWithInstances?: string[];
  syncMethod?: 'direct_lan' | 'cellular_tunnel' | 'manual_sync' | 'p2p_relay';
  totalLabelsCount?: number;
  credentialsUsed?: {
    instanceId: string;
    tokenHash: string;
  };
}

export type NetworkConnectionMode = 'internet_public' | 'wifi_lan' | 'custom_tunnel';

export interface SyncConnectionConfig {
  instanceId: string;
  instanceName: string;
  hostAddress: string;
  port: number;
  publicHostUrl: string; // Public / Internet URL accessible via 4G/5G/WAN
  connectionMode: NetworkConnectionMode;
  credentials: PWACredentials;
  allowLanDiscovery: boolean;
  allowCellularTunnel: boolean;
  saveDataOnMetered: boolean;
}

export interface MobileSyncMessage {
  type: 'LOT_PUSH' | 'TEMPLATE_CATALOG_SYNC' | 'HEARTBEAT' | 'LOT_ACK' | 'INSTANCE_ANNOUNCE';
  payload: any;
  senderInstanceId: string;
  timestamp: string;
  authTokenHash?: string;
}
