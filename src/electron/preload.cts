import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
	categories: {
		get: () => ipcRenderer.invoke("categories:get"),
	},
	skillTree: {
		get: () => ipcRenderer.invoke("skillTree:get"),
	},
	concepts: {
		create: (input: unknown) => ipcRenderer.invoke("concepts:create", input),
		update: (input: unknown) => ipcRenderer.invoke("concepts:update", input),
	},
});
