import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option<T extends string | number> {
    label: string;
    value: T;
    tooltip?: string;
}

interface MultiSelectProps<T extends string | number> {
    options: Option<T>[];
    selected: T[];
    onChange: (selected: T[]) => void;
    label: string;
}

const MultiSelect = <T extends string | number>({ options, selected, onChange, label }: MultiSelectProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value: T) => {
        if (selected.includes(value)) {
            onChange(selected.filter((item) => item !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-aether-500 focus:border-transparent outline-hidden hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-slate-400" />
                </div>
                <span className="truncate">
                    {selected.length === 0
                        ? label
                        : `${selected.length} selected`}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden left-0 md:left-auto md:right-0"
                    >
                        <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                            {options.map((option) => {
                                const isSelected = selected.includes(option.value);
                                return (
                                    <div
                                        key={String(option.value)}
                                        onClick={() => toggleOption(option.value)}
                                        className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
                                    >
                                        <div className={`shrink-0 w-4 h-4 mr-3 border rounded flex items-center justify-center transition-colors ${isSelected
                                            ? 'bg-aether-500 border-aether-500'
                                            : 'border-slate-300 dark:border-slate-600'
                                            }`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="grow">{option.label}</span>
                                        {option.tooltip && (
                                            <div className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title={option.tooltip}>
                                                <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">?</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {options.length === 0 && (
                                <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 text-center">
                                    No options available
                                </div>
                            )}
                        </div>
                        {selected.length > 0 && (
                            <div className="border-t border-slate-100 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800/50">
                                <button
                                    onClick={() => onChange([])}
                                    className="w-full text-xs text-slate-500 hover:text-aether-500 dark:text-slate-400 dark:hover:text-aether-400 font-medium py-1"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MultiSelect;
