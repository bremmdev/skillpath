import path from "node:path";
import { app, BrowserWindow, screen } from "electron";
import { closeDatabase, getDatabase } from "./db/index.js";
import { registerIpcHandlers } from "./ipc.js";

function createWindow() {
	const cursorPoint = screen.getCursorScreenPoint();
	const display = screen.getDisplayNearestPoint(cursorPoint);

	// Get the work area size so the window is maximized to the screen size
	const { width, height } = display.workAreaSize;

	const mainWindow = new BrowserWindow({
		width,
		height,
		icon:
			process.env.NODE_ENV === "development"
				? path.join(app.getAppPath(), "src", "assets", "icon.png")
				: undefined,
		webPreferences: {
			// preload is authored as .cts so it compiles to CommonJS (preload.cjs).
			// Sandboxed preload scripts can't be ESM, even though main.js is ESM.
			preload: path.join(app.getAppPath(), "dist-electron", "preload.cjs"),
			// These match Electron's secure defaults; set explicitly so intent is
			// documented and a future dependency/version change can't silently
			// weaken them. Node stays in the main process; the renderer only gets
			// the contextBridge api surface.
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: true,
		},
	});

	// Maximize the window and show it
	mainWindow.once("ready-to-show", () => {
		mainWindow.setBounds({ width, height });
		mainWindow.maximize();
		mainWindow.show();
	});

	if (process.env.NODE_ENV === "development") {
		mainWindow.loadURL("http://localhost:3000");
	} else {
		mainWindow.loadFile(path.join(app.getAppPath(), "dist-ui", "index.html"));
	}
}

app.whenReady().then(() => {
	// Open the database and run migrations before showing the window
	getDatabase();
	registerIpcHandlers();
	createWindow();
});

app.on("before-quit", () => {
	closeDatabase();
});
