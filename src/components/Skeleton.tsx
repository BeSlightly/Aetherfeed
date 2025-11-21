import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
    className?: string;
    height?: string | number;
    width?: string | number;
    borderRadius?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className,
    height,
    width,
    borderRadius
}) => {
    return (
        <div
            className={clsx('animate-pulse bg-slate-200 dark:bg-slate-700 rounded-md', className)}
            style={{
                height,
                width,
                borderRadius
            }}
        />
    );
};

export default Skeleton;
