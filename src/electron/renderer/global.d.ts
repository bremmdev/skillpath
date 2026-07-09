import type {
	Category,
	Concept,
	CreateConceptInput,
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
			};
			skillTree: {
				get: () => Promise<SkillTreeCategory[]>;
			};
			concepts: {
				create: (input: CreateConceptInput) => Promise<Concept>;
				update: (input: UpdateConceptInput) => Promise<Concept>;
			};
		};
	}
}
