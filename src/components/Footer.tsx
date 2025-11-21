import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="relative py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-void-950 z-10">
            <div className="max-w-7xl 2xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-600">
                    &copy; {new Date().getFullYear()} Aetherfeed. Not affiliated with SQUARE ENIX CO., LTD. or FINAL FANTASY XIV.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
