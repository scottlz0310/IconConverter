# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:import-analysis] Failed to resolve import \"@tanstack/react-query\" from \"src/main.tsx\". Does the file exist?"
  - generic [ref=e5]: /app/src/main.tsx:3:49
  - generic [ref=e6]: "2 | import { StrictMode } from \"react\"; 3 | import { createRoot } from \"react-dom/client\"; 4 | import { QueryClient, QueryClientProvider } from \"@tanstack/react-query\"; | ^ 5 | import \"./index.css\"; 6 | import App from \"./App.tsx\";"
  - generic [ref=e7]: at TransformPluginContext._formatLog (file:///app/node_modules/.pnpm/vite@7.1.12_@types+node@24.9.2_jiti@2.6.1_lightningcss@1.30.2/node_modules/vite/dist/node/chunks/config.js:31106:43) at TransformPluginContext.error (file:///app/node_modules/.pnpm/vite@7.1.12_@types+node@24.9.2_jiti@2.6.1_lightningcss@1.30.2/node_modules/vite/dist/node/chunks/config.js:31103:14) at normalizeUrl (file:///app/node_modules/.pnpm/vite@7.1.12_@types+node@24.9.2_jiti@2.6.1_lightningcss@1.30.2/node_modules/vite/dist/node/chunks/config.js:29590:18) at process.processTicksAndRejections (node:internal/process/task_queues:105:5) at async file:///app/node_modules/.pnpm/vite@7.1.12_@types+node@24.9.2_jiti@2.6.1_lightningcss@1.30.2/node_modules/vite/dist/node/chunks/config.js:29648:32 at async Promise.all (index 3) at async TransformPluginContext.transform (file:///app/node_modules/.pnpm/vite@7.1.12_@types+node@24.9.2_jiti@2.6.1_lightningcss@1.30.2/node_modules/vite/dist/node/chunks/config.js:29616:4) at async EnvironmentPluginContainer.transform (file:///app/node_modules/.pnpm/vite@7.1.12_@types+node@24.9.2_jiti@2.6.1_lightningcss@1.30.2/node_modules/vite/dist/node/chunks/config.js:30905:14) at async loadAndTransform (file:///app/node_modules/.pnpm/vite@7.1.12_@types+node@24.9.2_jiti@2.6.1_lightningcss@1.30.2/node_modules/vite/dist/node/chunks/config.js:26043:26) at async viteTransformMiddleware (file:///app/node_modules/.pnpm/vite@7.1.12_@types+node@24.9.2_jiti@2.6.1_lightningcss@1.30.2/node_modules/vite/dist/node/chunks/config.js:27118:20)
  - generic [ref=e8]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e9]: server.hmr.overlay
    - text: to
    - code [ref=e10]: "false"
    - text: in
    - code [ref=e11]: vite.config.ts
    - text: .
```
