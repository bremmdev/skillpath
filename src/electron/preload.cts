import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  categories: {
    get: () => ipcRenderer.invoke("categories:get"),
  },
  skillTree: {
    get: () => ipcRenderer.invoke("skillTree:get"),
  },
});
