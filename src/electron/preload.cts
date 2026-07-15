import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
	categories: {
		get: () => ipcRenderer.invoke("categories:get"),
	},
	skillTree: {
		get: () => ipcRenderer.invoke("skillTree:get"),
	},
	dashboard: {
		stats: () => ipcRenderer.invoke("dashboard:stats"),
		learningFocus: (range: unknown) =>
			ipcRenderer.invoke("dashboard:learningFocus", range),
		recentlyLearned: () => ipcRenderer.invoke("dashboard:recentlyLearned"),
	},
	concepts: {
		create: (input: unknown) => ipcRenderer.invoke("concepts:create", input),
		update: (input: unknown) => ipcRenderer.invoke("concepts:update", input),
	},
});
