
export type DeployTarget = 'theme' | 'plugin' | 'custom' | 'root';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'error' | 'success' | 'warning';
  source: string; // e.g., 'Analysis', 'Connection', 'System'
  message: string;
  details?: string; // JSON string or stack trace
}

export interface RepoDetails {
  language: string;
  framework: string;
  complexity: string; // e.g., "High", "Standard"
  summary: string;
  isWordPress?: boolean; // New field to track if it's WP ecosystem
  creationDate?: string;
  lastCommitDate?: string;
  fileCount?: string;
}

export interface WpConnectionDetails {
  status: 'idle' | 'connected' | 'error';
  siteName: string;
  siteDescription: string;
  version: string;
  namespaces: string[];
}

export interface DeploymentConfig {
  id?: string;
  name?: string;
  gitUrl: string;
  repoDetails: RepoDetails;
  
  // Wizard State
  currentStep: number;

  // System Logs
  logs: LogEntry[];
  
  // New WP Connection Fields
  wpUrl: string;
  wpConnection: WpConnectionDetails;
  
  // FTP Details for saving profile
  ftpHost?: string;
  ftpUser?: string;
  ftpPassword?: string;
  ftpPort?: string;

  target: DeployTarget;
  targetName: string;
  branch: string;
  protocol: 'sftp' | 'ftp';
  authType: 'password' | 'ssh_key';
  remoteBase: string;
  notifications: boolean;
  enableRollback: boolean;
  createLog: boolean;
  dryRun: boolean;
  
  // New Strategy Field
  deploymentMode: 'sync' | 'add';
  
  // New Webhook Field
  webhookUrl?: string;
}

export const DEFAULT_CONFIG: DeploymentConfig = {
  gitUrl: '',
  currentStep: 1,
  logs: [],
  repoDetails: {
    language: 'PHP',
    framework: 'WordPress',
    complexity: 'Standard',
    summary: 'Waiting for analysis...',
    isWordPress: true,
    creationDate: '-',
    lastCommitDate: '-',
    fileCount: '-'
  },
  // Default WP Config
  wpUrl: '',
  wpConnection: {
    status: 'idle',
    siteName: '',
    siteDescription: '',
    version: '',
    namespaces: []
  },
  ftpHost: '',
  ftpUser: '',
  ftpPassword: '',
  ftpPort: '',
  target: 'theme',
  targetName: 'my-project',
  branch: 'main',
  protocol: 'sftp',
  authType: 'ssh_key',
  remoteBase: '/public_html/wp-content/themes/',
  notifications: true,
  enableRollback: true,
  createLog: true,
  dryRun: false,
  deploymentMode: 'sync', // Default to Smart Sync (Install/Update mirror)
  webhookUrl: ''
};
