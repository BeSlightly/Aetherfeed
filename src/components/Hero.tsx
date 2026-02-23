import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface HeroProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

const Hero: React.FC<HeroProps> = ({ searchTerm, setSearchTerm }) => {
    return (
        <section className="relative pt-10 pb-4 md:pt-14 md:pb-6 overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white">
                            Discover <span className="text-transparent bg-clip-text bg-linear-to-r from-aether-500 to-purple-600">Dalamud</span> Plugins
                        </h1>
                        <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
                            Browse, search, and discover plugins for Final Fantasy XIV.
                        </p>
                    </div>

                    {/* Search Interface */}
                    <div
                        id="hero-search"
                        className="max-w-xl mx-auto bg-white dark:bg-slate-800/50 p-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 backdrop-blur-xs"
                    >
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search plugins by name, author, or description..."
                                aria-label="Search plugins"
                                className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-sm md:text-base focus:outline-hidden"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
