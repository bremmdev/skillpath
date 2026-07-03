import type { Category, SkillTreeCategory } from "../db/types";

// Ambient contract for the API surface exposed by preload.ts via
// contextBridge.exposeInMainWorld("api", ...). Every method is an IPC call
// (ipcRenderer.invoke), so returns are Promises even though the main-process
// handlers look synchronous.
declare global {
  interface Window {
    api: {
      categories: {
        get: () => Promise<Category[]>;
      };
      skillTree: {
        get: () => Promise<SkillTreeCategory[]>;
      };
    };
  }
}
