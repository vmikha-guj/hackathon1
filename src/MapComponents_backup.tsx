import { useState } from "react";
import type { MapEntry, MapDescription } from "./mapTypes";
import { intensityColor, intensityBg } from "./mapTypes";

/* ── Tag Pill ── */
export function TagPill({ label }: { label: string }) {
  return (
    <span style={{
      background: "#EEEDFE", color: "#534AB7", border: "1px solid #AFA9EC",
      borderRadius: 6, fontSize: 11, fontWeight: 500, padding: "3px 10px",
    }}>#{label}</span>
  );
}

/* ── Intensity Bar ── */
export function IntensityBar({ score }: { score: number }) {
  const c = intensityColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#EEEDFE", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${score * 10}%`, height: "100%", background: c, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: c, minWidth: 20 }}>{score}/10</span>
    </div>
  );
}

/* ── Spinner ── */
export function Spinner({ text }: { text?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "3rem 0" }}>
      <div style={{
        width: 32, height: 32, border: "3px solid #EEEDFE", borderTop: "3px solid #534AB7",
        borderRadius: "50%", animation: "spin 0.75s linear infinite",
      }} />
      <p style={{ fontSize: 13, color: "#8883C4", margin: 0 }}>{text || "Mapping site…"}</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── Cache Badge ── */
export function CacheBadge() {
  return (
    <span style={{
      background: "#E1F5EE", color: "#0F6E56", border: "1px solid #5DCAA5",
      borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "3px 10px",
      letterSpacing: "0.06em", textTransform: "uppercase",
    }}>⚡ Cached</span>
  );
}

/* ── Map Result Card (scrape view) ── */
export function MapResultCard({ entry }: { entry: MapEntry }) {
  const d = entry.description;
  return (
    <div style={{
      background: "white", borderRadius: 16, overflow: "hidden",
      border: "1px solid #EEEDFE", boxShadow: "0 4px 32px rgba(83,74,183,0.10)",
    }}>
      <div style={{ height: 4, background: `linear-gradient(90deg, ${intensityColor(d.intensity_score)}, #534AB7)` }} />
      <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #EEEDFE" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
              {entry.cached && <CacheBadge />}
              <span style={{ fontSize: 11, color: "#8883C4" }}>{entry.domain}</span>
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 4px", color: "#1a1744" }}>{d.site_title}</p>
            <a href={entry.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#534AB7", textDecoration: "none" }}>{entry.url}</a>
          </div>
          <div style={{
            background: intensityBg(d.intensity_score), borderRadius: 10, padding: "8px 12px",
            textAlign: "center", flexShrink: 0,
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: intensityColor(d.intensity_score) }}>{d.intensity_score}</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: intensityColor(d.intensity_score), letterSpacing: "0.06em", textTransform: "uppercase" }}>density</div>
          </div>
        </div>
      </div>
      {/* Value Prop */}
      <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #EEEDFE" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#AFA9EC", margin: "0 0 8px", textTransform: "uppercase" }}>Core Value</p>
        <p style={{ fontSize: 14, color: "#2D2B52", margin: 0, lineHeight: 1.75 }}>{d.core_value_prop}</p>
      </div>
      {/* Nav Map */}
      {d.navigation_map?.length > 0 && (
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #EEEDFE" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#AFA9EC", margin: "0 0 10px", textTransform: "uppercase" }}>Navigation Map</p>
          {d.navigation_map.map((n, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#534AB7", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>→</span>
              <p style={{ fontSize: 13, color: "#2D2B52", margin: 0, lineHeight: 1.5 }}>{n}</p>
            </div>
          ))}
        </div>
      )}
      {/* Key Findings */}
      {d.key_findings?.length > 0 && (
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #EEEDFE" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#AFA9EC", margin: "0 0 10px", textTransform: "uppercase" }}>Key Findings</p>
          {d.key_findings.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#1D9E75", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>◆</span>
              <p style={{ fontSize: 13, color: "#2D2B52", margin: 0, lineHeight: 1.5 }}>{f}</p>
            </div>
          ))}
        </div>
      )}
      {/* Tags */}
      {d.semantic_tags?.length > 0 && (
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #EEEDFE" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#AFA9EC", margin: "0 0 10px", textTransform: "uppercase" }}>Semantic Tags</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {d.semantic_tags.map((t, i) => <TagPill key={i} label={t} />)}
          </div>
        </div>
      )}
      {/* Products */}
      {d.products?.length > 0 && (
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #EEEDFE" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#AFA9EC", margin: "0 0 10px", textTransform: "uppercase" }}>
            Products Found ({d.products.length})
          </p>
          <div style={{ borderRadius: 10, border: "1px solid #EEEDFE", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", padding: "8px 14px", background: "#FAFAFE", borderBottom: "1px solid #EEEDFE" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#AFA9EC", letterSpacing: "0.06em", textTransform: "uppercase" }}>Product</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#AFA9EC", letterSpacing: "0.06em", textTransform: "uppercase" }}>Price</span>
            </div>
            {d.products.map((p, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr auto", padding: "10px 14px",
                borderBottom: i < d.products.length - 1 ? "0.5px solid #EEEDFE" : "none",
                background: i % 2 === 0 ? "white" : "#FDFCFF",
              }}>
                <span style={{ fontSize: 13, color: "#2D2B52", fontWeight: 500 }}>{p.name}</span>
                <span style={{ fontSize: 13, color: "#1D9E75", fontWeight: 700 }}>{p.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Intensity */}
      <div style={{ padding: "14px 20px", background: "#FAFAFE" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#AFA9EC", margin: "0 0 8px", textTransform: "uppercase" }}>Information Density</p>
        <IntensityBar score={d.intensity_score} />
      </div>
    </div>
  );
}

/* ── Grid Card (map view) ── */
export function GridCard({ entry, onClick }: { entry: MapEntry; onClick: () => void }) {
  const d = entry.description;
  return (
    <button onClick={onClick} style={{
      background: "white", borderRadius: 14, overflow: "hidden",
      border: "1px solid #EEEDFE", cursor: "pointer", textAlign: "left",
      transition: "all 0.15s", boxShadow: "0 2px 12px rgba(83,74,183,0.06)",
      width: "100%", padding: 0,
    }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${intensityColor(d.intensity_score)}, #534AB7)` }} />
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: "#8883C4", fontWeight: 500 }}>{entry.domain}</span>
          <span style={{
            fontSize: 11, fontWeight: 800, color: intensityColor(d.intensity_score),
            background: intensityBg(d.intensity_score), borderRadius: 6, padding: "2px 7px",
          }}>{d.intensity_score}</span>
        </div>
        <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 6px", color: "#1a1744", lineHeight: 1.3 }}>{d.site_title}</p>
        <p style={{ fontSize: 12, color: "#6B6B8A", margin: "0 0 10px", lineHeight: 1.5 }}>
          {d.core_value_prop.length > 100 ? d.core_value_prop.substring(0, 100) + "…" : d.core_value_prop}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {d.semantic_tags.slice(0, 3).map((t, i) => (
            <span key={i} style={{ background: "#EEEDFE", color: "#534AB7", borderRadius: 4, fontSize: 10, padding: "2px 6px" }}>#{t}</span>
          ))}
        </div>
      </div>
    </button>
  );
}

/* ── Detail Modal ── */
export function DetailModal({ entry, onClose }: { entry: MapEntry; onClose: () => void }) {
  const d = entry.description;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,23,68,0.5)", backdropFilter: "blur(4px)",
      zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "white", borderRadius: 18, maxWidth: 600, width: "100%", maxHeight: "80vh",
        overflow: "auto", boxShadow: "0 20px 60px rgba(83,74,183,0.25)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #EEEDFE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, margin: 0, color: "#1a1744" }}>{d.site_title}</p>
            <a href={entry.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#534AB7" }}>{entry.url}</a>
          </div>
          <button onClick={onClose} style={{ background: "#EEEDFE", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#534AB7", fontWeight: 600 }}>✕</button>
        </div>
        <div style={{ padding: "14px 20px", borderBottom: "0.5px solid #EEEDFE" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#AFA9EC", margin: "0 0 6px", textTransform: "uppercase" }}>Core Value</p>
          <p style={{ fontSize: 14, color: "#2D2B52", margin: 0, lineHeight: 1.7 }}>{d.core_value_prop}</p>
        </div>
        {d.navigation_map?.length > 0 && (
          <div style={{ padding: "14px 20px", borderBottom: "0.5px solid #EEEDFE" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#AFA9EC", margin: "0 0 8px", textTransform: "uppercase" }}>Navigation Map</p>
            {d.navigation_map.map((n, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <span style={{ color: "#534AB7", fontWeight: 700 }}>→</span>
                <span style={{ fontSize: 13, color: "#2D2B52" }}>{n}</span>
              </div>
            ))}
          </div>
        )}
        {d.key_findings?.length > 0 && (
          <div style={{ padding: "14px 20px", borderBottom: "0.5px solid #EEEDFE" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#AFA9EC", margin: "0 0 8px", textTransform: "uppercase" }}>Key Findings</p>
            {d.key_findings.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <span style={{ color: "#1D9E75", fontWeight: 700 }}>◆</span>
                <span style={{ fontSize: 13, color: "#2D2B52" }}>{f}</span>
              </div>
            ))}
          </div>
        )}
        {d.semantic_tags?.length > 0 && (
          <div style={{ padding: "14px 20px", borderBottom: "0.5px solid #EEEDFE" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#AFA9EC", margin: "0 0 8px", textTransform: "uppercase" }}>Semantic Tags</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{d.semantic_tags.map((t, i) => <TagPill key={i} label={t} />)}</div>
          </div>
        )}
        <div style={{ padding: "14px 20px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#AFA9EC", margin: "0 0 8px", textTransform: "uppercase" }}>Information Density</p>
          <IntensityBar score={d.intensity_score} />
        </div>
      </div>
    </div>
  );
}
