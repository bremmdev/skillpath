import { ipcMain } from "electron";
import { createCategory, getCategories } from "./db/categories.js";
import { createConcept, updateConcept } from "./db/concepts.js";
import {
	getDashboardStats,
	getLearningFocus,
	getRecentlyLearnedConcepts,
} from "./db/dashboard.js";
import { getSkillTree } from "./db/skill-tree.js";
import type {
	CreateCategoryInput,
	CreateConceptInput,
	UpdateConceptInput,
} from "./db/types.js";

// The app's IPC contract, in one place. Each ipcMain.handle here should have a
// matching bridge method in preload.cts and a matching type in
// renderer/global.d.ts — keep the three in sync. Handlers stay thin: they just
// call into the db layer and let it throw (the rejection crosses IPC to React
// Query). Call this once from main.ts after the app is ready.
export function registerIpcHandlers() {
	ipcMain.handle("categories:get", () => getCategories());
	ipcMain.handle("categories:create", (_event, input: CreateCategoryInput) =>
		createCategory(input),
	);
	ipcMain.handle("skillTree:get", () => getSkillTree());
	ipcMain.handle("dashboard:stats", () => getDashboardStats());
	ipcMain.handle("dashboard:learningFocus", (_event, range: unknown) =>
		getLearningFocus(range === 90 ? 90 : 30),
	);
	ipcMain.handle("dashboard:recentlyLearned", () =>
		getRecentlyLearnedConcepts(),
	);
	ipcMain.handle("concepts:create", (_event, input: CreateConceptInput) =>
		createConcept(input),
	);
	ipcMain.handle("concepts:update", (_event, input: UpdateConceptInput) =>
		updateConcept(input),
	);
}
