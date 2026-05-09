import { useState } from "react";
import type { MapEntry } from "./mapTypes";
import { intensityColor, intensityBg } from "./mapTypes";

/* ─────────────────────────────────────────────
   GLOBAL STYLES — injected once
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=IBM+Plex+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmer { 0%,100% { opacity:.7; } 50% { opacity:1; } }
  @keyframes pulse   { 0%,100% { transform:scale(1); } 50% { transform:scale(1.04); } }
  @keyframes slideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }

  .ss-card          { animation: fadeUp 0.45s cubic-bezier(.22,1,.36,1) both; }
  .ss-row:hover     { background: var(--md-surface-hi) !important; }
  .ss-gridcard:hover{ transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,.45) !important; }
  .ss-pill:hover    { background:var(--md-pill-hover) !important; }
  .ss-close:hover   { background:var(--md-pill-hover) !important; }
  .ss-finding       { animation: slideIn 0.3s ease both; }
`;

function GlobalStyles() {
  return <style>{GLOBAL_CSS}</style>;
}

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const T = {
  bg       : "var(--md-bg)",
  surface  : "var(--md-surface)",
  surfaceHi: "var(--md-surface-hi)",
  border   : "var(--md-border)",
  borderHi : "var(--md-border-hi)",
  accent   : "#8B7CFF",
  accentDim: "#5D52CC",
  green    : "#3ECF8E",
  amber    : "#F59E0B",
  red      : "#F87171",
  textPri  : "var(--md-text-pri)",
  textSec  : "var(--md-text-sec)",
  textDim  : "var(--md-text-dim)",
  mono     : "'IBM Plex Mono', monospace",
  display  : "'Playfair Display', serif",
  body     : "'Plus Jakarta Sans', sans-serif",
};

function scoreColor(s: number) {
  if (s >= 8) return T.green;
  if (s >= 5) return T.accent;
  if (s >= 3) return T.amber;
  return T.red;
}

/* ─────────────────────────────────────────────
   TAG PILL
───────────────────────────────────────────── */
export function TagPill({ label }: { label: string }) {
  return (
    <span className="ss-pill" style={{
      background : "rgba(139,124,255,0.10)",
      color      : T.accent,
      border     : `1px solid rgba(139,124,255,0.25)`,
      borderRadius: 4,
      fontSize   : 11,
      fontWeight : 600,
      fontFamily : T.mono,
      padding    : "3px 9px",
      cursor     : "default",
      transition : "background 0.15s",
      letterSpacing: "0.02em",
    }}>#{label}</span>
  );
}

/* ─────────────────────────────────────────────
   INTENSITY BAR
───────────────────────────────────────────── */
export function IntensityBar({ score }: { score: number }) {
  const c = scoreColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 4, background: "var(--md-track)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          width: `${score * 10}%`, height: "100%", background: c,
          borderRadius: 2, transition: "width 0.6s cubic-bezier(.22,1,.36,1)",
          boxShadow: `0 0 8px ${c}55`,
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: c, fontFamily: T.mono, minWidth: 28 }}>
        {score}/10
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SPINNER
───────────────────────────────────────────── */
export function Spinner({ text }: { text?: string }) {
  return (
    <>
      <GlobalStyles />
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 16, padding: "3.5rem 0",
      }}>
        <div style={{
          width: 34, height: 34,
          border: `2px solid rgba(139,124,255,0.15)`,
          borderTop: `2px solid ${T.accent}`,
          borderRadius: "50%", animation: "spin 0.75s linear infinite",
        }} />
        <p style={{ fontSize: 12, color: T.textDim, margin: 0, fontFamily: T.mono, letterSpacing: "0.04em" }}>
          {text || "Mapping site…"}
        </p>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   CACHE BADGE
───────────────────────────────────────────── */
export function CacheBadge() {
  return (
    <span style={{
      background   : "rgba(62,207,142,0.1)",
      color        : T.green,
      border       : `1px solid rgba(62,207,142,0.3)`,
      borderRadius : 4,
      fontSize     : 10,
      fontWeight   : 700,
      fontFamily   : T.mono,
      padding      : "3px 9px",
      letterSpacing: "0.06em",
      textTransform: "uppercase" as const,
    }}>⚡ Cached</span>
  );
}

/* ─────────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize     : 9,
      fontWeight   : 700,
      fontFamily   : T.mono,
      letterSpacing: "0.12em",
      color        : T.textDim,
      margin       : "0 0 10px",
      textTransform: "uppercase" as const,
    }}>{children}</p>
  );
}

/* ─────────────────────────────────────────────
   DIVIDER
───────────────────────────────────────────── */
function Divider() {
  return <div style={{ height: "0.5px", background: T.border, margin: "0" }} />;
}

/* ─────────────────────────────────────────────
   MAP RESULT CARD (scrape view)
───────────────────────────────────────────── */
export function MapResultCard({ entry }: { entry: MapEntry }) {
  const d = entry.description;
  const sc = scoreColor(d.intensity_score);

  return (
    <>
      <GlobalStyles />
      <div className="ss-card" style={{
        background  : T.surface,
        borderRadius: 16,
        border      : `1px solid ${T.borderHi}`,
        overflow    : "hidden",
        boxShadow   : `0 0 0 1px rgba(0,0,0,.4), 0 24px 48px rgba(0,0,0,.5), 0 0 80px rgba(139,124,255,0.05)`,
        fontFamily  : T.body,
      }}>
        {/* Top accent bar */}
        <div style={{
          height    : 3,
          background: `linear-gradient(90deg, ${sc}, ${T.accent}, ${T.accentDim})`,
          boxShadow : `0 0 12px ${sc}66`,
        }} />

        {/* Header */}
        <div style={{ padding: "18px 22px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
              {entry.cached && <CacheBadge />}
              <span style={{ fontSize: 11, color: T.textDim, fontFamily: T.mono }}>{entry.domain}</span>
            </div>
            <p style={{ fontFamily: T.display, fontWeight: 700, fontSize: 20, margin: "0 0 6px", color: T.textPri, lineHeight: 1.2 }}>
              {d.site_title}
            </p>
            <a href={entry.url} target="_blank" rel="noreferrer" style={{
              fontSize: 11, color: T.accentDim, textDecoration: "none",
              fontFamily: T.mono, display: "block",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{entry.url}</a>
          </div>
          {/* Score badge */}
          <div style={{
            background   : `rgba(${sc === T.green ? "62,207,142" : sc === T.accent ? "139,124,255" : sc === T.amber ? "245,158,11" : "248,113,113"},0.08)`,
            border       : `1px solid ${sc}33`,
            borderRadius : 10,
            padding      : "10px 14px",
            textAlign    : "center" as const,
            flexShrink   : 0,
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: sc, fontFamily: T.mono, lineHeight: 1 }}>
              {d.intensity_score}
            </div>
            <div style={{ fontSize: 8, fontWeight: 700, color: sc, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginTop: 3 }}>
              density
            </div>
          </div>
        </div>

        <Divider />

        {/* Core Value */}
        <div style={{ padding: "16px 22px" }}>
          <SectionLabel>Core Value Proposition</SectionLabel>
          <p style={{ fontSize: 14, color: T.textSec, margin: 0, lineHeight: 1.8 }}>{d.core_value_prop}</p>
        </div>

        <Divider />

        {/* Navigation Map */}
        {d.navigation_map?.length > 0 && (
          <>
            <div style={{ padding: "16px 22px" }}>
              <SectionLabel>Navigation Map</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {d.navigation_map.map((n, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 8, alignItems: "center",
                    background: T.surfaceHi, borderRadius: 7,
                    padding: "8px 12px", border: `1px solid ${T.border}`,
                  }}>
                    <span style={{ color: T.accentDim, fontWeight: 700, fontSize: 12, fontFamily: T.mono, flexShrink: 0 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p style={{ fontSize: 12, color: T.textSec, margin: 0, lineHeight: 1.4 }}>{n}</p>
                  </div>
                ))}
              </div>
            </div>
            <Divider />
          </>
        )}

        {/* Key Findings */}
        {d.key_findings?.length > 0 && (
          <>
            <div style={{ padding: "16px 22px" }}>
              <SectionLabel>Key Findings</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {d.key_findings.map((f, i) => (
                  <div key={i} className="ss-finding" style={{
                    display: "flex", gap: 12, alignItems: "flex-start",
                    animationDelay: `${i * 0.06}s`,
                  }}>
                    <span style={{
                      color: T.green, fontWeight: 700, fontSize: 12,
                      fontFamily: T.mono, flexShrink: 0, marginTop: 2,
                    }}>◆</span>
                    <p style={{ fontSize: 13, color: T.textSec, margin: 0, lineHeight: 1.65 }}>{f}</p>
                  </div>
                ))}
              </div>
            </div>
            <Divider />
          </>
        )}

        {/* Semantic Tags */}
        {d.semantic_tags?.length > 0 && (
          <>
            <div style={{ padding: "16px 22px" }}>
              <SectionLabel>Semantic Tags</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {d.semantic_tags.map((t, i) => <TagPill key={i} label={t} />)}
              </div>
            </div>
            <Divider />
          </>
        )}

        {/* Products */}
        {d.products?.length > 0 && (
          <>
            <div style={{ padding: "16px 22px" }}>
              <SectionLabel>Products Found ({d.products.length})</SectionLabel>
              <div style={{ borderRadius: 10, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr auto",
                  padding: "8px 14px", background: T.surfaceHi,
                  borderBottom: `1px solid ${T.border}`,
                }}>
                  <span style={{ fontSize: 9, fontWeight: 700, fontFamily: T.mono, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Product</span>
                  <span style={{ fontSize: 9, fontWeight: 700, fontFamily: T.mono, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Price</span>
                </div>
                {d.products.map((p, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr auto",
                    padding: "10px 14px",
                    borderBottom: i < d.products.length - 1 ? `1px solid ${T.border}` : "none",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                  }}>
                    <span style={{ fontSize: 13, color: T.textSec, fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 13, color: T.green, fontWeight: 700, fontFamily: T.mono }}>{p.price}</span>
                  </div>
                ))}
              </div>
            </div>
            <Divider />
          </>
        )}

        {/* Intensity */}
        <div style={{ padding: "14px 22px", background: "var(--md-footer-bg)" }}>
          <SectionLabel>Information Density</SectionLabel>
          <IntensityBar score={d.intensity_score} />
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   GRID CARD
───────────────────────────────────────────── */
export function GridCard({ entry, onClick }: { entry: MapEntry; onClick: () => void }) {
  const d = entry.description;
  const sc = scoreColor(d.intensity_score);
  return (
    <>
      <GlobalStyles />
      <button className="ss-gridcard" onClick={onClick} style={{
        background  : T.surface,
        borderRadius: 12,
        border      : `1px solid ${T.border}`,
        cursor      : "pointer",
        textAlign   : "left" as const,
        transition  : "all 0.2s cubic-bezier(.22,1,.36,1)",
        boxShadow   : "0 4px 16px rgba(0,0,0,.3)",
        width       : "100%",
        padding     : 0,
        overflow    : "hidden",
        fontFamily  : T.body,
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${sc}, ${T.accent})` }} />
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: T.textDim, fontFamily: T.mono, fontWeight: 500 }}>{entry.domain}</span>
            <span style={{
              fontSize: 11, fontWeight: 800, fontFamily: T.mono,
              color: sc, background: `${sc}15`,
              borderRadius: 5, padding: "2px 7px",
              border: `1px solid ${sc}30`,
            }}>{d.intensity_score}</span>
          </div>
          <p style={{ fontFamily: T.display, fontWeight: 700, fontSize: 14, margin: "0 0 6px", color: T.textPri, lineHeight: 1.3 }}>
            {d.site_title}
          </p>
          <p style={{ fontSize: 12, color: T.textSec, margin: "0 0 10px", lineHeight: 1.55 }}>
            {d.core_value_prop.length > 90 ? d.core_value_prop.substring(0, 90) + "…" : d.core_value_prop}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {d.semantic_tags.slice(0, 3).map((t, i) => (
              <span key={i} style={{
                background: "rgba(139,124,255,0.08)", color: T.accentDim,
                borderRadius: 4, fontSize: 10, fontFamily: T.mono,
                padding: "2px 6px", border: `1px solid rgba(139,124,255,0.15)`,
              }}>#{t}</span>
            ))}
          </div>
        </div>
      </button>
    </>
  );
}

/* ─────────────────────────────────────────────
   DETAIL MODAL
───────────────────────────────────────────── */
export function DetailModal({ entry, onClose }: { entry: MapEntry; onClose: () => void }) {
  const d = entry.description;
  const sc = scoreColor(d.intensity_score);
  return (
    <>
      <GlobalStyles />
      <div style={{
        position      : "fixed", inset: 0,
        background    : "rgba(6,5,15,0.75)",
        backdropFilter: "blur(8px)",
        zIndex        : 100,
        display       : "flex", alignItems: "center", justifyContent: "center",
        padding       : 20,
        fontFamily    : T.body,
      }} onClick={onClose}>
        <div style={{
          background  : T.surface,
          borderRadius: 18,
          maxWidth    : 620, width: "100%", maxHeight: "82vh",
          overflow    : "auto",
          border      : `1px solid ${T.borderHi}`,
          boxShadow   : `0 32px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(0,0,0,.5)`,
          animation   : "fadeUp 0.25s cubic-bezier(.22,1,.36,1) both",
        }} onClick={e => e.stopPropagation()}>
          {/* Top bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${sc}, ${T.accent})`, borderRadius: "18px 18px 0 0" }} />
          {/* Modal header */}
          <div style={{
            padding: "16px 20px", borderBottom: `1px solid ${T.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: T.display, fontWeight: 700, fontSize: 18, margin: "0 0 4px", color: T.textPri, lineHeight: 1.2 }}>
                {d.site_title}
              </p>
              <a href={entry.url} target="_blank" rel="noreferrer" style={{
                fontSize: 11, color: T.accentDim, fontFamily: T.mono,
                display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{entry.url}</a>
            </div>
            <button className="ss-close" onClick={onClose} style={{
              background: T.surfaceHi, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "6px 12px", cursor: "pointer",
              fontSize: 13, color: T.textSec, fontWeight: 600,
              marginLeft: 12, flexShrink: 0, transition: "background 0.15s",
            }}>✕</button>
          </div>

          {/* Core Value */}
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
            <SectionLabel>Core Value</SectionLabel>
            <p style={{ fontSize: 14, color: T.textSec, margin: 0, lineHeight: 1.75 }}>{d.core_value_prop}</p>
          </div>

          {/* Nav Map */}
          {d.navigation_map?.length > 0 && (
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
              <SectionLabel>Navigation Map</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {d.navigation_map.map((n, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 8, alignItems: "center",
                    background: T.surfaceHi, borderRadius: 6, padding: "7px 10px",
                    border: `1px solid ${T.border}`,
                  }}>
                    <span style={{ color: T.accentDim, fontWeight: 700, fontSize: 11, fontFamily: T.mono }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontSize: 12, color: T.textSec }}>{n}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Findings */}
          {d.key_findings?.length > 0 && (
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
              <SectionLabel>Key Findings</SectionLabel>
              {d.key_findings.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 7, alignItems: "flex-start" }}>
                  <span style={{ color: T.green, fontWeight: 700, fontFamily: T.mono, flexShrink: 0 }}>◆</span>
                  <span style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {d.semantic_tags?.length > 0 && (
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
              <SectionLabel>Semantic Tags</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {d.semantic_tags.map((t, i) => <TagPill key={i} label={t} />)}
              </div>
            </div>
          )}

          {/* Products */}
          {d.products?.length > 0 && (
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
              <SectionLabel>Products ({d.products.length})</SectionLabel>
              <div style={{ borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                {d.products.map((p, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr auto",
                    padding: "9px 13px",
                    borderBottom: i < d.products.length - 1 ? `1px solid ${T.border}` : "none",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                  }}>
                    <span style={{ fontSize: 13, color: T.textSec }}>{p.name}</span>
                    <span style={{ fontSize: 13, color: T.green, fontWeight: 700, fontFamily: T.mono }}>{p.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Intensity */}
          <div style={{ padding: "14px 20px" }}>
            <SectionLabel>Information Density</SectionLabel>
            <IntensityBar score={d.intensity_score} />
          </div>
        </div>
      </div>
    </>
  );
}
