import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Lock, Copy, Check, ExternalLink } from 'lucide-react';
import { formatDate } from '../utils/formatDate';
import type { ProcessedPlugin } from '../utils/pluginProcessor';

interface PluginCardProps {
    plugin: ProcessedPlugin;
    maxApiLevel?: number;
}

const getApiBadgeColor = (level: number, maxLevel?: number) => {
    if (!maxLevel) return 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700';

    if (level === maxLevel) {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30';
    }
    if (level === maxLevel - 1) {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
    }
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
};

const PluginCard: React.FC<PluginCardProps> = ({ plugin, maxApiLevel }) => {
    const installUrl = plugin._repo.repo_url;
    const sourceUrl = plugin.RepoUrl || plugin._repo.repo_source_url;
    const isClosedSource = plugin.is_closed_source;
    const closedSourceUrl = sourceUrl || installUrl;
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (installUrl) {
            try {
                await navigator.clipboard.writeText(installUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="group relative flex flex-col bg-white/80 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-aether-500/50 dark:hover:border-aether-500/50 transition-all duration-300 h-full shadow-xs hover:shadow-md"
        >
            <div className="p-5 flex flex-col grow">
                {/* Header: Title & Meta */}
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-aether-600 dark:group-hover:text-aether-400 transition-colors">
                            {plugin.Name}
                        </h2>
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>by</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{plugin.Author || 'Unknown'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* API Badges */}
                        {plugin.plugin_api_levels_array.slice(0, 2).map((level) => (
                            <div key={level} className={`shrink-0 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${getApiBadgeColor(level, maxApiLevel)}`}>
                                API {level}
                            </div>
                        ))}
                        {/* Last Updated */}
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            {formatDate(plugin.plugin_last_updated_max_ts)}
                        </span>
                    </div>
                </div>

                {/* Description */}
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-2 mb-4 grow">
                    {plugin.Description}
                </p>

                {/* Footer: Actions & Repo Info */}
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {/* Install Button Group */}
                        {installUrl && (
                            <div className="flex items-center rounded-lg overflow-hidden shadow-xs bg-slate-900 dark:bg-white">
                                <a
                                    href={installUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-white dark:text-slate-900 text-xs font-semibold hover:bg-aether-600 dark:hover:bg-aether-200 transition-colors"
                                    title="Open Repository"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Repository
                                </a>
                                <div className="h-4 w-px bg-white/20 dark:bg-slate-900/10"></div>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center justify-center px-2 py-1.5 text-white dark:text-slate-900 hover:bg-aether-600 dark:hover:bg-aether-200 transition-colors"
                                    title="Copy Repository URL"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        )}

                        {/* Source Link */}
                        {isClosedSource ? (
                            <a
                                href={closedSourceUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/20 transition-colors"
                                title="Closed Source"
                            >
                                <Lock className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">Closed Source</span>
                            </a>
                        ) : sourceUrl && (
                            <a
                                href={sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center p-1.5 rounded-lg transition-colors text-slate-400 hover:text-aether-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                                title="View Source"
                            >
                                <Code className="w-4 h-4" />
                            </a>
                        )}
                    </div>

                    {(plugin.discordUrl || plugin.isPunish) && (
                        <div className="flex items-center gap-2">
                            {plugin.discordUrl && (
                                <a
                                    href={plugin.discordUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors text-slate-400 hover:text-[#5865F2] hover:bg-slate-50 dark:hover:bg-slate-800"
                                    title="Join Discord Server"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.2 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.05-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.85 2.12-1.89 2.12zM15.49 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.85 2.12-1.89 2.12z" />
                                    </svg>
                                </a>
                            )}
                            {plugin.isPunish && (
                                <a
                                    href="https://puni.sh/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center"
                                    title="Visit Puni.sh"
                                >
                                    <img
                                        src="punish-logo.webp"
                                        alt="Puni.sh"
                                        className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                                    />
                                </a>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </motion.article>
    );
};

export default PluginCard;
