import { ImageResponse } from "next/og";

// Branded social-share card (1200x630). Next wires this into openGraph.images AND twitter.images.
export const alt = "Helpr — Tu equipo en WhatsApp, con memoria.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0f3d2c",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#b6e84a",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Memoria operativa para ONGs
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 130,
              fontWeight: 800,
              color: "#f6f0e2",
              lineHeight: 1,
            }}
          >
            helpr
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 48,
              fontWeight: 700,
              color: "#f6f0e2",
              marginTop: 28,
            }}
          >
            Tu equipo en WhatsApp,
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 48,
              fontWeight: 700,
              color: "#b6e84a",
            }}
          >
            con memoria.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 27,
              color: "#d7f38c",
              marginTop: 28,
              maxWidth: 920,
              lineHeight: 1.4,
            }}
          >
            Texto o audio por WhatsApp, convertido en tareas, decisiones y
            responsables.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
