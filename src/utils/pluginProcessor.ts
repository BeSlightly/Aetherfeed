import type { Plugin, Repo } from '../hooks/usePlugins';

export interface ProcessedPlugin extends Plugin {
    _repo: Repo;
    plugin_api_levels_array: number[];
    plugin_last_updated_max_ts: number;
    is_closed_source?: boolean;
    _searchMeta: {
        name: string;
        description: string;
        author: string;
        repo: string;
    };
}

export const normalizeForSearch = (text: string): string => {
    if (!text) return "";
    return text.toLowerCase().replace(/[^\w]/g, "");
};

export const processPlugins = (
    repoData: Repo[],
    priorityRepoUrls: Set<string>
): ProcessedPlugin[] => {
    const pluginsGroupedByIdentifier = new Map<string, { pluginData: Plugin; repoData: Repo }[]>();

    // 1. Group by InternalName or Name
    for (const repo of repoData) {
        if (!repo.plugins || !Array.isArray(repo.plugins)) continue;

        for (const plugin of repo.plugins) {
            const pluginIdentifier = plugin.InternalName || plugin.Name;
            if (!pluginIdentifier) continue;

            if (!pluginsGroupedByIdentifier.has(pluginIdentifier)) {
                pluginsGroupedByIdentifier.set(pluginIdentifier, []);
            }
            pluginsGroupedByIdentifier.get(pluginIdentifier)?.push({
                pluginData: { ...plugin },
                repoData: repo,
            });
        }
    }

    const allPluginsFlatGrouped: ProcessedPlugin[] = [];

    // 2. Deduplicate by Developer
    for (const [, occurrences] of pluginsGroupedByIdentifier.entries()) {
        const occurrencesByDeveloper = new Map<string, typeof occurrences>();

        for (const occ of occurrences) {
            const devIdentifier =
                occ.repoData.repo_developer_name ||
                occ.pluginData.Author ||
                "Unknown Developer";

            if (!occurrencesByDeveloper.has(devIdentifier)) {
                occurrencesByDeveloper.set(devIdentifier, []);
            }
            occurrencesByDeveloper.get(devIdentifier)?.push(occ);
        }

        const deduplicatedOccurrencesForIdentifier: any[] = [];

        for (const [, devOccurrences] of occurrencesByDeveloper.entries()) {
            if (devOccurrences.length > 0) {
                // Find best occurrence for this developer
                let bestOccurrence = devOccurrences[0];
                const allApiLevelsInGroup = new Set<number>();
                let maxLastUpdate = 0;

                for (const occ of devOccurrences) {
                    const apiLevel = occ.pluginData.DalamudApiLevel ? parseInt(occ.pluginData.DalamudApiLevel.toString()) : 0;
                    if (apiLevel) allApiLevelsInGroup.add(apiLevel);

                    const currentTs = occ.pluginData.LastUpdate || 0;
                    if (currentTs > maxLastUpdate) maxLastUpdate = currentTs;

                    const bestApi = bestOccurrence.pluginData.DalamudApiLevel ? parseInt(bestOccurrence.pluginData.DalamudApiLevel.toString()) : 0;

                    if (apiLevel > bestApi) {
                        bestOccurrence = occ;
                    } else if (apiLevel === bestApi) {
                        if (currentTs > (bestOccurrence.pluginData.LastUpdate || 0)) {
                            bestOccurrence = occ;
                        }
                    }
                }

                deduplicatedOccurrencesForIdentifier.push({
                    pluginData: bestOccurrence.pluginData,
                    repoData: bestOccurrence.repoData,
                    _allApiLevelsFromRepo: Array.from(allApiLevelsInGroup).sort((a, b) => b - a),
                    _maxLastUpdateTimestampInGroup: maxLastUpdate
                });
            }
        }

        // 3. Apply Priority Repo Logic
        const priorityCandidates = deduplicatedOccurrencesForIdentifier.filter(
            (occ) => priorityRepoUrls.has(occ.repoData.repo_url)
        );

        if (priorityCandidates.length > 0) {
            // Pick best from priority candidates
            let bestPriority = priorityCandidates[0];
            // Simple max API logic for now
            for (let i = 1; i < priorityCandidates.length; i++) {
                const current = priorityCandidates[i];
                const currentMaxApi = Math.max(...(current._allApiLevelsFromRepo || [0]));
                const bestMaxApi = Math.max(...(bestPriority._allApiLevelsFromRepo || [0]));

                if (currentMaxApi > bestMaxApi) {
                    bestPriority = current;
                }
            }
            allPluginsFlatGrouped.push(createFinalPluginObject(bestPriority));
        } else {
            // Add all unique developer versions
            deduplicatedOccurrencesForIdentifier.forEach(occ => {
                allPluginsFlatGrouped.push(createFinalPluginObject(occ));
            });
        }
    }

    return allPluginsFlatGrouped;
};

function createFinalPluginObject(occurrence: any): ProcessedPlugin {
    const finalPlugin = { ...occurrence.pluginData };
    finalPlugin._repo = { ...occurrence.repoData };
    finalPlugin.plugin_api_levels_array = occurrence._allApiLevelsFromRepo || [];

    // Ensure current API level is in the array
    if (finalPlugin.DalamudApiLevel && !finalPlugin.plugin_api_levels_array.includes(parseInt(finalPlugin.DalamudApiLevel))) {
        finalPlugin.plugin_api_levels_array.push(parseInt(finalPlugin.DalamudApiLevel));
    }

    finalPlugin.plugin_api_levels_array.sort((a: number, b: number) => b - a);
    finalPlugin.plugin_last_updated_max_ts = occurrence._maxLastUpdateTimestampInGroup;

    finalPlugin._searchMeta = {
        name: normalizeForSearch(finalPlugin.Name || finalPlugin.InternalName),
        description: normalizeForSearch(finalPlugin.Description),
        author: normalizeForSearch(finalPlugin.Author),
        repo: normalizeForSearch(finalPlugin._repo.repo_name)
    };

    return finalPlugin;
}
