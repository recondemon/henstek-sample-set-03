const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "journalStore",
  Object.freeze({
    load: () => ipcRenderer.invoke("journal:load"),
    save: (value) => ipcRenderer.invoke("journal:save", value),
    export: () => ipcRenderer.invoke("journal:export"),
  }),
);
