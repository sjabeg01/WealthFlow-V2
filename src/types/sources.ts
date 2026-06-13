// --- CORE TYPES ---

export type SourceType = 'csv' | 'bank' | 'api' | 'manual';

export type SourceStatus = 'active' | 'syncing' | 'error' | 'disconnected';

export type SyncStatus = 'success' | 'failed' | 'partial' | 'running';

export interface DataSource {
  id: string;
  userId: string;
  type: SourceType;
  label: string;
  status: SourceStatus;
  lastSyncAt?: string;
  lastSyncStatus?: SyncStatus;
  lastErrorMessage?: string;
  metadata: Record<string, any>;
  transactionCount: number;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncLog {
  id: string;
  sourceId: string;
  status: SyncStatus;
  transactionsFound: number;
  transactionsImported: number;
  transactionsSkipped: number;
  errorMessage?: string;
  errorDetails?: Record<string, any>;
  durationMs: number;
  startedAt: string;
  completedAt?: string;
}

export interface CSVSourceMetadata {
  fileName: string;
  fileSize: number;
  detectedBank: string | null;
  transactionCount: number;
}

export interface BankSourceMetadata {
  bankName: string;
  bankCode: string;
  lastSyncAt: string;
}

// --- COMPONENT PROPS ---

export interface SetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSourceAdded: (source: DataSource) => void;
}

export interface DataSourcesPanelProps {
  sources: DataSource[];
  loading: boolean;
  onAddSource: () => void;
  onSourceClick: (source: DataSource) => void;
}
