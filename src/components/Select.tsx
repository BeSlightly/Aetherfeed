import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option<T extends string | number> {
    label: string;
    value: T;
}

interface SelectProps<T extends string | number> {
    options: Option<T>[];
    selected: T;
    onChange: (selected: T) => void;
    label?: string;
}

const Select = <T extends string | number>({ options, selected, onChange, label }: SelectProps<T>) => {
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

    const handleSelect = (value: T) => {
        onChange(value);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === selected);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 pl-9 pr-4 py-2 bg-transparent border-none text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-0 outline-hidden hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors min-w-[140px]"
            >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ArrowUpDown className="h-4 w-4 text-slate-400" />
                </div>
                <span className="truncate grow text-left">
                    {selectedOption ? selectedOption.label : label}
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
                        className="absolute z-50 mt-2 w-full min-w-[160px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden left-0"
                    >
                        <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                            {options.map((option) => {
                                const isSelected = selected === option.value;
                                return (
                                    <div
                                        key={String(option.value)}
                                        onClick={() => handleSelect(option.value)}
                                        className={`flex items-center px-4 py-2 text-sm cursor-pointer transition-colors ${isSelected
                                            ? 'bg-aether-50 dark:bg-aether-900/20 text-aether-600 dark:text-aether-400'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        <span className="grow">{option.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Select;
