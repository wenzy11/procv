/**
 * Smoke test: PDF renders Turkish glyphs with NotoSans TTF.
 * Run: node scripts/verify-pdf-font.mjs
 */
import path from "path";
import { fileURLToPath } from "url";
import { writeFileSync } from "fs";
import React from "react";
import { renderToBuffer, Font } from "@react-pdf/renderer";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: path.join(root, "public/fonts/NotoSans-Regular.ttf"),
      fontWeight: 400,
    },
    {
      src: path.join(root, "public/fonts/NotoSans-Bold.ttf"),
      fontWeight: 700,
    },
  ],
});

const { Document, Page, Text, StyleSheet } = await import("@react-pdf/renderer");

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "NotoSans", fontSize: 14 },
});

const doc = React.createElement(
  Document,
  null,
  React.createElement(
    Page,
    { size: "A4", style: styles.page },
    React.createElement(
      Text,
      null,
      "Türkçe: ı ş ğ İ ö ü ç — yazılımcı iş arıyorum",
    ),
  ),
);

const buf = await renderToBuffer(doc);
const out = path.join(root, "tmp-pdf-font-test.pdf");
writeFileSync(out, buf);
console.log("Wrote", out, "(" + buf.length + " bytes)");
