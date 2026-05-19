import path from "path";
import { Font } from "@react-pdf/renderer";

/**
 * Noto Sans TTF (full hinted) — reliable Turkish glyphs in @react-pdf/renderer.
 * WOFF from fontsource often fails silently and falls back to Helvetica (broken ı, ş, ğ).
 */
let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;

  const regular = path.join(
    process.cwd(),
    "public/fonts/NotoSans-Regular.ttf",
  );
  const bold = path.join(process.cwd(), "public/fonts/NotoSans-Bold.ttf");

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: regular, fontWeight: 400 },
      { src: bold, fontWeight: 700 },
    ],
  });

  registered = true;
}
