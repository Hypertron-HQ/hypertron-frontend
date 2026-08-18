export type CompanyContextResult =
  | { ok: true; context: string; sourceUrl: string }
  | { ok: false; error: string };

export async function fetchCompanyContext(input: {
  website: string;
  name?: string;
  workspaceType?: string;
  signal?: AbortSignal;
}): Promise<CompanyContextResult> {
  try {
    const res = await fetch("/api/company-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        website: input.website,
        name: input.name,
        workspaceType: input.workspaceType,
      }),
      signal: input.signal,
    });
    const json = (await res.json().catch(() => ({}))) as {
      context?: string;
      sourceUrl?: string;
      error?: string;
    };
    if (!res.ok || !json.context?.trim()) {
      return {
        ok: false,
        error: json.error ?? "Could not generate company context.",
      };
    }
    return {
      ok: true,
      context: json.context.trim(),
      sourceUrl: json.sourceUrl ?? input.website,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, error: "Research cancelled." };
    }
    return { ok: false, error: "Could not reach the company context service." };
  }
}
