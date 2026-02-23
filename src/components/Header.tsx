import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Sun, Moon, Github, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm }) => {
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showHeaderSearch, setShowHeaderSearch] = useState(false);
    const isDark = theme === 'dark';
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.pathname !== '/') {
            setShowHeaderSearch(false);
            return undefined;
        }

        const target = document.getElementById('hero-search');
        if (!target || typeof IntersectionObserver === 'undefined') {
            setShowHeaderSearch(false);
            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowHeaderSearch(!entry.isIntersecting);
            },
            { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [location.pathname]);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Resources', href: '/resources' },
    ];

    const handleHomeClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        setIsMenuOpen(false);
        navigate('/', { state: { resetHome: Date.now() } });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <div className="absolute inset-0 bg-white/70 dark:bg-void-950/70 backdrop-blur-lg border-b border-slate-200/50 dark:border-white/10 z-0" />

            <div className="relative z-10 max-w-7xl 2xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="shrink-0 flex items-center cursor-pointer" onClick={handleHomeClick}>
                        <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Aetherfeed Logo" className="h-8 w-8 mr-2" />
                        <span className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                            Aetherfeed
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 translate-x-[calc(-50%-5px)] h-full">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    to={link.href}
                                    onClick={link.href === '/' ? handleHomeClick : undefined}
                                    className={`text-sm font-medium transition-colors relative ${isActive
                                        ? 'text-aether-600 dark:text-aether-400'
                                        : 'text-slate-600 hover:text-aether-500 dark:text-slate-300 dark:hover:text-aether-400'
                                        }`}
                                >
                                    {link.name}
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-aether-500 dark:bg-aether-400 rounded-t-full"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        {/* Actions */}
                        <div className="hidden md:flex items-center gap-3">
                            <AnimatePresence initial={false}>
                                {showHeaderSearch && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                        transition={{ duration: 0.18, ease: 'easeOut' }}
                                        className="relative hidden lg:flex items-center"
                                    >
                                        <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                                        <input
                                            type="search"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search plugins..."
                                            aria-label="Search plugins"
                                            className="w-44 lg:w-56 xl:w-64 pl-9 pr-4 py-2 text-sm rounded-full bg-white/80 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-aether-500 focus:border-transparent shadow-sm transition-colors"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 transition-colors focus:outline-hidden focus:ring-2 focus:ring-aether-500"
                                aria-label="Toggle theme"
                            >
                                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                            <a
                                href="https://github.com/beslightly/Aetherfeed"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-full hover:bg-aether-600 dark:hover:bg-aether-200 transition-colors flex items-center gap-2"
                            >
                                <Github className="h-4 w-4" />
                                <span>GitHub</span>
                            </a>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex md:hidden items-center space-x-4">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 transition-colors"
                            >
                                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 focus:outline-hidden"
                            >
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <motion.div
                initial={false}
                animate={isMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                className="md:hidden relative z-10 overflow-hidden bg-white dark:bg-void-950 border-b border-slate-200 dark:border-slate-800"
            >
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.href}
                            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-aether-500"
                            onClick={link.href === '/' ? handleHomeClick : () => setIsMenuOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <a
                        href="https://github.com/beslightly/Aetherfeed"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-full hover:bg-aether-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Github className="h-4 w-4" />
                        <span>GitHub</span>
                    </a>
                </div>
            </motion.div>
        </header>
    );
};

export default Header;
