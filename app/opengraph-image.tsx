import { ImageResponse } from "next/og";

export const alt = "Nimelist — jadwal anime, sinopsis, dan platform legal Indonesia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0b10",
          color: "#f5f5f7",
          padding: "64px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -100,
            width: 620,
            height: 620,
            borderRadius: 999,
            background: "rgba(109, 94, 248, 0.35)",
            filter: "blur(30px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -260,
            left: -120,
            width: 620,
            height: 620,
            borderRadius: 999,
            background: "rgba(245, 165, 36, 0.16)",
            filter: "blur(30px)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#6d5ef8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: "17px solid transparent",
                borderBottom: "17px solid transparent",
                borderLeft: "27px solid #ffffff",
                marginLeft: 8,
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>Nimelist</span>
            <span style={{ fontSize: 16, color: "#a7a7b5", letterSpacing: 3 }}>
              ANIME, DALAM WIB
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 }}>
          <span style={{ fontSize: 22, color: "#8475ff", fontWeight: 700 }}>
            Katalog anime Indonesia
          </span>
          <span
            style={{
              fontSize: 64,
              lineHeight: 1.06,
              fontWeight: 800,
              letterSpacing: -3,
            }}
          >
            Jadwal tayang, sinopsis, dan platform legal.
          </span>
          <span style={{ fontSize: 24, color: "#a7a7b5", lineHeight: 1.4 }}>
            Fall 2026 · Waktu Indonesia Barat · Tanpa streaming ilegal
          </span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["Jadwal WIB", "Sinopsis orisinal", "Platform legal"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: 999,
                border: "1px solid #2a2a35",
                background: "#15151d",
                padding: "10px 18px",
                fontSize: 18,
                color: "#d9d9e2",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
