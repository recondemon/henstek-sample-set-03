const { app, BrowserWindow, ipcMain, protocol, net, session, dialog, Menu } = require("electron");
const { join } = require("node:path");
const { pathToFileURL } = require("node:url");
const { writeFile } = require("node:fs/promises");
const { Store } = require("./store.cjs");
const { isAppPage } = require("./security.cjs");
protocol.registerSchemesAsPrivileged([
  {
    scheme: "journal",
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);
app.setName("Stillwater Desk");
let window, store;
app.whenReady().then(() => {
  store = new Store(app.getPath("userData"));
  protocol.handle("journal", (request) => {
    const url = new URL(request.url),
      name = url.pathname.slice(1);
    if (
      url.hostname !== "app" ||
      !["index.html", "styles.css", "renderer.js", "model.js", "ui.js", "assets/landscape.svg", "assets/heron.svg", "assets/stillwater-mark.svg"].includes(
        name,
      )
    )
      return new Response("Not found", { status: 404 });
    return net.fetch(pathToFileURL(join(__dirname, name)).toString());
  });
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) =>
    callback(false),
  );
  session.defaultSession.setPermissionCheckHandler(() => false);
  function caller(event) {
    if (
      !window ||
      event.sender !== window.webContents ||
      event.senderFrame !== window.webContents.mainFrame ||
      !isAppPage(event.senderFrame.url)
    )
      throw Error("Untrusted request.");
  }
  ipcMain.handle("journal:load", (event) => {
    caller(event);
    return store.load();
  });
  ipcMain.handle("journal:save", (event, value) => {
    caller(event);
    return store.save(value);
  });
  ipcMain.handle("journal:export", async (event) => {
    caller(event);
    const value = await store.load();
    const result = await dialog.showSaveDialog(window, {
      title: "Export Stillwater journal",
      defaultPath: "stillwater-journal.json",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (result.canceled) return false;
    await writeFile(result.filePath, JSON.stringify(value, null, 2), {
      mode: 0o600,
    });
    return true;
  });
  function create() {
    window = new BrowserWindow({
      width: 1240,
      height: 840,
      minWidth: 800,
      minHeight: 600,
      backgroundColor: "#edf1f6",
      title: "Stillwater Journal",
      webPreferences: {
        preload: join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (event, url) => {
      if (!isAppPage(url)) event.preventDefault();
    });
    window.webContents.on("will-attach-webview", (event) => event.preventDefault());
    window.loadURL("journal://app/index.html");
  }
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "Stillwater",
        submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }],
      },
      {
        label: "Edit",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
        ],
      },
      {
        label: "View",
        submenu: [{ role: "reload" }, { role: "togglefullscreen" }],
      },
      { label: "Window", submenu: [{ role: "minimize" }, { role: "zoom" }] },
    ]),
  );
  create();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) create();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
