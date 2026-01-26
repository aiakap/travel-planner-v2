/**
 * Parse .eml file and extract plain text content
 * .eml files are RFC 822 format (plain text email messages)
 */
export async function parseEMLFile(file: File): Promise<string> {
  const text = await file.text();
  
  // Simple extraction: look for content after headers
  // More sophisticated: could parse MIME parts, handle multipart/alternative, etc.
  
  // Find the body content (after blank line following headers)
  const headerEndIndex = text.indexOf('\n\n');
  if (headerEndIndex === -1) {
    // No clear header/body separation, return full text
    return text;
  }
  
  const body = text.substring(headerEndIndex).trim();
  
  // Remove common email artifacts
  const cleaned = body
    .replace(/=20/g, ' ')  // Quoted-printable space
    .replace(/=\n/g, '')   // Quoted-printable line breaks
    .replace(/\r\n/g, '\n'); // Normalize line endings
  
  return cleaned;
}
