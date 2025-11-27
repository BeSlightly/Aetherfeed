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
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="group relative flex flex-col bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-aether-500/50 dark:hover:border-aether-500/50 transition-all duration-300 h-full shadow-sm hover:shadow-md"
        >
            <div className="p-5 flex flex-col flex-grow">
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
                            <div key={level} className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getApiBadgeColor(level, maxApiLevel)}`}>
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
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-2 mb-4 flex-grow">
                    {plugin.Description}
                </p>

                {/* Footer: Actions & Repo Info */}
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {/* Install Button Group */}
                        {installUrl && (
                            <div className="flex items-center rounded-lg overflow-hidden shadow-sm bg-slate-900 dark:bg-white">
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

                </div>
            </div>
        </motion.article>
    );
};

export default PluginCard;
