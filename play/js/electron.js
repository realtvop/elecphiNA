const electron = new UAParser().getBrowser().name === "Electron" ? require("electron") : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

function cacheObject(key, value) {
    if (!electron) return null;
    
}