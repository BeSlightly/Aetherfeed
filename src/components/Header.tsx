import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Sun, Moon, Radio } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Link, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    const isDark = theme === 'dark';
    const location = useLocation();

    useEffect(() => {
        const controlNavbar = () => {
            if (typeof window !== 'undefined') {
                const currentScrollY = window.scrollY;

                // Hide if scrolling down and past 100px, show if scrolling up
                // Always show if at the very top or if menu is open
                if (currentScrollY > lastScrollY.current && currentScrollY > 100 && !isMenuOpen) {
                    setIsVisible(false);
                } else {
                    setIsVisible(true);
                }

                lastScrollY.current = currentScrollY;
            }
        };

        window.addEventListener('scroll', controlNavbar);

        return () => {
            window.removeEventListener('scroll', controlNavbar);
        };
    }, [isMenuOpen]);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Resources', href: '/resources' },
    ];

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="absolute inset-0 bg-white/70 dark:bg-void-950/70 backdrop-blur-lg border-b border-slate-200/50 dark:border-white/10" />

            <div className="relative max-w-7xl 2xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img src="/logo.svg" alt="Aetherfeed Logo" className="h-8 w-8 mr-2" />
                        <span className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                            Aetherfeed
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex space-x-8">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    to={link.href}
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

                    {/* Actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-aether-500"
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
                            <Radio className="h-4 w-4" />
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
                            className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 focus:outline-none"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <motion.div
                initial={false}
                animate={isMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden bg-white dark:bg-void-950 border-b border-slate-200 dark:border-slate-800"
            >
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.href}
                            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-aether-500"
                            onClick={() => setIsMenuOpen(false)}
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
                        <Radio className="h-4 w-4" />
                        <span>GitHub</span>
                    </a>
                </div>
            </motion.div>
        </header>
    );
};

export default Header;
