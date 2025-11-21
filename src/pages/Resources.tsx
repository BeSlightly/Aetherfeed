import React from 'react';
import { Construction } from 'lucide-react';

const Resources: React.FC = () => {
    return (
        <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4 text-center">
            <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-6">
                <Construction className="w-12 h-12 text-aether-500" />
            </div>
            <h1 className="text-4xl font-bold font-display text-slate-900 dark:text-white mb-4">
                Work in Progress
            </h1>
        </div>
    );
};

export default Resources;
