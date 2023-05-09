import { defineConfig } from 'vite'

export default defineConfig({
  
  build: {
    lib: {
      entry: "src/index.ts",
      fileName: "index",
      formats: ["cjs"]
    },
    rollupOptions: {
      external: ["azure-pipelines-task-lib/task"]
    }
  }
})