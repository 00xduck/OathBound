const { app, BrowserWindow, ipcMain, screen, shell, globalShortcut } = require("electron");
const Store = require("electron-store")
const path = require("path");
const fs = require('fs')
const os = require('os')
const { spawn } = require('child_process')
const discord = require("./discord");
const crypto = require("crypto")
const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline');

const save1 = new Store({
    name: 'save1'
})

const save2 = new Store({
    name: 'save2'
})

const save3 = new Store({
    name: 'save3'
})

const config = new Store({
    name: "config"
})

const globalStats = new Store({
    name: "stats",
    encryptionKey: "adwPieps323ayxderyQQ3Goodboy"
})

const achievementsStore = new Store({
    name: "achievements",
    encryptionKey: "adwPieps323ayxderyQQ3Goodboy"
})

const accountStore = new Store({
    name: "account"
})

const skinsStore = new Store({
    name: "skins",
    encryptionKey: "adwPieps323ayxderyQQ3Goodboy"
})

const achievementsDefault = {
    oathbound: { granted: false, desc: "- the start...", name: "OathBound", icon: "img/icons/healthboost_icon.png" },
    goblin_kill: { granted: false, desc: "Blood - green or red?", name: "Goblin Blood!", icon: "img/icons/killed_goblins.png" },
    deal: { granted: false, desc: "Trade with a NPC", name: "Deal!", icon: "img/icons/talked_to_NPC.png" },
    stone_age: { granted: false, desc: "Wait, I remember that!", name: "Stone Age!", icon: "img/icons/stone_age.png" },
    afk: { granted: false, desc: "You know that you can save the game, right?", name: "AFK", icon: "img/icons/afk.png" },
    beast: { granted: false, desc: "Kill an enemy with your bare hands!", name: "You Beast!", icon: "img/icons/beast.png" },
    close_call: { granted: false, desc: "Kill an enemy with less than 5% of your health", name: "Close Call", icon: "img/icons/close_call.png" },
    goblin_demolisher: { granted: false, desc: "Kill 75 Goblins", name: "Goblin Demolisher", icon: "img/icons/goblin_demolisher.png" },
    free_nate: { granted: false, desc: "You still have no idea who he is, but sure, why not", name: "Who Even Is Nate?", icon: "img/portraits/nate.png" },
    knock_knock: { granted: false, desc: "No Trespassing!", name: "Knock Knock!", icon: "img/blocks/door_1.png" },
    cheater: { granted: false, desc: "What's the fun in that?", name: "You Cheated!", icon: "img/icons/cheater.png" },
    craft: { granted: false, desc: "Getting your hand dirty!", name: "Let's Craft!", icon: "img/icons/craft.png" },
    heal: { granted: false, desc: "Trying best to stay alive!", name: "Healthy Diet!", icon: "img/icons/regeneration_icon.png" },
    goblin_kingdom: { granted: false, desc: "The goblins don't take kindly to visitors", name: "Bold Move!", icon: "img/icons/goblin_kingdom.png" },
    are_we_there_yet: { granted: false, desc: "Still no idea where you're going?", name: "Are we there yet?", icon: "img/icons/distance_traveled.png" },
    hoarder: { granted: false, desc: "Have a full inventory", name: "Hoarder", icon: "img/icons/hoarder.png" },
    you_werent_supposed_to_see_that: { granted: false, desc: "How did you find this?", name: "You weren't supposed to see that!", icon: "img/icons/see.png" },
    new_look: { granted: false, desc: "You look like a strong warrior!", name: "Getting a new look!", icon: "img/icons/armor.png" }
}

const saves = { 1: save1, 2: save2, 3: save3 }

function getAppDataPath() {
    switch (process.platform) {
        case 'win32':
            return path.join(process.env.APPDATA, 'oathbound')
        case 'darwin':
            return path.join(process.env.HOME, 'Library', 'Application Support', 'oathbound')
        default:
            return path.join(process.env.HOME, '.config', 'oathbound')
    }
}

function openAppFolder() {
    const folderPath = getAppDataPath()

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true })
    }

    switch (process.platform) {
        case 'win32':
            spawn('explorer', [folderPath])
            break
        case 'darwin':
            spawn('open', [folderPath])
            break
        default: // linux
            spawn('xdg-open', [folderPath])
            break
    }
}

let port = null;
let parser = null;
let mainWindow;


function createWindow() {
    const display = screen.getPrimaryDisplay()
    const refreshRate = display.displayFrequency
    mainWindow = new BrowserWindow({
        width: display.workArea.width,
        height: display.workArea.height,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, process.platform === 'win32' ? 'logo.ico' : 'logo.png'),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    if (false) {
        mainWindow.loadFile("public/error.html")
    } else {
        mainWindow.loadFile("public/index.html");
    }

    mainWindow.webContents.on('did-finish-load', () => {
        if (false) {
            mainWindow.webContents.send('data', { error: { text: "Refreshrate is too high!", type: "refreshRate", addInfo: "Refreshrate needs to be 60Hz" }, severity: "medium" });
        }
    });
}

if(!skinsStore.get('skins')) {
    const skinsPath = path.join(__dirname, 'public', 'data', 'skins.json')
    const raw = fs.readFileSync(skinsPath, 'utf-8')
    skins = JSON.parse(raw)
    skinsStore.set('skins', skins)
}

let configs;
let configsReady = false;
(async () => {
    try {
        const configPath = path.join(__dirname, 'public', 'data', 'configs.json')
        const raw = fs.readFileSync(configPath, 'utf-8')
        configs = JSON.parse(raw)
        if (!config.get('data')) {
            config.set('data', configs)
        }

        configsReady = true
    } catch (err) {
        console.error('Load Error on configs:', err)
    }
})()

function checkHashCompConfig() {
    if (!configs || !config.get('data')) return false

    try {
        const hashConfig = crypto
            .createHash('sha256')
            .update(JSON.stringify(configs))
            .digest('hex')

        const storedData = config.get('data')
        const storedHashConfig = crypto
            .createHash('sha256')
            .update(JSON.stringify(storedData))
            .digest('hex')

        console.log(`Default Config Hash: ${hashConfig}`);
        console.log(`Stored Config Hash: ${storedHashConfig}`);

        return hashConfig !== storedHashConfig
    } catch (err) {
        return false
    }
}

app.whenReady().then(() => {
    discord.connect()
    createWindow()
});

ipcMain.on('openLink', (event, url) => {
    shell.openExternal(url)
})

ipcMain.on('resetConfigs', () => {
    config.set('data', configs)
})

ipcMain.handle('getConfigs', () => {
    if (!configsReady) return { data: null, isAltered: false }
    return { data: config.get('data'), isAltered: checkHashCompConfig() }
})

ipcMain.on('saveGame', (event, worlds, playerData, save, meta, stats, settings, droppedItems) => {
    saves[Number(save)].set("worlds", worlds)
    saves[Number(save)].set("player", playerData)
    saves[Number(save)].set("meta", meta)
    /* saves[Number(save)].set("stats", stats) */
    saves[Number(save)].set("droppedItems", droppedItems)

    const oldStats = saves[Number(save)].get("stats")

    if (!oldStats) {
        saves[Number(save)].set("stats", stats)
    } else {
        oldStats.general.play_time.value += stats.general.play_time.value
        oldStats.general.healed.value += stats.general.healed.value
        oldStats.general.deaths.value += stats.general.deaths.value
        oldStats.general.distance.value += stats.general.distance.value

        oldStats.entities.kills.value += stats.entities.kills.value
        oldStats.entities.talked_to_NPC.value += stats.entities.talked_to_NPC.value
        oldStats.entities.killed_goblin.value += stats.entities.killed_goblin.value
        oldStats.entities.killed_skeleton.value += stats.entities.killed_skeleton.value

        oldStats.items.picked_up_items.value += stats.items.picked_up_items.value

        oldStats.sorcery.casted_spells.value += stats.sorcery.casted_spells.value

        saves[Number(save)].set("stats", oldStats)
    }
    if (meta.cheats) return
    const globalStatsLocal = globalStats.get('stats')

    if (!globalStatsLocal) {
        globalStats.set('stats', stats)
    } else {
        globalStatsLocal.general.play_time.value += stats.general.play_time.value
        globalStatsLocal.general.healed.value += stats.general.healed.value
        globalStatsLocal.general.deaths.value += stats.general.deaths.value
        globalStatsLocal.general.distance.value += stats.general.distance.value

        globalStatsLocal.entities.kills.value += stats.entities.kills.value
        globalStatsLocal.entities.talked_to_NPC.value += stats.entities.talked_to_NPC.value
        globalStatsLocal.entities.killed_goblin.value += stats.entities.killed_goblin.value
        globalStatsLocal.entities.killed_skeleton.value += stats.entities.killed_skeleton.value

        globalStatsLocal.items.picked_up_items.value += stats.items.picked_up_items.value

        globalStatsLocal.sorcery.casted_spells.value += stats.sorcery.casted_spells.value

        globalStats.set('stats', globalStatsLocal)
    }
})

ipcMain.on('grantAchievement', (event, achievement) => {
    const achievements = achievementsStore.get('achievements')
    if (!achievements) {
        const tempAchievements = achievementsDefault
        tempAchievements[achievement].granted = true
        achievementsStore.set('achievements', tempAchievements)
    } else {
        achievements[achievement].granted = true
        achievementsStore.set('achievements', achievements)
    }
})

ipcMain.on('saveSettings', (event, settings, values) => {
    config.set("settings", settings)
    config.set("values", values)
})

ipcMain.on('saveNamurleAndDesc', (event, name, description, save) => {
    saves[Number(save)].set('meta.name', name)
    saves[Number(save)].set('meta.description', description)
})

ipcMain.on('openFolder', () => {
    openAppFolder()
})

ipcMain.on('exitGame', () => {
    app.quit()
})

ipcMain.on('changeDCState', (event, state, message) => {
    discord.setStatus(state, { message: message })
})

ipcMain.on('deleteSave', (event, save) => {
    // delete stuff
    saves[Number(save)].clear()
})

ipcMain.on('logToMain', (event, text) => {
    console.log(text);
})

ipcMain.handle('checkForSaves', (event, index) => {
    const save = saves[index].get("worlds")
    const meta = saves[index].get('meta')
    if (save) {
        return { exists: true, meta: meta }
    }
    return { exists: false, meta: meta }
})

ipcMain.handle('fetchGlobalStats', (event) => {
    const stats = globalStats.get('stats')
    if (!stats) {
        return {
            general: {
                play_time: { value: 0, name: "Play Time", icon: "img/icons/play_time.png", desc: "Time spend in this world in minutes" },
                healed: { value: 0, name: "HP Healed", icon: "img/icons/healed.png", desc: "How much HP has been healed" },
                deaths: { value: 0, name: "Deaths", icon: "img/icons/killed_skeletons.png", desc: "How many times you died" },
                distance: { value: 0, name: "Distance Traveled", icon: "img/icons/distance_traveled.png", desc: "Distance traveled in px" },
            },
            entities: {
                kills: { value: 0, name: "Kills", icon: "img/icons/strength_icon.png", desc: "All kills" },
                talked_to_NPC: { value: 0, name: "Talked to NPC", icon: "img/icons/talked_to_NPC.png", desc: "How many times you talked to a NPC" },
                killed_goblin: { value: 0, name: "Killed goblin", icon: "img/icons/killed_goblins.png", desc: "How many goblin you killed" },
                killed_skeleton: { value: 0, name: "Killed skeleton", icon: "img/icons/killed_skeletons.png", desc: "How many skeletons you killed" },
            },
            items: {
                picked_up_items: { value: 0, name: "Picked up items", icon: "img/items/coin.png", desc: "How many items you picked up" },
            },
            sorcery: {
                casted_spells: { value: 0, name: "Spells casted", icon: "img/icons/fire_icon.png", desc: "How many spells you casted" },
            }
        }
    }
    return stats
})

ipcMain.handle('fetchSettings', (event) => {
    const settings = config.get('settings')
    const values = config.get('values')
    return {settings: settings,values: values }
})

ipcMain.handle('connectToDevice', (event) => {
    try {
        if(port && port.isOpen) {
            return {success: false, err: 'Port is alreay open'}
        }

        if(os.platform() === 'win32') {
            port = new SerialPort({
                path: 'COM3',
                baudRate: 9600
            })
        }else if(os.platform() === 'linux'){
            port = new SerialPort({
                path: '/dev/ttyUSB0',
                baudRate: 9600
            })
        }

        parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        
        parser.on('data', (ln) => {
            console.log(`[ARDUINO] ${ln}`)
            mainWindow.webContents.send('arduinoData', ln.trim())
        })  

        port.on('error', (err) => {
            console.error(err)
        })

        console.info('Connenction succesfull!')
    }catch(err) {
        console.log(err)
        return {success: false, err: err.message}
    }

    port.on('open', () => {
        setTimeout(() => {
            port.write("CONNECT\r\n", (err) => {
                if (err) console.error('Write error:', err.message)
                else console.log('CONNECT sent!')
            })
        }, 2000)
    })
    return {success: true}
})


ipcMain.on('sendMSGToDevice', (event, msg) => {
    if(port && port.isOpen && parser) {
        port.write(msg)
    }
})

ipcMain.handle('disconnentFromDevice', event => {
    port.write("DISCONNECT\r\n", (err) => {
        if (err) console.error('Write error:', err.message)
        else console.log('DISCONNECT sent!')
    })
    try {
        if(port && port.isOpen) {

            port.close(err => {
                port = null
                parser = null
                if(err) {
                    console.error(err.message)
                    return { success: false, err: err.message}
                }else {
                    console.log('Successfully disconnected!')
                }
            })
        }else {
            return {success: false, err: 'Port was already closed!'}
        }
    }catch(err) {
        return {success: false, err: err.message}
    }

    return {success: true}
})

ipcMain.handle('fetchAchievements', (event) => {
    let data = achievementsStore.get('achievements')
    if (!data) {
        achievementsStore.set('achievements', achievementsDefault)
        data = achievementsDefault
    }

    return data
})

ipcMain.handle('getStats', (event, save) => {
    const stats = saves[save].get('stats')

    return stats
})

ipcMain.handle('getWorldData', (event, save) => {
    const currentSave = saves[save].get("worlds")
    const playerData = saves[save].get("player")
    const metaData = saves[save].get("meta")
    const droppedItemsData = saves[save].get("droppedItems")
    return { intermediatWorld: currentSave, playerData: playerData, metaData: metaData, droppedItemsData: droppedItemsData }
})

ipcMain.handle('postStats', async (event, url) => {
    if(!accountStore.get('uuid') || !accountStore.get('username') || !globalStats.get('stats')) return {success: false, err: "Please create an account and have at least one world!"}

    console.log("UUID: " + accountStore.get('uuid'))
    try {
        const response = await fetch(`${url}/oathbound/postStats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: accountStore.get('username'),
                uuid:  accountStore.get('uuid'),
                stats: globalStats.get('stats')
            })
        });
    }catch(err) {
        return {success: false, err: err.message}
    }

    return {success: true}
})

ipcMain.handle('fetchSkins', (event) => {
    if(!skinsStore.get('skins')) {
        const skinsPath = path.join(__dirname, 'public', 'data', 'skins.json')
        const raw = fs.readFileSync(skinsPath, 'utf-8')
        skins = JSON.parse(raw)
        skinsStore.set('skins', skins)
    }

    const skins = skinsStore.get('skins')

    const skinsArr = Object.values(skins)
    let formattedArr = [];

    skinsArr.forEach(skin => {
        if(skin.hasSkin) {
            formattedArr.push({
                path: skin.path,
                name: skin.name,
                rarity: skin.rarity,
                selected: skin.selected,
                index: skin.index
            })
        }
    })

    return formattedArr
})

ipcMain.on('selectSkin', (event, index) => {
    if(!skinsStore.get('skins')) {
        const skinsPath = path.join(__dirname, 'public', 'data', 'skins.json')
        const raw = fs.readFileSync(skinsPath, 'utf-8')
        skins = JSON.parse(raw)
        skinsStore.set('skins', skins)
    }

    const skins = skinsStore.get('skins')


    Object.values(skins).forEach(skin => skin.selected = false)

    skins[index].selected = true
    

    skinsStore.set('skins', skins)
})

ipcMain.on('checkCode', (event, code) => {
    if(!skinsStore.get('skins')) {
        const skinsPath = path.join(__dirname, 'public', 'data', 'skins.json')
        const raw = fs.readFileSync(skinsPath, 'utf-8')
        skins = JSON.pharse(raw)
        skinsStore.set('skins', skins)
    }

    const skins = skinsStore.get('skins')
    console.log(code)
    Object.values(skins).forEach(skin => {
        console.log(skin.code)
        if(code === skin.code) {
            skin.hasSkin = true
            console.log('?')
        }
    })

    skinsStore.set('skins', skins)
})

ipcMain.handle('fetchName', event => {
    const name = accountStore.get('username')
    return name
})

ipcMain.on('rename', (event, name) => {
    accountStore.set('username', name)
    accountStore.set('uuid', crypto.randomUUID())
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});