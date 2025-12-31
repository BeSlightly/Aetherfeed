import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const SOURCE_URL = 'https://raw.githubusercontent.com/goatcorp/dalamud-distrib/refs/heads/main/stg/version';
const OUTPUT_PATH = resolve('public', 'data', 'dalamud-version.json');

const readExisting = async () => {
  try {
    const contents = await readFile(OUTPUT_PATH, 'utf8');
    return JSON.parse(contents);
  } catch {
    return null;
  }
};

const parseApiLevel = (assemblyVersion) => {
  if (!assemblyVersion || typeof assemblyVersion !== 'string') return 0;
  const major = Number.parseInt(assemblyVersion.split('.')[0], 10);
  return Number.isFinite(major) ? major : 0;
};

const writeOutput = async (payload) => {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2));
};

const run = async () => {
  const response = await fetch(SOURCE_URL, { headers: { 'User-Agent': 'Aetherfeed build' } });
  if (!response.ok) {
    throw new Error(`Failed to fetch Dalamud version: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  const apiLevel = parseApiLevel(raw.AssemblyVersion);
  if (!apiLevel) {
    throw new Error(`Invalid AssemblyVersion in response: ${JSON.stringify(raw)}`);
  }

  await writeOutput({
    apiLevel,
    assemblyVersion: raw.AssemblyVersion,
    gitSha: raw.GitSha ?? null,
    revision: raw.Revision ?? null,
    sourceUrl: SOURCE_URL
  });
};

try {
  await run();
} catch (error) {
  const existing = await readExisting();
  if (existing) {
    console.warn(`Warning: ${error instanceof Error ? error.message : 'Unknown error'}. Using existing ${OUTPUT_PATH}.`);
    process.exit(0);
  }
  console.error(error);
  process.exit(1);
}
