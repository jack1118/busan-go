// Split a dense note/paragraph into readable bullet lines.
// Conservative: only break on sentence terminators and existing newlines —
// never mid-sentence — so multi-store / multi-tip blobs become one line each
// without mangling a single sentence.
export function splitToBullets(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n+|(?<=[。！；])/)
    .map((s) => s.trim())
    .filter(Boolean);
}
