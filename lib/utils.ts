/** Lead time in days: Release Date − BRD Date. Returns null if either date is missing. */
export function calcLeadTime(brdDate: string | null | undefined, releaseDate: string | null | undefined): number | null {
  if (!brdDate || !releaseDate) return null;
  const brd = new Date(brdDate);
  const rel = new Date(releaseDate);
  if (Number.isNaN(brd.getTime()) || Number.isNaN(rel.getTime())) return null;
  const ms = rel.getTime() - brd.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export function calcSuccessRate(
  bugCountAfterRelease: number | null | undefined,
  scopeChanged: boolean | undefined
): number | null {
  const bugs = bugCountAfterRelease ?? 0;
  const scopePenalty = scopeChanged ? 20 : 0;
  const rate = 100 - bugs * 10 - scopePenalty;
  return Math.max(0, Math.min(100, rate));
}
