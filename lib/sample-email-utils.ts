import fs from "fs/promises"
import path from "path"

export interface SampleEmailSummary {
  id: string
  label: string
}

export interface SampleEmailDetail extends SampleEmailSummary {
  text: string
}

const SAMPLE_DIR_NAME = "sample data"

function getSampleDir(): string {
  return path.join(process.cwd(), SAMPLE_DIR_NAME)
}

function formatLabel(filename: string): string {
  const base = filename.replace(/\.eml$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
  return base.replace(/\b\w/g, (char) => char.toUpperCase())
}

function normalizeLines(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function splitHeadersBody(raw: string): { headersText: string; bodyText: string } {
  const normalized = normalizeLines(raw)
  const separatorIndex = normalized.indexOf("\n\n")
  if (separatorIndex === -1) {
    return { headersText: "", bodyText: normalized }
  }

  return {
    headersText: normalized.slice(0, separatorIndex),
    bodyText: normalized.slice(separatorIndex + 2),
  }
}

function parseHeaders(headersText: string): Record<string, string> {
  const headers: Record<string, string> = {}
  const lines = normalizeLines(headersText).split("\n")
  let currentKey: string | null = null

  lines.forEach((line) => {
    if (!line.trim()) return
    if (/^\s/.test(line) && currentKey) {
      headers[currentKey] = `${headers[currentKey]} ${line.trim()}`
      return
    }

    const index = line.indexOf(":")
    if (index === -1) return
    const key = line.slice(0, index).trim().toLowerCase()
    const value = line.slice(index + 1).trim()
    headers[key] = value
    currentKey = key
  })

  return headers
}

function decodeQuotedPrintable(value: string): string {
  const normalized = normalizeLines(value)
  const withoutSoftBreaks = normalized.replace(/=\n/g, "")
  return withoutSoftBreaks.replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => {
    const code = parseInt(hex, 16)
    return Number.isNaN(code) ? "" : String.fromCharCode(code)
  })
}

function decodeBody(body: string, encoding?: string): string {
  const normalizedEncoding = encoding?.toLowerCase() || "7bit"
  if (normalizedEncoding === "base64") {
    const compact = body.replace(/\s+/g, "")
    return Buffer.from(compact, "base64").toString("utf-8")
  }

  if (normalizedEncoding === "quoted-printable") {
    return decodeQuotedPrintable(body)
  }

  return body
}

function findBoundary(contentType?: string): string | null {
  if (!contentType) return null
  const match = contentType.match(/boundary="?([^";]+)"?/i)
  return match?.[1] || null
}

function extractPlainTextFromEml(raw: string): string {
  const { headersText, bodyText } = splitHeadersBody(raw)
  const headers = parseHeaders(headersText)
  const contentType = headers["content-type"]
  const boundary = findBoundary(contentType)

  if (contentType?.toLowerCase().startsWith("multipart/") && boundary) {
    const delimiter = `--${boundary}`
    const parts = normalizeLines(bodyText).split(delimiter)

    for (const part of parts) {
      const trimmed = part.trim()
      if (!trimmed || trimmed === "--") continue
      const { headersText: partHeadersText, bodyText: partBody } = splitHeadersBody(trimmed)
      const partHeaders = parseHeaders(partHeadersText)
      const partContentType = partHeaders["content-type"]?.toLowerCase()
      if (partContentType?.startsWith("text/plain")) {
        const decoded = decodeBody(partBody, partHeaders["content-transfer-encoding"])
        return decoded.trim()
      }
    }
  }

  const decoded = decodeBody(bodyText, headers["content-transfer-encoding"])
  return decoded.trim()
}

export async function listSampleEmails(): Promise<SampleEmailSummary[]> {
  const sampleDir = getSampleDir()
  const entries = await fs.readdir(sampleDir)
  return entries
    .filter((entry) => entry.toLowerCase().endsWith(".eml"))
    .sort((a, b) => a.localeCompare(b))
    .map((filename) => ({
      id: filename,
      label: formatLabel(filename),
    }))
}

export async function getSampleEmail(id: string): Promise<SampleEmailDetail | null> {
  if (!id || id.includes("/") || id.includes("..") || id.includes("\\")) {
    return null
  }

  const samples = await listSampleEmails()
  const sample = samples.find((item) => item.id === id)
  if (!sample) return null

  const sampleDir = getSampleDir()
  const filePath = path.join(sampleDir, id)
  const raw = await fs.readFile(filePath, "utf-8")
  const text = extractPlainTextFromEml(raw)

  return {
    ...sample,
    text,
  }
}
