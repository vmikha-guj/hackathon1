import { useState, useEffect, type CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";
import type { AnalysisLens, MapEntry, MapDescription } from "./mapTypes";
import { buildMapSystemPrompt, extractDomain } from "./mapTypes";
import { Spinner, MapResultCard, GridCard, DetailModal } from "./MapComponents";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
const FIRECRAWL_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY;
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const FREE_LIMIT = 10;
const ADMIN_SECRET = "mapmaster"; // Add ?admin=mapmaster to URL to bypass limit
const isAdmin = new URLSearchParams(window.location.search).get("admin") === ADMIN_SECRET;

function getUsageCount(): number {
  return parseInt(localStorage.getItem("map_usage_count") || "0", 10);
}
function incrementUsage(): void {
  localStorage.setItem("map_usage_count", String(getUsageCount() + 1));
}

type View = "map" | "grid" | "list";
type ThemeMode = "light" | "dark";

const ANALYSIS_LENSES: { name: AnalysisLens; helper: string }[] = [
  { name: "Website Summary", helper: "Audience, content, navigation" },
  { name: "Investor View", helper: "Growth, moat, risks" },
  { name: "Competitor View", helper: "Positioning, strengths, gaps" },
  { name: "Partnership View", helper: "Fit, integrations, channels" },
];

const EXAMPLE_URLS = [
  { label: "Try Stripe", value: "https://stripe.com" },
  { label: "Try Shopify", value: "https://shopify.com" },
  { label: "Try Airbnb", value: "https://airbnb.com" },
  { label: "Try Zomato", value: "https://www.zomato.com" },
];

const THEMES: Record<ThemeMode, Record<string, string>> = {
  light: {
    "--md-bg": "linear-gradient(135deg, #FBFAF6 0%, #F1F0FF 46%, #EAF7F3 100%)",
    "--md-surface": "#FFFFFF",
    "--md-surface-hi": "#F5F3FF",
    "--md-border": "rgba(83,74,183,0.14)",
    "--md-border-hi": "rgba(83,74,183,0.26)",
    "--md-text-pri": "#201C35",
    "--md-text-sec": "#534F68",
    "--md-text-dim": "#817C95",
    "--md-track": "rgba(83,74,183,0.10)",
    "--md-footer-bg": "#F8F7FC",
    "--md-pill-hover": "#EEEDFE",
  },
  dark: {
    "--md-bg": "#0C0B14",
    "--md-surface": "#13111F",
    "--md-surface-hi": "#1A1830",
    "--md-border": "rgba(255,255,255,0.07)",
    "--md-border-hi": "rgba(139,124,255,0.3)",
    "--md-text-pri": "#F0EEF8",
    "--md-text-sec": "#9492A8",
    "--md-text-dim": "#5A5870",
    "--md-track": "rgba(255,255,255,0.06)",
    "--md-footer-bg": "rgba(0,0,0,0.2)",
    "--md-pill-hover": "#2a2547",
  },
};

function getInitialTheme(): ThemeMode {
  return localStorage.getItem("map_theme") === "dark" ? "dark" : "light";
}

function cleanFinding(finding: string): string {
  return finding.replace(/\s+/g, " ").trim();
}

function isUsefulFinding(finding: string): boolean {
  const text = cleanFinding(finding);
  if (text.length < 18 || text.length > 240) return false;

  const noisyPatterns = [
    /\btoken(s)?\b/i,
    /\bcookie(s)?\b/i,
    /\btracking\b/i,
    /\bcsrf\b/i,
    /\bid[:#\s-]*[a-z0-9_-]{8,}/i,
    /\b(add to cart|cart|wishlist)\b/i,
    /\b(electric kettle|subscription for streaming)\b/i,
    /^\s*[$₹€£¥]\s?\d+/,
  ];

  return !noisyPatterns.some((pattern) => pattern.test(text));
}

function normalizeDescription(desc: MapDescription, analysisLens: AnalysisLens): MapDescription {
  const keyFindings = (desc.key_findings || [])
    .map(cleanFinding)
    .filter(isUsefulFinding)
    .slice(0, 5);

  return {
    ...desc,
    analysis_lens: analysisLens,
    prompt_version: 2,
    navigation_map: (desc.navigation_map || []).map(cleanFinding).filter(Boolean).slice(0, 8),
    semantic_tags: (desc.semantic_tags || []).map(cleanFinding).filter(Boolean).slice(0, 8),
    key_findings: keyFindings,
    products: Array.isArray(desc.products) ? desc.products.slice(0, 12) : [],
    intensity_score: Math.min(10, Math.max(1, Number(desc.intensity_score) || 5)),
  };
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MapEntry | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("map");
  const [entries, setEntries] = useState<MapEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [selected, setSelected] = useState<MapEntry | null>(null);
  const [usageCount, setUsageCount] = useState(getUsageCount());
  const [showPaywall, setShowPaywall] = useState(false);
  const [analysisLens, setAnalysisLens] = useState<AnalysisLens>("Website Summary");
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    localStorage.setItem("map_theme", theme);
  }, [theme]);

  const isLight = theme === "light";
  const themeVars = THEMES[theme] as CSSProperties;

  useEffect(() => {
    if (view !== "map") fetchEntries();
  }, [view]);

  async function fetchEntries() {
    setEntriesLoading(true);
    const { data } = await supabase
      .from("web_maps")
      .select("id, url, domain, description, created_at")
      .order("created_at", { ascending: false });
    setEntries(
      (data || []).map((r: any) => ({
        id: r.id,
        url: r.url,
        domain: r.domain,
        description: r.description as MapDescription,
        created_at: r.created_at,
      }))
    );
    setEntriesLoading(false);
  }

  async function handleMap() {
    if (!url.trim()) return;

    // Usage limit check (admin bypasses, cache hits don't count)
    if (!isAdmin && usageCount >= FREE_LIMIT) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const normalized = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    const domain = extractDomain(normalized);

    try {
      // ── Cache check ──
      const { data: cachedRows } = await supabase
        .from("web_maps")
        .select("id, url, domain, description, created_at")
        .eq("url", normalized)
        .order("created_at", { ascending: false })
        .limit(10);

      const cached = (cachedRows || []).find((row: any) => {
        const description = row.description as MapDescription;
        return description?.prompt_version === 2 && description?.analysis_lens === analysisLens;
      });

      if (cached) {
        setResult({
          id: cached.id,
          url: cached.url,
          domain: cached.domain,
          description: cached.description as MapDescription,
          created_at: cached.created_at,
          cached: true,
        });
        setLoading(false);
        return;
      }

      // ── Firecrawl (markdown + wait for JS content) ──
      const fc = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${FIRECRAWL_KEY}`,
        },
        body: JSON.stringify({
          url: normalized,
          formats: ["markdown"],
          waitFor: 5000,
          actions: [
            { type: "wait", milliseconds: 3000 },
            { type: "scroll", direction: "down", amount: 3 },
            { type: "wait", milliseconds: 2000 },
          ],
        }),
      });
      const fcData = await fc.json();
      if (!fcData.success) {
        const errMsg = fcData.error || "";
        if (errMsg.includes("ERR_ABORTED") || errMsg.includes("blocked") || errMsg.includes("denied")) {
          throw new Error("🚫 This site has anti-bot protection and blocked the scraper. Try a specific product/article page instead of the homepage (e.g. amazon.in/dp/XXXXX).");
        } else if (errMsg.includes("timeout") || errMsg.includes("timed out")) {
          throw new Error("⏱️ The page took too long to load. It may be too heavy or slow. Try again or use a more specific URL.");
        } else {
          throw new Error(`Could not scrape this page: ${errMsg || "Unknown error"}`);
        }
      }
      const markdown = fcData.data?.markdown?.substring(0, 15000) || "";

      // ── OpenAI (system + user split) ──
      const ai = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 2000,
          temperature: 0,
          messages: [
            { role: "system", content: buildMapSystemPrompt(analysisLens) },
            {
              role: "user",
              content: `Website URL: ${normalized}\nSelected lens: ${analysisLens}\n\nScraped content:\n${markdown}`,
            },
          ],
        }),
      });
      const aiData = await ai.json();
      const raw = aiData.choices?.[0]?.message?.content || "{}";
      const desc: MapDescription = normalizeDescription(
        JSON.parse(raw.replace(/```json|```/g, "").trim()),
        analysisLens
      );

      // ── Generate embedding ──
      let embedding: number[] | null = null;
      try {
        const embText =
          desc.core_value_prop + " " + desc.semantic_tags.join(" ");
        const embRes = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_KEY}`,
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: embText,
          }),
        });
        const embData = await embRes.json();
        embedding = embData.data?.[0]?.embedding || null;
      } catch {
        /* embedding is optional */
      }

      // ── Auto-save to web_maps ──
      const insertRow: any = {
        url: normalized,
        domain,
        content: markdown.substring(0, 10000),
        description: desc,
      };
      if (embedding) insertRow.embedding = JSON.stringify(embedding);

      const { data: saved, error: dbErr } = await supabase
        .from("web_maps")
        .insert([insertRow])
        .select("id, url, domain, description, created_at")
        .single();

      const entry: MapEntry = {
        id: saved?.id,
        url: normalized,
        domain,
        description: desc,
        created_at: saved?.created_at,
      };
      setResult(entry);

      // Count usage (only new scrapes, not cache hits)
      incrementUsage();
      setUsageCount(getUsageCount());
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await supabase.from("web_maps").delete().eq("id", id);
    setEntries((p) => p.filter((e) => e.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const viewLabels: Record<View, string> = {
    map: "🗺️ Map",
    grid: "📊 Grid",
    list: "📋 List",
  };

  return (
    <div
      style={{
        ...themeVars,
        minHeight: "100vh",
        background: "var(--md-bg)",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=IBM+Plex+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* ── Ambient floating orbs ── */}
      <div style={{
        position: "fixed", top: "-10%", right: "-5%", width: 400, height: 400,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(127,119,221,0.08) 0%, transparent 70%)",
        animation: "float 8s ease-in-out infinite", pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "-10%", left: "-5%", width: 300, height: 300,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(83,74,183,0.06) 0%, transparent 70%)",
        animation: "float 10s ease-in-out infinite", animationDelay: "2s", pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── Navbar ── */}
      <nav
        style={{
          background    : isLight ? "rgba(255,255,255,0.82)" : "rgba(13,12,22,0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom  : `1px solid ${isLight ? "rgba(83,74,183,0.14)" : "rgba(255,255,255,0.07)"}`,
          padding       : "0 2rem",
          height        : 62,
          display       : "flex",
          alignItems    : "center",
          justifyContent: "space-between",
          position      : "sticky",
          top           : 0,
          zIndex        : 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 11,
              background: "linear-gradient(135deg, #7F77DD, #534AB7, #3D35A0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(83,74,183,0.3)",
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 15, color: "var(--md-text-pri)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              MapDescriber
            </span>
            <span style={{ fontSize: 10, color: "var(--md-text-dim)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              Outskill Hackathon • Group 15
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 3, background: isLight ? "rgba(83,74,183,0.08)" : "rgba(255,255,255,0.04)", borderRadius: 12, padding: 3, border: `1px solid ${isLight ? "rgba(83,74,183,0.14)" : "rgba(255,255,255,0.07)"}` }}>
          {(["map", "grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                background: view === v ? "rgba(139,124,255,0.15)" : "transparent",
                border: view === v ? "1px solid rgba(139,124,255,0.3)" : "1px solid transparent",
                borderRadius: 9,
                padding: "7px 16px",
                fontSize: 12,
                fontWeight: view === v ? 700 : 500,
                color: view === v ? "#8B7CFF" : "#5A5870",
                cursor: "pointer",
                boxShadow: "none",
                transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                letterSpacing: "0.01em",
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>
          <button
            type="button"
            onClick={() => setTheme(isLight ? "dark" : "light")}
            title={isLight ? "Switch to dark theme" : "Switch to light theme"}
            style={{
              background: isLight ? "rgba(32,28,53,0.06)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${isLight ? "rgba(83,74,183,0.18)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 12,
              color: "var(--md-text-pri)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 800,
              padding: "9px 12px",
              minWidth: 74,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {isLight ? "Dark Mode" : "Light Mode"}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "2.5rem 1.5rem", position: "relative", zIndex: 1 }}>
        {/* ══════ MAP VIEW ══════ */}
        {view === "map" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "2.5rem", animation: "fadeInUp 0.6s ease-out" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(238,237,254,0.8)", border: "1px solid rgba(175,169,236,0.4)",
                backdropFilter: "blur(8px)",
                borderRadius: 999, padding: "5px 18px",
                fontSize: 11, fontWeight: 700, color: "#534AB7",
                letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 22,
              }}>
                <span style={{ display: "inline-block", animation: "float 3s ease-in-out infinite" }}>✦</span>
                AI-Powered Web Cartography
              </div>
              <h1 style={{
                fontFamily: "'Playfair Display',serif", fontWeight: 800,
                fontSize: "clamp(34px,6vw,56px)", lineHeight: 1.05,
                letterSpacing: "-0.04em", margin: "0 0 18px", color: "var(--md-text-pri)",
              }}>
                Explore Any Site.<br />
                <span style={{
                  background: "linear-gradient(135deg, #8B7CFF 0%, #534AB7 40%, #3D35A0 70%, #8B7CFF 100%)",
                  backgroundSize: "200% auto",
                  animation: "shimmer 3s linear infinite",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  Map Its DNA.
                </span>
              </h1>
              <p style={{ fontSize: 15, color: "var(--md-text-sec)", margin: "0 auto", maxWidth: 460, lineHeight: 1.75 }}>
                Paste any URL to generate an AI-powered site map — value proposition,
                navigation structure, semantic tags, product extraction, and information density scoring.
              </p>
            </div>

            {/* Analysis lens */}
            <div style={{
              background: isLight ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.035)",
              border: `1px solid ${isLight ? "rgba(83,74,183,0.16)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 16,
              padding: 14,
              marginBottom: 16,
              animation: "fadeInUp 0.6s ease-out 0.1s both",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
              }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#AFA9EC",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  Analysis Lens
                </span>
                <span style={{ fontSize: 11, color: "var(--md-text-dim)" }}>
                  Shapes the AI report
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                {ANALYSIS_LENSES.map((lens) => {
                  const active = analysisLens === lens.name;
                  return (
                    <button
                      key={lens.name}
                      type="button"
                      onClick={() => {
                        setAnalysisLens(lens.name);
                        setResult(null);
                        setError("");
                      }}
                      style={{
                        background: active ? "rgba(139,124,255,0.16)" : isLight ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.03)",
                        border: active ? "1px solid rgba(139,124,255,0.45)" : `1px solid ${isLight ? "rgba(83,74,183,0.13)" : "rgba(255,255,255,0.07)"}`,
                        borderRadius: 10,
                        padding: "10px 12px",
                        cursor: "pointer",
                        textAlign: "left" as const,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 800,
                        color: active ? "var(--md-text-pri)" : "var(--md-text-sec)",
                        marginBottom: 3,
                      }}>
                        {lens.name}
                      </span>
                      <span style={{ display: "block", fontSize: 10, color: active ? "#7F77DD" : "var(--md-text-dim)", lineHeight: 1.35 }}>
                        {lens.helper}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search bar */}
            <div style={{
              background: isLight ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(139,124,255,0.3)",
              backdropFilter: "blur(12px)",
              borderRadius: 18, padding: "6px 6px 6px 20px",
              display: "flex", alignItems: "center", gap: 10,
              marginBottom: 28,
              boxShadow: "0 4px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.4)",
              transition: "all 0.3s ease",
              animation: "fadeInUp 0.6s ease-out 0.15s both",
            }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#AFA9EC" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMap()}
                placeholder="https://example.com — paste any URL to map"
                style={{
                  flex: 1, border: "none", outline: "none",
                  background: "transparent", fontSize: 14,
                  color: "var(--md-text-pri)", padding: "12px 0", fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleMap}
                disabled={loading || !url.trim()}
                className="btn-glow"
                style={{
                  background: loading ? "#AFA9EC" : "linear-gradient(135deg,#7F77DD,#534AB7)",
                  color: "white", border: "none", borderRadius: 13,
                  padding: "13px 28px", fontSize: 13, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap", letterSpacing: "0.03em",
                  boxShadow: loading ? "none" : "0 4px 16px rgba(83,74,183,0.35)",
                  transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                {loading ? "Mapping…" : "Map It ↗"}
              </button>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
              margin: "-12px 0 28px",
              animation: "fadeInUp 0.6s ease-out 0.2s both",
            }}>
              {EXAMPLE_URLS.map((example) => (
                <button
                  key={example.value}
                  type="button"
                  onClick={() => {
                    setUrl(example.value);
                    setResult(null);
                    setError("");
                  }}
                  style={{
                    background: isLight ? "rgba(255,255,255,0.68)" : "rgba(139,124,255,0.08)",
                    border: `1px solid ${isLight ? "rgba(83,74,183,0.16)" : "rgba(139,124,255,0.2)"}`,
                    borderRadius: 999,
                    color: isLight ? "#534AB7" : "#AFA9EC",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "7px 12px",
                    fontFamily: "'IBM Plex Mono', monospace",
                    letterSpacing: "0.01em",
                  }}
                >
                  {example.label}
                </button>
              ))}
            </div>

            {error && (
              <div style={{
                background: "#FCEBEB", border: "1px solid #F09595",
                borderRadius: 12, padding: "12px 16px",
                fontSize: 13, color: "#A32D2D", marginBottom: 20,
              }}>{error}</div>
            )}

            {loading && (
              <div style={{ background: "white", border: "1px solid #EEEDFE", borderRadius: 16, boxShadow: "0 4px 24px rgba(83,74,183,0.08)" }}>
                <Spinner text="Scraping & mapping with AI…" />
              </div>
            )}

            {result && !loading && <MapResultCard entry={result} />}

            {!result && !loading && !error && (
              <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 20,
                  background: "#EEEDFE", margin: "0 auto 16px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#7F77DD" strokeWidth="1.5">
                    <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                </div>
                <p style={{ fontSize: 14, color: "var(--md-text-sec)", margin: 0 }}>Enter any URL to create a map entry</p>
                <p style={{ fontSize: 12, color: "#AFA9EC", margin: "6px 0 0" }}>Cached results return instantly — zero API cost</p>
              </div>
            )}
          </>
        )}

        {/* ══════ GRID VIEW ══════ */}
        {view === "grid" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 24, margin: "0 0 4px", color: "var(--md-text-pri)", letterSpacing: "-0.02em" }}>
                  Mapped Sites
                </h2>
                <p style={{ fontSize: 13, color: "var(--md-text-sec)", margin: 0 }}>
                  {entries.length} site{entries.length !== 1 ? "s" : ""} mapped
                </p>
              </div>
            </div>

            {entriesLoading && (
              <div style={{ background: "white", borderRadius: 16, border: "1px solid #EEEDFE" }}>
                <Spinner text="Loading map…" />
              </div>
            )}

            {!entriesLoading && entries.length === 0 && (
              <div style={{
                textAlign: "center", padding: "3rem",
                background: "white", border: "1px solid #EEEDFE",
                borderRadius: 16, boxShadow: "0 4px 24px rgba(83,74,183,0.08)",
              }}>
                <p style={{ fontSize: 14, color: "var(--md-text-sec)", margin: "0 0 14px" }}>No sites mapped yet</p>
                <button onClick={() => setView("map")} style={{
                  background: "linear-gradient(135deg,#7F77DD,#534AB7)",
                  color: "white", border: "none", borderRadius: 10,
                  padding: "10px 20px", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", boxShadow: "0 2px 12px rgba(83,74,183,0.3)",
                }}>Map your first site ↗</button>
              </div>
            )}

            {!entriesLoading && entries.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {entries.map((e) => (
                  <GridCard key={e.id} entry={e} onClick={() => setSelected(e)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════ LIST VIEW ══════ */}
        {view === "list" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 24, margin: "0 0 4px", color: "var(--md-text-pri)" }}>
                  Site Directory
                </h2>
                <p style={{ fontSize: 13, color: "var(--md-text-sec)", margin: 0 }}>{entries.length} entries</p>
              </div>
            </div>

            {entriesLoading && (
              <div style={{ background: "white", borderRadius: 16, border: "1px solid #EEEDFE" }}>
                <Spinner text="Loading…" />
              </div>
            )}

            {!entriesLoading && entries.length === 0 && (
              <div style={{
                textAlign: "center", padding: "3rem",
                background: "white", border: "1px solid #EEEDFE", borderRadius: 16,
              }}>
                <p style={{ fontSize: 14, color: "var(--md-text-sec)", margin: "0 0 14px" }}>No entries yet</p>
                <button onClick={() => setView("map")} style={{
                  background: "linear-gradient(135deg,#7F77DD,#534AB7)",
                  color: "white", border: "none", borderRadius: 10,
                  padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>Map a site ↗</button>
              </div>
            )}

            {!entriesLoading && entries.length > 0 && (
              <div style={{ background: "var(--md-surface)", borderRadius: 14, border: "1px solid var(--md-border)", overflow: "hidden" }}>
                {/* Table header */}
                <div style={{
                  display: "grid", gridTemplateColumns: "2fr 3fr 1fr 80px",
                  padding: "10px 16px", background: "rgba(255,255,255,0.03)",
                  borderBottom: "1px solid var(--md-border)", gap: 12,
                }}>
                  {["Site", "Value Prop", "Density", ""].map((h) => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "var(--md-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase" as const, fontFamily: "'IBM Plex Mono',monospace" }}>{h}</span>
                  ))}
                </div>
                {entries.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => setSelected(e)}
                    className="ss-row"
                    style={{
                      display: "grid", gridTemplateColumns: "2fr 3fr 1fr 80px",
                      padding: "12px 16px", borderBottom: "0.5px solid var(--md-border)",
                      cursor: "pointer", gap: 12, transition: "background 0.15s",
                      alignItems: "center", background: "transparent",
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13, margin: 0, color: "var(--md-text-pri)", lineHeight: 1.3 }}>{e.description.site_title}</p>
                      <p style={{ fontSize: 11, color: "var(--md-text-dim)", margin: "2px 0 0", fontFamily: "'IBM Plex Mono',monospace" }}>{e.domain}</p>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--md-text-sec)", margin: 0, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                      {e.description.core_value_prop}
                    </p>
                    <span style={{
                      fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace",
                      color: e.description.intensity_score >= 7 ? "#3ECF8E" : e.description.intensity_score >= 4 ? "#8B7CFF" : "#F59E0B",
                    }}>
                      {e.description.intensity_score}/10
                    </span>
                    <button
                      onClick={(ev) => { ev.stopPropagation(); if (e.id) handleDelete(e.id); }}
                      style={{
                        background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
                        borderRadius: 6, padding: "4px 10px", fontSize: 11,
                        color: "#F87171", cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace",
                      }}
                    >Del</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      {selected && <DetailModal entry={selected} onClose={() => setSelected(null)} />}

      {/* Usage badge */}
      {!isAdmin && (
        <div style={{
          position: "fixed", bottom: 16, right: 16, zIndex: 30,
          background: "var(--md-surface)", border: "1px solid var(--md-border)", borderRadius: 10,
          padding: "8px 14px", fontSize: 11, color: "var(--md-text-sec)",
          boxShadow: "0 2px 12px rgba(0,0,0,.4)", fontFamily: "'IBM Plex Mono',monospace",
        }}>
          Free scans: <strong style={{ color: usageCount >= FREE_LIMIT ? "#F87171" : "#8B7CFF" }}>{Math.max(0, FREE_LIMIT - usageCount)}</strong> / {FREE_LIMIT} remaining
        </div>
      )}

      {/* Paywall modal */}
      {showPaywall && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(26,23,68,0.6)",
          backdropFilter: "blur(6px)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{
            background: "var(--md-surface)", borderRadius: 20, maxWidth: 440, width: "100%",
            padding: "40px 32px", textAlign: "center" as const,
            border: "1px solid rgba(139,124,255,0.2)",
            boxShadow: "0 32px 80px rgba(0,0,0,.8)",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "linear-gradient(135deg,#8B7CFF,#534AB7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 8px 24px rgba(139,124,255,0.3)",
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display',serif", fontWeight: 800,
              fontSize: 24, margin: "0 0 8px", color: "var(--md-text-pri)",
            }}>Free Tier Reached</h2>
            <p style={{ fontSize: 14, color: "var(--md-text-sec)", margin: "0 0 24px", lineHeight: 1.6 }}>
              You've used all {FREE_LIMIT} free scans. Upgrade to <strong style={{ color: "#8B7CFF" }}>MapDescriber Pro</strong> for unlimited site mapping, product extraction, and cached results.
            </p>
            <button style={{
              background: "linear-gradient(135deg,#8B7CFF,#534AB7)",
              color: "white", border: "none", borderRadius: 12,
              padding: "14px 32px", fontSize: 15, fontWeight: 700,
              cursor: "pointer", width: "100%", marginBottom: 12,
              boxShadow: "0 4px 16px rgba(139,124,255,0.35)",
              letterSpacing: "0.02em", fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}>Upgrade to Pro — ₹499/month</button>
            <button onClick={() => setShowPaywall(false)} style={{
              background: "transparent", border: "none",
              fontSize: 13, color: "var(--md-text-dim)", cursor: "pointer",
              padding: "8px 16px", fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}>Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
}
