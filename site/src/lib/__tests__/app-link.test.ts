import { describe, expect, it } from "vitest";
import {
  APP_LINK_CODE_RE,
  appSchemeUrl,
  appStoreUrl,
  platformOf,
  playStoreUrl,
} from "../app-link";

describe("app-link (27/10/2026)", () => {
  it("accepts REF-<8 chars> codes only", () => {
    expect(APP_LINK_CODE_RE.test("R7KQ2M-K4x9PqZa")).toBe(true);
    expect(APP_LINK_CODE_RE.test("R7KQ2M")).toBe(false);
    expect(APP_LINK_CODE_RE.test("R7KQ2M-K4x9PqZa/..")).toBe(false);
  });

  it("reads the platform from the user agent", () => {
    expect(
      platformOf("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)"),
    ).toBe("ios");
    expect(platformOf("Mozilla/5.0 (Linux; Android 14; Pixel 8)")).toBe(
      "android",
    );
    expect(platformOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBeNull();
    expect(platformOf(null)).toBeNull();
  });

  it("builds the store links and the app's own scheme", () => {
    expect(playStoreUrl("R7KQ2M-K4x9PqZa")).toBe(
      "https://play.google.com/store/apps/details?id=com.benfordtech.plazo&referrer=plazo_code%3DR7KQ2M-K4x9PqZa",
    );
    expect(appStoreUrl({})).toBeNull();
    expect(
      appStoreUrl({
        PLAZO_APP_STORE_URL: "https://apps.apple.com/fr/app/plazo/id123/",
      }),
    ).toBe("https://apps.apple.com/fr/app/plazo/id123");
    expect(
      appStoreUrl({ PLAZO_APP_STORE_URL: "http://example.com" }),
    ).toBeNull();
    expect(appSchemeUrl("R7KQ2M-K4x9PqZa")).toBe("plazo://a/R7KQ2M-K4x9PqZa");
  });
});
