import type { Plugin, Repo } from '../hooks/usePlugins';

export interface ProcessedPlugin extends Plugin {
    _repo: Repo;
    plugin_api_levels_array: number[];
    plugin_last_updated_max_ts: number;
    is_closed_source?: boolean;
    isPunish?: boolean;
    discordUrl?: string;
    _apiLevel?: number;
    _maxApiLevel?: number;
    _searchMeta: {
        name: string;
        description: string;
        author: string;
        repo: string;
    };
}

interface IntermediatePluginOccurrence {
    pluginData: Plugin;
    repoData: Repo;
    _allApiLevelsFromRepo: number[];
    _maxApiLevel: number;
    _maxLastUpdateTimestampInGroup: number;
    _globalDiscordUrl?: string;
}

const isPunishRepo = (url: string) => {
    if (!url) return false;
    return (
        url.startsWith("https://puni.sh/api/repository/") ||
        url.startsWith("https://love.puni.sh/")
    );
};

export const normalizeForSearch = (text: string): string => {
    if (!text) return "";
    return text.toLowerCase().replace(/[^\w]/g, "");
};

export const processPlugins = (
    repoData: Repo[],
    priorityRepoUrls: Set<string>
): { plugins: ProcessedPlugin[]; allApiLevels: number[] } => {
    const pluginsGroupedByIdentifier = new Map<string, { pluginData: Plugin; repoData: Repo }[]>();

    // 1. Group by InternalName or Name
    for (const repo of repoData) {
        if (!repo.plugins || !Array.isArray(repo.plugins)) continue;

        for (const plugin of repo.plugins) {
            const pluginIdentifier = plugin.InternalName || plugin.Name;
            if (!pluginIdentifier) continue;

            const parsedApiLevel = plugin.DalamudApiLevel ? parseInt(plugin.DalamudApiLevel.toString()) || 0 : 0;

            if (!pluginsGroupedByIdentifier.has(pluginIdentifier)) {
                pluginsGroupedByIdentifier.set(pluginIdentifier, []);
            }
            pluginsGroupedByIdentifier.get(pluginIdentifier)?.push({
                pluginData: { ...plugin, _apiLevel: parsedApiLevel },
                repoData: repo,
            });
        }
    }

    const allPluginsFlatGrouped: ProcessedPlugin[] = [];

    // 2. Deduplicate by Developer
    for (const [, occurrences] of pluginsGroupedByIdentifier.entries()) {
        const occurrencesByDeveloper = new Map<string, typeof occurrences>();

        // Metadata Aggregation: Check if any occurrence has a Discord URL
        let foundDiscordUrl: string | undefined;
        for (const occ of occurrences) {
            if (occ.repoData.repo_discord_url) {
                foundDiscordUrl = occ.repoData.repo_discord_url;
                break; // Found one, good enough
            }
        }

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

        const deduplicatedOccurrencesForIdentifier: IntermediatePluginOccurrence[] = [];

        for (const [, devOccurrences] of occurrencesByDeveloper.entries()) {
            if (devOccurrences.length > 0) {
                // Find best occurrence for this developer
                let bestOccurrence = devOccurrences[0];
                const allApiLevelsInGroup = new Set<number>();
                let maxLastUpdate = 0;

                for (const occ of devOccurrences) {
                    const apiLevel = occ.pluginData._apiLevel || 0;
                    if (apiLevel) allApiLevelsInGroup.add(apiLevel);

                    const currentTs = occ.pluginData.LastUpdate || 0;
                    if (currentTs > maxLastUpdate) maxLastUpdate = currentTs;

                    const bestApi = bestOccurrence.pluginData._apiLevel || 0;

                    if (apiLevel > bestApi) {
                        bestOccurrence = occ;
                    } else if (apiLevel === bestApi) {
                        if (currentTs > (bestOccurrence.pluginData.LastUpdate || 0)) {
                            bestOccurrence = occ;
                        }
                    }
                }

                const allApiLevelsArray = Array.from(allApiLevelsInGroup).sort((a, b) => b - a);

                deduplicatedOccurrencesForIdentifier.push({
                    pluginData: bestOccurrence.pluginData,
                    repoData: bestOccurrence.repoData,
                    _allApiLevelsFromRepo: allApiLevelsArray,
                    _maxApiLevel: allApiLevelsArray[0] || 0,
                    _maxLastUpdateTimestampInGroup: maxLastUpdate,
                    _globalDiscordUrl: foundDiscordUrl
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
                const currentMaxApi = current._maxApiLevel || 0;
                const bestMaxApi = bestPriority._maxApiLevel || 0;

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

    const allApiLevelsSet = new Set<number>();
    for (const plugin of allPluginsFlatGrouped) {
        for (const level of plugin.plugin_api_levels_array) {
            if (level) allApiLevelsSet.add(level);
        }
    }

    return {
        plugins: allPluginsFlatGrouped,
        allApiLevels: Array.from(allApiLevelsSet).sort((a, b) => b - a)
    };
};

function createFinalPluginObject(occurrence: IntermediatePluginOccurrence): ProcessedPlugin {
    const finalPlugin = { ...occurrence.pluginData } as ProcessedPlugin;
    finalPlugin._repo = { ...occurrence.repoData };
    finalPlugin.plugin_api_levels_array = occurrence._allApiLevelsFromRepo || [];

    // Ensure current API level is in the array
    const currentApiLevel = finalPlugin._apiLevel || (finalPlugin.DalamudApiLevel ? parseInt(finalPlugin.DalamudApiLevel.toString()) || 0 : 0);
    if (currentApiLevel && !finalPlugin.plugin_api_levels_array.includes(currentApiLevel)) {
        finalPlugin.plugin_api_levels_array.push(currentApiLevel);
    }

    finalPlugin.plugin_api_levels_array.sort((a: number, b: number) => b - a);
    finalPlugin._maxApiLevel = occurrence._maxApiLevel || finalPlugin.plugin_api_levels_array[0] || 0;
    finalPlugin.plugin_last_updated_max_ts = occurrence._maxLastUpdateTimestampInGroup;

    const repoUrl = finalPlugin._repo.repo_url || "";

    // ---------------------------------------------------------
    // Developer & Branding Detection
    // ---------------------------------------------------------

    // 1. Check for Punish
    finalPlugin.isPunish = isPunishRepo(repoUrl);

    // 2. Assign Discord URL
    if (finalPlugin.isPunish) {
        finalPlugin.discordUrl = "https://discord.gg/Zzrcc8kmvy";
    } else {
        finalPlugin.discordUrl = occurrence._globalDiscordUrl;
    }

    finalPlugin._searchMeta = {
        name: normalizeForSearch(finalPlugin.Name || finalPlugin.InternalName),
        description: normalizeForSearch(finalPlugin.Description),
        author: normalizeForSearch(finalPlugin.Author),
        repo: normalizeForSearch(finalPlugin._repo.repo_name + (finalPlugin.isPunish ? " punish puni.sh" : ""))
    };

    return finalPlugin;
}
