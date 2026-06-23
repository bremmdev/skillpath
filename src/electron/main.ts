import { app, BrowserWindow } from "electron";
import path from "path";
import { getDatabase } from "./db/index.js";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
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
