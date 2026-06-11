import { ImageResponse } from "next/og";

export const alt = "AstroHue — Find a color hidden in the cosmos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#F3F0E8", color: "#171A21", padding: 70, fontFamily: "serif" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", fontFamily: "sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: 3 }}>ASTRO<br />HUE</div>
        <div style={{ display: "flex", flexDirection: "column" }}><div style={{ display: "flex", flexDirection: "column", fontSize: 82, lineHeight: .95 }}>Find a color<br />hidden in the cosmos</div><div style={{ marginTop: 28, fontFamily: "sans-serif", fontSize: 25, color: "#60636B" }}>A free astronomy color guessing game</div></div>
      </div>
      <div style={{ width: 430, height: 490, borderRadius: 45, background: "#0D1017", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ width: 330, height: 330, borderRadius: 999, background: "radial-gradient(circle at 35% 25%,#F7C736,#A653C5 45%,#315BDB 72%,#0D1017)", boxShadow: "0 0 100px #A653C588" }} />
        <div style={{ position: "absolute", left: 90, top: 280, width: 24, height: 24, border: "4px solid white", borderRadius: 99 }} />
      </div>
    </div>,
    size,
  );
}
