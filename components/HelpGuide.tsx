import React, { useState } from 'react';
import { GithubIcon, ServerIcon, CheckIcon, BookIcon, GlobeIcon } from './Icon';

const HelpGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
      { id: 'getting-started', label: 'Getting Started' },
      { id: 'git-strategy', label: 'Git Strategy' },
      { id: 'wp-api', label: 'WP REST API' },
      { id: 'server-config', label: 'Server & Paths' },
      { id: 'security', label: 'Security & Secrets' },
      { id: 'troubleshooting', label: 'Troubleshooting' },
  ];

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-fade-in">
      
      {/* Table of Contents */}
      <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <BookIcon className="w-5 h-5"/> Guide Contents
                  </h3>
              </div>
              <nav className="p-2 space-y-1">
                  {sections.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeSection === s.id 
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg'
                        }`}
                      >
                          {s.label}
                      </button>
                  ))}
              </nav>
          </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          
          {activeSection === 'getting-started' && (
              <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
                      <h2 className="text-3xl font-bold mb-4">Mastering Automated Deployments</h2>
                      <p className="text-blue-100 text-lg leading-relaxed">
                          Welcome to the professional standard for WordPress DevOps. This tool bridges the gap between modern Git workflows and traditional SFTP hosting.
                      </p>
                  </div>
                  
                  <div className="prose dark:prose-invert max-w-none">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">How it works</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                          Instead of manually dragging files with FileZilla, we create a <strong>GitHub Action</strong>. This is a script that lives in your repository. Whenever you push code to GitHub, GitHub's servers wake up, read this script, and securely transfer only the modified files to your WordPress server.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                          <div className="p-4 border rounded-lg bg-white dark:bg-dark-surface border-gray-200 dark:border-gray-700">
                              <span className="text-2xl mb-2 block">💻</span>
                              <h4 className="font-bold">1. Local Dev</h4>
                              <p className="text-xs text-gray-500">You write code on your machine and push to GitHub.</p>
                          </div>
                          <div className="p-4 border rounded-lg bg-white dark:bg-dark-surface border-gray-200 dark:border-gray-700">
                              <span className="text-2xl mb-2 block">🐙</span>
                              <h4 className="font-bold">2. GitHub Action</h4>
                              <p className="text-xs text-gray-500">GitHub detects the push and starts the "Deploy" job.</p>
                          </div>
                          <div className="p-4 border rounded-lg bg-white dark:bg-dark-surface border-gray-200 dark:border-gray-700">
                              <span className="text-2xl mb-2 block">🚀</span>
                              <h4 className="font-bold">3. Live Site</h4>
                              <p className="text-xs text-gray-500">Files arrive on your server instantly. No downtime.</p>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeSection === 'git-strategy' && (
              <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Git Repository Strategy</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                      It is crucial to structure your repository correctly. Do not put the entire WordPress core installation in Git unless you are an advanced user maintaining a full-site repo (Bedrock/Roots).
                  </p>

                  <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                      <h4 className="font-bold text-yellow-800 dark:text-yellow-200">Recommended Structure</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Create a separate repository for <strong>each</strong> custom theme or plugin.
                      </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-dark-border">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2">✅ Correct Usage</h4>
                          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                              <li>• Repo <code className="bg-gray-100 dark:bg-dark-bg px-1 rounded">my-theme</code> deploys to <code className="bg-gray-100 dark:bg-dark-bg px-1 rounded">.../themes/my-theme</code></li>
                              <li>• Repo <code className="bg-gray-100 dark:bg-dark-bg px-1 rounded">my-plugin</code> deploys to <code className="bg-gray-100 dark:bg-dark-bg px-1 rounded">.../plugins/my-plugin</code></li>
                          </ul>
                      </div>
                       <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-dark-border">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2">❌ Incorrect Usage</h4>
                          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                              <li>• Repo contains <code className="bg-gray-100 dark:bg-dark-bg px-1 rounded">wp-admin</code>, <code className="bg-gray-100 dark:bg-dark-bg px-1 rounded">wp-includes</code></li>
                              <li>• Deploying a single theme to the <code className="bg-gray-100 dark:bg-dark-bg px-1 rounded">public_html</code> root (this will wipe your site).</li>
                          </ul>
                      </div>
                  </div>
              </div>
          )}

          {activeSection === 'wp-api' && (
              <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connecting via REST API</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                      The "Live Connect" step uses the WordPress REST API to verify your destination before you configure deployments.
                  </p>

                  <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-400 p-4 rounded-r-lg">
                      <h4 className="font-bold text-blue-800 dark:text-blue-200">What we check</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          We send a GET request to <code className="font-mono bg-white dark:bg-black/20 px-1 rounded">https://yoursite.com/wp-json/</code>. This is a public endpoint on 99% of WordPress sites that returns the site name and basic status.
                      </p>
                  </div>
                  
                  <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 dark:text-white">Common Connection Issues</h4>
                      <div className="bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-200 dark:border-dark-border">
                          <h5 className="font-bold text-red-500 text-sm">CORS Error (Network Error)</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              If you see a network error, your WordPress site might be blocking requests from this web app domain. This is a browser security feature. 
                              <br/><br/>
                              <strong>Fix:</strong> You can usually ignore this if you are sure the URL is correct. The deployment (SFTP) does not use the REST API, so deployment will still work even if this check fails.
                          </p>
                      </div>
                       <div className="bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-200 dark:border-dark-border">
                          <h5 className="font-bold text-yellow-500 text-sm">404 Not Found</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              This means the REST API is disabled or your Permalinks are not configured. Try going to WP Admin > Settings > Permalinks and clicking "Save Changes".
                          </p>
                      </div>
                  </div>
              </div>
          )}

          {activeSection === 'server-config' && (
              <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Finding your Remote Path</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                      The most common error is a wrong destination path. This causes files to land in the wrong folder or not appear at all.
                  </p>

                  <div className="bg-gray-800 text-white p-6 rounded-xl shadow-lg">
                      <h4 className="font-mono font-bold text-green-400 mb-4">$ How to verify path</h4>
                      <ol className="list-decimal list-inside space-y-3 font-mono text-sm text-gray-300">
                          <li>Open FileZilla or your FTP client.</li>
                          <li>Connect to your server.</li>
                          <li>Navigate into <code className="text-white">wp-content</code>.</li>
                          <li>Navigate into <code className="text-white">themes</code>.</li>
                          <li>Look at the "Remote Site" bar at the top of FileZilla.</li>
                          <li>Copy that path exactly.</li>
                      </ol>
                  </div>
              </div>
          )}
          
           {activeSection === 'security' && (
              <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Secrets & SSH Keys</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                      Never hardcode passwords in `main.yml`. We use GitHub Secrets to inject them safely at runtime.
                  </p>
                  
                  <div className="border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
                      <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-dark-bg">
                              <tr>
                                  <th className="px-6 py-3 text-left font-bold text-gray-700 dark:text-gray-300">Secret Name</th>
                                  <th className="px-6 py-3 text-left font-bold text-gray-700 dark:text-gray-300">Content</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-100 dark:divide-dark-border">
                               <tr>
                                  <td className="px-6 py-4 font-mono text-blue-600">SERVER_IP</td>
                                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">ftp.example.com or 192.168.1.1</td>
                              </tr>
                              <tr>
                                  <td className="px-6 py-4 font-mono text-blue-600">FTP_USER</td>
                                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">your_sftp_username</td>
                              </tr>
                              <tr>
                                  <td className="px-6 py-4 font-mono text-purple-600">SSH_PRIVATE_KEY</td>
                                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">The entire content of your private key (Starts with -----BEGIN OPENSSH...)</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
          
          {activeSection === 'troubleshooting' && (
              <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Troubleshooting Common Errors</h2>
                  
                  <div className="space-y-4">
                      <details className="group bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border open:ring-2 open:ring-blue-500/20">
                          <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-gray-800 dark:text-white">
                              <span>Error: "Remote host verification failed"</span>
                              <span className="transition group-open:rotate-180">▼</span>
                          </summary>
                          <div className="p-4 pt-0 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-dark-border mt-2">
                              This means GitHub doesn't trust your server. You usually need to disable strict host checking in the Action config (our generator does this automatically via the action defaults usually, or you can add strict: false).
                          </div>
                      </details>

                      <details className="group bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border open:ring-2 open:ring-blue-500/20">
                          <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-gray-800 dark:text-white">
                              <span>Files are deleting on the server!</span>
                              <span className="transition group-open:rotate-180">▼</span>
                          </summary>
                          <div className="p-4 pt-0 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-dark-border mt-2">
                              The `ftp-deploy-action` tries to mirror Git to the Server. If a file (like uploads or node_modules) is on the server but NOT in Git, it will be deleted. <strong>Ensure your 'exclude' list is correct.</strong> We automatically add `wp-content/uploads/**` to the exclude list for Root deployments.
                          </div>
                      </details>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};

export default HelpGuide;
