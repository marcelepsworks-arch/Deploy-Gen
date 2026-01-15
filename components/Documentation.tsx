import React from 'react';
import { InfoIcon, ServerIcon, GithubIcon } from './Icon';

const Documentation: React.FC = () => {
  return (
    <div className="space-y-8">
      
      {/* Secrets Section */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6 transition-colors duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
             <GithubIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Secrets & Keys</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
          Navigate to: <span className="font-mono bg-gray-100 dark:bg-dark-bg px-1 rounded">Settings &gt; Secrets & variables &gt; Actions</span>
        </p>
        <div className="overflow-x-auto border border-gray-100 dark:border-dark-border rounded-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-dark-bg text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-4 py-3">Variable Name</th>
                <th className="px-4 py-3">Value Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border bg-white dark:bg-dark-surface">
              <tr>
                <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400 font-medium">SERVER_IP</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">Server Hostname (e.g., <code className="text-xs">ftp.mysite.com</code>) or IP.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400 font-medium">FTP_USER</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">SSH/SFTP Username.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400 font-medium">FTP_PASSWORD</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs">If Auth = Password</span>
                    <br/>Your SFTP password.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-purple-600 dark:text-purple-400 font-medium">SSH_PRIVATE_KEY</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs">If Auth = SSH Key</span>
                    <br/>The content of your private key (pem/rsa).
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Path Logic Section */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6 transition-colors duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
             <ServerIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Rollback & Recovery Strategy</h2>
        </div>
        
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            <p>
              The generated workflow includes a <code className="bg-gray-100 dark:bg-dark-bg px-1 rounded text-gray-800 dark:text-gray-200">workflow_dispatch</code> trigger.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-lg border border-gray-100 dark:border-dark-border">
                <h4 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  How to Rollback
                </h4>
                <ol className="list-decimal list-inside space-y-2 ml-1 text-gray-600 dark:text-gray-400">
                  <li>Go to <strong>GitHub Actions</strong> tab.</li>
                  <li>Select "Deploy" workflow on the left.</li>
                  <li>Click <strong>Run workflow</strong> dropdown.</li>
                  <li>In "Git Ref", paste the <strong>Commit SHA</strong> or <strong>Tag</strong> of the version you want to restore.</li>
                </ol>
              </div>

              <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-lg border border-gray-100 dark:border-dark-border">
                 <h4 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Registry (Logs)
                </h4>
                <p>
                    With "Deployment Registry" enabled, every deploy appends to <code className="text-xs bg-white dark:bg-dark-surface px-1 border rounded dark:border-dark-border">deploy_log.txt</code> on your server.
                </p>
                <p className="mt-2 text-xs italic opacity-80">
                    Use this file to audit when changes were made and which commit is currently live.
                </p>
              </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default Documentation;
