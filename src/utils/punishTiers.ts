export type PunishTier = 'core' | 'partner' | 'community';

const PUNISH_CORE_URL = 'https://love.puni.sh/ment.json';

const PUNISH_PARTNER_SLUGS = new Set<string>([
    'kawaii',
    'taurenkey',
    'veyn',
    'croizat',
    'ice',
    'jukka',
    'erdelf',
    'sourpuh',
    'knightmore',
    'wah',
    'glyceri',
    'xan',
    'akechi',
    'det',
    'gid',
    'justbees',
    'vera',
    'aly',
    'kage',
]);

// Substring matching supports GitHub's raw and redirect URL forms.
const PUNISH_PARTNER_URL_PATTERNS = [
    'NightmareXIV/MyDalamudPlugins',
];

const PUNISH_COMMUNITY_SLUGS = new Set<string>([
    'asuna',
    'boxu',
    'nexai',
    'spider',
    'vali',
    'abe',
    'nala',
    'aetherlove',
    'chika',
    'oof-games',
    'herc',
]);

const isPunishHostedUrl = (url: string): boolean => {
    if (!url) return false;
    return (
        url.startsWith('https://puni.sh/api/repository/') ||
        url.startsWith('https://love.puni.sh/')
    );
};

const extractPunishSlug = (url: string): string | null => {
    const match = url.match(/puni\.sh\/api\/repository\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
};

export const getPunishTier = (repoUrl: string): PunishTier | undefined => {
    if (!repoUrl) return undefined;

    if (repoUrl === PUNISH_CORE_URL) return 'core';

    if (PUNISH_PARTNER_URL_PATTERNS.some((p) => repoUrl.includes(p))) {
        return 'partner';
    }

    const slug = extractPunishSlug(repoUrl);
    if (slug) {
        if (PUNISH_PARTNER_SLUGS.has(slug)) return 'partner';
        if (PUNISH_COMMUNITY_SLUGS.has(slug)) return 'community';
        return 'community';
    }

    return undefined;
};

export const hasPunishTier = (repoUrl: string): boolean =>
    getPunishTier(repoUrl) !== undefined;

export { isPunishHostedUrl };

export interface TierMeta {
    label: string;
    bgClasses: string;
    ringClass: string;
    sealClasses: string;
    chipClasses: string;
}

export const TIER_META: Record<PunishTier, TierMeta> = {
    core: {
        label: 'Core',
        bgClasses: 'bg-amber-50 dark:bg-amber-500/10',
        ringClass: 'border-amber-400 dark:border-amber-500',
        sealClasses: 'bg-amber-400 dark:bg-amber-500',
        chipClasses: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40',
    },
    partner: {
        label: 'Partner',
        bgClasses: 'bg-violet-50 dark:bg-violet-500/10',
        ringClass: 'border-violet-400 dark:border-violet-500',
        sealClasses: 'bg-violet-400 dark:bg-violet-500',
        chipClasses: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-500/40',
    },
    community: {
        label: 'Community',
        bgClasses: 'bg-teal-50 dark:bg-teal-500/10',
        ringClass: 'border-teal-400 dark:border-teal-500',
        sealClasses: 'bg-teal-400 dark:bg-teal-500',
        chipClasses: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-500/40',
    },
};
