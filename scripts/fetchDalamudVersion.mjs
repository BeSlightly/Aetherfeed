import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const SOURCE_URL = 'https://raw.githubusercontent.com/goatcorp/Dalamud/refs/heads/master/Dalamud/Dalamud.csproj';
const DISTRIB_SOURCE_URL = 'https://raw.githubusercontent.com/goatcorp/dalamud-distrib/refs/heads/main/stg/version';
const OUTPUT_PATH = resolve('public', 'data', 'dalamud-version.json');

const readExisting = async () => {
  try {
    const contents = await readFile(OUTPUT_PATH, 'utf8');
    return JSON.parse(contents);
  } catch {
    return null;
  }
};

const parseMajorVersion = (version) => {
  if (!version || typeof version !== 'string') return 0;
  const major = Number.parseInt(version.split('.')[0], 10);
  return Number.isFinite(major) ? major : 0;
};

const parseDalamudVersion = (projectFile) => {
  const match = projectFile.match(/<DalamudVersion>\s*([^<]+?)\s*<\/DalamudVersion>/);
  return match?.[1] ?? null;
};

const writeOutput = async (payload) => {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
};

const run = async () => {
  const response = await fetch(SOURCE_URL, { headers: { 'User-Agent': 'Aetherfeed build' } });
  if (!response.ok) {
    throw new Error(`Failed to fetch Dalamud version: ${response.status} ${response.statusText}`);
  }

  const projectFile = await response.text();
  const dalamudVersion = parseDalamudVersion(projectFile);
  const apiLevel = parseMajorVersion(dalamudVersion);
  if (!apiLevel) {
    throw new Error(`Invalid DalamudVersion in response from ${SOURCE_URL}`);
  }

  let distribVersion = null;
  try {
    const distribResponse = await fetch(DISTRIB_SOURCE_URL, { headers: { 'User-Agent': 'Aetherfeed build' } });
    if (distribResponse.ok) {
      distribVersion = await distribResponse.json();
    } else {
      console.warn(`Warning: failed to fetch Dalamud distrib metadata: ${distribResponse.status} ${distribResponse.statusText}`);
    }
  } catch (error) {
    console.warn(`Warning: failed to fetch Dalamud distrib metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  await writeOutput({
    apiLevel,
    assemblyVersion: dalamudVersion,
    gitSha: distribVersion?.GitSha ?? null,
    revision: distribVersion?.Revision ?? null,
    sourceUrl: SOURCE_URL,
    distribAssemblyVersion: distribVersion?.AssemblyVersion ?? null,
    distribSourceUrl: DISTRIB_SOURCE_URL
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
