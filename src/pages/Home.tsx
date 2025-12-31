import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Hero from '../components/Hero';
import WarningBanner from '../components/WarningBanner';
import PluginCard from '../components/PluginCard';
import Skeleton from '../components/Skeleton';
import { usePlugins } from '../hooks/usePlugins';
import { normalizeForSearch } from '../utils/pluginProcessor';
import { formatDate } from '../utils/formatDate';
import { SortAsc, SortDesc } from 'lucide-react';
import MultiSelect from '../components/MultiSelect';
import Select from '../components/Select';

const CHINESE_REGEX = /[\u4e00-\u9fff]/i;
const JAPANESE_REGEX = /[\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf]/i;
const KOREAN_REGEX = /[\u1100-\u11ff\uac00-\ud7af]/i;

const Home: React.FC = () => {
    const { plugins, loading, error, allApiLevels, currentApiLevel } = usePlugins();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'updated' | 'author'>(() => {
        const saved = localStorage.getItem('aetherfeed_sortBy');
        return (saved as 'name' | 'updated' | 'author') || 'updated';
    });
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
        const saved = localStorage.getItem('aetherfeed_sortOrder');
        return (saved as 'asc' | 'desc') || 'desc';
    });
    const [selectedFilters, setSelectedFilters] = useState<(string | number)[]>(() => {
        const saved = localStorage.getItem('aetherfeed_selectedFilters');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return Array.isArray(parsed) ? parsed : ['latin_only'];
            } catch {
                return ['latin_only'];
            }
        }
        return ['latin_only'];
    });

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem('aetherfeed_sortBy', sortBy);
    }, [sortBy]);

    useEffect(() => {
        localStorage.setItem('aetherfeed_sortOrder', sortOrder);
    }, [sortOrder]);

    useEffect(() => {
        localStorage.setItem('aetherfeed_selectedFilters', JSON.stringify(selectedFilters));
    }, [selectedFilters]);

    const filterOptions = useMemo(() => {
        const options: { label: string; value: string | number; tooltip?: string }[] = [
            ...allApiLevels.map(level => ({ label: `API ${level}`, value: level })),
            {
                label: 'Hide non-english plugins',
                value: 'latin_only',
                tooltip: 'Hides plugins containing non-English characters in their name or description'
            }
        ];
        return options;
    }, [allApiLevels]);

    // Infinite Scroll State
    const [visibleCount, setVisibleCount] = useState(50);
    const observerTarget = useRef<HTMLDivElement>(null);
    const buildTimeText = useMemo(() => formatDate(new Date(__BUILD_TIME__).getTime()), []);

    const filteredPlugins = useMemo(() => {
        let result = [...plugins];
        const normalizedTerm = normalizeForSearch(searchTerm);

        // 1. Search Filter
        if (normalizedTerm) {
            result = result.filter(plugin => {
                return plugin._searchMeta.name.includes(normalizedTerm) ||
                    plugin._searchMeta.description.includes(normalizedTerm) ||
                    plugin._searchMeta.author.includes(normalizedTerm) ||
                    plugin._searchMeta.repo.includes(normalizedTerm);
            });
        }

        // Extract filters
        const apiFilters = selectedFilters.filter((f): f is number => typeof f === 'number');
        const isLatinOnly = selectedFilters.includes('latin_only');

        // 2. API Level Filter
        if (apiFilters.length > 0) {
            result = result.filter(p =>
                p.plugin_api_levels_array.some(level => apiFilters.includes(level))
            );
        }

        // 3. View Options Filter (Latin Only)
        if (isLatinOnly) {
            result = result.filter(p => {
                const name = p.Name || p.InternalName || '';
                const desc = p.Description || '';
                return (
                    !CHINESE_REGEX.test(name) &&
                    !CHINESE_REGEX.test(desc) &&
                    !JAPANESE_REGEX.test(name) &&
                    !JAPANESE_REGEX.test(desc) &&
                    !KOREAN_REGEX.test(name) &&
                    !KOREAN_REGEX.test(desc)
                );
            });
        }

        // 4. Sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = (a.Name || '').localeCompare(b.Name || '');
                    break;
                case 'author':
                    comparison = (a.Author || '').localeCompare(b.Author || '');
                    break;
                case 'updated':
                    comparison = (a.plugin_last_updated_max_ts || 0) - (b.plugin_last_updated_max_ts || 0);
                    break;
                default:
                    comparison = (a.plugin_last_updated_max_ts || 0) - (b.plugin_last_updated_max_ts || 0);
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [plugins, searchTerm, sortBy, sortOrder, selectedFilters]);

    // Reset visible count when filters change
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisibleCount(50);
    }, [searchTerm, sortBy, sortOrder, selectedFilters]);

    const displayPlugins = filteredPlugins.slice(0, visibleCount);
    const hasMore = visibleCount < filteredPlugins.length;

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setVisibleCount((prev) => Math.min(prev + 50, filteredPlugins.length));
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, filteredPlugins.length]);

    return (
        <>
            <Hero searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <WarningBanner />

            <div id="feed-anchor" className="relative z-10 max-w-7xl 2xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 w-full">

                {/* Controls Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold font-display bg-clip-text text-transparent bg-linear-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                            Plugin Feed
                        </h2>
                        <span className="px-3 py-1 rounded-full bg-aether-100 text-aether-700 dark:bg-aether-900/30 dark:text-aether-300 text-xs font-medium border border-aether-200 dark:border-aether-700/50">
                            {filteredPlugins.length} Available
                        </span>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Updated {buildTimeText}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {/* Sort Control */}
                        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-shadow focus-within:ring-2 focus-within:ring-aether-500 focus-within:border-transparent">
                            <Select
                                options={[
                                    { label: 'Last Updated', value: 'updated' },
                                    { label: 'Name', value: 'name' },
                                    { label: 'Author', value: 'author' }
                                ]}
                                selected={sortBy}
                                onChange={(value) => {
                                    setSortBy(value as 'name' | 'updated' | 'author');
                                    if (value === 'updated') setSortOrder('desc');
                                    else setSortOrder('asc');
                                }}
                            />
                            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700"></div>
                            <button
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="px-3 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-r-xl"
                                title={sortBy === 'updated'
                                    ? (sortOrder === 'asc' ? "Oldest first" : "Newest first")
                                    : (sortOrder === 'asc' ? "A to Z" : "Z to A")
                                }
                            >
                                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Unified Filter Control */}
                        <MultiSelect
                            options={filterOptions}
                            selected={selectedFilters}
                            onChange={setSelectedFilters}
                            label="Filter"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 mb-8">
                        Error loading plugins: {error}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-[400px] rounded-3xl overflow-hidden bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-slate-700/50 p-6">
                                <Skeleton height="2rem" width="60%" className="mb-4" />
                                <Skeleton height="1rem" width="40%" className="mb-8" />
                                <Skeleton height="6rem" className="mb-6" />
                                <div className="flex gap-2 mt-auto">
                                    <Skeleton height="2.5rem" width="50%" />
                                    <Skeleton height="2.5rem" width="50%" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                            <AnimatePresence mode='sync'>
                                {displayPlugins.map((plugin) => (
                                    <PluginCard
                                        key={`${plugin._repo.repo_url}-${plugin.InternalName}`}
                                        plugin={plugin}
                                        maxApiLevel={currentApiLevel || allApiLevels[0]}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Infinite Scroll Sentinel */}
                        {hasMore && (
                            <div ref={observerTarget} className="h-20 w-full flex items-center justify-center mt-8 text-sm text-slate-500 dark:text-slate-400">
                                <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-aether-500 animate-[spin_1.4s_linear_infinite]"></div>
                                <span className="ml-3">Loading more plugins…</span>
                            </div>
                        )}

                        {displayPlugins.length === 0 && !loading && (
                            <div className="text-center py-24">
                                <p className="text-xl text-slate-500 dark:text-slate-400">
                                    No plugins found matching "{searchTerm}"
                                </p>
                                <button
                                    onClick={() => { setSearchTerm(''); setSelectedFilters([]); }}
                                    className="mt-4 text-aether-500 hover:underline"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}

                        {!searchTerm && filteredPlugins.length > 50 && !hasMore && (
                            <div className="mt-12 text-center">
                                <p className="text-slate-500 dark:text-slate-400 mb-4">Showing all {filteredPlugins.length} plugins</p>
                                <p className="text-sm text-slate-400 dark:text-slate-500">Use the search bar to find specific plugins</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default Home;
