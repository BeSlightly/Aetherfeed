import React from 'react';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 dark:bg-void-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
            {/* Background Decorations */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-aether-500/20 dark:bg-aether-600/10 rounded-full blur-[120px] animate-float" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 dark:bg-purple-600/10 rounded-full blur-[100px] animate-float delay-1000" />
            </div>

            <Header />

            <main className="flex-grow z-10 pt-16">
                <Outlet />
            </main>

            <Footer />
            <ScrollToTop />
        </div>
    );
};

export default Layout;
