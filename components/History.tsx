import React from 'react';
import { DeploymentConfig } from '../types';
import { CopyIcon } from './Icon';

interface HistoryProps {
  onLoad: (config: DeploymentConfig) => void;
}

const History: React.FC<HistoryProps> = ({ onLoad }) => {
  const [history, setHistory] = React.useState<DeploymentConfig[]>([]);

  React.useEffect(() => {
    // In a real app, this would read from localStorage. 
    // For demo purposes, we simulate reading or initialize.
    const saved = localStorage.getItem('wp_deploy_gen_history');
    if (saved) {
        setHistory(JSON.parse(saved));
    }
  }, []);

  const clearHistory = () => {
      localStorage.removeItem('wp_deploy_gen_history');
      setHistory([]);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Session Registry</h2>
                <p className="text-sm text-gray-500">Configurations you have saved or generated recently.</p>
            </div>
            {history.length > 0 && (
                <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-700">Clear Registry</button>
            )}
        </div>

        {history.length === 0 ? (
            <div className="bg-white dark:bg-dark-surface p-12 rounded-xl border border-gray-200 dark:border-dark-border text-center">
                <span className="text-4xl mb-4 block">📜</span>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Registry Empty</h3>
                <p className="text-gray-500 text-sm mt-2">
                    Save a configuration in the "Config" tab to see it here.
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {history.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-200 dark:border-dark-border flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                    item.target === 'theme' ? 'bg-purple-100 text-purple-700' :
                                    item.target === 'plugin' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {item.target}
                                </span>
                                <h4 className="font-bold text-gray-800 dark:text-white">{item.targetName}</h4>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 font-mono">{item.remoteBase}</p>
                        </div>
                        <button 
                            onClick={() => onLoad(item)}
                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                            LOAD CONFIG
                        </button>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default History;
