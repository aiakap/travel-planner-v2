/**
 * Normalize profile value text to prevent duplicate-looking variants.
 *
 * Goals:
 * - Treat visually identical strings as the same value
 * - Strip invisible Unicode that commonly appears from LLMs / copy-paste
 * - Normalize whitespace to a single ASCII space
 *
 * This function is intentionally conservative: it does NOT change letter case.
 * Callers should apply case folding (e.g. `.toLowerCase()`) only when used as a key.
 */
export function normalizeProfileValueText(input: string): string {
  if (typeof input !== "string") return "";

  // 1) Unicode normalize (canonical + compatibility)
  let s = input.normalize("NFKC");

  // 2) Remove common zero-width / invisible characters
  // - Zero width space/joiners, BOM, word joiner, soft hyphen
  s = s.replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, "");

  // 3) Normalize whitespace:
  // - Convert any whitespace (including NBSP) to a regular space
  // - Collapse runs to a single space
  s = s.replace(/[\s\u00A0]+/g, " ").trim();

  return s;
}

