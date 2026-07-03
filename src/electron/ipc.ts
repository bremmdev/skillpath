import { ipcMain } from "electron";
import { getCategories, getSkillTree } from "./db/db-query.js";

// The app's IPC contract, in one place. Each ipcMain.handle here should have a
// matching bridge method in preload.cts and a matching type in
// renderer/global.d.ts — keep the three in sync. Handlers stay thin: they just
// call into the db layer and let it throw (the rejection crosses IPC to React
// Query). Call this once from main.ts after the app is ready.
export function registerIpcHandlers() {
  ipcMain.handle("categories:get", () => getCategories());
  ipcMain.handle("skillTree:get", () => getSkillTree());
}
