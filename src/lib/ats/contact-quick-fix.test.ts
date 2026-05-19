import { describe, expect, it } from "vitest";
import { contactQuickFixPatch } from "./contact-quick-fix";

describe("contactQuickFixPatch", () => {
  it("appends .com to bare gmail addresses", () => {
    const patch = contactQuickFixPatch({
      fullName: "Test",
      headline: "",
      email: "user@gmail",
      phone: "",
      location: "",
      summary: "",
    });
    expect(patch?.email).toBe("user@gmail.com");
  });

  it("formats Turkish mobile numbers", () => {
    const patch = contactQuickFixPatch({
      fullName: "Test",
      headline: "",
      email: "",
      phone: "5551234567",
      location: "",
      summary: "",
    });
    expect(patch?.phone).toContain("+90");
  });
});
