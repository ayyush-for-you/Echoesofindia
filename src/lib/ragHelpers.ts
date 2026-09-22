import { Manuscript } from "../types/manuscript";

/**
 * Combines a manuscript's title, language, period, region, description,
 * tags, translated text, and translation summary into a unified string optimized for vector embedding.
 */
export function prepareDocumentText(manuscript: Manuscript): string {
  const parts: string[] = [];

  if (manuscript.title) {
    parts.push(`Title: ${manuscript.title}`);
  }
  if (manuscript.originalLanguage) {
    parts.push(`Original Language: ${manuscript.originalLanguage}`);
  }
  if (manuscript.period) {
    parts.push(`Historical Period: ${manuscript.period}`);
  }
  if (manuscript.region) {
    parts.push(`Geographic Region: ${manuscript.region}`);
  }
  if (manuscript.tags && manuscript.tags.length > 0) {
    parts.push(`Topics & Tags: ${manuscript.tags.join(", ")}`);
  }
  if (manuscript.description) {
    parts.push(`Curator Description: ${manuscript.description}`);
  }
  if (manuscript.translationSummary) {
    parts.push(`Translation Summary: ${manuscript.translationSummary}`);
  }
  if (manuscript.translatedText) {
    parts.push(`Full English Translation:\n${manuscript.translatedText}`);
  }

  return parts.join("\n\n");
}

/**
 * Extracts a text snippet around the first occurrence of the query,
 * with contextLength characters of context on each side. Highlights the match with ** markers.
 */
export function extractSnippet(
  text: string,
  query: string,
  contextLength: number = 200
): string {
  if (!text) return "";
  if (!query || !query.trim()) {
    return text.length > contextLength * 2
      ? `${text.slice(0, contextLength * 2)}...`
      : text;
  }

  const cleanQuery = query.trim();
  const lowerText = text.toLowerCase();
  const lowerQuery = cleanQuery.toLowerCase();

  // Find position of the query or its first word
  let matchIndex = lowerText.indexOf(lowerQuery);
  let matchLength = cleanQuery.length;

  if (matchIndex === -1) {
    // Try matching the first prominent word of the query (> 3 chars)
    const words = cleanQuery.split(/\s+/).filter((w) => w.length > 3);
    for (const word of words) {
      const idx = lowerText.indexOf(word.toLowerCase());
      if (idx !== -1) {
        matchIndex = idx;
        matchLength = word.length;
        break;
      }
    }
  }

  // If still not found, return the beginning of the text
  if (matchIndex === -1) {
    const preview = text.slice(0, contextLength * 2).trim();
    return text.length > contextLength * 2 ? `${preview}...` : preview;
  }

  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(text.length, matchIndex + matchLength + contextLength);

  const prefix = start > 0 ? "... " : "";
  const suffix = end < text.length ? " ..." : "";

  const before = text.slice(start, matchIndex);
  const match = text.slice(matchIndex, matchIndex + matchLength);
  const after = text.slice(matchIndex + matchLength, end);

  return `${prefix}${before}**${match}**${after}${suffix}`.trim();
}

/**
 * Converts an ISO date string to a human-readable relative time ("2 hours ago", "3 days ago", etc.).
 */
export function formatRelativeTime(isoDate: string): string {
  if (!isoDate) return "Unknown date";
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return "Unknown date";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) {
    return "just now";
  }
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? "1 minute ago" : `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
}
