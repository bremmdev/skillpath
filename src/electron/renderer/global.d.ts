import type {
	Category,
	Concept,
	CreateCategoryInput,
	CreateConceptInput,
	DashboardStats,
	LearningFocus,
	LearningFocusRange,
	RecentlyLearnedConcept,
	SkillTreeCategory,
	UpdateConceptInput,
} from "../db/types";

// Ambient contract for the API surface exposed by preload.ts via
// contextBridge.exposeInMainWorld("api", ...). Every method is an IPC call
// (ipcRenderer.invoke), so returns are Promises even though the main-process
// handlers look synchronous.
declare global {
	interface Window {
		api: {
			categories: {
				get: () => Promise<Category[]>;
				create: (input: CreateCategoryInput) => Promise<Category>;
			};
			skillTree: {
				get: () => Promise<SkillTreeCategory[]>;
			};
			dashboard: {
				stats: () => Promise<DashboardStats>;
				learningFocus: (range: LearningFocusRange) => Promise<LearningFocus>;
				recentlyLearned: () => Promise<RecentlyLearnedConcept[]>;
			};
			concepts: {
				create: (input: CreateConceptInput) => Promise<Concept>;
				update: (input: UpdateConceptInput) => Promise<Concept>;
			};
		};
	}
}
