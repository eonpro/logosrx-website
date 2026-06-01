import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// 180×180 is the standard apple-touch-icon size; this is the icon iMessage,
// iOS home screen, and many link-preview crawlers use.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const mark = await readFile(join(process.cwd(), "src/app/icon.svg"));
  const markSrc = `data:image/svg+xml;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#262262",
        }}
      >
        <img src={markSrc} width={116} height={116} alt="Logos RX" />
      </div>
    ),
    { ...size },
  );
}
