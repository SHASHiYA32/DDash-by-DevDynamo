import { ImageResponse } from "next/og";

export const alt = "DDash: your whole business, one dashboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const bars = [90, 130, 120, 190, 260];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0a0a0a", color: "#fafafa", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40, fontWeight: 700 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#c4f13a", color: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>D</div>
          DDash
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -3 }}>
            <span>Your whole business,</span>
            <span style={{ color: "#c4f13a" }}>one dashboard.</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ width: 38, height: h, borderRadius: 8, background: i === 4 ? "#c4f13a" : "#2a2a2a" }} />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#a3a3a3" }}>
          <span>Live charts · Automatic reports · Employee logins</span>
          <span style={{ color: "#c4f13a" }}>by DevDynamo</span>
        </div>
      </div>
    ),
    size,
  );
}
