import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WarningBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(() => {
        const dismissed = localStorage.getItem('aetherfeed_warning_dismissed_v2');
        return !dismissed;
    });

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('aetherfeed_warning_dismissed_v2', 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8"
                >
                    <div className="relative overflow-hidden rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 backdrop-blur-xs p-4 shadow-xs">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg shrink-0">
                                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                            </div>
                            <div className="grow space-y-1 pt-0.5">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-amber-100 flex items-center gap-2">
                                    Disclaimer
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed text-pretty">
                                    These plugin lists are dynamically generated and not vetted. They may contain malware or jeopardize your account. Proceed&nbsp;with&nbsp;caution. If you're installing plugins from custom repositories, <span className="font-bold text-amber-700 dark:text-amber-400">DO NOT</span> ask for help on the XIVLauncher discord. Please&nbsp;review the plugin's README for support.
                                </p>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed text-pretty mt-2">
                                    Aetherfeed is not affiliated with any listed plugins or developers, including puni.sh.
                                    <br />
                                    For an official puni.sh plugin directory, visit <a href="https://puni.sh/" className="font-semibold underline underline-offset-2 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200" target="_blank" rel="noreferrer">puni.sh</a>.
                                </p>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                                aria-label="Dismiss warning"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WarningBanner;
