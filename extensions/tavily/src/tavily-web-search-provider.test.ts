/**
 * Tavily Web Search Provider Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { createTavilyWebSearchProvider } from "./tavily-web-search-provider.js";

describe("Tavily Web Search Provider", () => {
  describe("createTavilyWebSearchProvider", () => {
    it("should create a valid WebSearchProviderPlugin", () => {
      const provider = createTavilyWebSearchProvider();

      expect(provider).toBeDefined();
      expect(provider.id).toBe("tavily");
      expect(provider.label).toBe("Tavily Search");
      expect(provider.envVars).toEqual(["TAVILY_API_KEY"]);
      expect(provider.placeholder).toBe("tvly-...");
      expect(provider.signupUrl).toBe("https://tavily.com");
      expect(provider.docsUrl).toBe("https://docs.tavily.com");
    });

    it("should have correct credential paths", () => {
      const provider = createTavilyWebSearchProvider();

      expect(provider.credentialPath).toBe("plugins.entries.tavily.config.webSearch.apiKey");
      expect(provider.inactiveSecretPaths).toEqual([
        "plugins.entries.tavily.config.webSearch.apiKey",
      ]);
    });

    it("should have createTool function", () => {
      const provider = createTavilyWebSearchProvider();

      expect(provider.createTool).toBeDefined();
      expect(typeof provider.createTool).toBe("function");
    });
  });
});
