import { Manuscript } from "@/types/manuscript";
import { GAME_ARTIFACTS_MAP } from "@/data/gameArtifacts";

/**
 * Syncs a single discovered in-game artifact to the Curator's Vault.
 * Checks for duplicates by matching archiveId.
 */
export function syncGameArtifactToVault(
  artifactId: string,
  addManuscript: (m: Manuscript) => void,
  existingManuscripts: Manuscript[]
): Manuscript | null {
  const data = GAME_ARTIFACTS_MAP[artifactId];
  if (!data) return null;

  // Check if this artifact already exists in vault by archiveId
  const alreadyInVault = existingManuscripts.some(
    (m) => m.archiveId === data.manuscript.archiveId
  );

  if (alreadyInVault) {
    return null;
  }

  const newManuscript: Manuscript = {
    id: crypto.randomUUID(),
    uploadedAt: new Date().toISOString(),
    originalImageUrl: data.svgImage,
    ...data.manuscript,
  };

  addManuscript(newManuscript);
  return newManuscript;
}

/**
 * Syncs all currently unlocked in-game artifacts to the Curator's Vault at once.
 * Returns the list of newly created manuscripts.
 */
export function syncAllGameArtifacts(
  unlockedArtifacts: string[],
  addManuscript: (m: Manuscript) => void,
  existingManuscripts: Manuscript[]
): Manuscript[] {
  const currentList = [...existingManuscripts];
  const newlyCreated: Manuscript[] = [];

  for (const artifactId of unlockedArtifacts) {
    const created = syncGameArtifactToVault(artifactId, addManuscript, currentList);
    if (created) {
      newlyCreated.push(created);
      currentList.push(created);
    }
  }

  return newlyCreated;
}
