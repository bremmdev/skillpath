import { app, BrowserWindow } from "electron";
import path from "path";
import { getDatabase, closeDatabase } from "./db/index.js";
import { screen } from "electron";

function createWindow() {
  const cursorPoint = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPoint);

  // Get the work area size so the window is maximized to the screen size
  const { width, height } = display.workAreaSize;

  const mainWindow = new BrowserWindow({
    width,
    height,
    webPreferences: {
      nodeIntegration: true,
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
  createWindow();
});

app.on("before-quit", () => {
  closeDatabase();
});
