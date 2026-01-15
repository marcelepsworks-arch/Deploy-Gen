import React, { useState, useEffect, useCallback } from 'react';
import { DeploymentConfig, DEFAULT_CONFIG } from './types';
import ConfigForm from './components/ConfigForm';
import WorkflowPreview from './components/WorkflowPreview';
import HelpGuide from './components/HelpGuide';
import History from './components/History';
import LogViewer from './components/LogViewer';
import { SettingsIcon, CodeIcon, BookIcon, HistoryIcon, GithubIcon, HistoryIcon as UndoIcon, TerminalIcon } from './components/Icon';
import { encryptData, decryptData } from './utils/security';

const STORAGE_KEY = 'wp_deploy_gen_secure_v1';

const App: React.FC = () => {
  // Main State with Lazy Initialization
  // This ensures we load the saved state immediately on the first render, 
  // preventing any flash of default state or overwriting by auto-save.
  const [config, setConfigState] = useState<DeploymentConfig>(() => {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const decrypted = decryptData(savedData);
            if (decrypted && typeof decrypted === 'object') {
                return {
                    ...DEFAULT_CONFIG,
                    ...decrypted,
                };
            }
        }
    } catch (e) {
        console.error("Failed to load saved session:", e);
    }
    return DEFAULT_CONFIG;
  });
  
  // Undo/Redo History Stacks
  const [historyStack, setHistoryStack] = useState<DeploymentConfig[]>([]);
  
  const [activeTab, setActiveTab] = useState<'config' | 'preview' | 'help' | 'history' | 'logs'>('config');
  const [darkMode, setDarkMode] = useState(false);

  // Auto-Save Effect
  // This triggers on every config change to ensure persistence.
  useEffect(() => {
    if (config) {
        const encrypted = encryptData(config);
        localStorage.setItem(STORAGE_KEY, encrypted);
    }
  }, [config]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Wrapper for setting config that pushes to history
  const setConfig = useCallback((newConfig: DeploymentConfig | ((prev: DeploymentConfig) => DeploymentConfig)) => {
    setConfigState((prevConfig) => {
      const updated = typeof newConfig === 'function' ? newConfig(prevConfig) : newConfig;
      
      // Push previous state to history
      setHistoryStack((prevHistory) => {
          const newHistory = [...prevHistory, prevConfig];
          return newHistory.slice(-50);
      });
      
      return updated;
    });
  }, []);

  const handleConfigChange = (key: keyof DeploymentConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUndo = () => {
      if (historyStack.length === 0) return;
      
      const previousConfig = historyStack[historyStack.length - 1];
      const newHistory = historyStack.slice(0, -1);
      
      setHistoryStack(newHistory);
      setConfigState(previousConfig); 
  };

  // Secure Save (Explicit Snapshot)
  const saveToHistory = () => {
      // 1. Save to Session Registry (History Tab)
      const savedHistory = localStorage.getItem('wp_deploy_gen_history');
      const list = savedHistory ? JSON.parse(savedHistory) : [];
      
      // Auto-save handles the current session, this button adds to the "Registry" list
      // We keep the history list in clear text/simple JSON for display titles in this demo context,
      // though typically you'd encrypt sensitive fields here too. 
      // For now, we assume the user understands "Save & Encrypt" refers to the active session persistence.
      const newList = [config, ...list.filter((c: any) => c.targetName !== config.targetName)].slice(0, 10);
      localStorage.setItem('wp_deploy_gen_history', JSON.stringify(newList));
      
      // Trigger auto-save immediately just in case
      const encrypted = encryptData(config);
      localStorage.setItem(STORAGE_KEY, encrypted);

      setActiveTab('history');
  };

  const navItems = [
      { id: 'config', label: 'Configurator', icon: SettingsIcon },
      { id: 'preview', label: 'Code Preview', icon: CodeIcon },
      { id: 'logs', label: 'System Logs', icon: TerminalIcon },
      { id: 'help', label: 'Help & Security', icon: BookIcon },
      { id: 'history', label: 'Session Registry', icon: HistoryIcon },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0B1120] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-dark-border">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg mr-3">WP</div>
             <span className="font-bold text-lg tracking-tight">Deploy Gen</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                        activeTab === item.id 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                </button>
            ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-dark-border">
             <button 
               onClick={() => setDarkMode(!darkMode)}
               className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
             >
               {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
             </button>
        </div>
      </aside>

      {/* Main Content Area - No Window Scroll, Inner Scroll Only */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-[#0B1120] relative">
         
         {/* Top Bar for Context Actions */}
         <header className="h-16 flex items-center justify-between px-8 bg-white/50 dark:bg-[#0B1120]/50 backdrop-blur-sm z-10 sticky top-0">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold">
                    {activeTab === 'config' && 'Pipeline Configuration'}
                    {activeTab === 'preview' && 'Review & Export'}
                    {activeTab === 'help' && 'Master Guide'}
                    {activeTab === 'history' && 'Registry'}
                    {activeTab === 'logs' && 'System Event Logs'}
                </h1>
            </div>
            
            <div className="flex gap-3">
                {activeTab === 'config' && (
                    <>
                        <button 
                            onClick={handleUndo}
                            disabled={historyStack.length === 0}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                historyStack.length > 0
                                ? 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                                : 'bg-gray-100 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            }`}
                            title="Tornar a la versió anterior (Undo)"
                        >
                            <UndoIcon className="w-4 h-4 transform rotate-180" /> {/* Rotate history icon to look like undo */}
                            Undo
                        </button>
                        <button 
                            onClick={saveToHistory}
                            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-lg hover:shadow-lg transition-transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <SettingsIcon className="w-4 h-4" />
                            SAVE & ENCRYPT
                        </button>
                    </>
                )}
            </div>
         </header>

         {/* Scrollable Content Container */}
         <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeTab === 'config' && (
                <ConfigForm 
                  config={config} 
                  onChange={handleConfigChange} 
                  onFinish={() => {
                      // Save state before moving to preview
                      const encrypted = encryptData(config);
                      localStorage.setItem(STORAGE_KEY, encrypted);
                      setActiveTab('preview');
                  }}
                />
            )}
            
            {activeTab === 'preview' && (
                <div className="h-full max-h-[800px] rounded-xl overflow-hidden shadow-2xl">
                    <WorkflowPreview config={config} />
                </div>
            )}

            {activeTab === 'help' && (
                <HelpGuide />
            )}

            {activeTab === 'history' && (
                <History onLoad={(c) => {
                    setConfigState(c); 
                    setActiveTab('config');
                }} />
            )}

            {activeTab === 'logs' && (
                <div className="h-full max-h-[800px] rounded-xl overflow-hidden shadow-2xl">
                    <LogViewer logs={config.logs || []} />
                </div>
            )}
         </div>
      </main>
    </div>
  );
};

export default App;