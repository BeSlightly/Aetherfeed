import { useState, useEffect } from 'react';
import { processPlugins, type ProcessedPlugin } from '../utils/pluginProcessor';

export interface Plugin {
    Name: string;
    Description: string;
    Author: string;
    InternalName: string;
    RepoUrl?: string;
    LastUpdate: number;
    DalamudApiLevel?: number | string;
    is_closed_source?: boolean;
    _apiLevel?: number;
}

export interface Repo {
    repo_name: string;
    repo_url: string;
    repo_developer_name?: string;
    repo_source_url?: string;
    repo_discord_url?: string;
    plugins: Plugin[];
}

export const usePlugins = () => {
    const [plugins, setPlugins] = useState<ProcessedPlugin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allApiLevels, setAllApiLevels] = useState<number[]>([]);
    const [currentApiLevel, setCurrentApiLevel] = useState(0);

    useEffect(() => {
        const fetchPlugins = async () => {
            try {
                const [configResponse, priorityResponse, dalamudResponse] = await Promise.all([
                    fetch(`${import.meta.env.BASE_URL}data/plugins.json`),
                    fetch(`${import.meta.env.BASE_URL}data/priority-repos.json`),
                    fetch(`${import.meta.env.BASE_URL}data/dalamud-version.json`)
                ]);

                if (!configResponse.ok) {
                    throw new Error('Failed to fetch plugins');
                }

                const repoData: Repo[] = await configResponse.json();
                let priorityUrls = new Set<string>();

                if (priorityResponse.ok) {
                    const priorityData = await priorityResponse.json();
                    if (Array.isArray(priorityData)) {
                        priorityUrls = new Set(priorityData);
                    }
                }

                let dalamudApiLevel = 0;
                if (dalamudResponse.ok) {
                    const dalamudData = await dalamudResponse.json();
                    if (typeof dalamudData?.apiLevel === 'number') {
                        dalamudApiLevel = dalamudData.apiLevel;
                    } else if (typeof dalamudData?.assemblyVersion === 'string') {
                        const major = parseInt(dalamudData.assemblyVersion.split('.')[0], 10);
                        if (!Number.isNaN(major)) dalamudApiLevel = major;
                    } else if (typeof dalamudData?.AssemblyVersion === 'string') {
                        const major = parseInt(dalamudData.AssemblyVersion.split('.')[0], 10);
                        if (!Number.isNaN(major)) dalamudApiLevel = major;
                    }
                }

                const { plugins: processedPlugins, allApiLevels: levels } = processPlugins(repoData, priorityUrls);
                const mergedLevels = [...levels];
                if (dalamudApiLevel && !mergedLevels.includes(dalamudApiLevel)) {
                    mergedLevels.push(dalamudApiLevel);
                }
                mergedLevels.sort((a, b) => b - a);

                setAllApiLevels(mergedLevels);
                setPlugins(processedPlugins);
                setCurrentApiLevel(dalamudApiLevel || levels[0] || 0);

            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchPlugins();
    }, []);

    return { plugins, loading, error, allApiLevels, currentApiLevel };
};
