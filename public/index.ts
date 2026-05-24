// initialise canvas
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')
if (!canvas) throw new Error('Canvas element not found')
const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('2D context not supported')
// set dimensions
let CANVAS_WIDTH = canvas.width = /* 2000 */ window.innerWidth
const CANVAS_HEIGHT = canvas.height = 700
// some configs
ctx.imageSmoothingEnabled = false;

// initial values
let gameSpeed = 0 // game speed depending on the players movement
let gameFrame = 0 // counter for the frames
const MAX_FALL_SPEED = 8 // 
const staggerFrames = 7 // amount of ticks between each frame of animation
const globalGravity = 8 // gravity affecting the player
const groundY = 535 // is the y-coordinate of the ground
let isLoading = true
let bgPosition = 0
let shakeX = 0
let shakeY = 0
let shakeIntensity = 0

let cheats = false
let date = sessionStorage.getItem('date')

let AFKCounter = 0

const imageCache: Record<string, HTMLImageElement> = {}

function getImage(src: string): HTMLImageElement {
    if (!imageCache[src]) {
        const img = new Image()
        img.src = src
        imageCache[src] = img
    }
    return imageCache[src]
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
}

const defaultStats = stats

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
}

setInterval(() => {
    stats.general.play_time.value++
}, 60000)

let fps = 0 // current fps
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;
let lastFrameTime = 0
let frameCount = 0
let lastTime = performance.now()

let isQuestUIupdated = false
// positions depending on the element
enum StaticPositions {
    OnGround = -1
}

// saving all keys
let keys: Record<string, boolean> = {}
// all objects on the screen
let nonWorldElems: nonWorldElems[] = []
let backgroundLayers: backgroundLayer[] = []
let droppedItems: droppedItem[] = []
let particles: particles[] = []
let deadObjects: entity[] = []
// level design values
let levelPos = 0
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
    rumble: new Audio('sound/rumble.mp3'),
}

function playSound(sound: string, volume: number, isInRegistry?: boolean) {
    if (!menu.checkSetting('Master Sound')) return

    if (isInRegistry) {
        const key = sound as keyof typeof sounds;
        sounds[key].volume = sound === 'UIopen' || sound === 'UIclose' ? volume / 10 : volume;
        sounds[key].currentTime = 0;
        sounds[key].play();
        return;
    }

    const audio = new Audio(`sound/${sound}`);
    audio.volume = volume;
    audio.play();
}

// interfaces && types
type item = 'earth_gem'|'wood_pickaxe'|'stone_pickaxe'|'iron_pickaxe'|'copper_pickaxe'|'gold_pickaxe'|'cow_flesh' | 'chicken_flesh' | 'cleansing_rune' | 'blank_scroll' | 'blood_gem' | 'blood_scroll' | "iron_staff" | 'ice_scroll' | 'earth_scroll' | 'void_scroll' | 'fire_scroll' | 'lightning_scroll' | 'goblin_mask' | 'coffee' | 'key' | 'fruit' | 'horn' | 'cloth' | 'silver_ingot' | 'stone' | 'string' | 'leather' | 'hardened_boots' | 'copper_ingot' | 'gold_ingot' | 'iron_ingot' | 'stick' | 'mushroom' | 'lightning_potion' | 'healthboost_potion' | 'icing_rapier' | 'big_regeneration_potion' | 'regeneration_potion' | 'peasants_robe' | 'steel_robe' | 'null' | 'supernova' | 'poisoned_staff' | 'holy_longsword' | 'flaming_saber' | 'knights_helm' | 'berserker_helmet' | 'leather_boots' | 'leather_hood' | 'gold_crown' | 'iron_boots' | 'iron_chestplate_tier_3' | 'iron_chestplate_tier_2' | 'iron_chestplate_tier_1' | 'iron_helmet' | 'pappbanditem' | 'wood_sword' | 'brocken_sword' | 'stone_sword' | 'beer' | 'coin' | 'iron_sword' | 'gold_sword' | 'copper_sword' | 'heal_potion' | 'big_heal_potion' | 'wood_rapier' | 'stone_rapier' | 'iron_rapier' | 'gold_rapier' | 'copper_rapier' | 'wood_sickle' | 'stone_sickle' | 'iron_sickle' | 'gold_sickle' | 'copper_sickle'
type effect = 'speed' | 'stun' | 'burning' | 'regeneration' | 'ice' | 'strength' | 'electrocute' | 'healthboost' | 'deaths_curse' | 'poison'

type ItemData = {
    spriteX: number
    spriteY: number
    height: number
    width: number
    scale: number
    attackDamage: number
    src: string
    use?: () => void
    attack?: (entity: entity) => void
    onUse: string
    clearsAfterUse: boolean
    attackRange: number
    attackCooldown: number
    description: string
    type: string
    slot?: string
    protection?: number
    rendering?: { pos: { x: number, y: number, x2: number }, isMirrored: boolean, scale: number },
    animation?: {
        frames: number
        length: number
    }
}

type effectTypeBase = {
    ticks: number
    onTick?(entity: entity): void
    start?(entity: entity): void
    end?(entity: entity): void
    particle: string
    spriteWidth: number
    spriteHeight: number
    frameAmount: number
    icon: string
    name: string
}

type effectType = {
    effect: effectTypeBase,
    duration: number,
    factor: number,
    index: number
}

type recipe = {
    recipe: [string, string, string]
    output: item
    A: item
    B?: item
    C?: item
    D?: item
    E?: item
    F?: item
    G?: item
    H?: item
}

let effects: Record<effect, effectTypeBase>;
let items: Record<item, ItemData>
let recipes: recipe[];
let worlds: Record<string, {
    mobCap: number
    music?: string
    background: {
        imgs: string[]
        spriteWidth: number
        spriteHeight: number
        ground: string
    }
    elements: WorldElement[]
}> = {}
let configs;

type EffectFunction = {
    onTick?: (entity: entity) => void
    start?: (entity: entity) => void
    end?: (entity: entity) => void
}

type EffectFunctions = Record<string, EffectFunction>

const effectFunctions: EffectFunctions = {
    burning: {
        onTick: (entity: entity) => {
            entity.takeHit(3)
        },
    },
    regeneration: {
        onTick: (entity: entity) => {
            entity.heal(2)
        },
    },
    ice: {
        onTick: (entity: entity) => {
            entity.takeHit(2)
        },
        start(entity: entity) {
            if (entity.data.speed) {
                entity.data.speed /= 1.5
            }
        },
        end(entity: entity) {
            if (entity.data.speed) {
                entity.data.speed *= 1.5
            }
        },
    },
    healthboost: {
        start: (entity: entity) => {
            entity.data.maxHealth = entity.data.maxHealth * 1.5
            entity.data.health *= 1.5
        },
        end: (entity: entity) => {
            entity.data.maxHealth /= 1.5
        },
    },
    deaths_curse: {
        end: (entity: entity) => {
            if (Math.round(Math.random() * entity.data.health) < 10) {
                entity.data.health = 0
            }
        },
    },
    poison: {
        onTick: (entity: entity) => {
            if (entity.data.isMoving) {
                entity.takeHit(3)
            }
        },
    },
    speed: {
        start(entity: entity) {
            if (entity.data.speed) {
                entity.data.speed *= 1.5
            }
        },
        end(entity: entity) {
            if (entity.data.speed) {
                entity.data.speed /= 1.5
            }
        },
    }
}
const itemFunctions = {
    beer: {
        use: () => {
            player.heal(5)
            if (menu.checkSetting('Master Sound')) playSound('drink.wav', menu.values.effects / 100)
            return
        },
    },
    chicken_flesh: {
        use: () => {
            player.heal(10)
        },
    },
    cow_flesh: {
        use: () => {
            player.heal(10)
        },
    },
    heal_potion: {
        use: () => {
            player.heal(35)
            grantAchievement('heal')
            if (menu.checkSetting('Master Sound')) playSound('drink.wav', menu.values.effects / 100)
            return
        },
    },
    big_heal_potion: {
        use: () => {
            player.heal(50)
            grantAchievement('heal')
            if (menu.checkSetting('Master Sound')) playSound('drink.wav', menu.values.effects / 100)
            return
        },
    },
    pappbanditem: {
        use: () => {
            player.heal(1000000)
        },
    },
    holy_longsword: {
        use: () => {
            player.addEffect('healthboost', 500, 1)
        },
    },
    supernova: {
        use: () => {
            player.addEffect('strength', 500, 1)
        },
    },
    regeneration_potion: {
        use: () => {
            player.addEffect('regeneration', 600, 1)
            grantAchievement('heal')
            if (menu.checkSetting('Master Sound')) playSound('drink.wav', menu.values.effects / 100)
        },
    },
    big_regeneration_potion: {
        use: () => {
            player.addEffect('regeneration', 1000, 1)
            grantAchievement('heal')
            if (menu.checkSetting('Master Sound')) playSound('drink.wav', menu.values.effects / 100)
            return
        },
    },
    healthboost_potion: {
        use: () => {
            player.addEffect('healthboost', 3000, 1)
            grantAchievement('heal')
            if (menu.checkSetting('Master Sound')) playSound('drink.wav', menu.values.effects / 100)
        },
    },
    lightning_potion: {
        use: () => {
            player.addEffect('electrocute', 1500, 1)
            if (menu.checkSetting('Master Sound')) playSound('drink.wav', menu.values.effects / 100)
        },
    },
    fruit: {
        use: () => {
            player.heal(5)
        },
    },
    mushroom: {
        use: () => {
            let removeArr: number[] = []
            player.effectData.effects.forEach((effect, i) => {
                removeArr.push(effect.index)
            })

            removeArr.forEach(i => {
                player.removeEffect(i)
            })
        },
    },
    coffee: {
        use: () => {
            player.heal(5)
            player.addEffect('speed', 600, 1)
            if (menu.checkSetting('Master Sound')) playSound('drink.wav', menu.values.effects / 100)
            return
        },
    },
    icing_rapier: {
        attack(entity: entity) {
            entity.addEffect('ice', 1000, 1)
        },
    },
    flaming_saber: {
        attack(entity: entity) {
            entity.addEffect('burning', 500, 1)
        },
    },
    null: {
        attack(entity: entity) {
            player.takeHit(10)
            entity.addEffect('deaths_curse', 1500, 1)
        },
    },
    ice_gem: {
        use: () => {
            player.addEffect('ice', 250, 1)
        }
    },
    fire_gem: {
        use: () => {
            player.addEffect('burning', 250, 1)
        }
    },
    iron_staff: {
        use: () => {
            if (player.data.isMoving) return
            if (player.story.learntMagic) {
                openStaffGUI('iron_staff')
            } else {
                displayInfo('You don\'t know how to use this!')
            }

        },
        attackStart: () => {

        }
    },
    gold_staff: {
        use: () => {
            if (player.data.isMoving) return
            if (player.story.learntMagic) {
                openStaffGUI('gold_staff')
            } else {
                displayInfo('You don\'t know how to use this!')
            }

        }
    },
    advanced_staff: {
        use: () => {
            if (player.data.isMoving) return
            if (player.story.learntMagic) {
                openStaffGUI('advanced_staff')
            } else {
                displayInfo('You don\'t know how to use this!')
            }

        }
    },
    master_staff: {
        use: () => {
            if (player.data.isMoving) return
            if (player.story.learntMagic) {
                openStaffGUI('master_staff')
            } else {
                displayInfo('You don\'t know how to use this!')
            }

        }
    },
    cleansing_rune: {
        use: () => {
            if (player.data.isMoving) return
            if (player.story.learntMagic) {
                openStaffGUI('cleansing')
            } else {
                displayInfo('You don\'t know how to use this!')
            }
        }
    },
    cat_whistle: {
        use: () => {
            player.companions.push(new catCompanion())
        }
    },
    mana_crystal: {
        use: () => {
            if(player.data.mana + 50 > 100) {
                player.data.mana = 100
            }else {
                player.data.mana += 50
            }
        }
    },
    cooked_chicken: {
        use: () => {
            player.heal(15)
        }
    },
    cooked_beef: {
        use: () => {
            player.heal(15)
        }
    }
}

type InventorySlot = item | null
type Inventory = InventorySlot[][]

type Trade = {
    amount: number
    item: item
}

interface spellType {
    name: string
    rendering: {
        icon: string
        spriteX: number
        spriteY: number
        width: number
        height: number
        scale?: number
    }
    cast: {
        start: {
            img: string,
            width: number,
            height: number,
            frameAmount: number
        },
        idle: {
            img: string,
            width: number,
            height: number,
            frameAmount: number
        },
        castTime: number
    }
    startFrame: number
    spellCooldown: number
    manaCost: number
    class: string
    tier: string
    castSpell(): void
    checkEndOfCooldown(frameAmount: number): Promise<void>
    cooldown(): Promise<void>
}

interface blocks {
    pos: { x: number, y: number }
    sprite: { img: string, pathToImage: string, spriteWidth: number, spriteHeight: number, scale?: number }
    interactData: { cooldown: number, output: { amount: number, item: item }[], isInfinite: boolean, healthBarScale: number } | null
    blocking: { isBlocking: boolean, removeItem: item | null }
    data: { class: string, showedText: boolean, spawnedHealthbar: boolean, wasCollected: boolean, healthbar: healthbar | null, health: number, maxHealth?: number }
    type: typeObject // information about the type of object
    worldElem: worldElementNames
    id: number
    interact?: () => void
    update(): void
    hitbox: { offsetX: number, offsetY: number, width: number, height: number }
    draw(): void
}

interface backgroundLayer {
    pos: { x: number, y: number }
    sprite: { img: CanvasImageSource, spriteWidth: number, spriteHeight: number }
    speedModifier: number // speed proportion to the gamespeed
    speed: number // gamespeed * speedModifier
    isInit: boolean // checks if layer has already been drawn
    type: typeObject // information about the type of object
    draw(): void
    update(): void
}

interface nonWorldElems {
    x: number
    y: number
    update(): void
    draw(): void
    type: typeObject
    entity: entity | blocks
}

interface particles {
    pos: { x: number, y: number }
    update(): void
    draw(): void
    animationStates: { name: string, frames: number }[]
    img: HTMLImageElement
    type: typeObject
    spriteHeight: number
    spriteWidth: number
    counter?: number
    entity: entity
    hitbox?: { offsetX: number, offsetY: number, width: number, height: number }
}

interface entity {
    update(): void
    draw(): void
    init(): void
    changeState(state: string): void
    showHealthbar(): void
    takeHit(damage: number): void
    setCooldown(ms: number): void
    interact(): void
    endConversation?(): void
    heal(healAmount: number): void
    addEffect(effect: effect, duration: number, factor: number): void
    removeEffect(index: number): void
    pos: { x: number, y: number }
    data: { class: string, attackFocus?: entity | null, craftingInventory?: InventorySlot[][], armor?: InventorySlot[], inventory?: InventorySlot[][], Ydirec?: number, interactionFocus?: block | container | entity | null, showingText?: boolean, selectedSlot?: number, dragging?: string | null, interactionRange?: number, velocity_Y?: number, canMove?: boolean, onSecondaryInventory?: boolean, speed?: number, onGround?: boolean, onInventory?: boolean, onTradingMenu?: boolean, health: number; maxHealth: number; attackRange: number; attackDamage: number; drops: { amount: number; drop: item; chance: number; }[]; name: string; onCooldown: boolean; isDead: boolean; isMoving: boolean; showedText: boolean; Xdirec: number; seeRange: number; attackType?: { type: 'melee' | 'rangedCombat', projectile: projectile } };
    sprite: { hitbox: { offsetX: number, offsetY: number, width: number, height: number }, img: string, spriteWidth: number, spriteHeight: number, scale: number, animationStates: AnimationState[], spriteAnimations: Record<string, framesObj>, frames: number, frameLoc: number, currentState: string, healthBarScale?: number }
    type: typeObject // info about the type of entity/thing
    worldElem: worldElementNames
    id: number
    conversation?: { first: string[], second?: string[], questCompleted?: string[] }
    conversationCounter?: number
    isSpeaking?: boolean
    present?: PresentItem[]
    hasGivenPresent?: boolean
    quest?: quest | null

}

type PresentItem = {
    item: item
    amount: number
}

interface container {
    pos: { x: number, y: number }
    update(): void
    draw(): void
    interact(): void
    changeState(state: string): void
    type: typeObject
    spriteHeight: number
    spriteWidth: number
    inventory: Inventory
    currentState: string
    id: number
    worldElem: worldElementNames
}

interface typeObject {
    isGround: boolean
    moving: boolean
    name: string
    allignment: string
    attackable: boolean
    interactable: boolean
    attackType?: {
        type: 'rangedCombat' | 'melee', projectile: { spriteWidth: number, scale: number, range: number, speed: number, damage: number, spriteHeight: number, pathToImage: string, animationStates: AnimationState[], hitbox: { offsetY: number, offsetX: number, width: number, height: number } }
    }
    isNotTurning?: boolean,
    bossbar?: boolean
}

interface AnimationState {
    name: string
    frames: number
}

interface framesObj {
    loc: Array<{ x: number; y: number }>
}

const observer = new ResizeObserver(() => {
    CANVAS_WIDTH = canvas.width = window.innerWidth
    ctx.imageSmoothingEnabled = false
})

observer.observe(document.body)

setInterval(() => {
    if (!player) return
    const newWidth = window.innerWidth
    if (canvas.width !== newWidth) {
        CANVAS_WIDTH = canvas.width = newWidth
    }
    if (canvas.width !== newWidth) {
        CANVAS_WIDTH = canvas.width = newWidth
        ctx.imageSmoothingEnabled = false
    }
    if (player.data.spellCooldown > 0) {
        player.data.spellCooldown--
        const div = document.querySelector('.cooldownDiv') as HTMLElement;
        div.classList.remove('display-none')
        const height = (player.data.spellCooldown / player.data.currentCooldown) * 80
        div!.style.height = `${height}px`
    }

    if (player.data.mana < 100) {
        player.data.mana += 0.25
        player.updateMana()
    }

    if (!player.data.onInventory && !player.data.onTradingMenu && !player.data.onSecondaryInventory && !player.data.isAttacking && player.data.canMove && !player.data.onCooldown && !player.data.castingSpell) {
        player.data.canMove = true
    }
}, 100)

// inputs
document.querySelector('#game')!.addEventListener('contextmenu', e => e.preventDefault());

canvas.addEventListener('mousedown', event => {
    if (isLoading) return
    if (event.button === 2 && !player.data.onInventory) {
        player.useItem()
    }

    if (event.button === 0 && !player.data.onInventory) {
        player.attack()
    }
})
addEventListener('keyup', event => {
    if (isLoading) return
    if (!player.data.onInventory) {
        keys[event.code] = false
        if (!player.data.isAttacking && player.sprite.currentState !== 'take_hit') player.changeState('idle')
        gameSpeed = 0
    }
})
addEventListener('keydown', event => {
    if (player.data.isDead) return;

    if (event.code === 'Escape') {
        if (player.data.onInventory || player.data.onSecondaryInventory) {
            closeInventory()
            closeStaffGUI()
        } else if (player.data.onTradingMenu) {
            closeTradingMenu()
        } else if (player.data.onCompanionGUI) {
            closeCompanionGUI()
        } else {
            menu.toggleMenu()
        }
    }
    if (isLoading || !(document.querySelector('#menu')?.classList.contains('display-none'))) return
    if (!player.data.onInventory && !player.data.onTradingMenu && !player.data.onSecondaryInventory && player.data.canMove) keys[event.code] = true

    if (event.code === 'KeyR' && !player.data.isMoving) {
        if (!player.data.onSecondaryInventory) {
            player.interact()
        }
    }

    if (event.code === 'KeyE' && !player.data.isMoving) {
        if (player.data.onInventory && !player.data.onTradingMenu && !player.data.onCompanionGUI) {
            document.querySelector('body')?.classList.remove('grab')
            player.data.dragging = null
            closeInventory()
            closeStaffGUI()
        } else {
            if (player.data.onTradingMenu) {
                closeTradingMenu()
            } else if (player.data.onCompanionGUI) {
                closeCompanionGUI()
            } else {
                openInventory()
            }
        }


    }

    if (event.code === 'Space' && !player.data.onInventory && player.data.canMove) {
        player.jump()
    }

    if (event.code === 'KeyQ') {
        player.drop()
    }

    if (event.code === 'KeyC' && !player.data.isMoving && !player.data.onInventory) {
        if (player.data.onCompanionGUI) {
            closeCompanionGUI()
        } else
            openCompanionGUI()
    }

    if (!player.data.onInventory && event.code.slice(0, 5) === 'Digit' && (parseInt(event.code.slice(5, 6)) < 6)) {
        changeSelectedSlot(parseInt(event.code.slice(5, 6)))
    }
})

let scrollCount = 0
window.addEventListener('wheel', (e) => {
    if (isLoading) return
    if (scrollCount % 300) {
        if (e.deltaY > 0) {
            if (player.data.selectedSlot < 5) {
                changeSelectedSlot(player.data.selectedSlot + 1)
            } else {
                changeSelectedSlot(1)
            }
        } else {
            if (player.data.selectedSlot > 1) {
                changeSelectedSlot(player.data.selectedSlot - 1)
            } else {
                changeSelectedSlot(5)
            }
        }
    }
    scrollCount++
})

// quest logic and events
let currentEvents: { event: event, entity: entity, extra?: any }[] = []
let activeQuests: quest[] = []

type event = 'kill' | 'talk' | 'walk' | 'give'

class menuClass {
    states: {
        menu: boolean
        options: boolean
        settings: boolean
    }
    settings: {
        audio: { name: string, settings: { name: string, state: boolean }[] }
        video: { name: string, settings: { name: string, state: boolean }[] }
        dev: { name: string, settings: { name: string, state: boolean }[] }
        accessibility: { name: string, settings: { name: string, state: boolean }[] }
    }
    values: {
        effects: number
        music: number
        brightness: number
    }
    commands: any
    constructor() {
        this.states = {
            menu: false,
            options: false,
            settings: false
        } // keep track of which menu screens are open
        this.settings = { // keeps track of all settings
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
        }

        this.values = {
            music: 100,
            effects: 50,
            brightness: 100
        }

        this.commands = {
            heal: (arg: string) => { player.heal(Number(arg)) },
            effect: (arg: effect) => { player.addEffect(arg, 1000, 1) },
            give: (arg: item) => { if (items[arg]) { player.addItem(arg, 1) } else { displayInfo('Unknown Item') } },
            damage: (arg: string) => { player.takeHit(Number(arg)) },
            summon: (arg: string) => {
                if (!elemRegistry[arg] || (arg !== 'skeleton' && arg !== 'goblin' && arg !== 'ogre')) {
                    displayInfo(`Unknown or Unsummonable entity`)
                    return
                }

                const entity = new elemRegistry[arg](player.pos.x, StaticPositions.OnGround, arg, 0)

                worlds[currentWorld].elements.push(entity)
            },
            world: (arg: string) => {
                if(worlds[arg])
                    changeWorld(arg)
                else {
                    displayInfo('Unknown World')
                }
            },
            story: (arg: string) => {
                if(!(player.story as any)[arg.trim()]) {
                    displayInfo('Unknown Story Flag')
                    return
                }else {
                    (player.story as any)[arg.trim()] = true 
                }
            }
        }
    }

    toggleMenu() {
        playSound('UIopen', this.values.effects / 100, true)
        const menu = document.querySelector('#menu');
        if (this.states.menu) {
            const options = document.querySelector('#options');
            const settings = document.querySelector('#settings');
            menu?.classList.add('display-none')
            options?.classList.add('display-none')
            settings?.classList.add('display-none')
            this.states.menu = false
            this.states.options = false
            this.states.settings = false
        } else {
            menu?.classList.remove('display-none')
            this.states.menu = true
        }

        window.api.saveSettings(this.settings, this.values)
    }

    toggleOptionsScreen() {
        playSound('UIopen', menu.values.effects / 100, true)
        const div = document.querySelector('#options');
        if (this.states.options) {
            div?.classList.add('display-none')
            this.states.options = false
        } else {
            this.states.options = true
            const settingsArr = Object.values(this.settings)
            div!.innerHTML = ''
            div!.classList.remove('display-none')
            div!.innerHTML += `<div class="flex-center"><h2>Options</h2></div><hr>`

            settingsArr.forEach(setting => {
                if (setting.name === 'dev' && !cheats) {

                } else
                    div!.innerHTML += `<div class="flex-center margin-top-16"><button class="btn-small background-color-gray" onclick="menu.toggleSettingsScreen('${setting.name}')">${setting.name.toUpperCase()}</button></div>`
            });

            div!.innerHTML += `<div class="flex-between margin-top-32"><button onclick="menu.toggleMenu()" class="btn-small background-color-gray">Close</button><button onclick="menu.toggleOptionsScreen()" class="btn-small background-color-gray">Back</button></div>`
        }
    }

    quit() {
        location.href = 'index.html'
    }

    async save() {
        const save = sessionStorage.getItem("save")
        const name = sessionStorage.getItem('name')
        const description = sessionStorage.getItem('description')
        if (!save) { menu.quit(); return }
        const temp = await window.api.checkForSaves(save)
        const alreadySavedMeta = temp.meta
        const settings = this.settings
        let meta = {
            name: "World",
            description: "World",
            world: currentWorld,
            quest: activeQuests,
            cheats: cheats,
            date: date
        }

        if (alreadySavedMeta) {
            meta.name = alreadySavedMeta.name,
                meta.description = alreadySavedMeta.description
            meta.date = alreadySavedMeta.date
        } else {
            meta.name = name ?? "World"
            meta.description = description ?? "World"
            meta.date = date
        }

        window.api.saveGame(worlds, player, save, meta, stats, settings, droppedItems)
        window.api.saveSettings(menu.settings, menu.values)
    }

    toggleSettingsScreen(setting: keyof menuClass['settings']) {
        playSound('UIopen', menu.values.effects / 100, true)
        const div = document.querySelector('#settings');
        if (this.states.settings) {
            this.states.settings = false
            div?.classList.add('display-none')
        } else {
            this.states.settings = true
            div?.classList.remove('display-none')
            div!.innerHTML = ''
            div!.classList.remove('display-none')
            div!.innerHTML += `<div class="flex-center"><h2>${setting.toUpperCase()} Settings</h2></div><hr>`

            const settings = this.settings[setting].settings

            settings.forEach(set => {
                div!.innerHTML += `<div class="flex-center margin-top-16"><button id="${set.name.replace(' ', '')}" class="btn-small background-color-gray" onclick="menu.toggleSetting('${set.name}', '${setting}')">${set.name}</button></div>`
                const btn = document.querySelector(`#${set.name.replace(' ', '')}`);
                if (set.state) {
                    btn?.classList.add('setting-true')
                    btn?.classList.remove('setting-false')
                } else {
                    btn?.classList.remove('setting-true')
                    btn?.classList.add('setting-false')
                }
            })
            if (setting === 'dev') {
                div!.innerHTML += `<div class="flex-center margin-top-16"><input id="command" placeholder="command..." type="text"><button class="gradientBtn btn-small margin-left-16" onclick="menu.runCommand()">Send</button></div>`
            } else if (setting === 'audio') {
                div!.innerHTML += `<div class="flex-center margin-top-16"><h3>Music: </h3><input id="musicRange" value="${menu.values.music}" type="range" max="100" min="0" onchange="music.volume = Number(document.querySelector('#musicRange').value)/100; menu.values.music = Number(document.querySelector('#musicRange').value)"></div><div class="flex-center margin-top-16"><h3>Effects: </h3><input id="effectsRange" value="${menu.values.effects}" type="range" max="100" min="0" onchange="menu.values.effects = Number(document.querySelector('#effectsRange').value)"></div>`
            } else if (setting === 'video') {
                div!.innerHTML += `<div class="flex-center margin-top-16"><h3>Brightness: </h3><input id="brightnessRange" value="${menu.values.music}" type="range" max="100" min="10" onchange="menu.values.brightness = document.querySelector('#brightnessRange').value;document.querySelector('body').style.filter = 'brightness(${this.values.brightness}%)'"></div>`
            }
            div!.innerHTML += `<div class="flex-between margin-top-32"><button onclick="menu.toggleMenu()" class="btn-small background-color-gray">Close</button><button onclick="menu.toggleSettingsScreen()" class="btn-small background-color-gray">Back</button></div>`
        }
    }

    toggleSetting(setting: string/* keyof menuClass['settings']['dev'] */, group: keyof menuClass['settings']) {
        if (group === 'dev') { grantAchievement('cheater') }
        this.settings[group].settings.forEach(set => {

            const btn = document.querySelector(`#${set.name.replace(' ', '')}`);
            if (set.name === setting) {
                if (set.state) {
                    btn?.classList.remove('setting-true')
                    btn?.classList.add('setting-false')
                    if (setting === 'Fullscreen') {
                        document.exitFullscreen();
                    }
                    set.state = false
                } else {
                    set.state = true
                    if (setting === 'Fullscreen') {
                        document.documentElement.requestFullscreen()
                    }
                    btn?.classList.add('setting-true')
                    btn?.classList.remove('setting-false')
                }
            }
        })
    }
    checkSetting(setting: string) {
        const allGroups = Object.values(this.settings)

        for (const group of allGroups) {
            for (const set of group.settings) {
                if (group.name === 'dev' && !cheats) {
                    return false
                };
                if (set.name === setting && set.state) {
                    return true
                }
            }
        }

        return false
    }
    runCommand() {
        const input = (document.querySelector('#command')! as HTMLInputElement).value;
        (document.querySelector('#command')! as HTMLInputElement).value = ''

        const command = input.split(/-(.+)/)

        if (!menu.commands[command[0].split(" ")[0] as any]) {
            displayInfo(`Unknown Command: ${command}`)
            return;
        }

        if (command[1] !== '') {
            menu.commands[command[0].split(" ")[0] as any](command[1])
        } else {
            menu.commands[command[0].split(" ")[0] as any]()
        }
    }
}

class quest {
    event: event
    entities: { entity: number, completed: boolean }[]
    text: string
    gift: { item: item, amount: number }[]
    completed: boolean
    giveCompleted: boolean
    itemsDeleted: boolean
    items?: { item: item, amount: number }[]
    constructor(event: event, entities: number[], text: string, gift: { item: item, amount: number }[], items?: { item: item, amount: number }[]) {
        this.event = event
        this.text = text
        this.gift = gift
        this.completed = false
        this.giveCompleted = false
        this.itemsDeleted = false
        this.entities = []
        entities.forEach(entity => {
            this.entities.push({ entity: entity, completed: false })
        })
        this.items = items
    }

    update() {
        let giveEventCompleted = false
        currentEvents.forEach(event => {
            if (event.event === this.event) {
                this.entities.forEach(entity => {
                    if (entity.entity === event.entity.id) {
                        entity.completed = true
                    }
                })

                if (this.event === 'give') {
                    if (event.extra) {
                        if (this.items === event.extra) {
                            this.completed = true
                            this.giveCompleted = true
                            giveEventCompleted = true
                        }
                    }
                }
            }
        })

        if (giveEventCompleted) {
            if (this.items && !this.itemsDeleted) {
                player.removeItems(this.items)
                this.itemsDeleted = true
            }
            return true
        }

        if (this.event === 'give' && this.giveCompleted) {
            return true
        }

        let questCompleted = true
        this.entities.forEach(entity => {
            if (!entity.completed) {
                questCompleted = false
                this.completed = false
            }
        })

        if (this.event === 'give') {
            questCompleted = false
        }

        return questCompleted
    }

    finish() {
        this.gift.forEach(gift => {
            player.addItem(gift.item, gift.amount)
        })

        if (this.text === "Pay the wizard two coins in order to learn magery.") {
            player.story.learntMagic = true
        } else if(this.text === "List: cow flesh, 2 string, chicken_flesh") {
            let market = worlds.jungle.elements.find(el => el instanceof trader && el.id === 70000)
            if(market) {
                (market as any).trade = [
                        [
                            {
                                "amount": 1,
                                "item": "chicken_flesh"
                            },
                            {
                                "amount":1,
                                "item": "cooked_chicken"
                            }
                        ],
                        [
                            {
                                "amount": 1,
                                "item": "cow_flesh"
                            },
                            {
                                "amount": 1,
                                "item": "cooked_beef"
                            }
                        ],
                        [
                            {
                                "amount": 1,
                                "item": "coin"
                            },
                            {
                                "amount": 2,
                                "item": "string"
                            }
                        ]
                    ]
            }
        } else if(this.text === "Find and defeat the goblin king!") {
            deleteElement(70001, "block", "jungle") // delete border
            deleteElement(70002, "NPC", "jungle") // delete guard
        }

        let index: number = -1

        activeQuests.forEach((quest, i) => {
            if (quest === this) {
                index = i
            }
        })
        if (index !== -1) {
            activeQuests.splice(index, 1)
        }
        isQuestUIupdated = false
        this.completed = true
    }
}

class passiveEntity extends Entity {
    sprite: {
        img: string
        pathToImage: string,
        spriteWidth: number,
        spriteHeight: number,
        scale: number,
        frames: number,
        frameLoc: number,
        currentState: string,
        spriteAnimations: Record<string, framesObj>
        animationStates: AnimationState[],
        hitbox: {
            offsetX: number,
            offsetY: number,
            width: number,
            height: number
        },
        invertOrientation?: boolean
    }
    data: {
        isAttacking: boolean,
        class: string,
        health: number,
        maxHealth: number,
        attackDamage: number,
        attackRange: number,
        drops: { drop: item, amount: number, chance: number }[],
        name: string,
        onCooldown: boolean,
        isDead: boolean,
        isMoving: boolean,
        showedText: boolean,
        Xdirec: number,
        seeRange: number,
        attackFocus: null | typeof player
    }
    type: {
        allignment: string,
        attackable: boolean,
        interactable: boolean,
        isGround: boolean,
        moving: boolean,
        name: string,
        attackType?: {
            type: "rangedCombat" | "melee",
            projectile: {
                spriteWidth: number,
                scale: number,
                damage: number,
                range: number,
                speed: number,
                spriteHeight: number,
                pathToImage: string,
                animationStates: AnimationState[],
                hitbox: {
                    offsetX: number,
                    offsetY: number,
                    width: number,
                    height: number
                }
            }
        },
        isNotTurning?: boolean
    }
    worldElem: worldElementNames
    currentGoal: number | null
    speed: number
    constructor(pos: { x: number, y: number }, sprite: { pathToImage: string, spriteWidth: number, spriteHeight: number, animationStates: AnimationState[], scale: number, hitbox: { offsetX: number, offsetY: number, width: number, height: number }, invertOrientation?: boolean, portrait?: string }, data: { health: number }, drops: { drop: item, amount: number, chance: number }[], worldElem: worldElementNames, id: number, dim: worldName) {

        let invertOrientation = sprite.invertOrientation
        if (pos.y === StaticPositions.OnGround) {
            pos.y = groundY - 400 * sprite.scale
        }

        super({ x: pos.x, y: pos.y },
            worldElem,
            id
        )

        this.sprite = {
            img: sprite.pathToImage,
            pathToImage: sprite.pathToImage,
            spriteWidth: sprite.spriteWidth,
            spriteHeight: sprite.spriteHeight,
            scale: sprite.scale,
            animationStates: sprite.animationStates,
            hitbox: sprite.hitbox,
            invertOrientation: invertOrientation,
            frames: 0,
            frameLoc: 0,
            spriteAnimations: {},
            currentState: 'idle',
        }

        this.data = {
            health: data.health,
            maxHealth: data.health,
            attackRange: 1,
            attackDamage: 1,
            drops: drops,
            class: 'passiveEntity',
            name: 'passiveEntity',
            isAttacking: false,
            attackFocus: null,
            isDead: false,
            isMoving: false,
            onCooldown: false,
            seeRange: 0,
            showedText: false,
            Xdirec: 1
        }

        this.type = {
            isGround: true /* is it a ground/flying troop */, name: 'passiveEntity' /* name of the enemy */, allignment: 'passive' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: true, interactable: false
        }
        this.worldElem = worldElem
        this.data.class = "passiveEntity"
        this.currentGoal = null
        this.speed = 2
        this.init()
    }

    interact(): void {

    }
    get center() {
        return {
            x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width / 2,
            y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height / 2
        }
    }
    async update(): Promise<void> {
        if (this.data.isDead) return
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            effect.duration--

            if (effect.duration <= 0) {
                if (effect.effect.end) {
                    effect.effect.end(this)
                }
                this.removeEffect(effect.index)
            }
            if (this.effectData.effectTicks % effect.effect.ticks === 0) {
                if (effect.effect.onTick) {
                    effect.effect.onTick(this)
                }
            }

            if (document.querySelector(`#${effect.effect.name} `)) {
                const div = document.querySelector(`#${effect.effect.name} `);
                if (div!.querySelector('#duration')) {
                    div!.querySelector('#duration')!.innerHTML = `${effect.duration} `
                }
            }

        })

        if (!this.currentGoal && Math.random() < .009) {
            if (Math.random() > .5) {
                this.currentGoal = Math.random() * 400
            } else {
                this.currentGoal = -(Math.random() * 400)
            }
        }



        if (this.currentGoal && !this.data.isDead) {
            if (this.currentGoal > 0) {
                this.pos.x += 2
                this.currentGoal -= 2
                this.data.Xdirec = 2
                if (this.currentGoal <= 0) {
                    this.currentGoal = null
                    this.speed = 2
                }
            } else {
                this.pos.x -= 2
                this.currentGoal += 2
                this.data.Xdirec = 1
                if (this.currentGoal >= 0) {
                    this.currentGoal = null
                    this.speed = 2
                }
            }
            if (this.sprite.currentState !== 'run' && this.sprite.currentState !== 'death') this.changeState('run')
        } else {
            if (this.sprite.currentState !== 'idle' && this.sprite.currentState !== 'death') this.changeState('idle')
        }

        this.sprite.frames++
        if (this.sprite.frames >= staggerFrames) {
            this.sprite.frames = 0
            this.sprite.frameLoc++
            const frameAmount = this.sprite.spriteAnimations[this.sprite.currentState].loc.length

            if (this.sprite.frameLoc >= frameAmount) {
                this.sprite.frameLoc = 0
                this.endOfAnimation(frameAmount)
            }
        }

        if (this.data.health <= 0 && this.sprite.currentState !== 'death') {
            if (player.data.inventory[3][player.data.selectedSlot - 1] === null) {
                grantAchievement('beast')
            }

            if (player.data.health / player.data.maxHealth <= 0.05) {
                grantAchievement('close_call')
            }

            stats.entities.kills.value++
            if (this.data.name === 'goblin') {
                grantAchievement('goblin_kill')

                const globalStats = await window.api.fetchGlobalStats()
                if (globalStats.entities.killed_goblin.value >= 75) {
                    grantAchievement('goblin_demolisher')
                }
            }
            if (this.data.name === 'goblin') {
                stats.entities.killed_goblin.value++
            } else if (this.data.name === 'skeleton') {
                stats.entities.killed_skeleton.value++
            }
            this.changeState('death')
            this.data.onCooldown = true
            currentEvents.push({ event: 'kill', entity: this })
            isQuestUIupdated = false
            if (menu.checkSetting('Master Sound')) playSound('death.mp3', menu.values.effects / 100)
        }

        if (this.data.health <= 0) return
    }

    draw() {
        if (menu.checkSetting('Hitboxes')) {
            ctx!.save()
            ctx!.strokeStyle = this.type.allignment === 'enemy' ? 'red' : (this.type.allignment === 'passive' ? 'yellow' : 'green')
            ctx!.lineWidth = 2
            ctx!.strokeRect(
                this.pos.x + this.sprite.hitbox.offsetX,
                this.pos.y + this.sprite.hitbox.offsetY,
                this.sprite.hitbox.width,
                this.sprite.hitbox.height
            )
            ctx!.strokeStyle = "black"
            ctx!.strokeRect(this.pos.x + this.sprite.hitbox.offsetX, this.pos.y + this.sprite.hitbox.offsetY, 5, 5)
            ctx!.restore()
        }

        let frameX = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].x // get current locations of the animation
        let frameY = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].y

        let orientation = this.data.Xdirec === 2

        if (this.sprite.invertOrientation) {
            orientation = !orientation
        }

        const image = getImage(this.sprite.img)
        if (orientation) {
            ctx!.save() // save current state of the canvas
            const drawX = -(this.pos.x + 400 * this.sprite.scale)
            ctx!.scale(-1, 1) // invert orientatian of the entity
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale)
            ctx!.restore()
        } else {
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale)
        }

    }

    takeHit(damage: number): void {
        if (this.data.health <= 0) return;
        if (Math.random() * 100 < 80)
            this.setCooldown(1000)
        this.changeState('take_hit')
        if (player.pos.x > this.pos.x) {
            this.currentGoal = -400
            this.speed = 4
        } else {
            this.currentGoal = 400
            this.speed = 4
        }
        this.data.health -= damage
        this.showHealthbar()
    }

    endOfAnimation(frameAmount: number): void {
        if (this.sprite.currentState === 'death') {
            let deadParticles: number[] = []
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i)
                }
            })
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle, 1)
            })
            this.data.drops.forEach(drop => {
                if (Math.floor(Math.random() * 100) <= drop.chance) {
                    droppedItems.push(new droppedItem({ x: this.pos.x + this.sprite.hitbox.offsetX + Math.round(Math.random() * 80) - 40, y: this.pos.y + this.sprite.hitbox.offsetY }, drop.drop, currentWorld))
                }
            })
            if (this.data.isDead) return;
            this.data.isDead = true
            this.sprite.frameLoc = frameAmount - 1
            deadObjects.push(this)
            return
        } else {
            if (this.sprite.currentState === 'take_hit') {
                this.changeState('idle')
            } else if (this.sprite.currentState === 'attack') {
                if (this.type.attackType?.type === 'rangedCombat') {
                    particles.push(new projectile(this, this.type.attackType.projectile.spriteWidth, this.type.attackType.projectile.spriteHeight, this.type.attackType.projectile.scale, this.type.attackType.projectile.pathToImage, this.type.attackType.projectile.animationStates, this.type.attackType.projectile.range, this.type.attackType.projectile.speed, this.type.attackType.projectile.damage, this.type.attackType.projectile.hitbox, 'arrow'))
                }
                this.changeState('idle')
                this.data.isAttacking = false
            }
        }
        if (this.type.name === 'trader' && this.sprite.currentState === 'open') {
            this.changeState('dialogue')
        }
    }

    attack(): void {
        if (!this.data.isAttacking && !this.data.onCooldown) {
            this.changeState('attack')
            this.data.isAttacking = true
            setTimeout(() => {
                if (this.data.isDead) return
                if (this.data.onCooldown) return
                if (this.type.attackType?.type !== 'rangedCombat') {
                    const playerPosX = player.pos.x
                    const playerDirec = this.pos.x - player.pos.x
                    const distanceXToPlayer = Math.abs((playerPosX + (player.sprite.spriteWidth / 2) * player.sprite.scale) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale))
                    if (playerDirec <= 0 && distanceXToPlayer <= this.data.attackRange && player.pos.y + this.data.attackRange >= this.pos.y) {
                        player.takeHit(this.data.attackDamage)
                    } else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && player.pos.y + this.data.attackRange >= this.pos.y) {
                        player.takeHit(this.data.attackDamage)
                    }
                }
            }, 550)
        }
    }
}

type companionType = catCompanion
class catCompanion {
    sprite: {
        img: string
        pathToImage: string,
        spriteWidth: number,
        spriteHeight: number,
        scale: number,
        frames: number,
        frameLoc: number,
        currentState: string,
        spriteAnimations: Record<string, framesObj>
        animationStates: AnimationState[],
        hitbox: {
            offsetX: number,
            offsetY: number,
            width: number,
            height: number
        },
        invertOrientation?: boolean
    }
    lootPool: item[]
    relativePosition: { x: number, y: number }
    selected: boolean
    pos: { x: number, y: number }
    img: HTMLImageElement | null
    Xdirec: number
    cooldown: number
    portrait: string
    constructor() {
        this.lootPool = ["string", "leather", "chicken_flesh"]
        this.relativePosition = { x: 100, y: StaticPositions.OnGround }
        this.selected = false
        this.cooldown = 18000
        this.sprite = {
            img: 'img/passiveEntities/cat.png',
            pathToImage: 'img/passiveEntities/cat.png',
            spriteWidth: 80,
            spriteHeight: 64,
            scale: 0.5,
            spriteAnimations: {},
            frames: 0,
            frameLoc: 0,
            currentState: 'idle',
            animationStates: [
                { name: 'idle', frames: 8 },
                { name: 'run', frames: 12 },
                { name: 'take_hit', frames: 4 },
                { name: 'attack', frames: 8 }
            ],
            hitbox: {
                offsetX: 50,
                offsetY: 40,
                width: 100,
                height: 90
            }
        }
        this.Xdirec = 1
        this.pos = { x: 0, y: 0 }
        this.img = null
        this.portrait = 'img/portraits/cat.png'

        this.init()
    }
    init() {
        // initialise spriteAnimation object
        this.sprite.animationStates.forEach((state, index) => { // iterate through all animations
            let frames: framesObj = { // create a frames object to store the location of the current animation
                loc: []
            }
            for (let j = 0; j < state.frames; j++) { // iterate for each frame
                let positionX = j * this.sprite.spriteWidth // calculate the corresponding position of said frame
                let positionY = index * this.sprite.spriteHeight

                frames.loc.push({ x: positionX, y: positionY }) // push these positions onto the frames object
            }

            this.sprite.spriteAnimations[state.name] = frames // create a key on the spriteAnimations object to store this data
        })

        this.img = new Image()
        if (this.img instanceof HTMLImageElement)
            this.img.src = this.sprite.img
    }
    changeState(state: string) {
        this.sprite.currentState = state
        this.sprite.frameLoc = 0 // reset animation
        this.sprite.frames = 0
    }
    update() {
        this.pos.x = player.center.x - 300
        this.pos.y = 550
        this.Xdirec = player.data.Xdirec

        if (gameFrame + 1 % this.cooldown === 0) {
            const drop = this.lootPool[Math.floor(Math.random() * this.lootPool.length)]

            droppedItems.push(new droppedItem({ x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width * Math.random(), y: this.pos.y - 30 }, drop, currentWorld))
        }

        if (player.data.isMoving) {
            if (this.sprite.currentState !== 'run') this.changeState('run')
        } else {
            if (this.sprite.currentState !== 'idle') this.changeState('idle')
        }

        this.sprite.frames++
        if (this.sprite.frames >= staggerFrames) {
            this.sprite.frames = 0
            this.sprite.frameLoc++
            const frameAmount = this.sprite.spriteAnimations[this.sprite.currentState].loc.length

            if (this.sprite.frameLoc >= frameAmount) {
                this.sprite.frameLoc = 0
            }
        }
    }

    draw() {
        if (menu.checkSetting('Hitboxes')) {
            ctx!.save()
            ctx!.strokeStyle = 'green'
            ctx!.lineWidth = 2
            ctx!.strokeRect(
                this.pos.x + this.sprite.hitbox.offsetX,
                this.pos.y + this.sprite.hitbox.offsetY,
                this.sprite.hitbox.width,
                this.sprite.hitbox.height
            )
            ctx!.strokeStyle = "black"
            ctx!.strokeRect(this.pos.x + this.sprite.hitbox.offsetX, this.pos.y + this.sprite.hitbox.offsetY, 5, 5)
            ctx!.restore()
        }

        let frameX = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].x // get current locations of the animation
        let frameY = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].y

        const image = getImage(this.sprite.img)
        if (this.Xdirec === 1) {
            ctx!.save() // save current state of the canvas
            const drawX = -(this.pos.x + 400 * this.sprite.scale)
            ctx!.scale(-1, 1) // invert orientatian of the entity
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale)
            ctx!.restore()
        } else {
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale)
        }
    }
}

class trader extends Entity implements entity {
    sprite: {
        img: string
        pathToImage: string,
        spriteWidth: number,
        spriteHeight: number,
        scale: number,
        frames: number,
        frameLoc: number,
        currentState: string,
        spriteAnimations: Record<string, framesObj>
        animationStates: AnimationState[],
        hitbox: {
            offsetX: number,
            offsetY: number,
            width: number,
            height: number
        },
        invertOrientation?: boolean
    }
    data: {
        isAttacking: boolean,
        class: string,
        health: number,
        maxHealth: number,
        attackDamage: number,
        attackRange: number,
        drops: { drop: item, amount: number, chance: number }[],
        name: string,
        onCooldown: boolean,
        isDead: boolean,
        isMoving: boolean,
        showedText: boolean,
        Xdirec: number,
        seeRange: number,
        attackFocus: null | typeof player
    }
    type: {
        allignment: string,
        attackable: boolean,
        interactable: boolean,
        isGround: boolean,
        moving: boolean,
        name: string,
        attackType?: {
            type: "rangedCombat" | "melee",
            projectile: {
                spriteWidth: number,
                scale: number,
                damage: number,
                range: number,
                speed: number,
                spriteHeight: number,
                pathToImage: string,
                animationStates: AnimationState[],
                hitbox: {
                    offsetX: number,
                    offsetY: number,
                    width: number,
                    height: number
                }
            }
        },
        isNotTurning?: boolean
    }
    trade: Trade[][]
    worldElem: worldElementNames
    constructor(pos: { x: number, y: number }, sprite: { img: string, spriteWidth: number, spriteHeight: number, frameAmount: number, scale: number, invertDirec?: boolean }, trade: Trade[][], worldElem: worldElementNames, isNotTurning: boolean, id: number) {

        if (pos.y === StaticPositions.OnGround) {
            pos.y = 500
        }

        super({ x: pos.x, y: pos.y },
            worldElem,
            id
        )

        let hitbox;
        if (sprite.img === 'img/passiveEntities/shop.png') {
            hitbox = { offsetX: 10, offsetY: 0, width: 350, height: 700 }
        } else {
            hitbox = { offsetX: 0, offsetY: 0, width: 200, height: 200 }
        }

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
            hitbox: hitbox
        }

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
        }

        this.type = {
            isGround: true /* is it a ground/flying troop */, name: 'trader' /* name of the enemy */, allignment: 'passive' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: false, interactable: true, isNotTurning: isNotTurning
        }

        this.worldElem = worldElem
        this.trade = trade
        this.data.class = "trader"
        this.init()
    }

    async update(): Promise<void> {
        if (this.data.isDead) return
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            effect.duration--

            if (effect.duration <= 0) {
                if (effect.effect.end) {
                    effect.effect.end(this)
                }
                this.removeEffect(effect.index)
            }
            if (this.effectData.effectTicks % effect.effect.ticks === 0) {
                if (effect.effect.onTick) {
                    effect.effect.onTick(this)
                }
            }

            if (document.querySelector(`#${effect.effect.name} `)) {
                const div = document.querySelector(`#${effect.effect.name} `);
                if (div!.querySelector('#duration')) {
                    div!.querySelector('#duration')!.innerHTML = `${effect.duration} `
                }
            }

        })

        if (this.sprite.currentState !== 'attack') this.data.isAttacking = false

        if (this.type.interactable) {
            if (checkCollision({ hitbox: player.hitbox, pos: player.pos }, { hitbox: this.sprite.hitbox, pos: this.pos }) && !player.data.onCooldown && player.data.onGround) {
                if (!this.data.showedText && menu.checkSetting('labels')) {
                    displayInfo('Press "R" to interact')
                    this.data.showedText = true
                }
                player.data.interactionFocus = this
                /*                 player.data.interactionFocus = null
                                player.data.interactionFocusGrab = null */
            } else {
                if (player.data.interactionFocus === this) {
                    player.data.interactionFocus = null
                }
                this.data.showedText = false
                if (this.sprite.currentState !== 'idle') this.changeState('idle')
            }
        }

        this.sprite.frames++
        if (this.sprite.frames >= staggerFrames) {
            this.sprite.frames = 0
            this.sprite.frameLoc++
            const frameAmount = this.sprite.spriteAnimations[this.sprite.currentState].loc.length

            if (this.sprite.frameLoc >= frameAmount) {
                this.sprite.frameLoc = 0
                this.endOfAnimation(frameAmount)
            }
        }

        if (this.data.health <= 0 && this.sprite.currentState !== 'death') {
            if (player.data.inventory[3][player.data.selectedSlot - 1] === null) {
                grantAchievement('beast')
            }

            if (player.data.health / player.data.maxHealth <= 0.05) {
                grantAchievement('close_call')
            }

            stats.entities.kills.value++
            if (this.data.name === 'goblin') {
                grantAchievement('goblin_kill')

                const globalStats = await window.api.fetchGlobalStats()
                if (globalStats.entities.killed_goblin.value >= 75) {
                    grantAchievement('goblin_demolisher')
                }
            }
            if (this.data.name === 'goblin') {
                stats.entities.killed_goblin.value++
            } else if (this.data.name === 'skeleton') {
                stats.entities.killed_skeleton.value++
            }
            this.data.drops.forEach(drop => {
                if (Math.floor(Math.random() * 100) <= drop.chance) {
                    droppedItems.push(new droppedItem({ x: this.pos.x + this.sprite.hitbox.offsetX + Math.round(Math.random() * 80) - 40, y: this.pos.y + this.sprite.hitbox.offsetY }, drop.drop, currentWorld))
                }
            })
            this.changeState('death')
            this.data.onCooldown = true
            currentEvents.push({ event: 'kill', entity: this })
            isQuestUIupdated = false
            if (menu.checkSetting('Master Sound')) playSound('death.mp3', menu.values.effects / 100)
        }

        if (this.data.health <= 0) return

        if (!menu.checkSetting('No Aggro')) {
            const playerPosX = player.pos.x
            const distanceXToPlayer = Math.abs((playerPosX + (player.sprite.spriteWidth / 2) * player.sprite.scale) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale))
            const playerDirec = this.pos.x - player.pos.x
            const playerHiddenFromGoblins = player.data.armor[0] === 'goblin_mask' && this.data.name === 'goblin'

            if (distanceXToPlayer <= this.data.attackRange && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy') {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player
                    this.attack()
                }
            } else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy') {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player
                    this.attack()
                }
            } else if (distanceXToPlayer <= this.data.seeRange && !this.data.onCooldown && this.type.allignment === 'enemy') {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player
                    if (this.sprite.currentState !== 'run') this.changeState('run')
                    if (playerPosX > this.pos.x) {
                        this.pos.x += 4
                    } else {
                        this.pos.x -= 4
                    }
                    if (this.checkEffect('poison').wasFound) {
                        this.data.health -= .1
                    }
                } else {
                    if (this.sprite.currentState === 'run') { this.changeState('idle') }
                }
            } else {
                if (this.sprite.currentState === 'run') { this.changeState('idle') }

                this.data.attackFocus = null
            }

            this.effectData.effectTicks++
        }
    }

    draw() {
        if (menu.checkSetting('Hitboxes')) {
            ctx!.save()
            ctx!.strokeStyle = this.type.allignment === 'enemy' ? 'red' : (this.type.allignment === 'passive' ? 'yellow' : 'green')
            ctx!.lineWidth = 2
            ctx!.strokeRect(
                this.pos.x + this.sprite.hitbox.offsetX,
                this.pos.y + this.sprite.hitbox.offsetY,
                this.sprite.hitbox.width,
                this.sprite.hitbox.height
            )
            ctx!.strokeStyle = "black"
            ctx!.strokeRect(this.pos.x + this.sprite.hitbox.offsetX, this.pos.y + this.sprite.hitbox.offsetY, 5, 5)
            ctx!.restore()
        }

        let frameX = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].x // get current locations of the animation
        let frameY = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].y

        let orientation = (player.pos.x + player.sprite.spriteWidth / 2) - (this.pos.x + this.sprite.spriteWidth / 2)

        if (this.sprite.invertOrientation) {
            orientation = -orientation
        }

        const image = getImage(this.sprite.img)
        if (orientation <= 0 && !this.type.isNotTurning) {
            this.data.Xdirec = 2
            ctx!.save() // save current state of the canvas
            const drawX = -(this.pos.x + 400 * this.sprite.scale)
            ctx!.scale(-1, 1) // invert orientatian of the entity
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX + shakeX, this.pos.y + shakeY, 400 * this.sprite.scale, 400 * this.sprite.scale)
            ctx!.restore()
        } else {
            this.data.Xdirec = 1
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x + shakeX, this.pos.y + shakeY, 400 * this.sprite.scale, 400 * this.sprite.scale)
        }

    }

    takeHit(damage: number): void {
        if (this.data.health <= 0) return;
        if (Math.random() * 100 < 80)
            this.setCooldown(1000)
        this.changeState('take_hit')
        this.data.health -= damage
        this.showHealthbar()
    }

    endOfAnimation(frameAmount: number): void {
        if (this.sprite.currentState === 'death') {
            let deadParticles: number[] = []
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i)
                }
            })
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle, 1)
            })

            if (this.data.isDead) return;
            this.data.isDead = true
            this.sprite.frameLoc = frameAmount - 1
            deadObjects.push(this)
            return
        } else {
            if (this.sprite.currentState === 'take_hit') {
                this.changeState('idle')
            } else if (this.sprite.currentState === 'attack') {
                if (this.type.attackType?.type === 'rangedCombat') {
                    particles.push(new projectile(this, this.type.attackType.projectile.spriteWidth, this.type.attackType.projectile.spriteHeight, this.type.attackType.projectile.scale, this.type.attackType.projectile.pathToImage, this.type.attackType.projectile.animationStates, this.type.attackType.projectile.range, this.type.attackType.projectile.speed, this.type.attackType.projectile.damage, this.type.attackType.projectile.hitbox, 'arrow'))
                }
                this.changeState('idle')
                this.data.isAttacking = false
            }
        }
        if (this.type.name === 'trader' && this.sprite.currentState === 'open') {
            this.changeState('dialogue')
        }
    }

    attack(): void {
        if (!this.data.isAttacking && !this.data.onCooldown) {
            this.changeState('attack')
            this.data.isAttacking = true
            setTimeout(() => {
                if (this.data.isDead) return
                if (this.data.onCooldown) return
                if (this.type.attackType?.type !== 'rangedCombat') {
                    const playerPosX = player.pos.x
                    const playerDirec = this.pos.x - player.pos.x
                    const distanceXToPlayer = Math.abs((playerPosX + (player.sprite.spriteWidth / 2) * player.sprite.scale) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale))
                    if (playerDirec <= 0 && distanceXToPlayer <= this.data.attackRange && player.pos.y + this.data.attackRange >= this.pos.y) {
                        player.takeHit(this.data.attackDamage)
                    } else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && player.pos.y + this.data.attackRange >= this.pos.y) {
                        player.takeHit(this.data.attackDamage)
                    }
                }
            }, 550)
        }
    }

    interact(): void {
        openTradingMenu(this.trade)
    }

    get bottom() {
        return (this.pos.y + this.hitbox.offsetY + this.hitbox.height)
    }
}

type actionType = 'destroy' | 'spawn'
class NPC extends Entity implements entity {
    sprite: {
        img: string
        pathToImage: string,
        spriteWidth: number,
        spriteHeight: number,
        scale: number,
        frames: number,
        frameLoc: number,
        currentState: string,
        spriteAnimations: Record<string, framesObj>
        animationStates: AnimationState[],
        hitbox: {
            offsetX: number,
            offsetY: number,
            width: number,
            height: number
        },
        invertOrientation?: boolean
    }
    data: {
        isAttacking: boolean,
        class: string,
        health: number,
        maxHealth: number,
        attackDamage: number,
        attackRange: number,
        drops: { drop: item, amount: number, chance: number }[],
        name: string,
        onCooldown: boolean,
        isDead: boolean,
        isMoving: boolean,
        showedText: boolean,
        Xdirec: number,
        seeRange: number,
        attackFocus: null | typeof player
    }
    type: {
        allignment: string,
        attackable: boolean,
        interactable: boolean,
        isGround: boolean,
        moving: boolean,
        name: string,
        attackType?: {
            type: "rangedCombat" | "melee",
            projectile: {
                spriteWidth: number,
                scale: number,
                damage: number,
                range: number,
                speed: number,
                spriteHeight: number,
                pathToImage: string,
                animationStates: AnimationState[],
                hitbox: {
                    offsetX: number,
                    offsetY: number,
                    width: number,
                    height: number
                }
            }
        },
        isNotTurning?: boolean
    }
    conversation: { first: string[], second?: string[], questCompleted?: string[] }
    conversationCounter: number
    isSpeaking: boolean
    name: string
    portrait: string | undefined
    worldElem: worldElementNames
    present: PresentItem[]
    hasGivenPresent: boolean
    quest: quest | null
    questCompleted: boolean
    story: { action: actionType, ids: number[], dim: worldName, extra?: any }[] | null
    constructor(pos: { x: number, y: number }, sprite: { pathToImage: string, spriteWidth: number, spriteHeight: number, frameAmount: number, scale: number, hitbox: { offsetX: number, offsetY: number, width: number, height: number }, invertOrientation?: boolean, portrait?: string }, worldElem: worldElementNames, conversation: { first: string[], second?: string[], questCompleted?: string[] }, name: string, present: PresentItem[], id: number, quest: quest | null, story: { action: actionType, ids: number[], dim: worldName, extra?: any }[] | null) {

        let invertOrientation = sprite.invertOrientation
        if (pos.y === StaticPositions.OnGround) {
            pos.y = groundY - 400 * sprite.scale
        }

        super({ x: pos.x, y: pos.y },
            worldElem,
            id
        )

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
        }

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
        }

        this.type = {
            isGround: true /* is it a ground/flying troop */, name: 'NPC' /* name of the enemy */, allignment: 'passive' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: false, interactable: true
        }

        this.portrait = sprite.portrait
        this.worldElem = worldElem
        this.conversation = conversation
        this.conversationCounter = 0
        this.isSpeaking = false
        this.name = name
        this.present = present
        this.hasGivenPresent = false
        this.quest = quest
        this.story = story
        this.questCompleted = false
        this.data.class = "NPC"
        this.init()
    }
    endConversation() {
        const portrait = document.querySelector('#portrait') as HTMLElement;
        portrait!.style.background = ``
        stats.entities.talked_to_NPC.value++

        const speakDiv = document.querySelector('#speakingDiv');
        speakDiv?.classList.add('display-none')

        if (this.quest && !this.hasGivenPresent) {
            activeQuests.push(this.quest)
            isQuestUIupdated = false
        }

        if (this.story && !this.hasGivenPresent) {
            this.story.forEach(elem => {
                if (elem.action === 'destroy') {
                    removeWorldElements(elem.ids, ['id'], elem.dim)
                } else if (elem.action === 'spawn') {
                    let elemsArray: container[] | entity[] | block[] = []

                    elem.extra.forEach((element: any) => {
                        elemsArray.push(new elemRegistry[element.class](...element.args))
                    });

                    spawnElements(elemsArray, elem.dim)
                }
            })
        }

        if (!this.hasGivenPresent) {
            this.present.forEach(item => {
                player.addItem(item.item, item.amount)
            })
            this.hasGivenPresent = true
        }

        if(this.data.name === 'nate') {
            player.data.immune = false
        }

        window.api.sendMSGToDevice("CLEAR\n")
    }

    speak(): void {
        const speakDiv = document.querySelector('#speakingDiv');
        speakDiv?.classList.remove('display-none')
        const portrait = document.querySelector('#portrait') as HTMLElement;
        if (this.portrait) {

            portrait!.style.background = `url(${this.portrait})`
        } else {
            portrait!.style.background = `url(img/portraits/defaultNPC.png)`
        }

        player.data.canMove = false

        if (this.quest?.items && this.hasGivenPresent) {
            let hasAllItems = true
            this.quest.items.forEach(item => {
                let amount = 0
                for (let y = 0; y < player.data.inventory.length; y++) {
                    for (let x = 0; x < player.data.inventory[y].length; x++) {
                        if (player.data.inventory[y][x] === item.item) amount++
                    }
                }
                if (amount < item.amount) hasAllItems = false
            })
            if (hasAllItems) {
                currentEvents.push({ event: 'give', entity: this, extra: this.quest.items })
            }

            activeQuests.forEach(quest => {
                quest.update()
            })
        }

        currentEvents.push({ event: 'talk', entity: this })
        isQuestUIupdated = false
        advanceConversation(this)
    }

    interact(): void {
        if (!this.isSpeaking) {
            this.speak()
            this.isSpeaking = true
        }
    }
    get center() {
        return {
            x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width / 2,
            y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height / 2
        }
    }
    async update(): Promise<void> {
        if (this.data.isDead) return
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            effect.duration--

            if (effect.duration <= 0) {
                if (effect.effect.end) {
                    effect.effect.end(this)
                }
                this.removeEffect(effect.index)
            }
            if (this.effectData.effectTicks % effect.effect.ticks === 0) {
                if (effect.effect.onTick) {
                    effect.effect.onTick(this)
                }
            }

            if (document.querySelector(`#${effect.effect.name} `)) {
                const div = document.querySelector(`#${effect.effect.name} `);
                if (div!.querySelector('#duration')) {
                    div!.querySelector('#duration')!.innerHTML = `${effect.duration} `
                }
            }

        })

        if (this.sprite.currentState !== 'attack') this.data.isAttacking = false

        if (this.type.interactable) {
            if (checkCollision({ hitbox: player.hitbox, pos: player.pos }, { hitbox: this.sprite.hitbox, pos: this.pos }) && !player.data.onCooldown && player.data.onGround) {
                if (!this.data.showedText && menu.checkSetting('labels')) {
                    displayInfo('Press "R" to interact')
                    this.data.showedText = true
                }
                player.data.interactionFocus = this
                /*                 player.data.interactionFocus = null
                                player.data.interactionFocusGrab = null */
            } else {
                if (player.data.interactionFocus === this) {
                    player.data.interactionFocus = null
                }
                this.data.showedText = false
                if (this.sprite.currentState !== 'idle') this.changeState('idle')
            }
        }

        this.sprite.frames++
        if (this.sprite.frames >= staggerFrames) {
            this.sprite.frames = 0
            this.sprite.frameLoc++
            const frameAmount = this.sprite.spriteAnimations[this.sprite.currentState].loc.length

            if (this.sprite.frameLoc >= frameAmount) {
                this.sprite.frameLoc = 0
                this.endOfAnimation(frameAmount)
            }
        }

        if (this.data.health <= 0 && this.sprite.currentState !== 'death') {
            if (player.data.inventory[3][player.data.selectedSlot - 1] === null) {
                grantAchievement('beast')
            }

            if (player.data.health / player.data.maxHealth <= 0.05) {
                grantAchievement('close_call')
            }

            stats.entities.kills.value++
            if (this.data.name === 'goblin') {
                grantAchievement('goblin_kill')

                const globalStats = await window.api.fetchGlobalStats()
                if (globalStats.entities.killed_goblin.value >= 75) {
                    grantAchievement('goblin_demolisher')
                }
            }
            if (this.data.name === 'goblin') {
                stats.entities.killed_goblin.value++
            } else if (this.data.name === 'skeleton') {
                stats.entities.killed_skeleton.value++
            }
            this.data.drops.forEach(drop => {
                if (Math.floor(Math.random() * 100) <= drop.chance) {
                    droppedItems.push(new droppedItem({ x: this.pos.x + this.sprite.hitbox.offsetX + Math.round(Math.random() * 80) - 40, y: this.pos.y + this.sprite.hitbox.offsetY }, drop.drop, currentWorld))
                }
            })
            this.changeState('death')
            this.data.onCooldown = true
            currentEvents.push({ event: 'kill', entity: this })
            isQuestUIupdated = false
            if (menu.checkSetting('Master Sound')) playSound('death.mp3', menu.values.effects / 100)
        }

        if (this.data.health <= 0) return

        if (!menu.checkSetting('No Aggro')) {
            const playerPosX = player.pos.x
            const distanceXToPlayer = Math.abs((playerPosX + (player.sprite.spriteWidth / 2) * player.sprite.scale) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale))
            const playerDirec = this.pos.x - player.pos.x
            const playerHiddenFromGoblins = player.data.armor[0] === 'goblin_mask' && this.data.name === 'goblin'

            if (distanceXToPlayer <= this.data.attackRange && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy') {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player
                    this.attack()
                }
            } else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy') {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player
                    this.attack()
                }
            } else if (distanceXToPlayer <= this.data.seeRange && !this.data.onCooldown && this.type.allignment === 'enemy') {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player
                    if (this.sprite.currentState !== 'run') this.changeState('run')
                    if (playerPosX > this.pos.x) {
                        this.pos.x += 4
                    } else {
                        this.pos.x -= 4
                    }
                    if (this.checkEffect('poison').wasFound) {
                        this.data.health -= .1
                    }
                } else {
                    if (this.sprite.currentState === 'run') { this.changeState('idle') }
                }
            } else {
                if (this.sprite.currentState === 'run') { this.changeState('idle') }

                this.data.attackFocus = null
            }

            this.effectData.effectTicks++
        }
    }

    draw() {
        if (menu.checkSetting('Hitboxes')) {
            ctx!.save()
            ctx!.strokeStyle = this.type.allignment === 'enemy' ? 'red' : (this.type.allignment === 'passive' ? 'yellow' : 'green')
            ctx!.lineWidth = 2
            ctx!.strokeRect(
                this.pos.x + this.sprite.hitbox.offsetX,
                this.pos.y + this.sprite.hitbox.offsetY,
                this.sprite.hitbox.width,
                this.sprite.hitbox.height
            )
            ctx!.strokeStyle = "black"
            ctx!.strokeRect(this.pos.x + this.sprite.hitbox.offsetX, this.pos.y + this.sprite.hitbox.offsetY, 5, 5)
            ctx!.restore()
        }

        let frameX = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].x // get current locations of the animation
        let frameY = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].y

        let orientation = (player.pos.x + player.sprite.spriteWidth / 2) - (this.pos.x + this.sprite.spriteWidth / 2)

        if (this.data.name === 'elder' || this.sprite.invertOrientation) {
            orientation = -orientation
        }

        const image = getImage(this.sprite.img)
        if (orientation <= 0 && !this.type.isNotTurning) {
            this.data.Xdirec = 2
            ctx!.save() // save current state of the canvas
            const drawX = -(this.pos.x + 400 * this.sprite.scale)
            ctx!.scale(-1, 1) // invert orientatian of the entity
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX + shakeX, this.pos.y + shakeY, 400 * this.sprite.scale, 400 * this.sprite.scale)
            ctx!.restore()
        } else {
            this.data.Xdirec = 1
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x + shakeX, this.pos.y + shakeY, 400 * this.sprite.scale, 400 * this.sprite.scale)
        }

    }

    takeHit(damage: number): void {
        if (this.data.health <= 0) return;
        if (Math.random() * 100 < 80)
            this.setCooldown(1000)
        this.changeState('take_hit')
        this.data.health -= damage
        this.showHealthbar()
    }

    endOfAnimation(frameAmount: number): void {
        if (this.sprite.currentState === 'death') {
            let deadParticles: number[] = []
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i)
                }
            })
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle, 1)
            })

            if (this.data.isDead) return;
            this.data.isDead = true
            this.sprite.frameLoc = frameAmount - 1
            deadObjects.push(this)
            return
        } else {
            if (this.sprite.currentState === 'take_hit') {
                this.changeState('idle')
            } else if (this.sprite.currentState === 'attack') {
                if (this.type.attackType?.type === 'rangedCombat') {
                    particles.push(new projectile(this, this.type.attackType.projectile.spriteWidth, this.type.attackType.projectile.spriteHeight, this.type.attackType.projectile.scale, this.type.attackType.projectile.pathToImage, this.type.attackType.projectile.animationStates, this.type.attackType.projectile.range, this.type.attackType.projectile.speed, this.type.attackType.projectile.damage, this.type.attackType.projectile.hitbox, 'arrow'))
                }
                this.changeState('idle')
                this.data.isAttacking = false
            }
        }
        if (this.type.name === 'trader' && this.sprite.currentState === 'open') {
            this.changeState('dialogue')
        }

        
    }

    attack(): void {
        if (!this.data.isAttacking && !this.data.onCooldown) {
            this.changeState('attack')
            this.data.isAttacking = true
            setTimeout(() => {
                if (this.data.isDead) return
                if (this.data.onCooldown) return
                if (this.type.attackType?.type !== 'rangedCombat') {
                    const playerPosX = player.pos.x
                    const playerDirec = this.pos.x - player.pos.x
                    const distanceXToPlayer = Math.abs((playerPosX + (player.sprite.spriteWidth / 2) * player.sprite.scale) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale))
                    if (playerDirec <= 0 && distanceXToPlayer <= this.data.attackRange && player.pos.y + this.data.attackRange >= this.pos.y) {
                        player.takeHit(this.data.attackDamage)
                    } else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && player.pos.y + this.data.attackRange >= this.pos.y) {
                        player.takeHit(this.data.attackDamage)
                    }
                }
            }, 550)
        }
    }
}
//
function removeWorldElements(properties: any[], elementValue: string[], dim: worldName): boolean {
    let removeList: number[] = [];
    (worlds as any)[dim].elements.forEach((element: string, i: number) => {
        properties.forEach(property => {
            let elementProperty = elementValue.length === 1 ? (element as any)[elementValue[0]] : (element as any)[elementValue[0]][elementValue[1]]
            if (property === elementProperty) {
                removeList.push(i)
            }
        })
    });

    removeList.forEach(i => {
        if (!((worlds as any)[dim].elements[i].sprite.pathToImage === "img/blocks/house_5.png")) {
            (worlds as any)[dim].elements.splice(i, 1)
        }
    })

    return removeList.length > 0
}

function spawnElements(elements: blocks[] | entity[] | container[], dim: worldName) {
    elements.forEach(elem => {
        worlds[dim].elements.push(elem)
    })
}

function checkCollision(element1: { hitbox: { offsetX: number, offsetY: number, width: number, height: number }, pos: { x: number, y: number } }, element2: { hitbox: { offsetX: number, offsetY: number, width: number, height: number }, pos: { x: number, y: number } }): boolean {
    if (!element1.hitbox || !element2.hitbox) return false;

    const aLeft = element1.pos.x + element1.hitbox.offsetX
    const aRight = aLeft + element1.hitbox.width
    const aTop = element1.pos.y + element1.hitbox.offsetY
    const aBottom = aTop + element1.hitbox.height

    const bLeft = element2.pos.x + element2.hitbox.offsetX
    const bRight = bLeft + element2.hitbox.width
    const bTop = element2.pos.y + element2.hitbox.offsetY
    const bBottom = bTop + element2.hitbox.height

    return (
        aLeft < bRight &&
        aRight > bLeft &&
        aTop < bBottom &&
        aBottom > bTop
    )
}

function teleport(distance: number) {
    worlds[currentWorld].elements.forEach(el => {
        el.pos.x -= distance
    })

    droppedItems.forEach(item => {
        item.pos.x -= distance
    })
    player.worldPosX[currentWorld] += distance
}



function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function displayInfo(text: string) {
    const field = document.querySelector<HTMLElement>('#info')
    if (player.data.showingText) return;
    field!.innerHTML = text
    let opacity = 1
    let posX = 500
    player.data.showingText = true

    let interval = setInterval(() => {
        field!.style.opacity = `${opacity}`
        field!.parentElement!.style.top = `${posX}px`
        opacity -= 0.02
        posX -= 10

        if (opacity <= 0.25) {
            opacity = 0
            clearInterval(interval)
            player.data.showingText = false
            field!.innerHTML = ''
        }
    }, 50)
}

function checkForRecipes(): { output: item | null; isValid: boolean } {
    loop:
    for (const r of recipes) {
        for (let y = 0; y < 3; y++) {
            const invLine = player.data.craftingInventory[y]
            const recLine = r.recipe[y].split('')

            for (let x = 0; x < 3; x++) {
                let inv = invLine[x] ?? ' '
                let rec = recLine[x]

                if (inv === 'null') inv = ' '
                if (rec !== ' ') rec = r[rec as keyof recipe] as string
                if (inv !== rec) continue loop
            }
        }
        return { output: r.output, isValid: true }
    }

    return { output: null, isValid: false }
}
type AchievementKey = keyof typeof achievements;
async function grantAchievement(achievement: AchievementKey) {
    const achievementData = await window.api.fetchAchievements()
    if (achievementData[achievement].granted) return;
    if (cheats && achievement !== 'cheater') { return }

    const AchievementsWrapper = document.querySelector('.AchievementsWrapper') as HTMLElement;
    const data = achievements[achievement];
    (document.querySelector('.achievementIcon') as HTMLElement).style.backgroundImage = `url(${data.icon})`
    document.querySelector('#achievementName')!.innerHTML = data.name
    document.querySelector('#achievementDesc')!.innerHTML = data.desc

    AchievementsWrapper?.classList.remove('display-none')
    playSound('completeAchievement', menu.values.effects / 100, true)
    let counter = -400
    const interval = setInterval(() => {
        counter++
        AchievementsWrapper.style.right = `${counter}px`
        if (counter === 100) {
            clearInterval(interval)
            setTimeout(() => {
                const innerInterval = setInterval(() => {
                    counter--
                    AchievementsWrapper.style.right = `${counter}px`
                    if (counter < -400) {
                        clearInterval(innerInterval)
                        AchievementsWrapper.classList.add('display-none')
                    }
                }, 2.5)
            }, 3000)
        }
    }, 5)


    window.api.grantAchievement(achievement)
}

const elemRegistry: Record<string, new (...args: any[]) => any> = {
    block: block,
    NPC: NPC,
    goblin: goblin,
    skeleton: skeleton,
    nightBorn: nightBorn,
    chest: chest,
    trader: trader,
    teleporter: teleporter,
    enemyArcher: enemyArcher,
    ogre: ogre,
    passiveEntity: passiveEntity,
    storyStarter: storyStarter,
    goblinKing: goblinKing,
    stoneGolem: stoneGolem
};

const companionRegistry: Record<string, new (...args: any[]) => any> = {
    catCompanion: catCompanion
}

function deleteElement(id: number, elemClass: keyof typeof elemRegistry, dim: string): void {
    const world = worlds[dim]


    const index = world.elements.findIndex(el => {
        return el instanceof elemRegistry[elemClass] &&  el.id === id
    })

    const elem = world.elements[index]

    const healthbarIndex = nonWorldElems.findIndex(
        nwe => nwe.type.name === 'healthbar' && (nwe as healthbar).entity === elem
    )
    if (healthbarIndex !== -1) nonWorldElems.splice(healthbarIndex, 1)

    particles = particles.filter(p => p.entity !== elem)

    world.elements.splice(index, 1)
}

async function initialise() {
    // import data
    const loadingInfo = document.querySelector('#loadingInfo');
    const loadingBar = document.querySelector('#loadingBar') as HTMLProgressElement

    console.info('Fetching recipes...');
    loadingInfo!.innerHTML = 'Fetching recipes...'
    await fetch('./data/recipes.json')
        .then(res => res.json())
        .then(data => {
            recipes = data
        });
    loadingBar!.value += 10

    console.info('Fetching effects...');
    loadingInfo!.innerHTML = 'Fetching effects...'
    await fetch('./data/effects.json')
        .then(res => res.json())
        .then(data => {
            effects = data
        });
    loadingBar!.value += 10

    console.info('Fetching items...');
    loadingInfo!.innerHTML = 'Fetching items...'
    await fetch('./data/items.json')
        .then(res => res.json())
        .then(data => {
            items = data
        });
    loadingBar!.value += 5
    console.info('Fetching configs...');
    loadingInfo!.innerHTML = 'Fetching configs...'
    const configsRes = await window.api.getConfigs()
    configs = configsRes.data

    loadingBar!.value += 5
    
    const configsData = await window.api.fetchSettings()
    const settings = configsData.settings
    const values = configsData.values

    if (settings)
        menu.settings = settings
    
    if(values)
        menu.values = values

    const save = sessionStorage.getItem("save")
    let isOldSave
    if (save) {
        const temp = await window.api.checkForSaves(save)
        isOldSave = temp.exists
    } else {
        menu.quit()
        return
    }

    if (!isOldSave) {
        interface WorldData {
            name: string
            mobCap: number
            music?: string
            background: { imgs: string[], spriteWidth: number, spriteHeight: number, ground: string }
            elements: WorldElement[];
        }

        interface WorldElement {
            class: string;
            args: any[];
        }
        console.info('Fetching worlds...');
        loadingInfo!.innerHTML = 'Fetching worlds...'
        const intermediatWorld: Record<string, WorldData> = await fetch('./data/worlds.json')
            .then(r => r.json());

        console.info('Formatting worlds...');
        loadingInfo!.innerHTML = 'Formatting worlds...'
        Object.values(intermediatWorld).forEach((world: WorldData) => {
            if (!worlds[world.name]) {
                worlds[world.name] = { background: { imgs: [], spriteWidth: 0, spriteHeight: 0, ground: "" }, elements: [], mobCap: 0 };
            }
            worlds[world.name as any].background = {
                imgs: world.background.imgs,
                spriteWidth: world.background.spriteWidth,
                spriteHeight: world.background.spriteHeight,
                ground: world.background.ground
            }
            worlds[world.name as any].music = world.music
            worlds[world.name as any].mobCap = world.mobCap
            world.elements.forEach((element: WorldElement) => {
                const ElemClass = elemRegistry[element.class];

                if (!ElemClass) {
                    alert(`World loading error!`)
                    throw new Error(`World loading error!`);
                }

                if (ElemClass === NPC && element.args[7] !== null) {
                    const instance = new ElemClass(element.args[0], element.args[1], element.args[2], element.args[3], element.args[4], element.args[5], element.args[6], new quest(element.args[7][0], element.args[7][1], element.args[7][2], element.args[7][3], element.args[7][4]), element.args[8]);
                    worlds[world.name as any].elements.push(instance);
                } else {
                    const instance = new ElemClass(...element.args);
                    worlds[world.name as any].elements.push(instance);
                }

            });
        })

        player = new Player(CANVAS_WIDTH * 0.4, 420)
        loadingBar!.value += 40
        cheats = JSON.parse(sessionStorage.getItem('cheats') ?? 'false')
        await changeWorld('jungle', true)
        loadingBar!.value += 10
    } else {
        const { intermediatWorld, playerData, metaData, droppedItemsData } = await window.api.getWorldData(save)

        Object.entries(intermediatWorld).forEach(([worldName, world]: [string, any]) => {
            if (!worlds[worldName]) {
                worlds[worldName] = { background: { imgs: [], spriteWidth: 0, spriteHeight: 0, ground: "" }, elements: [], mobCap: 0 }
            }

            worlds[worldName].background = world.background
            worlds[worldName].mobCap = world.mobCap
            world.elements.forEach((elem: any) => {
                const ElemClass = elemRegistry[elem.data.class]

                if (!ElemClass) {
                    console.warn(`Unknown class: ${elem.data.class}`)
                    return
                }

                Object.setPrototypeOf(elem, ElemClass.prototype)

                if (elem.quest) {
                    let interquest = elem.quest
                    Object.setPrototypeOf(interquest, quest.prototype)
                    elem.quest = interquest
                }
                if (elem.data) {
                    elem.data.onCooldown = false
                    elem.data.isDead = false
                    elem.data.showedText = false
                    elem.data.attackFocus = null
                    elem.data.interactionFocus = null
                }

                elem.init()



                if ('onCooldown' in elem) {
                    elem.onCooldown = false
                }
                if(elem.data.class === 'goblinKing') {
                    const king = new goblinKing(elem.pos.x, elem.pos.y, elem.worldElem, elem.id)
                    king.data.health = elem.data.health
                    king.data.maxHealth = elem.data.maxHealth
                    king.hasGivenPresent = elem.hasGivenPresent
                    worlds[worldName].elements.push(king)
                } else {
                    const ElemClass = elemRegistry[elem.data?.class]
                    if (!ElemClass) {
                        console.warn(`Unknown class: ${elem.data?.class}, skipping`)
                        return
                    }
                    worlds[worldName].elements.push(elem)
                }

                
            })
        })

        player = new Player(CANVAS_WIDTH * 0.4, 420)

        loadingBar!.value += 20
        player.data = playerData.data
        player.story = playerData.story

        playerData.companions.forEach((comp: any) => {
            const RegistryClass = companionRegistry[comp.portrait?.includes('cat') ? 'catCompanion' : comp.constructor?.name]
            if (RegistryClass) {
                Object.setPrototypeOf(comp, RegistryClass.prototype)
            }
        })

        player.companions = playerData.companions

        player.data.spells.forEach(spell => {
            if (spell) {
                Object.setPrototypeOf(spell, spellRegistry[spell!.class].prototype)
            }
        })
        player.sprite = playerData.sprite
        player.sprite.img = sessionStorage.getItem('skinPath') as string
        player.pos = playerData.pos

        player.data.onCooldown = false
        player.data.isAttacking = false
        player.data.canMove = true

        cheats = metaData.cheats

        let intermediatQuests = metaData.quest
        intermediatQuests.forEach((interquest: quest) => {
            Object.setPrototypeOf(interquest, quest.prototype)
        })
        activeQuests = intermediatQuests
        changeWorld(metaData.world, true)

        const savedAchievements = await window.api.fetchAchievements();
        achievements = savedAchievements;

        (droppedItemsData as any).forEach((item: any) => {
            item.spawnFrame = 0
            Object.setPrototypeOf(item, droppedItem.prototype)
        });

        droppedItems = droppedItemsData

        loadingBar!.value += 20
    }

    if (configsRes.isAltered) {
        cheats = true
    }


    console.info('Finished initialisation');
    loadingInfo!.innerHTML = 'Finished initialisation'
}

function handleMovement(): boolean {
    let isBlocked = false;
    // check for keydown/up inputs
    if ((keys['KeyD'] || keys['KeyW']) && !player.data.onInventory && !player.data.onTradingMenu && !player.data.onSecondaryInventory && !player.data.isAttacking && player.data.canMove && !player.data.onCooldown && !player.data.castingSpell) {
        
        AFKCounter = 0
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
                        if (player.sprite.currentState !== 'idle' && player.sprite.currentState !== 'jump' && player.sprite.currentState !== 'fall' && !player.data.isAttacking) player.changeState('idle');
                    }
                }
            });
        }
        if (!isBlocked) {
            if (player.sprite.currentState !== 'run' && player.data.onGround && !player.data.onCooldown && !player.data.isAttacking) {
                player.changeState('run');
            }
            if (menu.checkSetting('Speed')) {
                gameSpeed = 100
                levelPos += 100;
                bgPosition -= 100
                if (!player.worldPosX[currentWorld]) {
                    player.worldPosX[currentWorld] = 100
                } else {
                    player.worldPosX[currentWorld] += 100
                }
            } else {
                gameSpeed = player.data.speed
                levelPos += player.data.speed;
                bgPosition -= player.data.speed
                stats.general.distance.value += player.data.speed
                if (!player.worldPosX[currentWorld]) {
                    player.worldPosX[currentWorld] = player.data.speed
                } else {
                    player.worldPosX[currentWorld] += player.data.speed
                }
            };
            (document.querySelector('.bar')! as HTMLElement).style.backgroundPosition = `${bgPosition}px 0`
            player.data.Xdirec = 1;
            player.data.isMoving = true;
        }
    } else if ((keys['KeyA'] || keys['KeyS']) && !player.data.onInventory && !player.data.onTradingMenu && !player.data.onSecondaryInventory && !player.data.isAttacking && player.data.canMove && !player.data.onCooldown && !player.data.castingSpell) {
        AFKCounter = 0

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
                        if (player.sprite.currentState !== 'idle' && player.sprite.currentState !== 'jump' && player.sprite.currentState !== 'fall') player.changeState('idle');
                    }
                }
            });
        }
        if (!player.data.onCooldown && !isBlocked) {
            if (player.sprite.currentState !== 'run' && player.data.onGround && !player.data.onCooldown && !player.data.isAttacking) {
                player.changeState('run');
            }

            if (menu.checkSetting('Speed')) {
                gameSpeed = -100
                levelPos -= 100;
                bgPosition += 100
                if (!player.worldPosX[currentWorld]) {
                    player.worldPosX[currentWorld] = -100
                } else {
                    player.worldPosX[currentWorld] -= 100
                }
            } else {
                gameSpeed = -player.data.speed
                levelPos -= player.data.speed;
                bgPosition += player.data.speed
                if (!player.worldPosX[currentWorld]) {
                    player.worldPosX[currentWorld] = -player.data.speed
                } else {
                    player.worldPosX[currentWorld] -= player.data.speed
                }

                stats.general.distance.value += player.data.speed
            }
            player.data.Xdirec = 2;
            player.data.isMoving = true;
        }
        (document.querySelector('.bar')! as HTMLElement).style.backgroundPosition = `${bgPosition}px 0`
    } else {
        AFKCounter++
        document.querySelector('.bar')?.classList.remove('scrollRight')
        document.querySelector('.bar')?.classList.remove('scrollLeft')

        if (AFKCounter > 18000) {
            grantAchievement('afk')
        }
    }
    if (isBlocked) gameSpeed = 0;

    return isBlocked
}

function mobSpawning() {
    if (!(configs!.worlds[currentWorld])) return;
    if (!(configs!.worlds[currentWorld].canSpawn)) return;
    const spawnRate = configs!.mobSpawning!.mobSpawningRateDefault
    if (gameFrame + 1 % spawnRate === 0) {
        let tally = 0
        worlds[currentWorld].elements.forEach(el => {
            if (el instanceof passiveEntity) tally++
        })
        if (tally > worlds[currentWorld].mobCap) {
            return
        };
        const ranMob = configs!.worlds[currentWorld].mobSpawns[Math.floor(Math.random() * configs!.worlds[currentWorld].mobSpawns.length)]
        let x;
        if (Math.random() > 0.5) {
            x = -((Math.round(Math.random() * configs!.worlds[currentWorld].worldSize.left) - player.worldPosX))
        } else {
            x = Math.round(Math.random() * configs!.worlds[currentWorld].worldSize.right) - player.worldPosX
        }
        if (ranMob === 'chicken') {
            const positions = { x: x, y: 645 }
            worlds[currentWorld].elements.push(new passiveEntity(positions, { pathToImage: 'img/passiveEntities/chicken.png', animationStates: [{ frames: 4, name: 'run' }, { frames: 4, name: 'idle' }, { frames: 4, name: 'take_hit' }, { frames: 4, name: 'death' }], hitbox: { offsetX: 0, offsetY: 0, height: 35, width: 35 }, scale: 0.15, spriteHeight: 32, spriteWidth: 32, invertOrientation: false }, { health: 13 }, [{ drop: 'chicken_flesh', amount: 1, chance: 75 }], "NPC", -1, currentWorld))
        } else if (ranMob === 'cow') {
            const positions = { x: x, y: 575 }
            worlds[currentWorld].elements.push(new passiveEntity(positions, { pathToImage: 'img/passiveEntities/cow.png', animationStates: [{ frames: 1, name: 'take_hit' }, { frames: 4, name: 's' }, { frames: 6, name: 'run' }, { frames: 9, name: 'idle' }, { frames: 5, name: 'death' }], hitbox: { offsetX: 10, offsetY: 20, height: 95, width: 115 }, scale: 0.35, spriteHeight: 32, spriteWidth: 48, invertOrientation: true }, { health: 25 }, [{ drop: 'cow_flesh', amount: 1, chance: 50 }, { drop: 'leather', amount: 1, chance: 50 }, { drop: 'horn', amount: 1, chance: 10 }], "NPC", -1, currentWorld))
        } else if (ranMob === 'goblin') {
            worlds[currentWorld].elements.push(new goblin(x, StaticPositions.OnGround, 'goblin', -1))
        }
    }
}

function checkMusic() {
    if (!menu.checkSetting('Master Sound')) {
        music.pause()
    } else if (music.paused) {
        music.play()
    }
}

function checkDisplayFPS(timestamp: number) {
    const now = performance.now();
    // display fps
    const fpsDiv = document.querySelector('.fps-div');
    frameCount++;
    if (now - lastTime >= 1000) {
        fps = frameCount;
        lastTime = now;
        frameCount = 0;
        if (menu.checkSetting('FPS')) {
            fpsDiv!.classList.remove('display-none')
            fpsDiv!.innerHTML = `<h1>${fps} FPS</h1>`;
        } else {
            fpsDiv!.classList.add('display-none')
        }
    }
    const elapsed = timestamp - lastFrameTime;
    if (elapsed < FRAME_TIME) {
        return true;
    }
    lastFrameTime = timestamp - (elapsed % FRAME_TIME);
    return false
}

function handleWorldElements(isBlocked: boolean) {
    // delete all objects that have been marked as dead
    deadObjects.forEach(obj => {
        let indexHealthbar = -1;
        for (let i = 0; i < nonWorldElems.length; i++) {
            if (nonWorldElems[i].type.name === 'healthbar' && (nonWorldElems[i] as healthbar).entity === obj) {
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

        if ((keys['KeyD'] || keys['KeyW']) && element.type.moving === true && !isBlocked && !player.data.isDead) {
            if(!(element as any).x) {
                element.pos.x -= gameSpeed;
            }else {
                (element as any).x -= gameSpeed;
            }
            
        } else if ((keys['KeyA'] || keys['KeyS']) && element.type.moving === true && !isBlocked && !player.data.isDead) {
            if(!(element as any).x) {
                element.pos.x -= gameSpeed;
            }else {
                (element as any).x -= gameSpeed;
            }
        }

        element.update();

        if(!(element as any).x) {
            if (element.pos.x >= VIEW_LEFT && element.pos.x <= VIEW_RIGHT) {
                element.draw();
            }
        }else {
            if ((element as any).x >= VIEW_LEFT && (element as any).x <= VIEW_RIGHT) {
                element.draw();
            }
        }

    });

    nonWorldElems.forEach(elem => {
        elem.update();
        elem.draw();
    });

    let removerArr: number[] = []
    droppedItems.forEach((item, i) => {
        if (item.wasPickedUp) {
            removerArr.push(i)
        }


        if ((keys['KeyD'] || keys['KeyW']) && !isBlocked && !player.data.isDead) {
            item.pos.x -= gameSpeed;
        } else if ((keys['KeyA'] || keys['KeyS']) && !isBlocked && !player.data.isDead) {
            item.pos.x -= gameSpeed;
        }
        item.update()
        item.draw()
    })

    removerArr.forEach(i => {
        droppedItems.splice(i, 1)
        return
    })

    player.draw();

    particles.forEach(particle => {
        if ((keys['KeyD'] || keys['KeyW']) && !isBlocked && !player.data.isDead) {
            particle.pos.x -= gameSpeed;
        } else if ((keys['KeyA'] || keys['KeyS']) && !isBlocked && !player.data.isDead) {
            particle.pos.x -= gameSpeed;
        }   
        particle.update();
        particle.draw();
    });
}

function handleQuests() {
    const questDiv = document.querySelector('#questDiv');
    if (activeQuests.length > 0) {
        questDiv?.classList.remove('display-none');
    } else {
        questDiv?.classList.add('display-none');
    }
    // check if any new events occured
    if (!isQuestUIupdated) {
        questDiv!.innerHTML = '';

        activeQuests.forEach(quest => {
            const questCompleted = quest.update();

            questDiv!.appendChild(document.createElement('hr')).classList.add('background-color-black');

            const titleDiv = document.createElement('div');
            const h2 = document.createElement('h2');
            h2.textContent = quest.text;
            titleDiv.appendChild(h2);
            questDiv!.appendChild(titleDiv);

            let amountOfCompleted = quest.entities.filter(e => e.completed).length;
            const h1 = document.createElement('h1');
            h1.textContent = `${amountOfCompleted}/${quest.entities.length}`;
            questDiv!.appendChild(h1);

            if (questCompleted) {
                const btn = document.createElement('button');
                btn.classList.add('confirm-btn');
                btn.id = 'questBtn';
                btn.addEventListener('click', () => {
                    quest.finish();
                });
                questDiv!.appendChild(btn);
            }
        });

        isQuestUIupdated = true;
    }
}

function update(timestamp: number = 0) {
    const frameNotReady = checkDisplayFPS(timestamp)
    if (frameNotReady) {
        requestAnimationFrame(update)
        return
    }
    // clear the canvas
    ctx!.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // check if world was loaded
    if (!currentWorld || !worlds[currentWorld]) {
        requestAnimationFrame(update)
        return
    }

    // checks for the music being paused/played
    checkMusic()

    // spawn logic
    mobSpawning()
    // check for screenshake
    updateShake()
    // player logic
    player.data.isMoving = false;

    document.body.style.filter = `brightness(${menu.values.brightness}%)`


    const isBlocked = handleMovement()
    player.update();

    handleWorldElements(isBlocked)

    handleQuests()

    currentEvents = [];
    gameFrame++;
    requestAnimationFrame(update);
}
// world logic
type worldElementNames = 'enemy' | 'invisWall' | 'barrel' | 'crate' | 'player' | 'house_1' | 'house' | 'door_1' | 'teleporter' | 'trader' | 'wall_2' | 'wall_1' | 'goblin' | 'nightBorn' | 'skeleton' | 'tree_1' | 'tree_2' | 'rocks_1' | 'bush_1' | 'bush_2' | 'bush_3' | 'plant_1' | 'statue_1' | 'chest' | 'NPC'

type worldName = keyof typeof worlds
let currentWorld: worldName;
type WorldElement = entity | blocks | container

async function changeWorld(world: worldName, fromInit?: boolean) {
    if (world.startsWith("house")) {
        grantAchievement('knock_knock')
    }

    if (world === 'goblin_kingdom') {
        grantAchievement('goblin_kingdom')
    }
    if(worlds[world].music) {
        music.src = worlds[world].music
    }else {
        music.src = 'sound/music.ogg'
    }

    if (!fromInit) {
        const loadingInfo = document.querySelector('#loadingInfo');
        const loadingScreen = document.querySelector('#loadingScreen');
        loadingScreen?.classList.remove('display-none')
        const loadingBar = document.querySelector('#loadingBar') as HTMLProgressElement
        canvas?.classList.add('display-none')
        document.querySelector('.bar')?.classList.add('display-none')

        backgroundLayers = []

        loadingInfo!.innerHTML = `Loading ${world}...`
        loadingBar.value += 20

        if (!worlds[world]) {
            console.error(`World does not exist: ${world}`)
            alert(`World error!`)
            menu.save()
            /* menu.quit() */
            return
        };

        (document.querySelector('.bar') as HTMLElement).style.backgroundImage = `url(img/background/${worlds[world].background.ground})`

        loadingInfo!.innerHTML = `Generating paralax layers...`
        loadingBar.value += 50
        const spriteWidth = worlds[world].background.spriteWidth
        const spriteHeight = worlds[world].background.spriteHeight
        const base_path = 'img/background/'
        let speedModifier = 0.2
        for (let i = 0; i < worlds[world].background.imgs.length; i++) {
            let currentLayer = new Image()
            currentLayer.src = `${base_path}${worlds[world].background.imgs[i]}`

            backgroundLayers.push(new Layer(currentLayer, speedModifier, spriteWidth, spriteHeight))
            speedModifier += 0.2
        }
        loadingInfo!.innerHTML = `Finishing...`
        await sleep(300)
        loadingBar.value += 30
        loadingInfo!.innerHTML = `Completed!`
        loadingBar.value += 30

        nonWorldElems = []
        currentWorld = world
        window.api.changeDCState('playing', currentWorld)

        loadingScreen?.classList.add('display-none')
        canvas?.classList.remove('display-none')
        document.querySelector('.bar')?.classList.remove('display-none')


    } else {
        backgroundLayers = []


        if (!worlds[world]) {
            console.error(`World does not exist: ${world}`)
            alert(`World error!`)
            menu.save()
            menu.quit()
            return
        }

        const spriteWidth = worlds[world].background.spriteWidth
        const spriteHeight = worlds[world].background.spriteHeight
        const base_path = 'img/background/'
        let speedModifier = 0.2;
        let lastImg = "rgb(89, 101, 25)";
        (document.querySelector('.bar') as HTMLElement).style.backgroundImage = `url(img/background/${worlds[world].background.ground})`
        for (let i = 0; i < worlds[world].background.imgs.length; i++) {
            let currentLayer = new Image()
            currentLayer.src = `${base_path}${worlds[world].background.imgs[i]}`

            lastImg = `${base_path}${worlds[world].background.imgs[i]}`

            backgroundLayers.push(new Layer(currentLayer, speedModifier, spriteWidth, spriteHeight))
            speedModifier += 0.2
        }

        await sleep(300)


        nonWorldElems = []
        currentWorld = world
        window.api.changeDCState('playing', currentWorld)
    }

}
function updateShake() {
    if (shakeIntensity > 0) {
        shakeX = (Math.random() - 0.5) * shakeIntensity
        shakeY = (Math.random() - 0.5) * shakeIntensity
        shakeIntensity *= 0.9
        if (shakeIntensity < 0.5) {
            shakeIntensity = 0
            shakeX = 0
            shakeY = 0
        }

        const bar = document.querySelector('.bar') as HTMLElement
        if (bar) {
            bar.style.transform = `translate(${shakeX}px, ${shakeY}px)`
        }
    }
}
function screenShake(intensity: number) {
    shakeIntensity = intensity
}

// declare player
let player: Player;
const menu = new menuClass()

let music = new Audio()
music.src = 'sound/music.ogg'
// initialise && push layers
async function start() {
    const loadingInfo = document.querySelector('#loadingInfo');
    const loadingScreen = document.querySelector('#loadingScreen');
    loadingScreen?.classList.remove('display-none')
    const loadingBar = document.querySelector('#loadingBar') as HTMLProgressElement


    window.api.changeDCState('playing', currentWorld)

    console.info('Initialising...');
    await initialise()

    loadingBar!.value += 20



    await updateHotbar()
    loadingInfo!.innerHTML = 'Starting!'
    await sleep(120)
    loadingScreen?.classList.add('display-none')
    isLoading = false

    music.volume = menu.values.music / 100
    music.loop = true

    grantAchievement('oathbound')
    await updateHotbar()
    await update()
}

start()