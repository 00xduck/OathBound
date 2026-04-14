const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getStats: (save) => ipcRenderer.invoke('getStats', save),
    saveNameAndDesc: (name, description, save) => ipcRenderer.send('saveNameAndDesc', name, description, save),
    logToMain: (text) => ipcRenderer.send('logToMain', text),
    openFolder: () => ipcRenderer.send('openFolder'),
    deleteSave: (save) => { ipcRenderer.send('deleteSave', save) },
    changeDCState: (state, message) => { ipcRenderer.send('changeDCState', state, message) },
    checkForSaves: (index) => ipcRenderer.invoke('checkForSaves', index),
    exitGame: () => ipcRenderer.send('exitGame'),
    saveGame: (worlds, playerData, save, meta, stats, settings, droppedItems) => ipcRenderer.send('saveGame', worlds, playerData, save, meta, stats, settings, droppedItems),
    getWorldData: (save) => ipcRenderer.invoke('getWorldData', save),
    onData: (callback) => ipcRenderer.on('data', (event, data) => callback(data)),
    openLink: (url) => { ipcRenderer.send('openLink', url) },
    saveSettings: (settings) => ipcRenderer.send('saveSettings', settings),
    fetchSettings: () => ipcRenderer.invoke('fetchSettings'),
    fetchGlobalStats: () => ipcRenderer.invoke('fetchGlobalStats'),
    fetchAchievements: () => ipcRenderer.invoke('fetchAchievements'),
    grantAchievement: (achievement) => ipcRenderer.send('grantAchievement', achievement)
});
