const { app, BrowserWindow } = require("electron");
const path = require("path");
const remoteMain = require("@electron/remote/main");

function createWindow() 
{
    const win = new BrowserWindow({
        title: "Shodan Explorer",
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 300,
        icon: path.join(__dirname, "images", "favicon.png"),
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    remoteMain.enable(win.webContents);
    win.loadFile("index.html");
}

app.whenReady().then(() => {
    remoteMain.initialize();
    createWindow();
});
