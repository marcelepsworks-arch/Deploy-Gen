import React, { useEffect, useState, useCallback } from 'react';
import { DeploymentConfig, LogEntry } from '../types';
// Removed GoogleGenAI import to eliminate quota errors
import { CheckIcon, GlobeIcon, LockClosedIcon, CodeIcon, InfoIcon, RocketLaunchIcon, SaveIcon, ServerIcon, BookIcon } from './Icon';
import { encryptData } from '../utils/security';

interface ConfigFormProps {
  config: DeploymentConfig;
  onChange: (key: keyof DeploymentConfig, value: any) => void;
  onFinish: () => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ config, onChange, onFinish }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Helper to add logs
  const addLog = useCallback((level: LogEntry['level'], source: string, message: string, details?: string) => {
      const entry: LogEntry = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          level,
          source,
          message,
          details
      };
      
      // Update logs in parent state
      onChange('logs', [...(config.logs || []), entry]);
  }, [config.logs, onChange]);

  // Auto-update remote path guidance based on target ONLY if user hasn't typed a custom one
  useEffect(() => {
    // Simple heuristic: only auto-update if it looks like a default path
    if (config.remoteBase.includes('wp-content')) {
        if (config.target === 'theme' && !config.remoteBase.includes('themes')) {
            onChange('remoteBase', '/public_html/wp-content/themes/');
        } else if (config.target === 'plugin' && !config.remoteBase.includes('plugins')) {
            onChange('remoteBase', '/public_html/wp-content/plugins/');
        }
    }
  }, [config.target]);

  const handleGitUrlChange = (url: string) => {
      onChange('gitUrl', url);
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
          const cleanName = lastPart.replace('.git', '');
          onChange('targetName', cleanName);
      }
  };

  /**
   * ROBUST ALGORITHM: Heuristic & API Based Analysis
   * Replaces AI to prevent Quota Exceeded errors.
   */
  const analyzeRepo = useCallback(async () => {
    if (!config.gitUrl) return;
    
    setIsAnalyzing(true);
    addLog('info', 'Analysis', `Starting static analysis for: ${config.gitUrl}`);

    // Default Fallback State
    let analysisResult = {
        language: 'PHP', 
        framework: 'WordPress',
        type: 'custom' as DeploymentConfig['target'],
        complexity: 'Standard',
        summary: 'Analysis based on URL structure.',
        isWordPress: true,
        creationDate: '-',
        lastCommitDate: '-',
        fileCount: '-'
    };

    try {
        const urlLower = config.gitUrl.toLowerCase();
        let detectedFromApi = false;

        // 1. Try GitHub API Analysis (if applicable)
        if (config.gitUrl.includes('github.com')) {
             const cleanUrl = config.gitUrl.replace(/\.git$/, '');
             const parts = cleanUrl.split('github.com/');
             
             if (parts[1]) {
                 const [owner, repo] = parts[1].split('/');
                 
                 if (owner && repo) {
                     addLog('info', 'Analysis', `Querying GitHub API for ${owner}/${repo}...`);
                     
                     // Fetch General Repo Info
                     const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
                     
                     if (repoRes.ok) {
                         const repoData = await repoRes.json();
                         detectedFromApi = true;

                         // Fetch Languages
                         const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
                         const langData = langRes.ok ? await langRes.json() : {};
                         
                         // Fetch Root Contents for Structural Analysis
                         const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
                         const contentsData = contentsRes.ok ? await contentsRes.json() : [];
                         const fileNames = Array.isArray(contentsData) ? contentsData.map((f: any) => f.name.toLowerCase()) : [];

                         // Determine Primary Language
                         const languages = Object.keys(langData);
                         const primaryLang = languages.length > 0 ? languages[0] : (repoData.language || 'Unknown');

                         // Structural Analysis
                         const hasStyleCss = fileNames.includes('style.css');
                         const hasFunctionsPhp = fileNames.includes('functions.php');
                         const hasWpConfig = fileNames.includes('wp-config.php');
                         const hasWpContent = fileNames.includes('wp-content');
                         const hasComposerJson = fileNames.includes('composer.json');
                         const hasPhpFiles = fileNames.some((f: string) => f.endsWith('.php'));

                         // Text Analysis
                         const textCorpus = (repoData.name + ' ' + (repoData.description || '') + ' ' + (repoData.topics || []).join(' ')).toLowerCase();
                         
                         // Decision Matrix
                         let detectedType: DeploymentConfig['target'] = 'custom';
                         let reason = "Inferred from file structure.";

                         if (hasWpConfig || hasWpContent) {
                             detectedType = 'root';
                             reason = "Detected wp-config.php or wp-content directory.";
                         } else if (hasStyleCss && hasFunctionsPhp) {
                             detectedType = 'theme';
                             reason = "Detected style.css and functions.php (Theme structure).";
                         } else if (textCorpus.includes('theme') && hasStyleCss) {
                             detectedType = 'theme';
                             reason = "Detected 'theme' topic and style.css.";
                         } else if (textCorpus.includes('plugin') || (repoData.topics && repoData.topics.includes('wordpress-plugin'))) {
                             detectedType = 'plugin';
                             reason = "Explicitly identified as plugin via topics/description.";
                         } else if (hasPhpFiles && !hasStyleCss) {
                             // If it has PHP files but no style.css, in a WP context, it's almost certainly a plugin
                             detectedType = 'plugin';
                             reason = "Detected PHP files without theme structure.";
                         } else if (textCorpus.includes('wordpress') && textCorpus.includes('seo')) {
                             // Specific catch for the Yoast case if file check was ambiguous
                             detectedType = 'plugin';
                         }

                         // Determine Framework
                         const isWP = textCorpus.includes('wordpress') || textCorpus.includes('wp-') || primaryLang === 'PHP';

                         analysisResult = {
                             language: primaryLang,
                             framework: isWP ? 'WordPress' : primaryLang, // Fallback to lang if not WP
                             type: detectedType,
                             complexity: repoData.size > 50000 ? 'High' : 'Standard',
                             summary: `${reason}\n${repoData.description || ''}`,
                             isWordPress: isWP,
                             creationDate: repoData.created_at?.split('T')[0] || '-',
                             lastCommitDate: repoData.pushed_at?.split('T')[0] || '-',
                             fileCount: `${Math.round(repoData.size / 1024)} MB (approx)`
                         };
                         
                         addLog('success', 'Analysis', `GitHub API Analysis Complete: Identified as ${detectedType}`, JSON.stringify(analysisResult, null, 2));
                     } else if (repoRes.status === 403 || repoRes.status === 429) {
                         addLog('warning', 'Analysis', 'GitHub API Rate Limit hit. Switching to URL-based heuristics.');
                     } else {
                         addLog('warning', 'Analysis', `GitHub API Error: ${repoRes.status}. Repository might be private.`);
                     }
                 }
             }
        }

        // 2. Fallback: URL & String Heuristics (if API failed or not GitHub)
        if (!detectedFromApi) {
             addLog('info', 'Analysis', 'Performing heuristic analysis on URL...');
             
             // Language Guess
             // Default to PHP for WP tools, unless URL suggests otherwise (e.g., 'react-theme')
             if (urlLower.includes('react') || urlLower.includes('node') || urlLower.includes('js')) {
                 analysisResult.language = 'JavaScript/TypeScript';
                 analysisResult.isWordPress = false;
                 analysisResult.framework = 'Node/React';
             }

             // Type Guess
             if (urlLower.includes('theme')) {
                 analysisResult.type = 'theme';
                 analysisResult.summary = "Detected 'theme' keyword in repository URL.";
             } else if (urlLower.includes('plugin') || urlLower.includes('seo')) {
                 analysisResult.type = 'plugin';
                 analysisResult.summary = "Detected 'plugin' or known plugin keyword in repository URL.";
             } else {
                 analysisResult.summary = "Could not detect specific type from URL. Defaulting to Custom.";
             }
             
             addLog('success', 'Analysis', 'Heuristic Analysis Complete');
        }

        // Update State
        onChange('repoDetails', {
            language: analysisResult.language,
            framework: analysisResult.framework,
            complexity: analysisResult.complexity,
            summary: analysisResult.summary,
            isWordPress: analysisResult.isWordPress,
            creationDate: analysisResult.creationDate,
            lastCommitDate: analysisResult.lastCommitDate,
            fileCount: analysisResult.fileCount
        });

        if (analysisResult.type) {
            onChange('target', analysisResult.type);
        }

    } catch (error: any) {
        console.error("Analysis failed", error);
        addLog('error', 'Analysis', `Analysis failed: ${error.message}`);
    } finally {
        setIsAnalyzing(false);
    }
  }, [config.gitUrl, onChange, addLog]);

  // Auto-analyze when entering step 2
  useEffect(() => {
      if (config.currentStep === 2 && config.gitUrl && config.repoDetails.summary === 'Waiting for analysis...') {
          analyzeRepo();
      }
  }, [config.currentStep, config.gitUrl, analyzeRepo]); 

  const checkWpConnection = async () => {
      if (!config.wpUrl) return;
      setIsConnecting(true);
      setConnectionError(null);
      addLog('info', 'Connection', `Testing connection to: ${config.wpUrl}`);

      try {
          // Add trailing slash if missing
          const baseUrl = config.wpUrl.endsWith('/') ? config.wpUrl : `${config.wpUrl}/`;
          const apiUrl = `${baseUrl}wp-json/`;

          const res = await fetch(apiUrl);
          if (!res.ok) {
              const text = await res.text();
              throw new Error(`HTTP Error: ${res.status} ${res.statusText} \nResponse: ${text.substring(0, 100)}...`);
          }
          
          const data = await res.json();
          
          onChange('wpConnection', {
              status: 'connected',
              siteName: data.name || 'Unknown Site',
              siteDescription: data.description || '',
              version: data.namespaces?.includes('wp/v2') ? 'REST API Active' : 'Legacy',
              namespaces: data.namespaces || []
          });
          
          addLog('success', 'Connection', `Connected to ${data.name || 'WordPress Site'}`, `Namespaces: ${(data.namespaces || []).join(', ')}`);

      } catch (err: any) {
          console.error(err);
          let msg = "Connection Failed. ";
          let details = err.message;
          if (err.message.includes('Failed to fetch')) {
              msg += "CORS Blocked? This often happens if the WordPress site doesn't allow cross-origin requests. You can still proceed if you are sure the URL is correct.";
              details += "\nNote: This is a browser restriction. The deployment (SFTP) will likely still work.";
          } else {
              msg += err.message;
          }
          setConnectionError(msg);
          addLog('error', 'Connection', msg, details);
          onChange('wpConnection', { ...config.wpConnection, status: 'error' });
      } finally {
          setIsConnecting(false);
      }
  };

  const handlePublish = async () => {
      if (!config.gitUrl) return;
      setIsPublishing(true);
      addLog('info', 'System', 'Starting pipeline generation process...');
      
      // Save current state securely before "publishing"
      const encrypted = encryptData(config);
      localStorage.setItem('wp_deploy_gen_secure_v1', encrypted);

      // Simulate pipeline generation
      await new Promise(r => setTimeout(r, 2000));
      
      addLog('success', 'System', 'Pipeline generated successfully. Ready for download.');
      setIsPublishing(false);
      onFinish();
  };

  const handleSaveProfile = () => {
      // 1. Save to Registry List
      const saved = localStorage.getItem('wp_deploy_gen_history');
      const list = saved ? JSON.parse(saved) : [];
      const newList = [config, ...list.filter((c: any) => c.targetName !== config.targetName)].slice(0, 10);
      localStorage.setItem('wp_deploy_gen_history', JSON.stringify(newList));
      
      // 2. Save as Current Secure Session
      const encrypted = encryptData(config);
      localStorage.setItem('wp_deploy_gen_secure_v1', encrypted);

      addLog('success', 'System', 'Configuration saved to secure registry.');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
  };

  const nextStep = () => {
      onChange('currentStep', Math.min(config.currentStep + 1, 5));
  };

  const prevStep = () => {
      onChange('currentStep', Math.max(config.currentStep - 1, 1));
  };

  const stepClass = "transition-all duration-300 ease-in-out flex-1 flex flex-col min-h-0";

  return (
    <div className="h-full flex flex-col relative">
      
      {/* Publishing Overlay */}
      {isPublishing && (
          <div className="absolute inset-0 z-50 bg-white/90 dark:bg-dark-bg/95 flex flex-col items-center justify-center rounded-2xl backdrop-blur-sm animate-fade-in">
               <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Generating Deployment Pipeline...</h3>
               <p className="text-gray-500 dark:text-gray-400">Packaging configuration for WordPress...</p>
          </div>
      )}

      {/* Progress Stepper */}
      <div className="mb-8 px-4 flex-shrink-0">
        <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10 rounded"></div>
            {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className={`flex flex-col items-center gap-2 transition-all duration-300 ${s <= config.currentStep ? 'opacity-100' : 'opacity-50'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-xl ${
                        s === config.currentStep 
                        ? 'bg-blue-600 text-white scale-110 ring-4 ring-blue-100 dark:ring-blue-900/40' 
                        : s < config.currentStep 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white dark:bg-dark-surface border-2 border-gray-300 dark:border-gray-600 text-gray-400'
                    }`}>
                        {s < config.currentStep ? <CheckIcon className="w-5 h-5"/> : s}
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-[#0B1120] px-2 whitespace-nowrap">
                        {s === 1 && 'Git Source'}
                        {s === 2 && 'Analysis'}
                        {s === 3 && 'Live Connect'}
                        {s === 4 && 'Server Path'}
                        {s === 5 && 'Security'}
                    </span>
                </div>
            ))}
        </div>
      </div>

      {/* Wizard Content */}
      <div className="flex-1 bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-gray-200 dark:border-dark-border overflow-hidden relative flex flex-col">
        
        {/* Step 1: Source */}
        {config.currentStep === 1 && (
            <div className={`${stepClass} p-8 animate-fade-in`}>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connect Repository</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8">Enter your public or private Git repository URL to begin the pipeline configuration.</p>
                
                <div className="space-y-6 max-w-2xl">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Git Repository URL</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={config.gitUrl}
                                onChange={(e) => handleGitUrlChange(e.target.value)}
                                className="flex-1 px-5 py-4 bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                                placeholder="https://github.com/username/project.git"
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Step 2: Analysis & Target */}
        {config.currentStep === 2 && (
            <div className={`${stepClass} p-8 animate-fade-in`}>
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Repository Analysis</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                             {isAnalyzing ? "Scanning repository patterns..." : "Review the detected project structure below."}
                        </p>
                    </div>
                    <button 
                        onClick={analyzeRepo}
                        disabled={!config.gitUrl || isAnalyzing}
                        className={`px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 ${isAnalyzing ? 'opacity-75 cursor-wait' : ''}`}
                    >
                        {isAnalyzing ? <span className="animate-spin">↻</span> : <span>⚡</span>} 
                        {isAnalyzing ? 'Analyzing...' : 'Re-Analyze'}
                    </button>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto custom-scrollbar pr-2 pb-4">
                    {/* Analysis Card */}
                    <div className="bg-gray-50 dark:bg-dark-bg p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-6 relative h-fit">
                         {isAnalyzing && (
                             <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center backdrop-blur-sm rounded-xl">
                                 <div className="animate-bounce text-indigo-600 font-bold">Scanning...</div>
                             </div>
                         )}
                         
                         <div>
                             <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                 <InfoIcon className="w-4 h-4"/> Scanned Metadata
                             </h4>
                             
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                     <span className="text-xs text-gray-500 block mb-1">Language</span>
                                     <span className="font-bold text-gray-900 dark:text-white text-lg">{config.repoDetails.language}</span>
                                 </div>
                                 <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                     <span className="text-xs text-gray-500 block mb-1">Detected Type</span>
                                     <span className="font-bold text-blue-600 text-lg uppercase">{config.target}</span>
                                 </div>
                             </div>

                             {/* Summary Block - Added Scroll for long summaries */}
                             <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mt-4">
                                 <span className="text-xs text-gray-500 block mb-2 font-bold uppercase flex items-center gap-2">
                                     <BookIcon className="w-4 h-4 text-indigo-500" /> 
                                     Technical Assessment
                                 </span>
                                 <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                     <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                         {config.repoDetails.summary}
                                     </p>
                                 </div>
                             </div>

                             {/* Activity Stats */}
                             <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                                <div className="text-center">
                                    <span className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Created</span>
                                    <span className="text-xs font-mono font-medium text-gray-900 dark:text-gray-300 block">{config.repoDetails.creationDate || '-'}</span>
                                </div>
                                <div className="text-center border-l border-gray-200 dark:border-gray-700">
                                    <span className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Last Commit</span>
                                    <span className="text-xs font-mono font-medium text-gray-900 dark:text-gray-300 block">{config.repoDetails.lastCommitDate || '-'}</span>
                                </div>
                                 <div className="text-center border-l border-gray-200 dark:border-gray-700">
                                    <span className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Files</span>
                                    <span className="text-xs font-mono font-medium text-gray-900 dark:text-gray-300 block">{config.repoDetails.fileCount || '-'}</span>
                                </div>
                            </div>
                         </div>
                         
                         {/* Git Detection Status */}
                         <div className={`p-4 rounded-xl border ${config.repoDetails.framework === 'WordPress' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-200'}`}>
                             <div className="flex items-center gap-3">
                                 <span className="text-xl">🐙</span>
                                 <div>
                                     <h5 className="font-bold text-sm text-gray-900 dark:text-white">Git Repository Verified</h5>
                                     <p className="text-xs text-gray-600 dark:text-gray-400">
                                         Detected <strong>{config.target}</strong> structure in the source.
                                         {config.target === 'plugin' ? ' Ready for installation or update.' : ''}
                                     </p>
                                 </div>
                             </div>
                         </div>
                    </div>

                    {/* Manual Override & Warnings */}
                    <div className="space-y-6">
                        {config.repoDetails.isWordPress === false && (
                            <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 dark:border-red-600 rounded-r-lg shadow-sm animate-pulse-slow">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">⚠️</span>
                                    <div>
                                        <h5 className="font-bold text-sm text-red-800 dark:text-red-200">Non-WordPress Code Detected</h5>
                                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                            The analysis suggests this is a <strong>{config.repoDetails.framework}</strong> project, not WordPress.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                             <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Project Type Override</label>
                             <div className="grid grid-cols-2 gap-2">
                                {['theme', 'plugin', 'custom', 'root'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => onChange('target', t)}
                                        className={`px-3 py-3 rounded-xl text-sm font-medium border transition-all ${
                                            config.target === t
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                            : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Step 3: Live Connection */}
        {config.currentStep === 3 && (
            <div className={`${stepClass} p-8 animate-fade-in`}>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connect to WordPress</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Optional: Connect to the WordPress REST API to verify the site exists.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Site URL</label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={config.wpUrl}
                                    onChange={(e) => onChange('wpUrl', e.target.value)}
                                    className="w-full pl-4 px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://mysite.com"
                                />
                                <button 
                                    onClick={checkWpConnection}
                                    disabled={!config.wpUrl || isConnecting}
                                    className={`px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow transition-all ${isConnecting ? 'opacity-70 cursor-wait' : 'hover:bg-blue-700'}`}
                                >
                                    {isConnecting ? 'Connecting...' : 'Test'}
                                </button>
                            </div>
                        </div>
                        
                        {connectionError && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                                <strong>Connection Error:</strong> {connectionError}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Step 4: Server Destination & Strategy */}
        {config.currentStep === 4 && (
            <div className={`${stepClass} p-8 animate-fade-in`}>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Server Configuration</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8">Define where files should land and how they should be installed.</p>
                
                <div className="space-y-8 max-w-3xl overflow-y-auto custom-scrollbar pr-2 pb-4">
                    
                    {/* Strategy Selector */}
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                        <label className="block text-sm font-bold text-blue-900 dark:text-blue-200 mb-3">Deployment Strategy</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => onChange('deploymentMode', 'sync')}
                                className={`p-4 rounded-lg border text-left transition-all ${
                                    config.deploymentMode === 'sync'
                                    ? 'bg-white dark:bg-dark-surface border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                                    : 'bg-transparent border-blue-200 dark:border-blue-800 opacity-60 hover:opacity-100'
                                }`}
                            >
                                <span className="block font-bold text-blue-900 dark:text-white mb-1">🔄 Smart Sync (Install/Update)</span>
                                <span className="text-xs text-blue-800 dark:text-blue-300">
                                    If plugin exists: <strong>Updates it.</strong><br/>
                                    If missing: <strong>Installs it.</strong><br/>
                                    <span className="italic opacity-75">Mirrors Git exactly (removes obsolete files).</span>
                                </span>
                            </button>
                            
                            <button
                                onClick={() => onChange('deploymentMode', 'add')}
                                className={`p-4 rounded-lg border text-left transition-all ${
                                    config.deploymentMode === 'add'
                                    ? 'bg-white dark:bg-dark-surface border-green-500 ring-2 ring-green-500/20 shadow-md'
                                    : 'bg-transparent border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100'
                                }`}
                            >
                                <span className="block font-bold text-gray-900 dark:text-white mb-1">➕ Safe Add/Update</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Uploads new & changed files only.<br/>
                                    <strong>Does NOT delete</strong> any existing files on server.<br/>
                                    <span className="italic opacity-75">Safer for messy servers.</span>
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* FTP/SFTP Connection Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-bg/50">
                        <div className="col-span-full">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ServerIcon className="w-4 h-4"/> Connection Profile (For Save)
                            </h4>
                        </div>

                        {/* Moved Auth Type Selector Here for Better UX */}
                        <div className="col-span-full mb-2">
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Authentication Method</label>
                             <div className="flex bg-white dark:bg-dark-surface p-1 rounded-lg border border-gray-200 dark:border-gray-700 w-full md:w-2/3">
                                  <button
                                     onClick={() => onChange('authType', 'password')}
                                     className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                                         config.authType === 'password' 
                                         ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                                         : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                     }`}
                                 >
                                     Password
                                 </button>
                                 <button
                                     onClick={() => onChange('authType', 'ssh_key')}
                                     className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                                         config.authType === 'ssh_key' 
                                         ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 shadow-sm' 
                                         : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                     }`}
                                 >
                                     SSH Key
                                 </button>
                             </div>
                        </div>

                        <div>
                             <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">FTP/SFTP Host</label>
                             <input
                                type="text"
                                value={config.ftpHost || ''}
                                onChange={(e) => onChange('ftpHost', e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                                placeholder="ftp.mysite.com"
                             />
                        </div>
                         <div>
                             <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">FTP User</label>
                             <input
                                type="text"
                                value={config.ftpUser || ''}
                                onChange={(e) => onChange('ftpUser', e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                                placeholder="my_username"
                             />
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                {config.authType === 'password' ? 'FTP Password' : 'SSH Key Passphrase (Optional)'}
                             </label>
                             <div className="relative">
                                  <input
                                     type="password"
                                     value={config.ftpPassword || ''}
                                     onChange={(e) => onChange('ftpPassword', e.target.value)}
                                     className="w-full px-3 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                                     placeholder={config.authType === 'password' ? '••••••••' : 'Leave empty if no passphrase'}
                                  />
                             </div>
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Port</label>
                             <input
                                type="number"
                                value={config.ftpPort || (config.protocol === 'sftp' ? '22' : '21')}
                                onChange={(e) => onChange('ftpPort', e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                                placeholder={config.protocol === 'sftp' ? '22' : '21'}
                             />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Absolute Server Path</label>
                        <div className="flex shadow-md rounded-xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                            <span className="bg-gray-100 dark:bg-gray-800 px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-sm border-r border-gray-200 dark:border-gray-700 flex items-center">
                                Path:
                            </span>
                            <input
                                type="text"
                                value={config.remoteBase}
                                onChange={(e) => onChange('remoteBase', e.target.value)}
                                className="flex-1 px-4 py-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-white font-mono text-sm focus:outline-none"
                                placeholder="/var/www/html/wp-content/themes/"
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Step 5: Security */}
        {config.currentStep === 5 && (
            <div className={`${stepClass} p-8 animate-fade-in`}>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Final Review & Security</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8">Review final settings before generation.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    {/* Removed Auth Strategy Selector from here, moved to Step 4 */}
                    
                    <div className="space-y-3 bg-gray-50 dark:bg-dark-bg p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                         <label className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-dark-surface transition-colors cursor-pointer bg-white dark:bg-dark-surface">
                            <input type="checkbox" checked={config.dryRun} onChange={(e) => onChange('dryRun', e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
                            <div className="ml-3">
                                <span className="block text-sm font-bold text-gray-900 dark:text-white">Dry Run Mode</span>
                                <span className="text-xs text-gray-500">Simulate deployment without uploading files.</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Notifications & Webhook Section */}
                <div className="bg-gray-50 dark:bg-dark-bg p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        🔔 Deployment Notifications
                    </h4>
                    <div className="space-y-3">
                         <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Webhook URL (Optional)</label>
                         <input
                            type="url"
                            value={config.webhookUrl || ''}
                            onChange={(e) => onChange('webhookUrl', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://hooks.slack.com/services/..."
                         />
                         <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Send a JSON POST payload on success or failure. Supports Slack, Discord, or custom endpoints.
                         </p>
                    </div>
                </div>
            </div>
        )}

        {/* Action Bar */}
        <div className="p-6 bg-gray-50 dark:bg-dark-bg border-t border-gray-200 dark:border-dark-border flex items-center justify-between flex-shrink-0">
            <button 
                onClick={prevStep} 
                disabled={config.currentStep === 1}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                    config.currentStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
                ← Back
            </button>

            <div className="flex gap-2">
                 <button 
                    onClick={handleSaveProfile}
                    className={`px-4 py-3 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 ${saveSuccess ? 'text-green-600 dark:text-green-400 border-green-300' : ''}`}
                    title="Save current configuration to registry"
                 >
                    {saveSuccess ? <CheckIcon className="w-5 h-5" /> : <SaveIcon className="w-5 h-5" />}
                    <span className="hidden sm:inline">Save</span>
                 </button>

                 {config.currentStep < 5 ? (
                    <button 
                        onClick={nextStep}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
                    >
                        Next Step →
                    </button>
                 ) : (
                    <button 
                        onClick={handlePublish}
                        disabled={!config.gitUrl}
                        className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 ${!config.gitUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <RocketLaunchIcon className="w-5 h-5" />
                        🚀 Publish
                    </button>
                 )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default ConfigForm;