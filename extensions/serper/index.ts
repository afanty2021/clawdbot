import { definePluginEntry } from "openclaw/plugin-sdk/core";
import { createSerperWebSearchProvider } from "./src/serper-web-search-provider.js";

export default definePluginEntry({
  id: "serper",
  name: "Serper Plugin",
  description: "Serper.dev Search API provider - Real-time Google Search results",
  register(api) {
    api.registerWebSearchProvider(createSerperWebSearchProvider());
  },
});
