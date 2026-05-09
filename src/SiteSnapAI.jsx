import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const FIRECRAWL_API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CONTENT_TYPE_COLORS = {
  blog: { bg: "#E1F5EE", text: "#0F6E56", border: "#5DCAA5" },
  news: { bg: "#E6F1FB", text: "#185FA5", border: "#85B7EB" },
  product: { bg: "#EEEDFE", text: "#534AB7", border: "#AFA9EC" },
  ecommerce: { bg: "#FAEEDA", text: "#854F0B", border: "#EF9F27" },
  documentation: { bg: "#F1EFE8", text: "#5F5E5A", border: "#B4B2A9" },
  "landing page": { bg: "#FAECE7", text: "#993C1D", border: "#F0997B" },
  other: { bg: "#F1EFE8", text: "#5F5E5A", border: "#B4B2A9" },
};

function Badge({ type }) {
  const colors = CONTENT_TYPE_COLORS[type?.toLowerCase()] || CONTENT_TYPE_COLORS.other;
  return (
    <span style={{
      background: colors.bg, color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: "999px", fontSize: "11px",
      fontWeight: 600, padding: "3px 10px",
      textTransform: "capitalize", letterSpacing: "0.03em"
    }}>{type || "other"}</span>
  );
}

function ToneBadge({ tone }) {
  return (
    <span style={{
      background: "#F1EFE8", color: "#5F5E5A",
      border: "1px solid #B4B2A9",
      borderRadius: "999px", fontSize: "11px",
      fontWeight: 500, padding: "3px 10px",
      textTransform: "capitalize"
    }}>{tone || "neutral"}</span>
  );
}

function HistoryCard({ item, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(item.scraped_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "12px", padding: "1rem 1.25rem",
      marginBottom: "12px", transition: "border-color 0.2s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
            <Badge type={item.content_type} />
            <ToneBadge tone={item.tone} />
            <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{date}</span>
          </div>
          <p style={{
            fontSize: "13px", color: "var(--color-text-info)",
            margin: "0 0 6px", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap"
          }}>{item.url}</p>
          {item.page_title && (
            <p style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 6px", color: "var(--color-text-primary)" }}>
              {item.page_title}
            </p>
          )}
          {!expanded && (
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
              {item.ai_summary?.substring(0, 120)}...
            </p>
          )}
          {expanded && (
            <div>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 10px", lineHeight: 1.6 }}>
                {item.ai_summary}
              </p>
              {item.key_topics?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {item.key_topics.map((t, i) => (
                    <span key={i} style={{
                      background: "var(--color-background-secondary)",
                      border: "0.5px solid var(--color-border-tertiary)",
                      borderRadius: "6px", fontSize: "12px",
                      padding: "3px 10px", color: "var(--color-text-secondary)"
                    }}>#{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button onClick={() => setExpanded(!expanded)} style={{
            background: "transparent", border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "8px", padding: "6px 10px", cursor: "pointer",
            fontSize: "12px", color: "var(--color-text-secondary)"
          }}>{expanded ? "Less" : "More"}</button>
          <button onClick={() => onDelete(item.id)} style={{
            background: "transparent", border: "0.5px solid #F09595",
            borderRadius: "8px", padding: "6px 10px", cursor: "pointer",
            fontSize: "12px", color: "#A32D2D"
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function SiteSnapAI() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState("scrape");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (view === "history") fetchHistory();
  }, [view]);

  async function fetchHistory() {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("scrapes")
      .select("*")
      .order("scraped_at", { ascending: false });
    if (!error) setHistory(data || []);
    setHistoryLoading(false);
  }

  async function handleScrape() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSaved(false);

    try {
      // Step 1: Firecrawl
      const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({ url, formats: ["markdown", "links"] })
      });
      const fcData = await fcRes.json();
      if (!fcData.success) throw new Error("Firecrawl failed to scrape this URL.");

      const rawContent = fcData.data?.markdown?.substring(0, 4000) || "";
      const pageTitle = fcData.data?.metadata?.title || "";
      const rawHeadings = fcData.data?.metadata?.description || "";

      // Step 2: OpenAI
      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 600,
          messages: [{
            role: "user",
            content: `You are a content analyst. Given this scraped website content, return ONLY a valid JSON object with no markdown or backticks:
{
  "summary": "3 clear sentences summarizing the page",
  "key_topics": ["topic1","topic2","topic3","topic4","topic5"],
  "content_type": "one of: blog, news, ecommerce, product, documentation, landing page, other",
  "tone": "one of: professional, casual, technical, promotional"
}

Website content:
${rawContent}`
          }]
        })
      });
      const aiData = await aiRes.json();
      const raw = aiData.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

      setResult({ url, page_title: pageTitle, raw_headings: rawHeadings, ...parsed });
    } catch (e) {
      setError(e.message || "Something went wrong. Try a different URL.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    const { error } = await supabase.from("scrapes").insert([{
      url: result.url,
      page_title: result.page_title,
      raw_headings: result.raw_headings,
      ai_summary: result.summary,
      key_topics: result.key_topics,
      content_type: result.content_type,
      tone: result.tone,
      scraped_at: new Date().toISOString()
    }]);
    if (!error) setSaved(true);
  }

  async function handleDelete(id) {
    await supabase.from("scrapes").delete().eq("id", id);
    setHistory(prev => prev.filter(h => h.id !== id));
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-background-tertiary)",
      fontFamily: "var(--font-sans)"
    }}>
      {/* Header */}
      <div style={{
        background: "var(--color-background-primary)",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        padding: "0 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "56px", position: "sticky", top: 0, zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px",
            background: "#534AB7", display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: "15px", color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}>
            SiteSnap AI
          </span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {["scrape", "history"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? "var(--color-background-secondary)" : "transparent",
              border: view === v ? "0.5px solid var(--color-border-secondary)" : "0.5px solid transparent",
              borderRadius: "8px", padding: "6px 14px",
              fontSize: "13px", fontWeight: view === v ? 500 : 400,
              cursor: "pointer", color: view === v ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              textTransform: "capitalize"
            }}>{v === "history" ? "History" : "Scrape"}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {view === "scrape" && (
          <>
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <h1 style={{
                fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 600,
                letterSpacing: "-0.03em", margin: "0 0 12px",
                color: "var(--color-text-primary)", lineHeight: 1.15
              }}>
                Stop Reading.<br />
                <span style={{ color: "#534AB7" }}>Start Knowing.</span>
              </h1>
              <p style={{
                fontSize: "15px", color: "var(--color-text-secondary)",
                margin: 0, lineHeight: 1.6, maxWidth: "440px", marginInline: "auto"
              }}>
                Paste any URL — get an AI-powered summary, key topics, and insights in seconds. No technical skills needed.
              </p>
            </div>

            {/* Input */}
            <div style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "12px", padding: "6px 6px 6px 16px",
              display: "flex", alignItems: "center", gap: "8px",
              marginBottom: "24px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
            }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
                stroke="var(--color-text-tertiary)" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleScrape()}
                placeholder="https://example.com/any-page"
                style={{
                  flex: 1, border: "none", outline: "none",
                  background: "transparent", fontSize: "14px",
                  color: "var(--color-text-primary)", padding: "8px 0"
                }}
              />
              <button onClick={handleScrape} disabled={loading || !url.trim()} style={{
                background: loading ? "#AFA9EC" : "#534AB7",
                color: "white", border: "none", borderRadius: "8px",
                padding: "10px 20px", fontSize: "13px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap", transition: "background 0.2s"
              }}>
                {loading ? "Scraping..." : "Scrape"}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "#FCEBEB", border: "0.5px solid #F09595",
                borderRadius: "10px", padding: "12px 16px",
                fontSize: "13px", color: "#A32D2D", marginBottom: "20px"
              }}>{error}</div>
            )}

            {/* Loading state */}
            {loading && (
              <div style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "12px", padding: "2rem",
                textAlign: "center"
              }}>
                <div style={{
                  width: "32px", height: "32px", border: "2px solid #EEEDFE",
                  borderTop: "2px solid #534AB7", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite", margin: "0 auto 12px"
                }}/>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
                  Scraping page and analysing content...
                </p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Result */}
            {result && !loading && (
              <div style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "12px", overflow: "hidden"
              }}>
                {/* Result header */}
                <div style={{
                  padding: "1rem 1.25rem",
                  borderBottom: "0.5px solid var(--color-border-tertiary)",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start"
                }}>
                  <div>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <Badge type={result.content_type} />
                      <ToneBadge tone={result.tone} />
                    </div>
                    {result.page_title && (
                      <p style={{ fontSize: "15px", fontWeight: 500, margin: "0 0 4px", color: "var(--color-text-primary)" }}>
                        {result.page_title}
                      </p>
                    )}
                    <a href={result.url} target="_blank" rel="noreferrer" style={{
                      fontSize: "12px", color: "var(--color-text-info)", textDecoration: "none"
                    }}>{result.url}</a>
                  </div>
                  <button onClick={handleSave} disabled={saved} style={{
                    background: saved ? "#EAF3DE" : "#534AB7",
                    color: saved ? "#3B6D11" : "white",
                    border: saved ? "0.5px solid #C0DD97" : "none",
                    borderRadius: "8px", padding: "8px 14px",
                    fontSize: "12px", fontWeight: 600,
                    cursor: saved ? "default" : "pointer", flexShrink: 0
                  }}>{saved ? "✓ Saved" : "Save"}</button>
                </div>

                {/* AI Summary */}
                <div style={{ padding: "1rem 1.25rem", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  <p style={{
                    fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em",
                    color: "var(--color-text-tertiary)", margin: "0 0 8px",
                    textTransform: "uppercase"
                  }}>AI Summary</p>
                  <p style={{ fontSize: "14px", color: "var(--color-text-primary)", margin: 0, lineHeight: 1.7 }}>
                    {result.summary}
                  </p>
                </div>

                {/* Key topics */}
                {result.key_topics?.length > 0 && (
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <p style={{
                      fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em",
                      color: "var(--color-text-tertiary)", margin: "0 0 10px",
                      textTransform: "uppercase"
                    }}>Key Topics</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {result.key_topics.map((t, i) => (
                        <span key={i} style={{
                          background: "var(--color-background-secondary)",
                          border: "0.5px solid var(--color-border-tertiary)",
                          borderRadius: "6px", fontSize: "12px",
                          padding: "4px 12px", color: "var(--color-text-secondary)",
                          fontWeight: 500
                        }}>#{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!result && !loading && !error && (
              <div style={{
                textAlign: "center", padding: "3rem 1rem",
                color: "var(--color-text-tertiary)"
              }}>
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }}>
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/>
                </svg>
                <p style={{ fontSize: "13px", margin: 0 }}>Enter any URL above to get started</p>
              </div>
            )}
          </>
        )}

        {view === "history" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 500, margin: 0, color: "var(--color-text-primary)" }}>
                Saved Scrapes
              </h2>
              <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                {history.length} saved
              </span>
            </div>

            {historyLoading && (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-tertiary)" }}>
                Loading...
              </div>
            )}

            {!historyLoading && history.length === 0 && (
              <div style={{
                textAlign: "center", padding: "3rem",
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "12px"
              }}>
                <p style={{ fontSize: "14px", color: "var(--color-text-tertiary)", margin: "0 0 12px" }}>
                  No saved scrapes yet
                </p>
                <button onClick={() => setView("scrape")} style={{
                  background: "#534AB7", color: "white", border: "none",
                  borderRadius: "8px", padding: "8px 16px",
                  fontSize: "13px", fontWeight: 500, cursor: "pointer"
                }}>Scrape your first URL</button>
              </div>
            )}

            {!historyLoading && history.map(item => (
              <HistoryCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
