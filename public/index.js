"use strict";
// initialise canvas
const canvas = document.querySelector('#canvas');
if (!canvas)
    throw new Error('Canvas element not found');
const ctx = canvas.getContext('2d');
if (!ctx)
    throw new Error('2D context not supported');
// set dimensions
const CANVAS_WIDTH = canvas.width = /* 2000 */ window.innerWidth;
const CANVAS_HEIGHT = canvas.height = 700;
// some configs
ctx.imageSmoothingEnabled = false;
// initial values
let gameSpeed = 0; // game speed depending on the players movement
let gameFrame = 0; // counter for the frames
const MAX_FALL_SPEED = 8; // 
const staggerFrames = 7; // amount of ticks between each frame of animation
const globalGravity = 8; // gravity affecting the player
const groundY = 580; // is the y-coordinate of the ground
let isLoading = true;
let bgPosition = 0;
let AFKCounter = 0;
const imageCache = {};
function getImage(src) {
    if (!imageCache[src]) {
        const img = new Image();
        img.src = src;
        imageCache[src] = img;
    }
    return imageCache[src];
}
let stats = {
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
};
let achievements = {
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
    cheater: {
        "granted": true,
        "desc": "What's the fun in that?",
        "name": "You Cheated!",
        "icon": "img/icons/cheater.png"
    },
    craft: { granted: false, desc: "Getting your hand dirty!", name: "Let's Craft!", icon: "img/icons/craft.png" },
    heal: { granted: false, desc: "Trying best to stay alive!", name: "Healthy Diet!", icon: "img/icons/regeneration_icon.png" },
    goblin_kingdom: { granted: false, desc: "The goblins don't take kindly to visitors", name: "Bold Move!", icon: "img/icons/goblin_kingdom.png" },
    are_we_there_yet: { granted: false, desc: "Still no idea where you're going?", name: "Are we there yet?", icon: "img/icons/goblin_kingdom.png" },
    hoarder: { granted: false, desc: "Have a full inventory", name: "Hoarder", icon: "img/icons/hoarder.png" },
    you_werent_supposed_to_see_that: { granted: false, desc: "How did you find this?", name: "You weren't supposed to see that!", icon: "img/icons/see.png" },
    new_look: { granted: false, desc: "You look like a strong warrior!", name: "Getting a new look!", icon: "img/icons/armor.png" }
};
setInterval(() => {
    stats.general.play_time.value++;
}, 60000);
let fps = 0; // current fps
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;
let lastFrameTime = 0;
let frameCount = 0;
let lastTime = performance.now();
let isQuestUIupdated = false;
// positions depending on the element
var StaticPositions;
(function (StaticPositions) {
    StaticPositions[StaticPositions["OnGround"] = -1] = "OnGround";
})(StaticPositions || (StaticPositions = {}));
// saving all keys
let keys = {};
// all objects on the screen
let nonWorldElems = [];
let backgroundLayers = [];
let droppedItems = [];
let particles = [];
let deadObjects = [];
// level design values
let levelPos = 0;
// sound logic
const sounds = {
    click: new Audio('sound/blipSelect.mp3'),
    drop: new Audio('sound/drop.wav'),
    pickup: new Audio('sound/pickup.wav'),
    equip: new Audio('sound/equip.wav'),
    speak: new Audio('sound/speak.wav'),
    takeDamage: new Audio('sound/takeDamage.wav'),
    UIopen: new Audio('sound/UIOpen.wav'),
    UIclose: new Audio('sound/UIclose.wav'),
    completeAchievement: new Audio('sound/completeAchievement.wav'),
    equipSpell: new Audio('sound/equipSpell.wav'),
    teleport: new Audio('sound/teleport.wav'),
};
function playSound(sound, volume, isInRegistry) {
    if (!menu.checkSetting('Master Sound'))
        return;
    if (isInRegistry) {
        const key = sound;
        sounds[key].volume = sound === 'UIopen' || sound === 'UIclose' ? volume / 10 : volume;
        sounds[key].currentTime = 0;
        sounds[key].play();
        return;
    }
    const audio = new Audio(`sound/${sound}`);
    audio.volume = volume;
    audio.play();
}
let effects;
let items;
let recipes;
let worlds = {};
const effectFunctions = {
    burning: {
        onTick: (entity) => {
            entity.takeHit(3);
        },
    },
    regeneration: {
        onTick: (entity) => {
            entity.heal(2);
        },
    },
    ice: {
        onTick: (entity) => {
            entity.takeHit(2);
        },
        start(entity) {
            if (entity.data.speed) {
                entity.data.speed /= 1.5;
            }
        },
        end(entity) {
            if (entity.data.speed) {
                entity.data.speed *= 1.5;
            }
        },
    },
    healthboost: {
        start: (entity) => {
            entity.data.maxHealth = entity.data.maxHealth * 1.5;
            entity.data.health *= 1.5;
        },
        end: (entity) => {
            entity.data.maxHealth /= 1.5;
        },
    },
    deaths_curse: {
        end: (entity) => {
            if (Math.round(Math.random() * entity.data.health) < 10) {
                entity.data.health = 0;
            }
        },
    },
    poison: {
        onTick: (entity) => {
            if (entity.data.isMoving) {
                entity.takeHit(3);
            }
        },
    },
    speed: {
        start(entity) {
            if (entity.data.speed) {
                entity.data.speed *= 1.5;
            }
        },
        end(entity) {
            if (entity.data.speed) {
                entity.data.speed /= 1.5;
            }
        },
    }
};
const itemFunctions = {
    beer: {
        use: () => {
            player.heal(5);
            if (menu.checkSetting('Master Sound'))
                playSound('drink.wav', menu.sounds.effects / 100);
            return;
        },
    },
    heal_potion: {
        use: () => {
            player.heal(35);
            console.log('?');
            grantAchievement('heal');
            if (menu.checkSetting('Master Sound'))
                playSound('drink.wav', menu.sounds.effects / 100);
            return;
        },
    },
    big_heal_potion: {
        use: () => {
            player.heal(50);
            grantAchievement('heal');
            if (menu.checkSetting('Master Sound'))
                playSound('drink.wav', menu.sounds.effects / 100);
            return;
        },
    },
    pappbanditem: {
        use: () => {
            player.heal(1000000);
        },
    },
    holy_longsword: {
        use: () => {
            player.addEffect('healthboost', 500, 1);
        },
    },
    supernova: {
        use: () => {
            player.addEffect('strength', 500, 1);
        },
    },
    regeneration_potion: {
        use: () => {
            player.addEffect('regeneration', 600, 1);
            grantAchievement('heal');
            if (menu.checkSetting('Master Sound'))
                playSound('drink.wav', menu.sounds.effects / 100);
        },
    },
    big_regeneration_potion: {
        use: () => {
            player.addEffect('regeneration', 1000, 1);
            grantAchievement('heal');
            if (menu.checkSetting('Master Sound'))
                playSound('drink.wav', menu.sounds.effects / 100);
            return;
        },
    },
    healthboost_potion: {
        use: () => {
            player.addEffect('healthboost', 3000, 1);
            grantAchievement('heal');
            if (menu.checkSetting('Master Sound'))
                playSound('drink.wav', menu.sounds.effects / 100);
        },
    },
    lightning_potion: {
        use: () => {
            player.addEffect('electrocute', 1500, 1);
            if (menu.checkSetting('Master Sound'))
                playSound('drink.wav', menu.sounds.effects / 100);
        },
    },
    fruit: {
        use: () => {
            player.heal(5);
        },
    },
    mushroom: {
        use: () => {
            let removeArr = [];
            player.effectData.effects.forEach((effect, i) => {
                removeArr.push(effect.index);
            });
            removeArr.forEach(i => {
                player.removeEffect(i);
            });
        },
    },
    coffee: {
        use: () => {
            player.heal(5);
            player.addEffect('speed', 600, 1);
            if (menu.checkSetting('Master Sound'))
                playSound('drink.wav', menu.sounds.effects / 100);
            return;
        },
    },
    icing_rapier: {
        attack(entity) {
            entity.addEffect('ice', 1000, 1);
        },
    },
    flaming_saber: {
        attack(entity) {
            entity.addEffect('burning', 500, 1);
        },
    },
    null: {
        attack(entity) {
            player.takeHit(10);
            entity.addEffect('deaths_curse', 1500, 1);
        },
    },
    ice_gem: {
        use: () => {
            player.addEffect('ice', 250, 1);
        }
    },
    fire_gem: {
        use: () => {
            player.addEffect('burning', 250, 1);
        }
    },
    iron_staff: {
        use: () => {
            if (player.data.isMoving)
                return;
            if (player.story.learntMagic) {
                openStaffGUI('iron_staff');
            }
            else {
                displayInfo('You don\'t know how to use this!');
            }
        },
        attackStart: () => {
        }
    },
    gold_staff: {
        use: () => {
            if (player.data.isMoving)
                return;
            if (player.story.learntMagic) {
                openStaffGUI('gold_staff');
            }
            else {
                displayInfo('You don\'t know how to use this!');
            }
        }
    },
    advanced_staff: {
        use: () => {
            if (player.data.isMoving)
                return;
            if (player.story.learntMagic) {
                openStaffGUI('advanced_staff');
            }
            else {
                displayInfo('You don\'t know how to use this!');
            }
        }
    },
    master_staff: {
        use: () => {
            if (player.data.isMoving)
                return;
            if (player.story.learntMagic) {
                openStaffGUI('master_staff');
            }
            else {
                displayInfo('You don\'t know how to use this!');
            }
        }
    }
};
setInterval(() => {
    if (!player)
        return;
    if (player.data.spellCooldown > 0) {
        player.data.spellCooldown--;
        const div = document.querySelector('.cooldownDiv');
        div.classList.remove('display-none');
        const height = (player.data.spellCooldown / player.data.currentCooldown) * 80;
        div.style.height = `${height}px`;
    }
    if (player.data.mana < 100) {
        player.data.mana += 0.25;
        player.updateMana();
    }
    if (!player.data.onInventory && !player.data.onTradingMenu && !player.data.onSecondaryInventory && !player.data.isAttacking && player.data.canMove && !player.data.onCooldown && !player.data.castingSpell) {
        player.data.canMove = true;
    }
}, 100);
// inputs
document.querySelector('#game').addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousedown', event => {
    if (isLoading)
        return;
    if (event.button === 2 && !player.data.onInventory) {
        player.useItem();
    }
    if (event.button === 0 && !player.data.onInventory) {
        player.attack();
    }
});
addEventListener('keyup', event => {
    if (isLoading)
        return;
    if (!player.data.onInventory) {
        keys[event.code] = false;
        if (!player.data.isAttacking && player.sprite.currentState !== 'take_hit')
            player.changeState('idle');
        gameSpeed = 0;
    }
});
addEventListener('keydown', event => {
    var _a, _b;
    if (event.code === 'Escape') {
        if (player.data.onInventory || player.data.onSecondaryInventory) {
            closeInventory();
            closeStaffGUI();
        }
        else if (player.data.onTradingMenu) {
            closeTradingMenu();
        }
        else {
            menu.toggleMenu();
        }
    }
    if (isLoading || !((_a = document.querySelector('#menu')) === null || _a === void 0 ? void 0 : _a.classList.contains('display-none')))
        return;
    if (!player.data.onInventory && !player.data.onTradingMenu && !player.data.onSecondaryInventory && player.data.canMove)
        keys[event.code] = true;
    if (event.code === 'KeyR' && !player.data.isMoving) {
        if (!player.data.onSecondaryInventory) {
            player.interact();
        }
    }
    if (event.code === 'KeyE' && !player.data.isMoving) {
        if (player.data.onInventory && !player.data.onTradingMenu) {
            (_b = document.querySelector('body')) === null || _b === void 0 ? void 0 : _b.classList.remove('grab');
            player.data.dragging = null;
            closeInventory();
            closeStaffGUI();
        }
        else {
            if (player.data.onTradingMenu) {
                closeTradingMenu();
            }
            else {
                openInventory();
            }
        }
    }
    if (event.code === 'Space' && !player.data.onInventory && player.data.canMove) {
        player.jump();
    }
    if (event.code === 'KeyQ') {
        player.drop();
    }
    if (!player.data.onInventory && event.code.slice(0, 5) === 'Digit' && (parseInt(event.code.slice(5, 6)) < 6)) {
        changeSelectedSlot(parseInt(event.code.slice(5, 6)));
    }
});
let scrollCount = 0;
window.addEventListener('wheel', (e) => {
    if (isLoading)
        return;
    if (scrollCount % 300) {
        if (e.deltaY > 0) {
            if (player.data.selectedSlot < 5) {
                changeSelectedSlot(player.data.selectedSlot + 1);
            }
            else {
                changeSelectedSlot(1);
            }
        }
        else {
            if (player.data.selectedSlot > 1) {
                changeSelectedSlot(player.data.selectedSlot - 1);
            }
            else {
                changeSelectedSlot(5);
            }
        }
    }
    scrollCount++;
});
// quest logic and events
let currentEvents = [];
let activeQuests = [];
class menuClass {
    constructor() {
        this.states = {
            menu: false,
            options: false,
            settings: false
        }; // keep track of which menu screens are open
        this.settings = {
            audio: {
                name: 'audio',
                settings: [
                    { name: 'Master Sound', state: false },
                ]
            },
            video: {
                name: 'video',
                settings: [
                    { name: 'Fullscreen', state: false },
                    { name: 'FPS', state: true },
                ]
            },
            dev: {
                name: 'dev',
                settings: [
                    { name: 'No Clip', state: false },
                    { name: 'Inf Damage', state: false },
                    { name: 'No Aggro', state: false },
                    { name: 'Hitboxes', state: false },
                    { name: 'Speed', state: false },
                    { name: 'Insta Skip', state: false },
                ]
            },
            accessibility: {
                name: 'accessibility',
                settings: [
                    { name: 'labels', state: true }
                ]
            }
        };
        this.sounds = {
            music: 100,
            effects: 50
        };
        this.commands = {
            heal: (arg) => { player.heal(Number(arg)); },
            effect: (arg) => { player.addEffect(arg, 1000, 1); },
            give: (arg) => { if (items[arg]) {
                player.addItem(arg, 1);
            }
            else {
                displayInfo('Unknown Item');
            } },
            damage: (arg) => { player.takeHit(Number(arg)); },
            summon: (arg) => {
                if (!elemRegistry[arg] || (arg !== 'skeleton' && arg !== 'goblin')) {
                    displayInfo(`Unknown or Unsummonable entity`);
                    return;
                }
                const entity = new elemRegistry[arg](player.pos.x, StaticPositions.OnGround, arg, 0);
                worlds[currentWorld].elements.push(entity);
            },
            world: (arg) => {
                try {
                    changeWorld(arg);
                }
                catch (err) {
                    displayInfo('Unkown world!');
                }
            },
            story: (arg) => {
                player.story[arg.trim()] = true;
            }
        };
    }
    toggleMenu() {
        const menu = document.querySelector('#menu');
        if (this.states.menu) {
            const options = document.querySelector('#options');
            const settings = document.querySelector('#settings');
            menu === null || menu === void 0 ? void 0 : menu.classList.add('display-none');
            options === null || options === void 0 ? void 0 : options.classList.add('display-none');
            settings === null || settings === void 0 ? void 0 : settings.classList.add('display-none');
            this.states.menu = false;
            this.states.options = false;
            this.states.settings = false;
        }
        else {
            menu === null || menu === void 0 ? void 0 : menu.classList.remove('display-none');
            this.states.menu = true;
        }
        window.api.saveSettings(this.settings);
    }
    toggleOptionsScreen() {
        const div = document.querySelector('#options');
        if (this.states.options) {
            div === null || div === void 0 ? void 0 : div.classList.add('display-none');
            this.states.options = false;
        }
        else {
            this.states.options = true;
            const settingsArr = Object.values(this.settings);
            div.innerHTML = '';
            div.classList.remove('display-none');
            div.innerHTML += `<div class="flex-center"><h2>Options</h2></div><hr>`;
            settingsArr.forEach(setting => {
                div.innerHTML += `<div class="flex-center margin-top-16"><button class="btn-small background-color-gray" onclick="menu.toggleSettingsScreen('${setting.name}')">${setting.name.toUpperCase()}</button></div>`;
            });
            div.innerHTML += `<div class="flex-between margin-top-32"><button onclick="menu.toggleMenu()" class="btn-small background-color-gray">Close</button><button onclick="menu.toggleOptionsScreen()" class="btn-small background-color-gray">Back</button></div>`;
        }
    }
    quit() {
        location.href = 'index.html';
    }
    async save() {
        const save = sessionStorage.getItem("save");
        const name = sessionStorage.getItem('name');
        const description = sessionStorage.getItem('description');
        if (!save || !name || !description) {
            menu.quit();
            return;
        }
        const temp = await window.api.checkForSaves(save);
        const alreadySavedMeta = temp.meta;
        const settings = this.settings;
        console.log(settings);
        let meta = {
            name: "World",
            description: "World",
            world: currentWorld,
            quest: activeQuests
        };
        if (alreadySavedMeta) {
            meta.name = alreadySavedMeta.name,
                meta.description = alreadySavedMeta.description;
        }
        else {
            meta.name = name,
                meta.description = description;
        }
        window.api.saveGame(worlds, player, save, meta, stats, settings, droppedItems);
    }
    toggleSettingsScreen(setting) {
        const div = document.querySelector('#settings');
        if (this.states.settings) {
            this.states.settings = false;
            div === null || div === void 0 ? void 0 : div.classList.add('display-none');
        }
        else {
            this.states.settings = true;
            div === null || div === void 0 ? void 0 : div.classList.remove('display-none');
            div.innerHTML = '';
            div.classList.remove('display-none');
            div.innerHTML += `<div class="flex-center"><h2>${setting.toUpperCase()} Settings</h2></div><hr>`;
            const settings = this.settings[setting].settings;
            settings.forEach(set => {
                div.innerHTML += `<div class="flex-center margin-top-16"><button id="${set.name.replace(' ', '')}" class="btn-small background-color-gray" onclick="menu.toggleSetting('${set.name}', '${setting}')">${set.name}</button></div>`;
                const btn = document.querySelector(`#${set.name.replace(' ', '')}`);
                if (set.state) {
                    btn === null || btn === void 0 ? void 0 : btn.classList.add('setting-true');
                    btn === null || btn === void 0 ? void 0 : btn.classList.remove('setting-false');
                }
                else {
                    btn === null || btn === void 0 ? void 0 : btn.classList.remove('setting-true');
                    btn === null || btn === void 0 ? void 0 : btn.classList.add('setting-false');
                }
            });
            if (setting === 'dev') {
                div.innerHTML += `<div class="flex-center margin-top-16"><input id="command" placeholder="command..." type="text"><button class="gradientBtn btn-small margin-left-16" onclick="menu.runCommand()">Send</button></div>`;
            }
            else if (setting === 'audio') {
                div.innerHTML += `<div class="flex-center margin-top-16"><h3>Music: </h3><input id="musicRange" value="menu.sounds.music" type="range" max="100" min="0" onchange="music.volume = Number(document.querySelector('#musicRange').value)/100; menu.sounds.music = Number(document.querySelector('#musicRange').value)"></div><div class="flex-center margin-top-16"><h3>Effects: </h3><input id="effectsRange" value="menu.sounds.effects" type="range" max="100" min="0" onchange="menu.sounds.effects = Number(document.querySelector('#effectsRange').value)"></div>`;
            }
            div.innerHTML += `<div class="flex-between margin-top-32"><button onclick="menu.toggleMenu()" class="btn-small background-color-gray">Close</button><button onclick="menu.toggleSettingsScreen()" class="btn-small background-color-gray">Back</button></div>`;
        }
    }
    toggleSetting(setting /* keyof menuClass['settings']['dev'] */, group) {
        if (group === 'dev') {
            grantAchievement('cheater');
        }
        this.settings[group].settings.forEach(set => {
            const btn = document.querySelector(`#${set.name.replace(' ', '')}`);
            if (set.name === setting) {
                if (set.state) {
                    btn === null || btn === void 0 ? void 0 : btn.classList.remove('setting-true');
                    btn === null || btn === void 0 ? void 0 : btn.classList.add('setting-false');
                    if (setting === 'Fullscreen') {
                        document.exitFullscreen();
                    }
                    set.state = false;
                }
                else {
                    set.state = true;
                    if (setting === 'Fullscreen') {
                        document.documentElement.requestFullscreen();
                    }
                    btn === null || btn === void 0 ? void 0 : btn.classList.add('setting-true');
                    btn === null || btn === void 0 ? void 0 : btn.classList.remove('setting-false');
                }
            }
        });
    }
    checkSetting(setting) {
        const allGroups = Object.values(this.settings);
        for (const group of allGroups) {
            for (const set of group.settings) {
                if (set.name === setting && set.state) {
                    return true;
                }
            }
        }
        return false;
    }
    runCommand() {
        const input = document.querySelector('#command').value;
        document.querySelector('#command').value = '';
        const command = input.split(/-(.+)/);
        if (!menu.commands[command[0].split(" ")[0]]) {
            displayInfo(`Unknown Command: ${command}`);
            return;
        }
        if (command[1] !== '') {
            menu.commands[command[0].split(" ")[0]](command[1]);
        }
        else {
            menu.commands[command[0].split(" ")[0]]();
        }
    }
}
class quest {
    constructor(event, entities, text, gift, items) {
        this.event = event;
        this.text = text;
        this.gift = gift;
        this.completed = false;
        this.entities = [];
        entities.forEach(entity => {
            this.entities.push({ entity: entity, completed: false });
        });
        this.items = items;
    }
    update() {
        let giveEventCompleted = false;
        currentEvents.forEach(event => {
            if (event.event === this.event) {
                this.entities.forEach(entity => {
                    if (entity.entity === event.entity.id) {
                        entity.completed = true;
                    }
                });
                if (this.event === 'give') {
                    if (event.extra) {
                        if (this.items === event.extra) {
                            this.completed = true;
                            giveEventCompleted = true;
                        }
                    }
                }
            }
        });
        if (giveEventCompleted) {
            if (this.items)
                player.removeItems(this.items);
            return true;
        }
        let questCompleted = true;
        this.entities.forEach(entity => {
            if (!entity.completed) {
                questCompleted = false;
                this.completed = false;
            }
        });
        if (this.event === 'give') {
            questCompleted = false;
        }
        return questCompleted;
    }
    finish() {
        this.gift.forEach(gift => {
            player.addItem(gift.item, gift.amount);
        });
        if (this.text === "Pay the wizard two coins in order to learn magery.") {
            player.story.learntMagic = true;
        }
        let index = -1;
        activeQuests.forEach((quest, i) => {
            if (quest === this) {
                index = i;
            }
        });
        if (index !== -1) {
            activeQuests.splice(index, 1);
        }
        isQuestUIupdated = false;
        this.completed = true;
    }
}
class trader extends Entity {
    constructor(pos, sprite, trade, worldElem, isNotTurning, id) {
        if (pos.y === StaticPositions.OnGround) {
            pos.y = 500;
        }
        super({ x: pos.x, y: pos.y }, worldElem, id);
        this.sprite = {
            img: sprite.img,
            pathToImage: sprite.img,
            spriteWidth: sprite.spriteWidth,
            spriteHeight: sprite.spriteHeight,
            scale: sprite.scale,
            frames: 0,
            frameLoc: 0,
            spriteAnimations: {},
            currentState: 'idle',
            invertOrientation: sprite.invertDirec || false,
            animationStates: [
                {
                    name: 'idle',
                    frames: sprite.frameAmount
                }
            ],
            hitbox: { offsetX: 0, offsetY: 0, width: 200, height: 200 }
        };
        this.data = {
            class: 'trader',
            isAttacking: false,
            health: 50,
            maxHealth: 50,
            attackDamage: 15,
            attackRange: 50,
            drops: [],
            name: 'trader',
            attackFocus: null,
            isDead: false,
            isMoving: false,
            onCooldown: false,
            seeRange: 0,
            showedText: false,
            Xdirec: 1
        };
        this.type = {
            isGround: true /* is it a ground/flying troop */, name: 'trader' /* name of the enemy */, allignment: 'passive' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: false, interactable: true, isNotTurning: isNotTurning
        };
        this.worldElem = worldElem;
        this.trade = trade;
        this.data.class = "trader";
        this.init();
    }
    async update() {
        if (this.data.isDead)
            return;
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            effect.duration--;
            if (effect.duration <= 0) {
                if (effect.effect.end) {
                    effect.effect.end(this);
                }
                this.removeEffect(effect.index);
            }
            if (this.effectData.effectTicks % effect.effect.ticks === 0) {
                if (effect.effect.onTick) {
                    effect.effect.onTick(this);
                }
            }
            if (document.querySelector(`#${effect.effect.name} `)) {
                const div = document.querySelector(`#${effect.effect.name} `);
                if (div.querySelector('#duration')) {
                    div.querySelector('#duration').innerHTML = `${effect.duration} `;
                }
            }
        });
        if (this.sprite.currentState !== 'attack')
            this.data.isAttacking = false;
        if (this.type.interactable) {
            if (checkCollision({ hitbox: player.hitbox, pos: player.pos }, { hitbox: this.sprite.hitbox, pos: this.pos }) && !player.data.onCooldown && player.data.onGround) {
                if (!this.data.showedText && menu.checkSetting('labels')) {
                    displayInfo('Press "R" to interact');
                    this.data.showedText = true;
                }
                player.data.interactionFocus = this;
                /*                 player.data.interactionFocus = null
                                player.data.interactionFocusGrab = null */
            }
            else {
                if (player.data.interactionFocus === this) {
                    player.data.interactionFocus = null;
                }
                this.data.showedText = false;
                if (this.sprite.currentState !== 'idle')
                    this.changeState('idle');
            }
        }
        this.sprite.frames++;
        if (this.sprite.frames >= staggerFrames) {
            this.sprite.frames = 0;
            this.sprite.frameLoc++;
            const frameAmount = this.sprite.spriteAnimations[this.sprite.currentState].loc.length;
            if (this.sprite.frameLoc >= frameAmount) {
                this.sprite.frameLoc = 0;
                this.endOfAnimation(frameAmount);
            }
        }
        if (this.data.health <= 0 && this.sprite.currentState !== 'death') {
            if (player.data.inventory[3][player.data.selectedSlot - 1] === null) {
                grantAchievement('beast');
            }
            if (player.data.health / player.data.maxHealth <= 0.05) {
                grantAchievement('close_call');
            }
            stats.entities.kills.value++;
            if (this.data.name === 'goblin') {
                grantAchievement('goblin_kill');
                const globalStats = await window.api.fetchGlobalStats();
                if (globalStats.entities.killed_goblin.value >= 75) {
                    grantAchievement('goblin_demolisher');
                }
            }
            if (this.data.name === 'goblin') {
                stats.entities.killed_goblin.value++;
            }
            else if (this.data.name === 'skeleton') {
                stats.entities.killed_skeleton.value++;
            }
            this.data.drops.forEach(drop => {
                if (Math.floor(Math.random() * 100) <= drop.chance) {
                    droppedItems.push(new droppedItem({ x: this.pos.x + this.sprite.hitbox.offsetX + Math.round(Math.random() * 80) - 40, y: this.pos.y + this.sprite.hitbox.offsetY }, drop.drop, currentWorld));
                }
            });
            this.changeState('death');
            this.data.onCooldown = true;
            currentEvents.push({ event: 'kill', entity: this });
            isQuestUIupdated = false;
            if (menu.checkSetting('Master Sound'))
                playSound('death.mp3', menu.sounds.effects / 100);
        }
        if (this.data.health <= 0)
            return;
        if (!menu.checkSetting('No Aggro')) {
            const playerPosX = player.pos.x;
            const distanceXToPlayer = Math.abs((playerPosX + (player.sprite.spriteWidth / 2) * player.sprite.scale) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale));
            const playerDirec = this.pos.x - player.pos.x;
            const playerHiddenFromGoblins = player.data.armor[0] === 'goblin_mask' && this.data.name === 'goblin';
            if (distanceXToPlayer <= this.data.attackRange && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy') {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player;
                    this.attack();
                }
            }
            else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy') {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player;
                    this.attack();
                }
            }
            else if (distanceXToPlayer <= this.data.seeRange && !this.data.onCooldown && this.type.allignment === 'enemy') {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player;
                    if (this.sprite.currentState !== 'run')
                        this.changeState('run');
                    if (playerPosX > this.pos.x) {
                        this.pos.x += 4;
                    }
                    else {
                        this.pos.x -= 4;
                    }
                    if (this.checkEffect('poison').wasFound) {
                        this.data.health -= .1;
                    }
                }
                else {
                    if (this.sprite.currentState === 'run') {
                        this.changeState('idle');
                    }
                }
            }
            else {
                if (this.sprite.currentState === 'run') {
                    this.changeState('idle');
                }
                this.data.attackFocus = null;
            }
            this.effectData.effectTicks++;
        }
    }
    draw() {
        if (menu.checkSetting('Hitboxes')) {
            ctx.save();
            ctx.strokeStyle = this.type.allignment === 'enemy' ? 'red' : (this.type.allignment === 'passive' ? 'yellow' : 'green');
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x + this.sprite.hitbox.offsetX, this.pos.y + this.sprite.hitbox.offsetY, this.sprite.hitbox.width, this.sprite.hitbox.height);
            ctx.strokeStyle = "black";
            ctx.strokeRect(this.pos.x + this.sprite.hitbox.offsetX, this.pos.y + this.sprite.hitbox.offsetY, 5, 5);
            ctx.restore();
        }
        let frameX = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].x; // get current locations of the animation
        let frameY = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].y;
        let orientation = (player.pos.x + player.sprite.spriteWidth / 2) - (this.pos.x + this.sprite.spriteWidth / 2);
        if (this.sprite.invertOrientation) {
            orientation = -orientation;
        }
        const image = getImage(this.sprite.img);
        if (orientation <= 0 && !this.type.isNotTurning) {
            this.data.Xdirec = 2;
            ctx.save(); // save current state of the canvas
            const drawX = -(this.pos.x + 400 * this.sprite.scale);
            ctx.scale(-1, 1); // invert orientatian of the entity
            ctx.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale);
            ctx.restore();
        }
        else {
            this.data.Xdirec = 1;
            ctx.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale);
        }
    }
    takeHit(damage) {
        if (this.data.health <= 0)
            return;
        if (Math.random() * 100 < 80)
            this.setCooldown(1000);
        this.changeState('take_hit');
        this.data.health -= damage;
        this.showHealthbar();
    }
    endOfAnimation(frameAmount) {
        var _a;
        if (this.sprite.currentState === 'death') {
            let deadParticles = [];
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i);
                }
            });
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle, 1);
            });
            if (this.data.isDead)
                return;
            this.data.isDead = true;
            this.sprite.frameLoc = frameAmount - 1;
            deadObjects.push(this);
            return;
        }
        else {
            if (this.sprite.currentState === 'take_hit') {
                this.changeState('idle');
            }
            else if (this.sprite.currentState === 'attack') {
                if (((_a = this.type.attackType) === null || _a === void 0 ? void 0 : _a.type) === 'rangedCombat') {
                    particles.push(new projectile(this, this.type.attackType.projectile.spriteWidth, this.type.attackType.projectile.spriteHeight, this.type.attackType.projectile.scale, this.type.attackType.projectile.pathToImage, this.type.attackType.projectile.animationStates, this.type.attackType.projectile.range, this.type.attackType.projectile.speed, this.type.attackType.projectile.damage, this.type.attackType.projectile.hitbox, 'arrow'));
                }
                this.changeState('idle');
                this.data.isAttacking = false;
            }
        }
        if (this.type.name === 'trader' && this.sprite.currentState === 'open') {
            this.changeState('dialogue');
        }
    }
    attack() {
        if (!this.data.isAttacking && !this.data.onCooldown) {
            this.changeState('attack');
            this.data.isAttacking = true;
            setTimeout(() => {
                var _a;
                if (this.data.isDead)
                    return;
                if (this.data.onCooldown)
                    return;
                if (((_a = this.type.attackType) === null || _a === void 0 ? void 0 : _a.type) !== 'rangedCombat') {
                    const playerPosX = player.pos.x;
                    const playerDirec = this.pos.x - player.pos.x;
                    const distanceXToPlayer = Math.abs((playerPosX + (player.sprite.spriteWidth / 2) * player.sprite.scale) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale));
                    if (playerDirec <= 0 && distanceXToPlayer <= this.data.attackRange && player.pos.y + this.data.attackRange >= this.pos.y) {
                        player.takeHit(this.data.attackDamage);
                    }
                    else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && player.pos.y + this.data.attackRange >= this.pos.y) {
                        player.takeHit(this.data.attackDamage);
                    }
                }
            }, 550);
        }
    }
    interact() {
        openTradingMenu(this.trade);
    }
}
class NPC extends Entity {
    constructor(pos, sprite, worldElem, conversation, name, present, id, quest, story) {
        let invertOrientation = sprite.invertOrientation;
        if (pos.y === StaticPositions.OnGround) {
            pos.y = groundY - 400 * sprite.scale;
        }
        super({ x: pos.x, y: pos.y }, worldElem, id);
        this.sprite = {
            img: sprite.pathToImage,
            pathToImage: sprite.pathToImage,
            spriteWidth: sprite.spriteWidth,
            spriteHeight: sprite.spriteHeight,
            scale: sprite.scale,
            animationStates: [{ name: 'idle', frames: sprite.frameAmount }],
            hitbox: sprite.hitbox,
            invertOrientation: invertOrientation,
            frames: 0,
            frameLoc: 0,
            spriteAnimations: {},
            currentState: 'idle',
        };
        this.data = {
            health: 100,
            maxHealth: 100,
            attackRange: 1,
            attackDamage: 1,
            drops: [],
            name: name,
            class: 'NPC',
            isAttacking: false,
            attackFocus: null,
            isDead: false,
            isMoving: false,
            onCooldown: false,
            seeRange: 0,
            showedText: false,
            Xdirec: 1
        };
        this.type = {
            isGround: true /* is it a ground/flying troop */, name: 'NPC' /* name of the enemy */, allignment: 'passive' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: false, interactable: true
        };
        this.portrait = sprite.portrait;
        this.worldElem = worldElem;
        this.conversation = conversation;
        this.conversationCounter = 0;
        this.isSpeaking = false;
        this.name = name;
        this.present = present;
        this.hasGivenPresent = false;
        this.quest = quest;
        this.story = story;
        this.questCompleted = false;
        this.data.class = "NPC";
        this.init();
    }
    endConversation() {
        const portrait = document.querySelector('#portrait');
        portrait.style.background = ``;
        stats.entities.talked_to_NPC.value++;
        const speakDiv = document.querySelector('#speakingDiv');
        speakDiv === null || speakDiv === void 0 ? void 0 : speakDiv.classList.add('display-none');
        if (this.quest && !this.hasGivenPresent) {
            activeQuests.push(this.quest);
            isQuestUIupdated = false;
        }
        if (this.story && !this.hasGivenPresent) {
            this.story.forEach(elem => {
                if (elem.action === 'destroy') {
                    removeWorldElements(elem.ids, ['id'], elem.dim);
                }
                else if (elem.action === 'spawn') {
                    let elemsArray = [];
                    elem.extra.forEach((element) => {
                        console.log(element.class);
                        elemsArray.push(new elemRegistry[element.class](...element.args));
                    });
                    spawnElements(elemsArray, elem.dim);
                }
            });
        }
        if (!this.hasGivenPresent) {
            this.present.forEach(item => {
                player.addItem(item.item, item.amount);
            });
            this.hasGivenPresent = true;
        }
    }
    speak() {
        var _a;
        const speakDiv = document.querySelector('#speakingDiv');
        speakDiv === null || speakDiv === void 0 ? void 0 : speakDiv.classList.remove('display-none');
        const portrait = document.querySelector('#portrait');
        if (this.portrait) {
            portrait.style.background = `url(${this.portrait})`;
        }
        else {
            portrait.style.background = `url(img/portraits/defaultNPC.png)`;
        }
        player.data.canMove = false;
        if (((_a = this.quest) === null || _a === void 0 ? void 0 : _a.items) && this.hasGivenPresent) {
            let hasAllItems = true;
            this.quest.items.forEach(item => {
                let amount = 0;
                for (let y = 0; y < player.data.inventory.length; y++) {
                    for (let x = 0; x < player.data.inventory[y].length; x++) {
                        if (player.data.inventory[y][x] === item.item)
                            amount++;
                    }
                }
                if (amount < item.amount)
                    hasAllItems = false;
            });
            if (hasAllItems) {
                currentEvents.push({ event: 'give', entity: this, extra: this.quest.items });
            }
            activeQuests.forEach(quest => {
                quest.update();
            });
        }
        currentEvents.push({ event: 'talk', entity: this });
        isQuestUIupdated = false;
        advanceConversation(this);
    }
    interact() {
        if (!this.isSpeaking) {
            this.speak();
            this.isSpeaking = true;
        }
    }
    get center() {
        return {
            x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width / 2,
            y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height / 2
        };
    }
    async update() {
        if (this.data.isDead)
            return;
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            effect.duration--;
            if (effect.duration <= 0) {
                if (effect.effect.end) {
                    effect.effect.end(this);
                }
                this.removeEffect(effect.index);
            }
            if (this.effectData.effectTicks % effect.effect.ticks === 0) {
                if (effect.effect.onTick) {
                    effect.effect.onTick(this);
                }
            }
            if (document.querySelector(`#${effect.effect.name} `)) {
                const div = document.querySelector(`#${effect.effect.name} `);
                if (div.querySelector('#duration')) {
                    div.querySelector('#duration').innerHTML = `${effect.duration} `;
                }
            }
        });
        if (this.sprite.currentState !== 'attack')
            this.data.isAttacking = false;
        if (this.type.interactable) {
            if (checkCollision({ hitbox: player.hitbox, pos: player.pos }, { hitbox: this.sprite.hitbox, pos: this.pos }) && !player.data.onCooldown && player.data.onGround) {
                if (!this.data.showedText && menu.checkSetting('labels')) {
                    displayInfo('Press "R" to interact');
                    this.data.showedText = true;
                }
                player.data.interactionFocus = this;
                /*                 player.data.interactionFocus = null
                                player.data.interactionFocusGrab = null */
            }
            else {
                if (player.data.interactionFocus === this) {
                    player.data.interactionFocus = null;
                }
                this.data.showedText = false;
                if (this.sprite.currentState !== 'idle')
                    this.changeState('idle');
            }
        }
        this.sprite.frames++;
        if (this.sprite.frames >= staggerFrames) {
            this.sprite.frames = 0;
            this.sprite.frameLoc++;
            const frameAmount = this.sprite.spriteAnimations[this.sprite.currentState].loc.length;
            if (this.sprite.frameLoc >= frameAmount) {
                this.sprite.frameLoc = 0;
                this.endOfAnimation(frameAmount);
            }
        }
        if (this.data.health <= 0 && this.sprite.currentState !== 'death') {
            if (player.data.inventory[3][player.data.selectedSlot - 1] === null) {
                grantAchievement('beast');
            }
            if (player.data.health / player.data.maxHealth <= 0.05) {
                grantAchievement('close_call');
            }
            stats.entities.kills.value++;
            if (this.data.name === 'goblin') {
                grantAchievement('goblin_kill');
                const globalStats = await window.api.fetchGlobalStats();
                if (globalStats.entities.killed_goblin.value >= 75) {
                    grantAchievement('goblin_demolisher');
                }
            }
            if (this.data.name === 'goblin') {
                stats.entities.killed_goblin.value++;
            }
            else if (this.data.name === 'skeleton') {
                stats.entities.killed_skeleton.value++;
            }
            this.data.drops.forEach(drop => {
                if (Math.floor(Math.random() * 100) <= drop.chance) {
                    droppedItems.push(new droppedItem({ x: this.pos.x + this.sprite.hitbox.offsetX + Math.round(Math.random() * 80) - 40, y: this.pos.y + this.sprite.hitbox.offsetY }, drop.drop, currentWorld));
                }
            });
            this.changeState('death');
            this.data.onCooldown = true;
            currentEvents.push({ event: 'kill', entity: this });
            isQuestUIupdated = false;
            if (menu.checkSetting('Master Sound'))
                playSound('death.mp3', menu.sounds.effects / 100);
        }
        if (this.data.health <= 0)
            return;
        if (!menu.checkSetting('No Aggro')) {
            const playerPosX = player.pos.x;
            const distanceXToPlayer = Math.abs((playerPosX + (player.sprite.spriteWidth / 2) * player.sprite.scale) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale));
            const playerDirec = this.pos.x - player.pos.x;
            const playerHiddenFromGoblins = player.data.armor[0] === 'goblin_mask' && this.data.name === 'goblin';
            if (distanceXToPlayer <= this.data.attackRange && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy') {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player;
                    this.attack();
                }
            }
            else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy') {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player;
                    this.attack();
                }
            }
            else if (distanceXToPlayer <= this.data.seeRange && !this.data.onCooldown && this.type.allignment === 'enemy') {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player;
                    if (this.sprite.currentState !== 'run')
                        this.changeState('run');
                    if (playerPosX > this.pos.x) {
                        this.pos.x += 4;
                    }
                    else {
                        this.pos.x -= 4;
                    }
                    if (this.checkEffect('poison').wasFound) {
                        this.data.health -= .1;
                    }
                }
                else {
                    if (this.sprite.currentState === 'run') {
                        this.changeState('idle');
                    }
                }
            }
            else {
                if (this.sprite.currentState === 'run') {
                    this.changeState('idle');
                }
                this.data.attackFocus = null;
            }
            this.effectData.effectTicks++;
        }
    }
    draw() {
        if (menu.checkSetting('Hitboxes')) {
            ctx.save();
            ctx.strokeStyle = this.type.allignment === 'enemy' ? 'red' : (this.type.allignment === 'passive' ? 'yellow' : 'green');
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x + this.sprite.hitbox.offsetX, this.pos.y + this.sprite.hitbox.offsetY, this.sprite.hitbox.width, this.sprite.hitbox.height);
            ctx.strokeStyle = "black";
            ctx.strokeRect(this.pos.x + this.sprite.hitbox.offsetX, this.pos.y + this.sprite.hitbox.offsetY, 5, 5);
            ctx.restore();
        }
        let frameX = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].x; // get current locations of the animation
        let frameY = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].y;
        let orientation = (player.pos.x + player.sprite.spriteWidth / 2) - (this.pos.x + this.sprite.spriteWidth / 2);
        if (this.data.name === 'elder' || this.sprite.invertOrientation) {
            orientation = -orientation;
        }
        const image = getImage(this.sprite.img);
        if (orientation <= 0 && !this.type.isNotTurning) {
            this.data.Xdirec = 2;
            ctx.save(); // save current state of the canvas
            const drawX = -(this.pos.x + 400 * this.sprite.scale);
            ctx.scale(-1, 1); // invert orientatian of the entity
            ctx.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale);
            ctx.restore();
        }
        else {
            this.data.Xdirec = 1;
            ctx.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale);
        }
    }
    takeHit(damage) {
        if (this.data.health <= 0)
            return;
        if (Math.random() * 100 < 80)
            this.setCooldown(1000);
        this.changeState('take_hit');
        this.data.health -= damage;
        this.showHealthbar();
    }
    endOfAnimation(frameAmount) {
        var _a;
        if (this.sprite.currentState === 'death') {
            let deadParticles = [];
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i);
                }
            });
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle, 1);
            });
            if (this.data.isDead)
                return;
            this.data.isDead = true;
            this.sprite.frameLoc = frameAmount - 1;
            deadObjects.push(this);
            return;
        }
        else {
            if (this.sprite.currentState === 'take_hit') {
                this.changeState('idle');
            }
            else if (this.sprite.currentState === 'attack') {
                if (((_a = this.type.attackType) === null || _a === void 0 ? void 0 : _a.type) === 'rangedCombat') {
                    particles.push(new projectile(this, this.type.attackType.projectile.spriteWidth, this.type.attackType.projectile.spriteHeight, this.type.attackType.projectile.scale, this.type.attackType.projectile.pathToImage, this.type.attackType.projectile.animationStates, this.type.attackType.projectile.range, this.type.attackType.projectile.speed, this.type.attackType.projectile.damage, this.type.attackType.projectile.hitbox, 'arrow'));
                }
                this.changeState('idle');
                this.data.isAttacking = false;
            }
        }
        if (this.type.name === 'trader' && this.sprite.currentState === 'open') {
            this.changeState('dialogue');
        }
    }
    attack() {
        if (!this.data.isAttacking && !this.data.onCooldown) {
            this.changeState('attack');
            this.data.isAttacking = true;
            setTimeout(() => {
                var _a;
                if (this.data.isDead)
                    return;
                if (this.data.onCooldown)
                    return;
                if (((_a = this.type.attackType) === null || _a === void 0 ? void 0 : _a.type) !== 'rangedCombat') {
                    const playerPosX = player.pos.x;
                    const playerDirec = this.pos.x - player.pos.x;
                    const distanceXToPlayer = Math.abs((playerPosX + (player.sprite.spriteWidth / 2) * player.sprite.scale) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale));
                    if (playerDirec <= 0 && distanceXToPlayer <= this.data.attackRange && player.pos.y + this.data.attackRange >= this.pos.y) {
                        player.takeHit(this.data.attackDamage);
                    }
                    else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && player.pos.y + this.data.attackRange >= this.pos.y) {
                        player.takeHit(this.data.attackDamage);
                    }
                }
            }, 550);
        }
    }
    get bottom() {
        return (this.pos.y + this.hitbox.offsetY + this.hitbox.height);
    }
}
//
function removeWorldElements(properties, elementValue, dim) {
    let removeList = [];
    worlds[dim].elements.forEach((element, i) => {
        properties.forEach(property => {
            let elementProperty = elementValue.length === 1 ? element[elementValue[0]] : element[elementValue[0]][elementValue[1]];
            if (property === elementProperty) {
                removeList.push(i);
            }
        });
    });
    removeList.forEach(i => {
        if (!(worlds[dim].elements[i].sprite.pathToImage === "img/blocks/house_5.png")) {
            worlds[dim].elements.splice(i, 1);
        }
    });
    return removeList.length > 0;
}
function spawnElements(elements, dim) {
    elements.forEach(elem => {
        worlds[dim].elements.push(elem);
    });
}
function checkCollision(element1, element2) {
    if (!element1.hitbox || !element2.hitbox)
        return false;
    const aLeft = element1.pos.x + element1.hitbox.offsetX;
    const aRight = aLeft + element1.hitbox.width;
    const aTop = element1.pos.y + element1.hitbox.offsetY;
    const aBottom = aTop + element1.hitbox.height;
    const bLeft = element2.pos.x + element2.hitbox.offsetX;
    const bRight = bLeft + element2.hitbox.width;
    const bTop = element2.pos.y + element2.hitbox.offsetY;
    const bBottom = bTop + element2.hitbox.height;
    return (aLeft < bRight &&
        aRight > bLeft &&
        aTop < bBottom &&
        aBottom > bTop);
}
function teleport(distance) {
    worlds[currentWorld].elements.forEach(el => {
        el.pos.x -= distance;
    });
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function displayInfo(text) {
    const field = document.querySelector('#info');
    if (player.data.showingText)
        return;
    field.innerHTML = text;
    let opacity = 1;
    let posX = 500;
    player.data.showingText = true;
    let interval = setInterval(() => {
        field.style.opacity = `${opacity}`;
        field.parentElement.style.top = `${posX}px`;
        opacity -= 0.02;
        posX -= 10;
        if (opacity <= 0.25) {
            opacity = 0;
            clearInterval(interval);
            player.data.showingText = false;
            field.innerHTML = '';
        }
    }, 50);
}
function checkForRecipes() {
    var _a;
    loop: for (const r of recipes) {
        for (let y = 0; y < 3; y++) {
            const invLine = player.data.craftingInventory[y];
            const recLine = r.recipe[y].split('');
            for (let x = 0; x < 3; x++) {
                let inv = (_a = invLine[x]) !== null && _a !== void 0 ? _a : ' ';
                let rec = recLine[x];
                if (inv === 'null')
                    inv = ' ';
                if (rec !== ' ')
                    rec = r[rec];
                if (inv !== rec)
                    continue loop;
            }
        }
        return { output: r.output, isValid: true };
    }
    return { output: null, isValid: false };
}
async function grantAchievement(achievement) {
    const achievementData = await window.api.fetchAchievements();
    if (achievementData[achievement].granted)
        return;
    const AchievementsWrapper = document.querySelector('.AchievementsWrapper');
    const data = achievements[achievement];
    document.querySelector('.achievementIcon').style.backgroundImage = `url(${data.icon})`;
    document.querySelector('#achievementName').innerHTML = data.name;
    document.querySelector('#achievementDesc').innerHTML = data.desc;
    AchievementsWrapper === null || AchievementsWrapper === void 0 ? void 0 : AchievementsWrapper.classList.remove('display-none');
    playSound('completeAchievement', menu.sounds.effects / 100, true);
    let counter = -400;
    const interval = setInterval(() => {
        counter++;
        AchievementsWrapper.style.right = `${counter}px`;
        if (counter === 100) {
            clearInterval(interval);
            setTimeout(() => {
                const innerInterval = setInterval(() => {
                    counter--;
                    AchievementsWrapper.style.right = `${counter}px`;
                    if (counter < -400) {
                        clearInterval(innerInterval);
                        AchievementsWrapper.classList.add('display-none');
                    }
                }, 2.5);
            }, 3000);
        }
    }, 5);
    window.api.grantAchievement(achievement);
}
const elemRegistry = {
    block: block,
    NPC: NPC,
    goblin: goblin,
    skeleton: skeleton,
    nightBorn: nightBorn,
    chest: chest,
    trader: trader,
    teleporter: teleporter,
    enemyArcher: enemyArcher,
    ogre: ogre
};
async function initialise() {
    // import data
    const loadingInfo = document.querySelector('#loadingInfo');
    const loadingBar = document.querySelector('#loadingBar');
    console.info('Fetching recipes...');
    loadingInfo.innerHTML = 'Fetching recipes...';
    await fetch('./data/recipes.json')
        .then(res => res.json())
        .then(data => {
        recipes = data;
    });
    loadingBar.value += 10;
    console.info('Fetching effects...');
    loadingInfo.innerHTML = 'Fetching effects...';
    await fetch('./data/effects.json')
        .then(res => res.json())
        .then(data => {
        effects = data;
    });
    loadingBar.value += 10;
    console.info('Fetching items...');
    loadingInfo.innerHTML = 'Fetching items...';
    await fetch('./data/items.json')
        .then(res => res.json())
        .then(data => {
        items = data;
    });
    loadingBar.value += 10;
    const settings = await window.api.fetchSettings();
    if (settings)
        menu.settings = settings;
    const save = sessionStorage.getItem("save");
    let isOldSave;
    if (save) {
        const temp = await window.api.checkForSaves(save);
        isOldSave = temp.exists;
    }
    else {
        menu.quit();
        return;
    }
    if (!isOldSave) {
        console.info('Fetching worlds...');
        loadingInfo.innerHTML = 'Fetching worlds...';
        const intermediatWorld = await fetch('./data/worlds.json')
            .then(r => r.json());
        console.info('Formatting worlds...');
        loadingInfo.innerHTML = 'Formatting worlds...';
        Object.values(intermediatWorld).forEach((world) => {
            if (!worlds[world.name]) {
                worlds[world.name] = { background: { imgs: [], spriteWidth: 0, spriteHeight: 0, ground: "" }, elements: [] };
            }
            worlds[world.name].background = {
                imgs: world.background.imgs,
                spriteWidth: world.background.spriteWidth,
                spriteHeight: world.background.spriteHeight,
                ground: world.background.ground
            };
            world.elements.forEach((element) => {
                const ElemClass = elemRegistry[element.class];
                if (!ElemClass) {
                    alert(`World loading error!`);
                    throw new Error(`World loading error!`);
                }
                if (ElemClass === NPC && element.args[7] !== null) {
                    const instance = new ElemClass(element.args[0], element.args[1], element.args[2], element.args[3], element.args[4], element.args[5], element.args[6], new quest(element.args[7][0], element.args[7][1], element.args[7][2], element.args[7][3], element.args[7][4]), element.args[8]);
                    worlds[world.name].elements.push(instance);
                }
                else {
                    const instance = new ElemClass(...element.args);
                    worlds[world.name].elements.push(instance);
                }
            });
        });
        loadingBar.value += 40;
        await changeWorld('jungle', true);
        loadingBar.value += 10;
    }
    else {
        const { intermediatWorld, playerData, metaData, droppedItemsData } = await window.api.getWorldData(save);
        Object.entries(intermediatWorld).forEach(([worldName, world]) => {
            if (!worlds[worldName]) {
                worlds[worldName] = { background: { imgs: [], spriteWidth: 0, spriteHeight: 0, ground: "" }, elements: [] };
            }
            worlds[worldName].background = world.background;
            world.elements.forEach((elem) => {
                const ElemClass = elemRegistry[elem.data.class];
                if (!ElemClass) {
                    console.warn(`Unknown class: ${elem.data.class}`);
                    return;
                }
                Object.setPrototypeOf(elem, ElemClass.prototype);
                if (elem.quest) {
                    let interquest = elem.quest;
                    Object.setPrototypeOf(interquest, quest.prototype);
                    elem.quest = interquest;
                }
                if (elem.data) {
                    elem.data.onCooldown = false;
                    elem.data.isDead = false;
                    elem.data.showedText = false;
                    elem.data.attackFocus = null;
                    elem.data.interactionFocus = null;
                }
                elem.init();
                if ('onCooldown' in elem) {
                    elem.onCooldown = false;
                }
                worlds[worldName].elements.push(elem);
            });
        });
        loadingBar.value += 20;
        player.data = playerData.data;
        player.data.spells.forEach(spell => {
            if (spell) {
                Object.setPrototypeOf(spell, spellRegistry[spell.class].prototype);
            }
        });
        player.sprite = playerData.sprite;
        player.pos = playerData.pos;
        player.data.onCooldown = false;
        player.data.isAttacking = false;
        player.data.canMove = true;
        let intermediatQuests = metaData.quest;
        intermediatQuests.forEach((interquest) => {
            Object.setPrototypeOf(interquest, quest.prototype);
        });
        activeQuests = intermediatQuests;
        changeWorld(metaData.world, true);
        /*         const newstats = await window.api.getStats(save);
                stats = newstats; */
        const savedAchievements = await window.api.fetchAchievements();
        achievements = savedAchievements;
        droppedItemsData.forEach((item) => {
            Object.setPrototypeOf(item, droppedItem.prototype);
        });
        droppedItems = droppedItemsData;
        loadingBar.value += 20;
    }
    console.info('Finished initialisation');
    loadingInfo.innerHTML = 'Finished initialisation';
}
function update(timestamp = 0) {
    var _a, _b;
    const now = performance.now();
    // display fps
    const fpsDiv = document.querySelector('.fps-div');
    frameCount++;
    if (now - lastTime >= 1000) {
        fps = frameCount;
        lastTime = now;
        frameCount = 0;
        if (menu.checkSetting('FPS')) {
            fpsDiv.classList.remove('display-none');
            fpsDiv.innerHTML = `<h1>${fps} FPS</h1>`;
        }
        else {
            fpsDiv.classList.add('display-none');
        }
    }
    const elapsed = timestamp - lastFrameTime;
    if (elapsed < FRAME_TIME) {
        requestAnimationFrame(update);
        return;
    }
    lastFrameTime = timestamp - (elapsed % FRAME_TIME);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (!currentWorld || !worlds[currentWorld]) {
        requestAnimationFrame(update);
        return;
    }
    if (!menu.checkSetting('Master Sound')) {
        music.pause();
    }
    else if (music.paused) {
        music.play();
    }
    // player logic
    player.data.isMoving = false;
    let isBlocked = false;
    player.update();
    // check for keydown/up inputs
    if ((keys['KeyD'] || keys['KeyW']) && !player.data.onInventory && !player.data.onTradingMenu && !player.data.onSecondaryInventory && !player.data.isAttacking && player.data.canMove && !player.data.onCooldown && !player.data.castingSpell) {
        AFKCounter = 0;
        // check for obstacles
        if (!menu.checkSetting('No Clip') && !player.data.onBlock.isOnBlock) {
            worlds[currentWorld].elements.forEach(elem => {
                if (elem instanceof block && elem.blocking.isBlocking) {
                    if (checkCollision({ hitbox: elem.hitbox, pos: elem.pos }, { hitbox: player.hitbox, pos: player.pos })) {
                        isBlocked = true;
                        if (elem.center.x < player.center.x) {
                            isBlocked = false;
                        }
                        if (elem.blocking.text) {
                            displayInfo(elem.blocking.text);
                        }
                        if (player.sprite.currentState !== 'idle' && player.sprite.currentState !== 'jump' && player.sprite.currentState !== 'fall' && !player.data.isAttacking)
                            player.changeState('idle');
                    }
                }
            });
        }
        if (!isBlocked) {
            if (player.sprite.currentState !== 'run' && player.data.onGround && !player.data.onCooldown && !player.data.isAttacking) {
                player.changeState('run');
            }
            if (menu.checkSetting('Speed')) {
                gameSpeed = 100;
                levelPos += 100;
                bgPosition -= 100;
            }
            else {
                gameSpeed = player.data.speed;
                levelPos += player.data.speed;
                bgPosition -= player.data.speed;
                stats.general.distance.value += player.data.speed;
            }
            ;
            document.querySelector('.bar').style.backgroundPosition = `${bgPosition}px 0`;
            player.data.Xdirec = 1;
            player.data.isMoving = true;
        }
    }
    else if ((keys['KeyA'] || keys['KeyS']) && !player.data.onInventory && !player.data.onTradingMenu && !player.data.onSecondaryInventory && !player.data.isAttacking && player.data.canMove && !player.data.onCooldown && !player.data.castingSpell) {
        AFKCounter = 0;
        // check for obstacles
        if (!menu.checkSetting('No Clip') && !player.data.onBlock.isOnBlock) {
            worlds[currentWorld].elements.forEach(elem => {
                if (elem instanceof block && elem.blocking.isBlocking) {
                    if (checkCollision({ hitbox: elem.hitbox, pos: elem.pos }, { hitbox: player.hitbox, pos: player.pos })) {
                        isBlocked = true;
                        if (elem.center.x > player.center.x) {
                            isBlocked = false;
                        }
                        if (elem.blocking.text) {
                            displayInfo(elem.blocking.text);
                        }
                        if (player.sprite.currentState !== 'idle' && player.sprite.currentState !== 'jump' && player.sprite.currentState !== 'fall')
                            player.changeState('idle');
                    }
                }
            });
        }
        if (!player.data.onCooldown && !isBlocked) {
            if (player.sprite.currentState !== 'run' && player.data.onGround && !player.data.onCooldown && !player.data.isAttacking) {
                player.changeState('run');
            }
            if (menu.checkSetting('Speed')) {
                gameSpeed = -100;
                levelPos -= 100;
                bgPosition += 100;
            }
            else {
                gameSpeed = -player.data.speed;
                levelPos -= player.data.speed;
                bgPosition += player.data.speed;
                stats.general.distance.value += player.data.speed;
            }
            player.data.Xdirec = 2;
            player.data.isMoving = true;
        }
        document.querySelector('.bar').style.backgroundPosition = `${bgPosition}px 0`;
    }
    else {
        AFKCounter++;
        (_a = document.querySelector('.bar')) === null || _a === void 0 ? void 0 : _a.classList.remove('scrollRight');
        (_b = document.querySelector('.bar')) === null || _b === void 0 ? void 0 : _b.classList.remove('scrollLeft');
        if (AFKCounter > 18000) {
            grantAchievement('afk');
        }
    }
    if (isBlocked)
        gameSpeed = 0;
    deadObjects.forEach(obj => {
        let indexHealthbar = -1;
        for (let i = 0; i < nonWorldElems.length; i++) {
            if (nonWorldElems[i].type.name === 'healthbar' && nonWorldElems[i].entity === obj) {
                indexHealthbar = i;
                break;
            }
        }
        if (indexHealthbar !== -1) {
            nonWorldElems.splice(indexHealthbar, 1);
        }
        worlds[currentWorld].elements.splice(worlds[currentWorld].elements.indexOf(obj), 1);
    });
    // reset deadobjects
    deadObjects = [];
    backgroundLayers.forEach(Layer => {
        Layer.update();
        Layer.draw();
    });
    worlds[currentWorld].elements.forEach((element) => {
        const VIEW_LEFT = -600;
        const VIEW_RIGHT = CANVAS_WIDTH + 600;
        if ((keys['KeyD'] || keys['KeyW']) && element.type.moving === true && !isBlocked) {
            element.pos.x -= gameSpeed;
        }
        else if ((keys['KeyA'] || keys['KeyS']) && element.type.moving === true && !isBlocked) {
            element.pos.x -= gameSpeed;
        }
        element.update();
        if (element.pos.x >= VIEW_LEFT && element.pos.x <= VIEW_RIGHT) {
            element.draw();
        }
    });
    nonWorldElems.forEach(elem => {
        elem.update();
        elem.draw();
    });
    let removerArr = [];
    droppedItems.forEach((item, i) => {
        if (item.wasPickedUp) {
            removerArr.push(i);
        }
        if ((keys['KeyD'] || keys['KeyW']) && !isBlocked) {
            item.pos.x -= gameSpeed;
        }
        else if ((keys['KeyA'] || keys['KeyS']) && !isBlocked) {
            item.pos.x -= gameSpeed;
        }
        item.update();
        item.draw();
    });
    removerArr.forEach(i => {
        droppedItems.splice(i, 1);
        return;
    });
    player.draw();
    particles.forEach(particle => {
        // Bewegung der Partikel zeitbasiert machen
        if ((keys['KeyD'] || keys['KeyW']) && particle.type.moving === true && !isBlocked) {
            particle.pos.x -= gameSpeed;
        }
        else if ((keys['KeyA'] || keys['KeyS']) && particle.type.moving === true && !isBlocked) {
            particle.pos.x -= gameSpeed;
        }
        particle.update();
        particle.draw();
    });
    const questDiv = document.querySelector('#questDiv');
    if (activeQuests.length > 0) {
        questDiv === null || questDiv === void 0 ? void 0 : questDiv.classList.remove('display-none');
    }
    else {
        questDiv === null || questDiv === void 0 ? void 0 : questDiv.classList.add('display-none');
    }
    // check if any new events occured
    if (!isQuestUIupdated) {
        questDiv.innerHTML = '';
        activeQuests.forEach(quest => {
            const questCompleted = quest.update();
            questDiv.appendChild(document.createElement('hr')).classList.add('background-color-black');
            const titleDiv = document.createElement('div');
            const h2 = document.createElement('h2');
            h2.textContent = quest.text;
            titleDiv.appendChild(h2);
            questDiv.appendChild(titleDiv);
            let amountOfCompleted = quest.entities.filter(e => e.completed).length;
            const h1 = document.createElement('h1');
            h1.textContent = `${amountOfCompleted}/${quest.entities.length}`;
            questDiv.appendChild(h1);
            if (questCompleted) {
                const btn = document.createElement('button');
                btn.classList.add('confirm-btn');
                btn.id = 'questBtn';
                btn.addEventListener('click', () => {
                    console.log('click');
                    quest.finish();
                });
                questDiv.appendChild(btn);
            }
        });
        isQuestUIupdated = true;
    }
    currentEvents = [];
    gameFrame++;
    requestAnimationFrame(update);
}
let currentWorld;
async function changeWorld(world, fromInit) {
    var _a, _b;
    if (world.startsWith("house")) {
        grantAchievement('knock_knock');
    }
    if (world === 'goblin_kingdom') {
        grantAchievement('goblin_kingdom');
    }
    if (!fromInit) {
        const loadingInfo = document.querySelector('#loadingInfo');
        const loadingScreen = document.querySelector('#loadingScreen');
        loadingScreen === null || loadingScreen === void 0 ? void 0 : loadingScreen.classList.remove('display-none');
        const loadingBar = document.querySelector('#loadingBar');
        canvas === null || canvas === void 0 ? void 0 : canvas.classList.add('display-none');
        (_a = document.querySelector('.bar')) === null || _a === void 0 ? void 0 : _a.classList.add('display-none');
        backgroundLayers = [];
        loadingInfo.innerHTML = `Loading ${world}...`;
        loadingBar.value += 20;
        if (!worlds[world]) {
            console.error(`World does not exist: ${world}`);
            alert(`World error!`);
            menu.save();
            /* menu.quit() */
            return;
        }
        ;
        document.querySelector('.bar').style.backgroundImage = `url(img/background/${worlds[world].background.ground})`;
        loadingInfo.innerHTML = `Generating paralax layers...`;
        loadingBar.value += 50;
        const spriteWidth = worlds[world].background.spriteWidth;
        const spriteHeight = worlds[world].background.spriteHeight;
        const base_path = 'img/background/';
        let speedModifier = 0.2;
        for (let i = 0; i < worlds[world].background.imgs.length; i++) {
            let currentLayer = new Image();
            currentLayer.src = `${base_path}${worlds[world].background.imgs[i]}`;
            backgroundLayers.push(new Layer(currentLayer, speedModifier, spriteWidth, spriteHeight));
            speedModifier += 0.2;
        }
        loadingInfo.innerHTML = `Finishing...`;
        await sleep(300);
        loadingBar.value += 30;
        loadingInfo.innerHTML = `Completed!`;
        loadingBar.value += 30;
        nonWorldElems = [];
        currentWorld = world;
        window.api.changeDCState('playing', currentWorld);
        loadingScreen === null || loadingScreen === void 0 ? void 0 : loadingScreen.classList.add('display-none');
        canvas === null || canvas === void 0 ? void 0 : canvas.classList.remove('display-none');
        (_b = document.querySelector('.bar')) === null || _b === void 0 ? void 0 : _b.classList.remove('display-none');
    }
    else {
        backgroundLayers = [];
        if (!worlds[world]) {
            console.error(`World does not exist: ${world}`);
            alert(`World error!`);
            menu.save();
            menu.quit();
            return;
        }
        const spriteWidth = worlds[world].background.spriteWidth;
        const spriteHeight = worlds[world].background.spriteHeight;
        const base_path = 'img/background/';
        let speedModifier = 0.2;
        document.querySelector('.bar').style.backgroundImage = `url(img/background/${worlds[world].background.ground})`;
        for (let i = 0; i < worlds[world].background.imgs.length; i++) {
            let currentLayer = new Image();
            currentLayer.src = `${base_path}${worlds[world].background.imgs[i]}`;
            backgroundLayers.push(new Layer(currentLayer, speedModifier, spriteWidth, spriteHeight));
            speedModifier += 0.2;
        }
        await sleep(300);
        nonWorldElems = [];
        currentWorld = world;
        window.api.changeDCState('playing', currentWorld);
    }
}
// declare player
let player = new Player(CANVAS_WIDTH * 0.4, 420);
const menu = new menuClass();
let music = new Audio();
music.src = 'sound/music.ogg';
// initialise && push layers
async function start() {
    const loadingInfo = document.querySelector('#loadingInfo');
    const loadingScreen = document.querySelector('#loadingScreen');
    loadingScreen === null || loadingScreen === void 0 ? void 0 : loadingScreen.classList.remove('display-none');
    const loadingBar = document.querySelector('#loadingBar');
    await updateHotbar();
    window.api.changeDCState('playing', currentWorld);
    console.info('Initialising...');
    await initialise();
    loadingBar.value += 20;
    loadingInfo.innerHTML = 'Starting!';
    await sleep(120);
    loadingScreen === null || loadingScreen === void 0 ? void 0 : loadingScreen.classList.add('display-none');
    isLoading = false;
    music.volume = menu.sounds.music / 100;
    music.loop = true;
    grantAchievement('oathbound');
    await updateHotbar();
    await update();
}
start();
