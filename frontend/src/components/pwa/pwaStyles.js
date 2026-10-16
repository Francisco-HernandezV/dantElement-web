// Estilos compartidos por los avisos PWA (toast de instalación / actualización).
export const cardStyle = {
  pointerEvents: "auto",
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid var(--border-color, #30363d)",
  background: "var(--bg-card, #161b22)",
  color: "var(--text-main, #fff)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  fontSize: "0.85rem",
};

export const primaryBtn = {
  border: "none",
  borderRadius: "8px",
  padding: "8px 14px",
  fontWeight: 600,
  cursor: "pointer",
  background: "var(--color-accent, #3b82f6)",
  color: "#fff",
};

export const ghostBtn = {
  border: "none",
  background: "transparent",
  color: "var(--text-muted, #8b949e)",
  cursor: "pointer",
  padding: "8px",
};
