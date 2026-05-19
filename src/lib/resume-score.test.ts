import { describe, expect, it } from "vitest";
import { completionScore, displayScore } from "./resume-score";
import type { ResumeDocument } from "./types";

const base: ResumeDocument = {
  id: "1",
  title: "T",
  updatedAt: new Date().toISOString(),
  personal: {
    fullName: "A",
    headline: "B",
    email: "a@b.com",
    phone: "",
    location: "",
    summary: "x".repeat(90),
  },
  experience: [{ id: "e", role: "r", company: "c", startDate: "2020-01", endDate: "Present", description: "", highlights: [] }],
  projects: [],
  skills: Array.from({ length: 5 }, (_, i) => ({ id: String(i), name: `s${i}`, level: "Intermediate" })),
  languages: [],
  education: [],
};

describe("displayScore", () => {
  it("prefers lastAtsScore when set", () => {
    expect(displayScore({ ...base, lastAtsScore: 72 })).toBe(72);
  });

  it("falls back to completion", () => {
    const c = completionScore(base);
    expect(displayScore(base)).toBe(c);
  });
});
