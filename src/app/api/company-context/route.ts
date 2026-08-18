import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_SCRAPE_CHARS = 12_000;
const MAX_CONTEXT_CHARS = 850;
const FETCH_TIMEOUT_MS = 14_000;
const MIN_USEFUL_CHARS = 40;

type Body = {
  website?: unknown;
  name?: unknown;
  workspaceType?: unknown;
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const website = normalizeWebsite(body.website);
  if (!website) {
    return NextResponse.json(
      { error: "A valid http(s) website URL is required." },
      { status: 400 },
    );
  }

  const name =
    typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const workspaceType =
    typeof body.workspaceType === "string"
      ? body.workspaceType.trim().slice(0, 60)
      : "";

  const scraped = await scrapeWebsite(website);
  const pageText =
    scraped.text.trim().length >= MIN_USEFUL_CHARS
      ? scraped.text
      : [
          name ? `Company / workspace name: ${name}` : null,
          workspaceType ? `Workspace type: ${workspaceType}` : null,
          `Website: ${website}`,
          scraped.notes ||
            "The website returned little crawlable text (likely JavaScript-rendered). Infer a careful, non-inventive company profile from the name, type, and domain only.",
        ]
          .filter(Boolean)
          .join("\n");

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const context = await summarizeWithOpenAI({
    apiKey,
    model,
    website,
    name,
    workspaceType,
    pageText,
    thinSource: scraped.text.trim().length < MIN_USEFUL_CHARS,
  });

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: 502 });
  }

  return NextResponse.json({
    context: context.text,
    sourceUrl: website,
    model,
  });
}

function normalizeWebsite(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

async function scrapeWebsite(
  website: string,
): Promise<{ text: string; notes: string }> {
  const origin = new URL(website);
  const candidates = uniqueUrls([
    website,
    new URL("/about", origin).toString(),
    new URL("/about-us", origin).toString(),
    new URL("/company", origin).toString(),
  ]);

  const chunks: string[] = [];
  let notes = "";

  for (const url of candidates) {
    const page = await fetchHtml(url);
    if (!page.ok) {
      if (!notes && page.error) notes = page.error;
      continue;
    }
    const extracted = extractPageSignals(page.html);
    if (extracted) chunks.push(`Source: ${url}\n${extracted}`);
    if (joinedLength(chunks) >= 1_200) break;
  }

  const text = chunks.join("\n\n").slice(0, MAX_SCRAPE_CHARS);
  return {
    text,
    notes:
      text.length >= MIN_USEFUL_CHARS
        ? ""
        : notes ||
          "Little readable HTML text was available from the homepage and about pages.",
  };
}

function uniqueUrls(urls: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    const key = url.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}

function joinedLength(chunks: string[]) {
  return chunks.reduce((sum, chunk) => sum + chunk.length, 0);
}

async function fetchHtml(
  url: string,
): Promise<{ ok: true; html: string } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) {
      return {
        ok: false,
        error: `Could not fetch the website (HTTP ${response.status}).`,
      };
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml") &&
      !contentType.includes("application/xml")
    ) {
      return {
        ok: false,
        error: "Website did not return HTML content we can research.",
      };
    }
    const html = await response.text();
    return { ok: true, html };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, error: "Website scrape timed out." };
    }
    return { ok: false, error: "Could not reach the company website." };
  } finally {
    clearTimeout(timer);
  }
}

function extractPageSignals(html: string) {
  const parts: string[] = [];

  const title = matchContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) parts.push(`Title: ${decodeEntities(title)}`);

  const metaKeys = [
    ["description", /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i],
    ["description", /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i],
    ["og:title", /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i],
    ["og:title", /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["'][^>]*>/i],
    [
      "og:description",
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ],
    [
      "og:description",
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["'][^>]*>/i,
    ],
    [
      "twitter:description",
      /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ],
  ] as const;

  const seenMeta = new Set<string>();
  for (const [label, pattern] of metaKeys) {
    if (seenMeta.has(label)) continue;
    const value = matchContent(html, pattern);
    if (!value) continue;
    seenMeta.add(label);
    parts.push(`${label}: ${decodeEntities(value)}`);
  }

  const jsonLdBlocks = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  for (const block of jsonLdBlocks.slice(0, 4)) {
    const raw = block[1]?.trim();
    if (!raw) continue;
    const flattened = flattenJsonLd(raw);
    if (flattened) parts.push(`Structured data: ${flattened}`);
  }

  const nextData = matchContent(
    html,
    /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (nextData) {
    const flattened = flattenNextData(nextData);
    if (flattened) parts.push(`App data: ${flattened}`);
  }

  const bodyText = htmlToPlainText(html);
  if (bodyText) parts.push(bodyText);

  return parts.join("\n").trim();
}

function matchContent(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1]?.trim() || "";
}

function flattenJsonLd(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const values: string[] = [];
    walkJson(parsed, values, 0);
    return values.join(" ").replace(/\s+/g, " ").trim().slice(0, 2_500);
  } catch {
    return "";
  }
}

function flattenNextData(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const values: string[] = [];
    walkJson(parsed, values, 0);
    return values.join(" ").replace(/\s+/g, " ").trim().slice(0, 3_000);
  } catch {
    return "";
  }
}

function walkJson(value: unknown, out: string[], depth: number) {
  if (depth > 6 || out.join(" ").length > 3_500) return;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      trimmed.length >= 24 &&
      trimmed.length <= 500 &&
      /[a-zA-Z]/.test(trimmed) &&
      !trimmed.startsWith("http") &&
      !trimmed.includes("function") &&
      !/^[0-9a-f-]{16,}$/i.test(trimmed)
    ) {
      out.push(trimmed);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value.slice(0, 40)) walkJson(item, out, depth + 1);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (
        /description|tagline|summary|about|headline|name|title|mission|product/i.test(
          key,
        )
      ) {
        walkJson(nested, out, depth + 1);
      }
    }
  }
}

function htmlToPlainText(html: string) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<\/(p|div|h[1-6]|li|br|tr|section|article|header|main)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, MAX_SCRAPE_CHARS);
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    );
}

async function summarizeWithOpenAI(input: {
  apiKey: string;
  model: string;
  website: string;
  name: string;
  workspaceType: string;
  pageText: string;
  thinSource: boolean;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const system = [
    "You write concise company profiles for Hypertron workspace setup.",
    "Return only 2 short paragraphs of plain text.",
    "Keep the entire response under 850 characters including spaces.",
    "No markdown, bullets, titles, or preamble.",
    "Cover what the company does, who it serves, and payment or operations needs if available.",
    "If the source is thin, stay factual and do not invent product details, customers, or metrics.",
    "You may use the company name, workspace type, and domain as weak signals when page text is sparse.",
  ].join(" ");

  const user = [
    input.name ? `Workspace name: ${input.name}` : null,
    input.workspaceType ? `Workspace type: ${input.workspaceType}` : null,
    `Website: ${input.website}`,
    input.thinSource
      ? "Note: scraped page text was sparse; keep the profile carefully general."
      : null,
    "",
    "Scraped website text:",
    input.pageText,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        temperature: 0.3,
        max_tokens: 260,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    const json = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };

    if (!response.ok) {
      return {
        ok: false,
        error: json.error?.message ?? "OpenAI request failed.",
      };
    }

    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return { ok: false, error: "OpenAI returned an empty summary." };
    }

    return { ok: true, text: text.slice(0, MAX_CONTEXT_CHARS) };
  } catch {
    return { ok: false, error: "Could not reach OpenAI." };
  }
}
