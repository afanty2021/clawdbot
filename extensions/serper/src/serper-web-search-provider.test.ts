/**
 * Serper Web Search Provider Tests
 */

import { describe, it, expect } from "bun:test";
import { createSerperWebSearchProvider } from "./serper-web-search-provider.js";

describe("Serper Web Search Provider", () => {
  describe("createSerperWebSearchProvider", () => {
    it("should create a valid WebSearchProviderPlugin", () => {
      const provider = createSerperWebSearchProvider();

      expect(provider).toBeDefined();
      expect(provider.id).toBe("serper");
      expect(provider.label).toBe("Serper (Google)");
      expect(provider.envVars).toEqual(["SERPER_API_KEY"]);
      expect(provider.signupUrl).toBe("https://serper.dev");
      expect(provider.docsUrl).toBe("https://serper.dev/api-reference");
    });

    it("should have correct credential paths", () => {
      const provider = createSerperWebSearchProvider();

      expect(provider.credentialPath).toBe("plugins.entries.serper.config.webSearch.apiKey");
      expect(provider.inactiveSecretPaths).toEqual([
        "plugins.entries.serper.config.webSearch.apiKey",
      ]);
    });

    it("should have createTool function", () => {
      const provider = createSerperWebSearchProvider();

      expect(provider.createTool).toBeDefined();
      expect(typeof provider.createTool).toBe("function");
    });
  });
});
