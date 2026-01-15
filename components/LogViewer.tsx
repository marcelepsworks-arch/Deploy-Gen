import React, { useState } from 'react';
import { LogEntry } from '../types';
import { InfoIcon, TerminalIcon } from './Icon';

interface LogViewerProps {
  logs: LogEntry[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const [filter, setFilter] = useState<'all' | 'error'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLogs = logs.filter(log => {
      if (filter === 'error') return log.level === 'error';
      return true;
  }).reverse(); // Show newest first

  return (
    <div className="h-full flex flex-col bg-gray-900 dark:bg-[#0f1115] text-gray-300 font-mono text-sm border-l border-gray-700 dark:border-gray-800">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 dark:bg-[#161b22] border-b border-gray-700 dark:border-gray-800">
        <div className="flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-gray-400" />
            <h2 className="font-bold text-gray-200">System Logs</h2>
            <span className="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-400">{logs.length}</span>
        </div>
        
        <div className="flex bg-gray-700 rounded-lg p-1">
             <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    filter === 'all' 
                    ? 'bg-gray-600 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
             >
                All Events
             </button>
             <button
                onClick={() => setFilter('error')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    filter === 'error' 
                    ? 'bg-red-900/50 text-red-200 shadow-sm' 
                    : 'text-gray-400 hover:text-red-300'
                }`}
             >
                Errors Only
             </button>
        </div>
      </div>

      {/* Log List */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4 space-y-2">
          {filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                  <TerminalIcon className="w-12 h-12 mb-4" />
                  <p>No logs recorded in this session.</p>
              </div>
          ) : (
              filteredLogs.map(log => (
                  <div key={log.id} className="group flex flex-col bg-gray-800/50 dark:bg-[#161b22]/50 border border-gray-700 dark:border-gray-800 rounded-lg overflow-hidden hover:border-gray-600 transition-all">
                      <div 
                        className="flex items-start gap-3 p-3 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      >
                          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                              log.level === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                              log.level === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                              log.level === 'warning' ? 'bg-yellow-500' :
                              'bg-blue-500'
                          }`} />
                          
                          <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] text-gray-500">{log.timestamp}</span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">
                                      {log.source}
                                  </span>
                              </div>
                              <p className={`whitespace-pre-wrap break-words ${log.level === 'error' ? 'text-red-300' : 'text-gray-300'}`}>
                                  {log.message}
                              </p>
                          </div>

                          {log.details && (
                              <button className="text-xs text-gray-500 hover:text-white transition-colors">
                                  {expandedId === log.id ? 'Hide' : 'Details'}
                              </button>
                          )}
                      </div>

                      {/* Expanded Details */}
                      {expandedId === log.id && log.details && (
                          <div className="border-t border-gray-700/50 bg-black/20 p-3">
                              <pre className="text-xs text-gray-400 overflow-x-auto p-2 bg-black/30 rounded border border-gray-800">
                                  {log.details}
                              </pre>
                          </div>
                      )}
                  </div>
              ))
          )}
      </div>
    </div>
  );
};

export default LogViewer;