// initialise canvas
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')
if (!canvas) throw new Error('Canvas element not found')
const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('2D context not supported')
// set dimensions
const CANVAS_WIDTH = canvas.width = 2000
const CANVAS_HEIGHT = canvas.height = 700

// initial values
let gameSpeed = 0 // game speed depending on the players movement
let gameFrame = 0 // counter for the frames
const staggerFrames = 7 // amount of ticks between each frame of animation
const globalGravity = 60 // gravity affecting the player
const groundY = 580 // is the y-coordinate of the ground

let fps = 0 // current fps
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
let backgroundLayers: blocks[] = []
let particles: particles[] = []
let deadObjects: entity[] = []
// level design values
let levelPos = 0
// sound logic
function playSound(sound: string) {
    const audio = new Audio(`sound/${sound}.mp3`)

    audio.play()
}

// interfaces && types
type item = 'key' | 'fruit' | 'horn' | 'cloth' | 'silver_ingot' | 'stone' | 'string' | 'leather' | 'hardened_boots' | 'copper_ingot' | 'gold_ingot' | 'iron_ingot' | 'stick' | 'mushroom' | 'lightning_potion' | 'healthboost_potion' | 'icing_rapier' | 'big_regeneration_potion' | 'regeneration_potion' | 'peasants_robe' | 'steel_robe' | 'null' | 'supernova' | 'poisoned_staff' | 'holy_longsword' | 'flaming_saber' | 'knights_helm' | 'berserker_helmet' | 'leather_boots' | 'leather_hood' | 'gold_crown' | 'iron_boots' | 'iron_chestplate_tier_3' | 'iron_chestplate_tier_2' | 'iron_chestplate_tier_1' | 'iron_helmet' | 'pappbanditem' | 'wood_sword' | 'brocken_sword' | 'stone_sword' | 'beer' | 'coin' | 'iron_sword' | 'gold_sword' | 'copper_sword' | 'heal_potion' | 'big_heal_potion' | 'wood_rapier' | 'stone_rapier' | 'iron_rapier' | 'gold_rapier' | 'copper_rapier' | 'wood_sickle' | 'stone_sickle' | 'iron_sickle' | 'gold_sickle' | 'copper_sickle'
type effect = 'burning' | 'regeneration' | 'ice' | 'strength' | 'electrocute' | 'thunder_shock' | 'healthboost' | 'deaths_curse' | 'poison'

type ItemData = {
    spriteX: number
    spriteY: number
    height: number
    width: number
    scale: number
    attackDamage: number
    src: string
    use: () => void
    attack?: (entity: entity) => void
    onUse: string
    clearsAfterUse: boolean
    attackRange: number
    attackCooldown: number
    description: string
    type: string
    slot?: string
    protection?: number
}

type effectTypeBase = {
    ticks: number
    onTick(entity: entity): void
    particle: string
    spriteWidth: number
    spriteHeight: number
    frameAmount: number
    effected?: boolean
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

const recipes: recipe[] = [
    {
        recipe: [
            ' A ',
            ' AC',
            ' B ',
        ],
        output: "iron_sword",
        A: 'iron_ingot',
        B: 'stick',
        C: 'string'
    },
    {
        recipe: [
            ' A ',
            ' AC',
            ' B ',
        ],
        output: "gold_sword",
        A: 'gold_ingot',
        B: 'stick',
        C: 'string'
    },
    {
        recipe: [
            ' A ',
            ' AC',
            ' B ',
        ],
        output: "copper_sword",
        A: 'copper_ingot',
        B: 'stick',
        C: 'string'
    },
    {
        recipe: [
            'AAA',
            'A A',
            '   ',
        ],
        output: "iron_helmet",
        A: 'iron_ingot',
    },
    {
        recipe: [
            '',
            'A A',
            'A A',
        ],
        output: "iron_boots",
        A: 'iron_ingot',
    },
    {
        recipe: [
            '   ',
            'A A',
            'B B',
        ],
        output: "hardened_boots",
        A: 'iron_ingot',
        B: 'leather'
    },
    {
        recipe: [
            '   ',
            'A A',
            'A A',
        ],
        output: "leather_boots",
        A: 'leather',
    },
    {
        recipe: [
            'A A',
            'BAB',
            'AAA',
        ],
        output: "peasants_robe",
        A: 'leather',
        B: 'string'
    },
    {
        recipe: [
            'A A',
            'BAB',
            'AAA',
        ],
        output: "peasants_robe",
        A: 'leather',
        B: 'string'
    },
    {
        recipe: [
            'BAB',
            'A A',
            '   ',
        ],
        output: "leather_hood",
        A: 'leather',
        B: 'string'
    },
    {
        recipe: [
            'A A',
            'AAA',
            'AAA',
        ],
        output: "iron_chestplate_tier_1",
        A: 'iron_ingot',
    },
    {
        recipe: [
            ' A ',
            ' AC',
            ' B ',
        ],
        output: "stone_sword",
        A: 'stone',
        B: 'stick',
        C: 'string'
    },
    {
        recipe: [
            ' A ',
            ' AB',
            ' A ',
        ],
        output: "wood_sword",
        A: 'stick',
        B: 'string'
    },
    {
        recipe: [
            'A A',
            'BAB',
            'AAA',
        ],
        output: "iron_chestplate_tier_2",
        A: 'iron_ingot',
        B: 'silver_ingot'
    },
    {
        recipe: [
            'A A',
            'BAB',
            'BBB',
        ],
        output: "iron_chestplate_tier_3",
        A: 'iron_ingot',
        B: 'silver_ingot'
    },
    {
        recipe: [
            'A A',
            'BAB',
            'BBB',
        ],
        output: "steel_robe",
        A: 'silver_ingot',
        B: 'cloth'
    },
    {
        recipe: [
            'A A',
            'AAA',
            '   ',
        ],
        output: "gold_crown",
        A: 'gold_ingot',
    },
    {
        recipe: [
            'B B',
            'AAA',
            '   ',
        ],
        output: "berserker_helmet",
        A: 'iron_ingot',
        B: 'horn'
    },
    {
        recipe: [
            'AAA',
            'ABA',
            '   ',
        ],
        output: "knights_helm",
        A: 'silver_ingot',
        B: 'iron_ingot'
    }
]

const effects: Record<effect, effectTypeBase> = {
    burning: {
        ticks: 50,
        onTick: (entity) => {
            entity.takeHit(3)
        },
        particle: 'img/particles/burning.png',
        spriteWidth: 32,
        spriteHeight: 48,
        frameAmount: 8,
        icon: 'img/icons/fire_icon.png',
        name: 'burning'
    },
    regeneration: {
        ticks: 30,
        onTick: (entity) => {
            entity.heal(2)
        },
        particle: 'img/particles/regeneration.png',
        spriteWidth: 64,
        spriteHeight: 64,
        frameAmount: 23,
        icon: 'img/icons/regeneration_icon.png',
        name: 'regeneration'
    },
    ice: {
        ticks: 100,
        onTick: (entity) => {
            entity.takeHit(2)
        },
        particle: 'img/particles/ice.png',
        spriteWidth: 32,
        spriteHeight: 32,
        frameAmount: 8,
        icon: 'img/icons/ice_icon.png',
        name: 'ice'
    },
    strength: {
        ticks: 100,
        onTick: (entity) => {
            return
        },
        particle: 'img/particles/strength.png',
        spriteWidth: 80,
        spriteHeight: 80,
        frameAmount: 4,
        icon: 'img/icons/strength_icon.png',
        name: 'strength'
    },
    electrocute: {
        ticks: 100,
        onTick: (entity) => {
            return
        },
        particle: 'img/particles/electrocute.png',
        spriteWidth: 128,
        spriteHeight: 128,
        frameAmount: 9,
        icon: 'img/icons/electrocute_icon.png',
        name: 'electrocute'
    },
    thunder_shock: {
        ticks: 2,
        onTick: (entity) => {
            entity.takeHit(0.1)
        },
        particle: 'img/particles/thunder_shock.png',
        spriteWidth: 96,
        spriteHeight: 96,
        frameAmount: 7,
        icon: 'img/icons/thunder_shock_icon.png',
        name: 'thunder_shock'
    },
    healthboost: {
        ticks: 100,
        onTick: (entity) => {
            entity.maxHealth = entity.maxHealth * 1.5
            entity.health *= 1.5
        },
        particle: 'img/particles/healthboost.png',
        spriteWidth: 64,
        spriteHeight: 64,
        frameAmount: 17,
        icon: 'img/icons/healthboost_icon.png',
        name: 'healthboost',
        effected: false
    },
    deaths_curse: {
        ticks: 100,
        onTick: (entity) => {
            return
        },
        particle: 'img/particles/deaths_curse.png',
        spriteWidth: 64,
        spriteHeight: 64,
        frameAmount: 48,
        icon: 'img/icons/deaths_curse_icon.png',
        name: 'deaths_curse',
        effected: false
    },
    poison: {
        ticks: 5,
        onTick: (entity) => {
            if (entity.isMoving) {
                entity.takeHit(3)
            }
        },
        particle: 'img/particles/poison.png',
        spriteWidth: 128,
        spriteHeight: 128,
        frameAmount: 17,
        icon: 'img/icons/poison_icon.png',
        name: 'poison'
    }
}

const items: Record<item, ItemData> = {
    wood_sword: {
        spriteX: 0,
        spriteY: 0,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 6,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'A sharpened stick <br>',
        type: 'weapon'
    },
    stone_sword: {
        spriteX: 16,
        spriteY: 0,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 8,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'weapon'
    },
    iron_sword: {
        spriteX: 32,
        spriteY: 0,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 10,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'weapon'
    },
    gold_sword: {
        spriteX: 48,
        spriteY: 0,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 15,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Good looks can\'t win a fight!',
        type: 'weapon'
    },
    copper_sword: {
        spriteX: 64,
        spriteY: 0,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 12,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Spartan Sword',
        type: 'weapon'
    },
    brocken_sword: {
        spriteX: 0,
        spriteY: 256,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 3,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'It has seen better days',
        type: 'weapon'
    },
    wood_rapier: {
        spriteX: 0,
        spriteY: 64,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 3,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 190,
        attackCooldown: 1000,
        description: '- longer range <br> - less attack damage',
        type: 'weapon'
    },
    stone_rapier: {
        spriteX: 16,
        spriteY: 64,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 5,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 190,
        attackCooldown: 1000,
        description: '',
        type: 'weapon'
    },
    iron_rapier: {
        spriteX: 32,
        spriteY: 64,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 8,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 190,
        attackCooldown: 1000,
        description: '',
        type: 'weapon'
    },
    gold_rapier: {
        spriteX: 48,
        spriteY: 64,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 12,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 190,
        attackCooldown: 1000,
        description: 'Polished to shine even the darkest of creatures!',
        type: 'weapon'
    },
    copper_rapier: {
        spriteX: 64,
        spriteY: 64,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 10,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 190,
        attackCooldown: 1000,
        description: 'Oxidising Reach',
        type: 'weapon'
    },
    wood_sickle: {
        spriteX: 0,
        spriteY: 32,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 2,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 100,
        attackCooldown: 500,
        description: '- less cooldown <br> - less reach',
        type: 'weapon'
    },
    stone_sickle: {
        spriteX: 16,
        spriteY: 32,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 4,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 100,
        attackCooldown: 500,
        description: '',
        type: 'weapon'
    },
    iron_sickle: {
        spriteX: 32,
        spriteY: 32,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 6,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 100,
        attackCooldown: 500,
        description: 'Are you a Communist?',
        type: 'weapon'
    },
    gold_sickle: {
        spriteX: 48,
        spriteY: 32,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 10,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 100,
        attackCooldown: 500,
        description: 'Luxury, Applied Rapidly.',
        type: 'weapon'
    },
    copper_sickle: {
        spriteX: 64,
        spriteY: 32,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 8,
        src: 'weapons.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 100,
        attackCooldown: 500,
        description: '',
        type: 'weapon'
    },
    beer: {
        spriteX: 0,
        spriteY: 0,
        height: 32,
        width: 32,
        scale: 1.5,
        attackDamage: 1,
        src: 'beer.png',
        use: () => {
            player.heal(5)
            return
        },
        onUse: 'Heals 5 HP',
        clearsAfterUse: true,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Better drunk, than dead!',
        type: 'food'
    },
    heal_potion: {
        spriteX: 0,
        spriteY: 0,
        height: 32,
        width: 32,
        scale: 1.5,
        attackDamage: 1,
        src: 'heal_potion.png',
        use: () => {
            player.heal(20)
            return
        },
        onUse: 'Heals 20 HP',
        clearsAfterUse: true,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Side effects may include winning',
        type: 'food'
    },
    big_heal_potion: {
        spriteX: 0,
        spriteY: 0,
        height: 32,
        width: 32,
        scale: 1.5,
        attackDamage: 1,
        src: 'big_heal_potion.png',
        use: () => {
            player.heal(35)
            return
        },
        onUse: 'Heals 35 HP',
        clearsAfterUse: true,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'For injuries labeled "fatal"',
        type: 'food'
    },
    coin: {
        spriteX: 0,
        spriteY: 0,
        height: 32,
        width: 32,
        scale: 1.5,
        attackDamage: 1,
        src: 'coin.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Can be used to trade',
        type: 'item'
    },
    pappbanditem: {
        spriteX: 0,
        spriteY: 0,
        height: 32,
        width: 32,
        scale: 1.5,
        attackDamage: 1000,
        src: 'pappbanditem.png',
        use: () => {
            player.heal(1000000)
        },
        onUse: 'Grants great power!',
        clearsAfterUse: false,
        attackRange: 15000,
        attackCooldown: 0,
        description: 'Papp-Band-Item',
        type: 'testItem'
    },
    iron_helmet: {
        spriteX: 0,
        spriteY: 0,
        height: 64,
        width: 64,
        scale: 0.75,
        attackDamage: 1,
        src: 'armor.png',
        use: () => {
            return;
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'A shiny helmet!',
        type: 'armor',
        slot: 'helmet',
        protection: 10
    },
    iron_chestplate_tier_1: {
        spriteX: 384,
        spriteY: 256,
        height: 64,
        width: 64,
        scale: 0.75,
        attackDamage: 1,
        src: 'armor.png',
        use: () => {
            return;
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Tier One',
        type: 'armor',
        slot: 'chestplate',
        protection: 15
    },
    iron_chestplate_tier_2: {
        spriteX: 448,
        spriteY: 256,
        height: 64,
        width: 64,
        scale: 0.75,
        attackDamage: 1,
        src: 'armor.png',
        use: () => {
            return;
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Tier Two',
        type: 'armor',
        slot: 'chestplate',
        protection: 20
    },
    iron_chestplate_tier_3: {
        spriteX: 512,
        spriteY: 256,
        height: 64,
        width: 64,
        scale: 0.75,
        attackDamage: 1,
        src: 'armor.png',
        use: () => {
            return;
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Tier Three',
        type: 'armor',
        slot: 'chestplate',
        protection: 25
    },
    hardened_boots: {
        spriteX: 128,
        spriteY: 128,
        height: 64,
        width: 64,
        scale: 0.75,
        attackDamage: 1,
        src: 'armor.png',
        use: () => {
            return;
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'armor',
        slot: 'boots',
        protection: 7.5
    },
    gold_crown: {
        spriteX: 256,
        spriteY: 64,
        height: 64,
        width: 64,
        scale: 0.75,
        attackDamage: 1,
        src: 'armor.png',
        use: () => {
            return;
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'armor',
        slot: 'helmet',
        protection: 7.5
    },
    leather_hood: {
        spriteX: 512,
        spriteY: 0,
        height: 64,
        width: 64,
        scale: 0.75,
        attackDamage: 1,
        src: 'armor.png',
        use: () => {
            return;
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'armor',
        slot: 'helmet',
        protection: 5
    },
    leather_boots: {
        spriteX: 0,
        spriteY: 128,
        height: 64,
        width: 64,
        scale: 0.75,
        attackDamage: 1,
        src: 'armor.png',
        use: () => {
            return;
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'armor',
        slot: 'boots',
        protection: 5
    },
    berserker_helmet: {
        spriteX: 64,
        spriteY: 0,
        height: 64,
        width: 64,
        scale: 0.75,
        attackDamage: 2,
        src: 'armor.png',
        use: () => {
            return;
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Horns don\'t add much protection, do they?',
        type: 'armor',
        slot: 'helmet',
        protection: 12.5
    },
    knights_helm: {
        spriteX: 448,
        spriteY: 0,
        height: 64,
        width: 64,
        scale: 0.75,
        attackDamage: 2,
        src: 'armor.png',
        use: () => {
            return;
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Forged for the masses of the army!',
        type: 'armor',
        slot: 'helmet',
        protection: 15
    },
    flaming_saber: {
        spriteX: 0,
        spriteY: 0,
        height: 32,
        width: 32,
        scale: 2,
        attackDamage: 18,
        src: 'weapons2.png',
        use: () => {
            return
        },
        attack(entity: entity) {
            entity.addEffect('burning', 500, 1)
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Make your enemies your next buffet',
        type: 'weapon'
    },
    holy_longsword: {
        spriteX: 128,
        spriteY: 0,
        height: 32,
        width: 32,
        scale: 2,
        attackDamage: 20,
        src: 'weapons2.png',
        use: () => {
            player.addEffect('healthboost', 500, 1)
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'With the power of heaven!',
        type: 'weapon'
    },
    poisoned_staff: {
        spriteX: 64,
        spriteY: 0,
        height: 32,
        width: 32,
        scale: 2,
        attackDamage: 16,
        src: 'weapons2.png',
        use: () => {
            return
        },
        attack: (entity) => {
            entity.addEffect('poison', 1000, 1)
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Don\'t hit yourself!',
        type: 'weapon'
    },
    supernova: {
        spriteX: 0,
        spriteY: 32,
        height: 32,
        width: 32,
        scale: 2,
        attackDamage: 32,
        src: 'weapons2.png',
        use: () => {
            player.addEffect('strength', 500, 1)
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 2000,
        description: 'Uhmm',
        type: 'weapon'
    },
    null: {
        spriteX: 96,
        spriteY: 64,
        height: 32,
        width: 32,
        scale: 2,
        attackDamage: 10,
        src: 'weapons2.png',
        use: () => {
            return
        },
        attack(entity: entity) {
            player.takeHit(10)
            entity.addEffect('deaths_curse', 1500, 1)
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 2000,
        description: 'Only death will win!',
        type: 'weapon'
    },
    steel_robe: {
        spriteX: 320,
        spriteY: 192,
        height: 64,
        width: 64,
        scale: 0.75,
        attackDamage: 1,
        src: 'armor.png',
        use: () => {
            return;
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Classy armor',
        type: 'armor',
        slot: 'chestplate',
        protection: 20
    },
    iron_boots: {
        spriteX: 192,
        spriteY: 128,
        height: 64,
        width: 64,
        scale: 0.75,
        attackDamage: 1,
        src: 'armor.png',
        use: () => {
            return;
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'armor',
        slot: 'boots',
        protection: 9
    },
    peasants_robe: {
        spriteX: 384,
        spriteY: 320,
        height: 64,
        width: 64,
        scale: 0.75,
        attackDamage: 1,
        src: 'armor.png',
        use: () => {
            return;
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Muddy and teared',
        type: 'armor',
        slot: 'chestplate',
        protection: 10
    },
    regeneration_potion: {
        spriteX: 0,
        spriteY: 0,
        height: 26,
        width: 12,
        scale: 1.5,
        attackDamage: 1,
        src: 'regeneration_potion.png',
        use: () => {
            player.addEffect('regeneration', 600, 1)
            return
        },
        onUse: 'Gives the regeneration effect',
        clearsAfterUse: true,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'food'
    },
    big_regeneration_potion: {
        spriteX: 0,
        spriteY: 0,
        height: 37,
        width: 19,
        scale: 1.5,
        attackDamage: 1,
        src: 'big_regeneration_potion.png',
        use: () => {
            player.addEffect('regeneration', 1000, 1)
            return
        },
        onUse: 'Gives the regeneration effect',
        clearsAfterUse: true,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Side effects may include winning',
        type: 'food'
    },
    icing_rapier: {
        spriteX: 32,
        spriteY: 0,
        height: 32,
        width: 32,
        scale: 2,
        attackDamage: 15,
        src: 'weapons2.png',
        use: () => {
            return
        },
        attack(entity: entity) {
            entity.addEffect('ice', 1000, 1)
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 2000,
        description: 'Uhmm',
        type: 'weapon'
    },
    healthboost_potion: {
        spriteX: 0,
        spriteY: 0,
        height: 25,
        width: 14,
        scale: 1.5,
        attackDamage: 1,
        src: 'healthboost_potion.png',
        use: () => {
            player.addEffect('healthboost', 3000, 1)
            return
        },
        onUse: 'Gives +50% health',
        clearsAfterUse: true,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'food'
    },
    lightning_potion: {
        spriteX: 0,
        spriteY: 0,
        height: 64,
        width: 64,
        scale: 0.75,
        attackDamage: 1,
        src: 'lightning_potion.png',
        use: () => {
            player.addEffect('electrocute', 1500, 1)
            return
        },
        onUse: 'Gives electrocute effect',
        clearsAfterUse: true,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'feel the power of Zeus',
        type: 'food'
    },
    mushroom: {
        spriteX: 240,
        spriteY: 128,
        height: 16,
        width: 16,
        scale: 2,
        attackDamage: 1,
        src: 'items_sheet.png',
        use: () => {
            let removeArr: number[] = []
            player.effects.forEach((effect, i) => {
                removeArr.push(effect.index)
            })

            removeArr.forEach(i => {
                player.removeEffect(i)
            })
        },
        onUse: 'Removes all effects',
        clearsAfterUse: true,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'A bit squishy in the mouth',
        type: 'food'
    },
    stick: {
        spriteX: 368,
        spriteY: 272,
        height: 16,
        width: 16,
        scale: 2,
        attackDamage: 1,
        src: 'items_sheet.png',
        use: () => {
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'item'
    },
    iron_ingot: {
        spriteX: 256,
        spriteY: 176,
        height: 16,
        width: 16,
        scale: 2,
        attackDamage: 1,
        src: 'items_sheet.png',
        use: () => {
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'item'
    },
    gold_ingot: {
        spriteX: 272,
        spriteY: 176,
        height: 16,
        width: 16,
        scale: 2,
        attackDamage: 1,
        src: 'items_sheet.png',
        use: () => {
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'item'
    },
    copper_ingot: {
        spriteX: 240,
        spriteY: 176,
        height: 16,
        width: 16,
        scale: 2,
        attackDamage: 1,
        src: 'items_sheet.png',
        use: () => {
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'item'
    },
    leather: {
        spriteX: 144,
        spriteY: 192,
        height: 16,
        width: 16,
        scale: 2,
        attackDamage: 1,
        src: 'items_sheet.png',
        use: () => {
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Moo!',
        type: 'item'
    },
    string: {
        spriteX: 352,
        spriteY: 224,
        height: 16,
        width: 16,
        scale: 2,
        attackDamage: 1,
        src: 'items_sheet.png',
        use: () => {
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'item'
    },
    stone: {
        spriteX: 368,
        spriteY: 320,
        height: 16,
        width: 16,
        scale: 2,
        attackDamage: 1,
        src: 'items_sheet.png',
        use: () => {
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'A big rock',
        type: 'item'
    },
    silver_ingot: {
        spriteX: 320,
        spriteY: 176,
        height: 16,
        width: 16,
        scale: 2,
        attackDamage: 1,
        src: 'items_sheet.png',
        use: () => {
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'item'
    },
    cloth: {
        spriteX: 352,
        spriteY: 208,
        height: 16,
        width: 16,
        scale: 2,
        attackDamage: 1,
        src: 'items_sheet.png',
        use: () => {
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Made in China',
        type: 'item'
    },
    horn: {
        spriteX: 176,
        spriteY: 352,
        height: 16,
        width: 16,
        scale: 2,
        attackDamage: 1,
        src: 'items_sheet.png',
        use: () => {
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Goat weapon',
        type: 'item'
    },
    fruit: {
        spriteX: 48,
        spriteY: 160,
        height: 16,
        width: 16,
        scale: 2,
        attackDamage: 1,
        src: 'items_sheet.png',
        use: () => {
            player.heal(5)
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: '',
        type: 'item'
    },
    key: {
        spriteX: 384,
        spriteY: 224,
        height: 16,
        width: 16,
        scale: 2,
        attackDamage: 1,
        src: 'items_sheet.png',
        use: () => {
            return
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Might unlock something',
        type: 'item'
    }
}

type InventorySlot = item | null
type Inventory = InventorySlot[][]

type Trade = {
    amount: number
    item: item
}

interface blocks {
    x: number
    y: number
    update(): void
    draw(): void
    interact(): void
    type: typeObject
    spriteHeight: number
    spriteWidth: number
    worldElem?: worldElementNames
    health?: number
    maxHealth?: number
    healthBarScale?: number
    isBlocking?: boolean
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
    x: number
    y: number
    update(): void
    draw(): void
    interact(): void
    type: typeObject
    spriteHeight: number
    spriteWidth: number
    counter: number
    entity: entity
}

interface entity {
    x: number
    y: number
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
    currentState: string
    onCooldown: boolean
    type: typeObject
    health: number
    worldElem?: worldElementNames
    maxHealth: number
    spriteHeight: number
    spriteWidth: number
    conversationCounter?: number
    conversation?: String[]
    scale?: number
    Xdirec: number
    isMoving: boolean
    addEffect(effect: effect, duration: number, factor: number): void
    lootDrop: { amount: number, drop: item }[]
    healthBarScale?: number
    isSpeaking?: boolean
    id: number
}

type PresentItem = {
    item: item
    amount: number
}

interface container {
    x: number
    y: number
    update(): void
    draw(): void
    interact(): void
    changeState(state: string): void
    type: typeObject
    spriteHeight: number
    spriteWidth: number
    inventory: Inventory
    currentState: string
    worldElem: worldElementNames
}

interface typeObject {
    isGround: boolean
    moving: boolean
    name: string
    allignment: string
    attackable: boolean
    interactable: boolean
}

interface AnimationState {
    name: string
    frames: number
}

interface framesObj {
    loc: Array<{ x: number; y: number }>
}
// inputs
document.querySelector('#game')!.addEventListener('contextmenu', e => e.preventDefault());

canvas.addEventListener('mousedown', event => {
    if (event.button === 2 && !player.onInventory) {
        player.useItem()
    }

    if (event.button === 0 && !player.onInventory) {
        player.attack()
    }
})
addEventListener('keyup', event => {
    if (!player.onInventory) {
        keys[event.code] = false
        player.changeState('idle')
        gameSpeed = 0
    }
})
addEventListener('keydown', event => {
    if (!player.onInventory && !player.onTradingMenu && !player.onSecondaryInventory && player.canMove) keys[event.code] = true

    if (event.code === 'KeyR' && !player.isMoving) {
        if (!player.onSecondaryInventory) {
            player.interact()
        }
    }

    if (event.code === 'KeyE' && !player.isMoving) {
        if (player.onInventory && !player.onTradingMenu) {
            closeInventory()
        } else {
            if (player.onTradingMenu) {
                closeTradingMenu()
            } else {
                openInventory()
            }
        }


    }

    if (event.code === 'Space' && !player.onInventory) {
        player.jump()
    }

    if (!player.onInventory && event.code.slice(0, 5) === 'Digit' && (parseInt(event.code.slice(5, 6)) < 6)) {
        changeSelectedSlot(parseInt(event.code.slice(5, 6)))
    }
})

// quest logic and events
let currentEvents: { event: event, entity: entity }[] = []
let activeQuests: quest[] = []

type event = 'kill' | 'talk' | 'walk'

class quest {
    event: event
    entities: { entity: number, completed: boolean }[]
    text: string
    gift: { item: item, amount: number }[]
    completed: boolean
    constructor(event: event, entities: number[], text: string, gift: { item: item, amount: number }[]) {
        this.event = event
        this.text = text
        this.gift = gift
        this.completed = false
        this.entities = []
        entities.forEach(entity => {
            this.entities.push({ entity: entity, completed: false })
        })
    }

    update() {
        currentEvents.forEach(event => {
            if (event.event === this.event) {
                this.entities.forEach(entity => {
                    if (entity.entity === event.entity.id) {
                        entity.completed = true
                    }
                })
            }
        })
        let questCompleted = true
        this.entities.forEach(entity => {
            if (!entity.completed) {
                questCompleted = false
                this.completed = false
            }
        })

        return questCompleted
    }

    finish() {
        this.gift.forEach(gift => {
            player.addItem(gift.item, gift.amount)
        })

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
    }
}

// classes for objects in the game
// other objects classes
class Layer implements blocks {
    x: number // x coordinate
    y: number // y coordinate
    spriteWidth: number
    spriteHeight: number
    image: CanvasImageSource // path to the spritesheet
    speedModifier: number // speed proportion to the gamespeed
    speed: number // gamespeed * speedModifier
    isInit: boolean // checks if layer has already been drawn
    type: typeObject // information about the type of object
    constructor(image: CanvasImageSource, speedModifier: number, spriteWidth: number, spriteHeight: number) {
        this.x = 0
        this.y = 0
        this.spriteWidth = spriteWidth
        this.spriteHeight = spriteHeight
        this.image = image
        this.speedModifier = speedModifier
        this.speed = gameSpeed * this.speedModifier
        this.isInit = false
        this.type = { isGround: true /* is a ground troop/thing */, name: 'layer' /* name of the entity/thing */, allignment: 'passive' /* does it attack the player */, moving: false /* should it be moved when the player moves; to mimic movement */, attackable: false, interactable: false }
    }
    update() {
        this.speed = gameSpeed * this.speedModifier

        this.x = Math.floor(this.x - this.speed)

        if (this.x <= -this.spriteWidth) {
            this.x += this.spriteWidth
        } else if (this.x >= this.spriteWidth) {
            this.x -= this.spriteWidth
        }
    }
    draw() {
        ctx!.drawImage(this.image, this.x, this.y, this.spriteWidth, this.spriteHeight)
        ctx!.drawImage(this.image, this.x + this.spriteWidth, this.y, this.spriteWidth, this.spriteHeight)
        ctx!.drawImage(this.image, this.x - this.spriteWidth, this.y, this.spriteWidth, this.spriteHeight)
    }

    interact(): void {
        return
    }
}

class particle implements particle {
    x: number // x coordinate
    y: number // y coordinate
    entity: entity
    spriteWidth: number
    spriteHeight: number
    type: typeObject // information about the type of object
    frames: number
    frameLoc: number
    animationStates: AnimationState[]
    spriteAnimations: Record<string, framesObj>
    currentState: string
    img: HTMLImageElement
    counter: number
    constructor(entity: entity, spriteWidth: number, spriteHeight: number, img: HTMLImageElement, counter: number, frameAmount: number) {
        this.x = 0
        this.y = 0
        this.entity = entity
        this.spriteWidth = spriteWidth
        this.spriteHeight = spriteHeight
        this.frames = 0
        this.frameLoc = 0
        this.currentState = 'normal'
        this.type = { isGround: true /* is a ground troop/thing */, name: 'particle' /* name of the entity/thing */, allignment: 'passive' /* does it attack the player */, moving: true /* should it be moved when the player moves; to mimic movement */, attackable: false, interactable: false }
        this.animationStates = [
            {
                name: 'normal',
                frames: frameAmount
            }
        ]
        this.spriteAnimations = {}
        this.img = img
        this.counter = counter
        this.init()
    }
    update() {
        if (this.entity.Xdirec === 1) {
            this.x = this.entity.x + this.entity.spriteWidth
        } else {
            this.x = this.entity.x + this.entity.spriteWidth / 2
        }
        if (this.entity.type.name === 'goblin') {
            this.x += 30
        }

        this.y = this.entity.y + this.entity.spriteHeight

        this.frames++
        if (this.frames >= staggerFrames) { // check if next frame should be drawn
            this.frames = 0 // reset frames
            this.frameLoc++ // advance to next frame
            const frameAmount = this.spriteAnimations[this.currentState].loc.length
            if (this.frameLoc >= frameAmount) { // check if the end of the animation is reached
                this.frameLoc = 0
            }
        }
    }

    init() {
        this.animationStates.forEach((state, index) => {
            let frames: framesObj = {
                loc: []
            }
            for (let j = 0; j < state.frames; j++) {
                let positionX = j * this.spriteWidth
                let positionY = index * this.spriteHeight

                frames.loc.push({ x: positionX, y: positionY })
            }

            this.spriteAnimations[state.name] = frames
        })
    }

    draw() {
        let frameX = this.spriteAnimations[this.currentState].loc[this.frameLoc].x
        let frameY = this.spriteAnimations[this.currentState].loc[this.frameLoc].y

        ctx!.drawImage(this.img, frameX, frameY, this.spriteWidth, this.spriteHeight, this.x, this.y, 150 * (this.entity.scale ?? 1), 150 * (this.entity.scale ?? 1))
    }

    interact(): void {
        return
    }
}

class healthbar implements nonWorldElems {
    x: number // x coordinate
    y: number // y coordinate
    entity: entity | blocks
    spriteWidth: number
    spriteHeight: number
    type: typeObject // information about the type of object
    constructor(entity: entity | blocks) {
        this.x = 0
        this.y = 0
        this.entity = entity
        this.spriteWidth = 100
        this.spriteHeight = 50
        this.type = { isGround: true /* is a ground troop/thing */, name: 'healthbar' /* name of the entity/thing */, allignment: 'passive' /* does it attack the player */, moving: true /* should it be moved when the player moves; to mimic movement */, attackable: false, interactable: false }
    }
    update() {
        this.x = this.entity.x
        this.y = this.entity.y

        if (this.entity === player) {
            this.x += 15
        } else if (this.entity.type.name === 'nightBorn') {
            this.x += 60
        } else if (this.entity.type.name === 'teleporter') {
            this.y -= 130
            this.x -= 20
        }
    }
    draw() {
        if (!this.entity.maxHealth || !this.entity.health) return;

        const backgroundColor = this.entity.type.name === 'interactable' || this.entity.type.name === 'teleporter' ? "rgb(215, 215, 215)" : "rgb(184, 0, 0)"
        const overColor = this.entity.type.name === 'interactable' ? "rgb(101, 101, 101)" : (this.entity.type.name === 'teleporter' ? "rgb(29, 93, 190)" : "rgb(0, 184, 3)")
        let scale = 1
        if (this.entity.healthBarScale) {
            scale = this.entity.type.name === 'interactable' ? this.entity.healthBarScale : 1
        }


        let drawMaxHealth = this.entity.maxHealth
        let drawHealth = this.entity.health
        if (this.entity.maxHealth > 100 && this.entity === player && drawHealth > 100) {
            drawHealth = drawHealth - 100
            ctx!.fillStyle = "rgb(184, 0, 0)"
            ctx!.fillRect(this.x + this.entity.spriteWidth, this.y + 90, 100, 20)
            ctx!.fillStyle = "rgb(222, 236, 24)"
            ctx!.fillRect(this.x + this.entity.spriteWidth, this.y + 90, ((drawHealth / 50) * 100 < 0) ? 0 : (drawHealth / 50) * 100, 20)

            drawHealth = 100
            drawMaxHealth = 100
        }
        ctx!.fillStyle = backgroundColor
        ctx!.fillRect(this.x + this.entity.spriteWidth, this.y + 120, 100 * scale, 20 * scale)
        ctx!.fillStyle = overColor
        ctx!.fillRect(this.x + this.entity.spriteWidth, this.y + 120, (((drawHealth / drawMaxHealth) * 100 < 0) ? 0 : (drawHealth / drawMaxHealth) * 100) * scale, 20 * scale)

    }
    interact(): void {
        return
    }
}

class chest implements container {
    x: number // x coordinate
    y: number // y coordinate
    showedText: boolean
    spriteWidth: number
    spriteHeight: number
    frames: number
    frameLoc: number
    currentState: string
    isInit: boolean
    img: HTMLImageElement
    inventory: Inventory
    spriteAnimations: Record<string, framesObj> // stores each animation as an object
    animationStates: AnimationState[] // stores each animation as an array
    type: typeObject // information about the type of object
    scale: number
    worldElem: worldElementNames
    constructor(x: number, y: number, inventory: Inventory, worldElem: worldElementNames) {
        this.x = x
        if (y === StaticPositions.OnGround) {
            this.y = 600
        } else {
            this.y = y
        }

        this.spriteWidth = 43
        this.spriteHeight = 40
        this.frames = 0
        this.frameLoc = 0
        this.scale = 0.3
        this.showedText = false
        this.isInit = false
        this.currentState = 'normal'
        this.img = new Image()
        this.img.src = 'img/items/dropChest.png'
        this.inventory = inventory
        this.spriteAnimations = {}
        this.animationStates = [
            {
                name: 'open',
                frames: 4
            },
            {
                name: 'normal',
                frames: 1
            }
        ]
        this.type = { isGround: true /* is a ground troop/thing */, name: 'chest' /* name of the entity/thing */, allignment: 'passive' /* does it attack the player */, moving: true /* should it be moved when the player moves; to mimic movement */, attackable: false, interactable: true }
        this.worldElem = worldElem
        this.init()
    }
    update() {

        const distanceXToPlayer = Math.abs((player.x + player.spriteWidth / 2) - (this.x + (this.spriteWidth / 2) * this.scale))
        if (distanceXToPlayer <= player.interactionRange && !player.onCooldown && player.onGround) {
            if (!this.showedText) {
                this.showedText = true
                displayInfo('Press "R" to interact')
            }
            player.interactionFocusContainer = this
            /*             player.interactionFocusEntity = null
                        player.interactionFocusGrab = null */
        } else {
            if (player.interactionFocusContainer === this) {
                player.interactionFocusContainer = null
            }
            this.showedText = false
        }

        this.frames++
        if (this.frames >= staggerFrames) {
            this.frames = 0
            this.frameLoc++
            const frameAmount = this.spriteAnimations[this.currentState].loc.length

            if (this.frameLoc >= frameAmount) {
                this.frameLoc = 0

                if (this.currentState === 'open') {
                    this.currentState = 'normal'
                }
            }
        }
    }
    draw() {
        let frameX = this.spriteAnimations[this.currentState].loc[this.frameLoc].x // get current locations of the animation
        let frameY = this.spriteAnimations[this.currentState].loc[this.frameLoc].y

        ctx!.drawImage(this.img, frameX, frameY, this.spriteWidth, this.spriteHeight, this.x, this.y, 400 * this.scale, 400 * this.scale)
    }
    init() {
        this.isInit = true
        // initialise spriteAnimation object
        this.animationStates.forEach((state, index) => { // iterate through all animations
            let frames: framesObj = { // create a frames object to store the location of the current animation
                loc: []
            }
            for (let j = 0; j < state.frames; j++) { // iterate for each frame
                let positionX = j * this.spriteWidth // calculate the corresponding position of said frame
                let positionY = 0

                frames.loc.push({ x: positionX, y: positionY }) // push these positions onto the frames object
            }

            this.spriteAnimations[state.name] = frames // create a key on the spriteAnimations object to store this data
        })
    }
    changeState(state: string) {
        this.currentState = state
        this.frames = 0
        this.frameLoc = 0
    }
    interact() {
        openInventory()
        openSecondaryContainer(this)
    }
    fill() { }
}

class interactable implements blocks {
    x: number // x coordinate
    y: number // y coordinate
    showedText: boolean
    spriteWidth: number
    spriteHeight: number
    frames: number
    frameLoc: number
    currentState: string
    isInfinite: boolean
    wasCollected: boolean
    healthBarScale: number
    isInit: boolean
    spawnedHealthbar: boolean
    health: number
    maxHealth: number
    healthbar: blocks | null
    img: HTMLImageElement
    spriteAnimations: Record<string, framesObj> // stores each animation as an object
    animationStates: AnimationState[] // stores each animation as an array
    type: typeObject // information about the type of object
    scale: number
    cooldown: number
    output: { amount: number, item: item }[]
    worldElem: worldElementNames
    canBeInteracted: boolean
    isBlocking: boolean
    removeItem: item | null
    constructor(x: number, y: number, cooldown: number, pathToImage: string, spriteWidth: number, spriteHeight: number, scale: number, output: { amount: number, item: item }[], isInfinite: boolean, healthBarScale: number, worldElem: worldElementNames, canBeInteracted: boolean, isBlocking: boolean, removeItem: item | null) {
        this.x = x
        this.y = y
        this.spriteWidth = spriteWidth
        this.spriteHeight = spriteHeight
        this.frames = 0
        this.frameLoc = 0
        this.scale = scale
        this.showedText = false
        this.isInit = false
        this.spawnedHealthbar = false
        this.isInfinite = isInfinite
        this.wasCollected = false
        this.currentState = 'normal'
        this.healthBarScale = healthBarScale
        this.healthbar = null
        this.img = new Image()
        this.img.src = pathToImage
        this.output = output
        this.spriteAnimations = {}
        this.animationStates = [
            {
                name: 'open',
                frames: 4
            },
            {
                name: 'normal',
                frames: 1
            }
        ]
        this.cooldown = cooldown
        this.health = 0
        this.maxHealth = cooldown
        this.canBeInteracted = canBeInteracted
        this.type = { isGround: true /* is a ground troop/thing */, name: 'interactable' /* name of the entity/thing */, allignment: 'passive' /* does it attack the player */, moving: true /* should it be moved when the player moves; to mimic movement */, attackable: false, interactable: true }

        if (this.y === StaticPositions.OnGround) {
            this.y = groundY - (this.scale * 400)
        }
        this.worldElem = worldElem
        this.isBlocking = isBlocking
        this.removeItem = removeItem

        this.init()
    }
    update() {
        if (this.canBeInteracted) {
            const distanceXToPlayer = Math.abs((player.x + player.spriteWidth / 2) - (this.x + (this.spriteWidth / 2) * this.scale))

            if (distanceXToPlayer <= player.interactionRange && !player.onCooldown && player.onGround) {
                if (!this.showedText) {
                    this.showedText = true
                    /* if (!this.wasCollected && this.isInfinite) displayInfo('Hold "R" to interact') */
                }
                player.interactionFocusGrab = this
            } else {

                if (player.interactionFocusGrab === this) {
                    player.interactionFocusGrab = null
                }

                this.showedText = false
            }
        }
        if (this.removeItem) {
            const distanceXToPlayer = Math.abs((player.x + player.spriteWidth / 2) - (this.x + (this.spriteWidth / 2) * this.scale))
            console.log(distanceXToPlayer);
            if (distanceXToPlayer <= player.interactionRange + 75 && !player.onCooldown && player.onGround) {
                if (!this.showedText) {
                    this.showedText = true
                    displayInfo('Press "R" to unlock')
                }
                player.interactionFocusGrab = this
            } else {

                if (player.interactionFocusGrab === this) {
                    player.interactionFocusGrab = null
                }

                this.showedText = false
            }
        }

        this.frames++
        if (this.frames >= staggerFrames) {
            this.frames = 0
            this.frameLoc++
            const frameAmount = this.spriteAnimations[this.currentState].loc.length
            if (this.frameLoc >= frameAmount) {
                this.frameLoc = 0
                if (this.currentState === 'open') {
                    this.currentState = 'normal'
                }
            }
        }
    }
    draw() {
        let frameX = this.spriteAnimations[this.currentState].loc[this.frameLoc].x // get current locations of the animation
        let frameY = this.spriteAnimations[this.currentState].loc[this.frameLoc].y

        ctx!.drawImage(this.img, frameX, frameY, this.spriteWidth, this.spriteHeight, this.x, this.y, 400 * this.scale, 400 * this.scale)
    }
    init() {
        this.isInit = true
        // initialise spriteAnimation object
        this.animationStates.forEach((state, index) => { // iterate through all animations
            let frames: framesObj = { // create a frames object to store the location of the current animation
                loc: []
            }
            for (let j = 0; j < state.frames; j++) { // iterate for each frame
                let positionX = j * this.spriteWidth // calculate the corresponding position of said frame
                let positionY = 0

                frames.loc.push({ x: positionX, y: positionY }) // push these positions onto the frames object
            }

            this.spriteAnimations[state.name] = frames // create a key on the spriteAnimations object to store this data
        })
    }
    changeState(state: string) {
        this.currentState = state
        this.frames = 0
        this.frameLoc = 0
    }
    interact() {
        if (this.canBeInteracted) {
            if (this.wasCollected && !this.isInfinite) return;

            if (!this.spawnedHealthbar) {
                nonWorldElems.push(new healthbar(this))
                this.spawnedHealthbar = true
            }

            if (keys['KeyR']) {
                this.health += 1
            } else {
                this.health = 0
            }

            if (this.health >= this.cooldown) {
                this.output.forEach(element => {
                    player.addItem(element.item, element.amount)
                    this.wasCollected = true
                    this.health = 0
                });
            }
        } else if (this.removeItem) {
            if (player.inventory[3][player.selectedSlot - 1] === this.removeItem) {
                this.isBlocking = false
                this.removeItem = null
                player.inventory[3][player.selectedSlot - 1] = null
                updateHotbar()
            } else {
                displayInfo(`Use a ${this.removeItem}`)
            }
        }
    }
}

class teleporter implements blocks {
    x: number // x coordinate
    y: number // y coordinate
    showedText: boolean
    spriteWidth: number
    spriteHeight: number
    frames: number
    frameLoc: number
    currentState: string
    wasCollected: boolean
    healthBarScale: number
    isInit: boolean
    spawnedHealthbar: boolean
    health: number
    maxHealth: number
    healthbar: blocks | null
    img: HTMLImageElement
    spriteAnimations: Record<string, framesObj> // stores each animation as an object
    animationStates: AnimationState[] // stores each animation as an array
    type: typeObject // information about the type of object
    scale: number
    cooldown: number
    worldElem: worldElementNames
    destination: { dim: worldName, x: number, y: number }
    constructor(x: number, y: number, cooldown: number, pathToImage: string, spriteWidth: number, spriteHeight: number, scale: number, healthBarScale: number, worldElem: worldElementNames, isBlocking: boolean, destination: { dim: worldName, x: number, y: number }) {
        this.x = x
        this.y = y
        this.spriteWidth = spriteWidth
        this.spriteHeight = spriteHeight
        this.frames = 0
        this.frameLoc = 0
        this.scale = scale
        this.showedText = false
        this.isInit = false
        this.spawnedHealthbar = false
        this.wasCollected = false
        this.currentState = 'normal'
        this.healthBarScale = healthBarScale
        this.healthbar = null
        this.img = new Image()
        this.img.src = pathToImage
        this.spriteAnimations = {}
        this.animationStates = [
            {
                name: 'open',
                frames: 4
            },
            {
                name: 'normal',
                frames: 1
            }
        ]
        this.cooldown = cooldown
        this.health = 0
        this.maxHealth = cooldown
        this.type = { isGround: true /* is a ground troop/thing */, name: 'teleporter' /* name of the entity/thing */, allignment: 'passive' /* does it attack the player */, moving: true /* should it be moved when the player moves; to mimic movement */, attackable: false, interactable: true }

        if (this.y === StaticPositions.OnGround) {
            this.y = groundY - (this.scale * 400)
        }
        this.worldElem = worldElem
        this.destination = destination

        this.init()
    }
    update() {
        const distanceXToPlayer = Math.abs((player.x + player.spriteWidth / 2) - (this.x + (this.spriteWidth / 2) * this.scale))

        if (distanceXToPlayer <= player.interactionRange && !player.onCooldown && player.onGround) {
            if (!this.showedText) {
                this.showedText = true
                if (!this.wasCollected) displayInfo('Hold "R" to interact')
            }
            player.interactionFocusGrab = this
        } else {

            if (player.interactionFocusGrab === this) {
                player.interactionFocusGrab = null
            }

            this.showedText = false
        }


        this.frames++
        if (this.frames >= staggerFrames) {
            this.frames = 0
            this.frameLoc++
            const frameAmount = this.spriteAnimations[this.currentState].loc.length
            if (this.frameLoc >= frameAmount) {
                this.frameLoc = 0
                if (this.currentState === 'open') {
                    this.currentState = 'normal'
                }
            }
        }
    }
    draw() {
        let frameX = this.spriteAnimations[this.currentState].loc[this.frameLoc].x // get current locations of the animation
        let frameY = this.spriteAnimations[this.currentState].loc[this.frameLoc].y

        ctx!.drawImage(this.img, frameX, frameY, this.spriteWidth, this.spriteHeight, this.x, this.y, 400 * this.scale, 400 * this.scale)
    }
    init() {
        this.isInit = true
        // initialise spriteAnimation object
        this.animationStates.forEach((state, index) => { // iterate through all animations
            let frames: framesObj = { // create a frames object to store the location of the current animation
                loc: []
            }
            for (let j = 0; j < state.frames; j++) { // iterate for each frame
                let positionX = j * this.spriteWidth // calculate the corresponding position of said frame
                let positionY = 0

                frames.loc.push({ x: positionX, y: positionY }) // push these positions onto the frames object
            }

            this.spriteAnimations[state.name] = frames // create a key on the spriteAnimations object to store this data
        })
    }
    changeState(state: string) {
        this.currentState = state
        this.frames = 0
        this.frameLoc = 0
    }
    interact() {
        if (!this.spawnedHealthbar) {
            nonWorldElems.push(new healthbar(this))
            this.spawnedHealthbar = true
        }

        if (keys['KeyR']) {
            this.health += 1
        } else {
            this.health = 0
        }

        if (this.health >= this.cooldown) {
            changeWorld(this.destination.dim)
            player.x = this.destination.x
            /* player.y = this.destination.y */
        }
    }
}

// enemy classes
abstract class Entity {
    lootDrop: { amount: number, drop: item, chance: number }[]
    frames: number // stores a value which decides if the next frame should be shown
    frameLoc: number // stores the location of said animation
    x: number
    y: number
    maxHealth: number
    health: number
    isDead: boolean
    attackRange: number
    attackDamage: number
    spriteWidth: number
    spriteHeight: number
    currentState: string
    onCooldown: boolean
    scale: number
    showedText: boolean
    img: HTMLImageElement // path to spritesheet
    type: typeObject // info about the type of entity/thing
    spriteAnimations: Record<string, framesObj> // stores each animation as an object
    animationStates: AnimationState[] // stores each animation as an array
    Xdirec: number
    effects: effectType[]
    effectTicks: number
    effectCounter: number
    isMoving: boolean
    name: string
    seeRange: number
    worldElem: worldElementNames
    id: number
    constructor(x: number, y: number, maxHealth: number, attackRange: number, spriteWidth: number, spriteHeight: number, attackDamage: number, animationStates: AnimationState[], img: HTMLImageElement, type: typeObject, scale: number, lootDrop: { amount: number, drop: item, chance: number }[], worldElem: worldElementNames, name: string, id: number) {
        this.x = x
        this.y = y
        this.frames = 0
        this.frameLoc = 0
        this.currentState = 'idle' // stores the current animation
        this.onCooldown = false
        this.isDead = false
        this.isMoving = false
        this.showedText = false
        this.scale = scale
        this.maxHealth = maxHealth
        this.health = maxHealth
        this.attackRange = attackRange
        this.attackDamage = attackDamage
        this.spriteWidth = spriteWidth
        this.spriteHeight = spriteHeight
        this.name = name
        this.img = img
        this.type = type
        this.spriteAnimations = {}
        this.animationStates = animationStates
        this.Xdirec = 2
        this.effects = []
        this.effectTicks = 0
        this.effectCounter = 0
        this.seeRange = 550
        this.lootDrop = lootDrop
        this.worldElem = worldElem
        this.id = id
    }

    init() {
        // initialise spriteAnimation object
        this.animationStates.forEach((state, index) => { // iterate through all animations
            let frames: framesObj = { // create a frames object to store the location of the current animation
                loc: []
            }
            for (let j = 0; j < state.frames; j++) { // iterate for each frame
                let positionX = j * this.spriteWidth // calculate the corresponding position of said frame
                let positionY = index * this.spriteHeight

                frames.loc.push({ x: positionX, y: positionY }) // push these positions onto the frames object
            }

            this.spriteAnimations[state.name] = frames // create a key on the spriteAnimations object to store this data
        })
    }

    update(): void {
        // check for effect ticks
        this.effects.forEach(effect => {
            effect.duration--
            if (effect.duration <= 0) {
                if (effect.effect.name === 'deaths_curse') this.health -= 100
                this.removeEffect(effect.index)
            }

            if (this.effectTicks % effect.effect.ticks === 0) {
                effect.effect.onTick(this)
            }
        })

        if (this.type.interactable) {
            let distanceXToPlayer = Math.abs((player.x + player.spriteWidth / 2) - (this.x + (this.spriteWidth / 2) * this.scale))
            if (this.type.name === 'trader') distanceXToPlayer - 50
            if (distanceXToPlayer <= player.interactionRange && !player.onCooldown && player.onGround) {
                if (!this.showedText) {
                    displayInfo('Press "R" to interact')
                    this.showedText = true
                }
                if (this.type.name === 'trader' && this.currentState !== 'greet' && this.currentState !== 'open' && this.currentState !== 'dialogue') this.changeState('greet')
                player.interactionFocusEntity = this
                /*                 player.interactionFocusContainer = null
                                player.interactionFocusGrab = null */
            } else {
                if (player.interactionFocusEntity === this) {
                    player.interactionFocusEntity = null
                }
                this.showedText = false
                if (this.currentState !== 'idle') this.changeState('idle')
            }
        }

        this.frames++
        if (this.frames >= staggerFrames) {
            this.frames = 0
            this.frameLoc++
            const frameAmount = this.spriteAnimations[this.currentState].loc.length

            if (this.frameLoc >= frameAmount) {
                this.frameLoc = 0
                this.endOfAnimation(frameAmount)
            }
        }

        if (this.health <= 0 && this.currentState !== 'death') {
            this.lootDrop.forEach(drop => {
                if (Math.floor(Math.random() * 100) <= drop.chance) {
                    player.addItem(drop.drop, Math.floor(Math.random() * drop.amount))
                }
            })
            this.changeState('death')
            this.onCooldown = true
            currentEvents.push({ event: 'kill', entity: this })
            isQuestUIupdated = false
            playSound('death')
        }
        const distanceXToPlayer = Math.abs(player.x - this.x)
        if (distanceXToPlayer <= this.attackRange && !this.onCooldown && player.y + this.attackRange >= this.y && this.type.allignment === 'enemy') {
            this.attack()
            this.setCooldown(1200)
        } else if (distanceXToPlayer <= this.seeRange && !this.onCooldown && this.type.allignment === 'enemy') {
            if (this.currentState !== 'run') this.changeState('run')
            if (player.x > this.x) {
                this.x += 4
            } else {
                this.x -= 4
            }
            if (this.checkEffect('poison').wasFound) {
                this.health -= .1
            }
        } else {
            if (this.currentState === 'run') this.changeState('idle')
        }

        this.effectTicks++
    }

    draw() {
        let frameX = this.spriteAnimations[this.currentState].loc[this.frameLoc].x // get current locations of the animation
        let frameY = this.spriteAnimations[this.currentState].loc[this.frameLoc].y

        let orientation = (player.x + player.spriteWidth / 2) - (this.x + this.spriteWidth / 2)
        if (this.name === 'elder') {
            orientation = -orientation
        }

        if (orientation <= 0) {
            ctx!.save() // save current state of the canvas
            const drawX = -(this.x + 400 * this.scale)
            ctx!.scale(-1, 1) // invert orientatian of the entity
            ctx!.drawImage(this.img, frameX, frameY, this.spriteWidth, this.spriteHeight, drawX, this.y, 400 * this.scale, 400 * this.scale)
            ctx!.restore()
        } else {
            ctx!.drawImage(this.img, frameX, frameY, this.spriteWidth, this.spriteHeight, this.x, this.y, 400 * this.scale, 400 * this.scale)
        }

    }

    changeState(state: string) {
        this.currentState = state
        this.frameLoc = 0 // reset animation
        this.frames = 0
    }

    takeHit(damage: number): void {
        if (this.health <= 0) return;
        this.changeState('take_hit')
        this.health -= damage
        this.showHealthbar()
    }

    setCooldown(ms: number): void {
        this.onCooldown = true
        setTimeout(() => this.onCooldown = false, ms)
    }

    endOfAnimation(frameAmount: number): void {
        if (this.currentState === 'death') {
            let deadParticles: number[] = []
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i)
                }
            })
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle, 1)
            })

            if (this.isDead) return;
            this.isDead = true
            this.frameLoc = frameAmount - 1
            deadObjects.push(this)
            return
        } else {
            if (this.currentState === 'take_hit') {
                this.changeState('idle')
            } else if (this.currentState === 'attack') {
                const distanceXToPlayer = Math.abs(player.x - this.x)
                if (distanceXToPlayer <= this.attackRange && player.y + this.attackRange >= this.y) {
                    player.takeHit(this.attackDamage)
                }
                this.changeState('idle')
            }
        }
        if (this.type.name === 'trader' && this.currentState === 'open') {
            this.changeState('dialogue')
        }
    }

    attack(): void {
        if (!this.onCooldown) {
            this.changeState('attack')
        }
    }

    showHealthbar() {

        const exists = nonWorldElems.some(o =>
            o.type.name === 'healthbar' &&
            (o as healthbar).entity === this
        );

        if (!exists) {
            const newHealthbar = new healthbar(this);
            nonWorldElems.push(newHealthbar);
        }
    }
    addEffect(effect: effect, duration: number, factor: number) {
        let foundDuplicate = false
        this.effects.forEach(effect1 => {
            if (effect1.effect.name === effect) {
                effect1.duration = duration
                foundDuplicate = true
            }
        })
        if (!foundDuplicate) {
            const image = new Image()
            image.src = effects[effect].particle
            this.effects.push({ effect: effects[effect], duration, factor, index: this.effectCounter })
            particles.push(new particle(this, effects[effect].spriteWidth, effects[effect].spriteHeight, image, this.effectCounter, effects[effect].frameAmount))
            this.effectCounter++
        }
    }

    removeEffect(index: number) {
        for (let i = 0; i < this.effects.length; i++) {
            if (this.effects[i].index === index) {
                this.effects.splice(i, 1)
                break;
            }
        }
        let particleIndex = 0
        particles.forEach((particle, i) => {
            if (particle.counter === index) {
                particleIndex = i
            }
        })
        particles.splice(particleIndex, 1)


    }

    heal(healAmount: number) {
        if (healAmount + this.health >= this.maxHealth) {
            this.health = this.maxHealth
        } else {
            this.health += healAmount
        }
    }

    checkEffect(effect: effect): { wasFound: boolean; effect: effectType | null } {
        let foundEffect = false
        let effect2: effectType | null = null
        this.effects.forEach(effect1 => {
            if (effect1.effect.name === effect) {
                foundEffect = true
                effect2 = effect1
            }
        })
        return { wasFound: foundEffect, effect: effect2 }
    }

    abstract interact(): void
}

class nightBorn extends Entity implements entity {
    worldElem: worldElementNames
    constructor(x: number, y: number, worldElem: worldElementNames, id: number) {
        let image = new Image()
        image.src = 'img/enemies/nightBorn.png'
        const scale = 1.5


        if (y === StaticPositions.OnGround) {
            y = 230
        }

        super(x, y, 300, 300, 80, 80, 20,
            [
                {
                    name: 'idle',
                    frames: 9
                },
                {
                    name: 'run',
                    frames: 6
                },
                {
                    name: 'attack',
                    frames: 12
                },
                {
                    name: 'take_hit',
                    frames: 5
                },
                {
                    name: 'death',
                    frames: 23
                }
            ], image,
            {
                isGround: true /* is it a ground/flying troop */, name: 'nightBorn' /* name of the enemy */, allignment: 'enemy' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: true, interactable: false
            }, scale, [{ amount: 1, drop: "silver_ingot", chance: 100 }], worldElem, 'nightborn', id) // grabs x and y from the parent class
        this.worldElem = worldElem
        this.init()
    }

    interact(): void {
        return
    }
}

class goblin extends Entity implements entity {
    worldElem: worldElementNames
    constructor(x: number, y: number, worldElem: worldElementNames, id: number) {
        let image = new Image()
        image.src = 'img/enemies/goblin.png'
        const scale = 1

        if (y === StaticPositions.OnGround) {
            y = 430
        }

        super(x, y, 50, 150, 150, 150, 10,
            [
                {
                    name: 'idle',
                    frames: 4
                },
                {
                    name: 'attack',
                    frames: 8
                },
                {
                    name: 'attack2',
                    frames: 8
                },
                {
                    name: 'death',
                    frames: 4
                },
                {
                    name: 'run',
                    frames: 8
                },
                {
                    name: 'take_hit',
                    frames: 4
                }
            ], image,
            {
                isGround: true /* is it a ground/flying troop */, name: 'goblin' /* name of the enemy */, allignment: 'enemy' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: true, interactable: false
            }, scale, [{ amount: 2, drop: "leather", chance: 50 }, { amount: 1, drop: "cloth", chance: 10 }, { amount: 1, drop: "string", chance: 25 }], worldElem, 'goblin', id)
        this.worldElem = worldElem
        this.init()
    }
    interact(): void {
        return
    }
}

class skeleton extends Entity implements entity {
    worldElem: worldElementNames
    constructor(x: number, y: number, worldElem: worldElementNames, id: number) {
        let image = new Image()
        image.src = 'img/enemies/skeleton.png'

        const scale = 0.5
        if (y === StaticPositions.OnGround) {
            y = 500
        }

        super(x, y, 15, 200, 96, 64, 17,
            [
                {
                    name: 'idle',
                    frames: 8
                },
                {
                    name: 'attack',
                    frames: 10
                },
                {
                    name: 'death',
                    frames: 13
                },
                {
                    name: 'run',
                    frames: 10
                },
                {
                    name: 'take_hit',
                    frames: 5
                }
            ], image,
            {
                isGround: true /* is it a ground/flying troop */, name: 'skeleton' /* name of the enemy */, allignment: 'enemy' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: true, interactable: false
            }, scale, [{ amount: 1, drop: "stone", chance: 75 }], worldElem, 'skeleton', id) // grabs x and y from the parent class
        this.worldElem = worldElem
        this.init()
    }
    interact(): void {
        return
    }
}

class trader extends Entity implements entity {
    trade: Trade[][]
    worldElem: worldElementNames
    constructor(x: number, y: number, trade: Trade[][], worldElem: worldElementNames, id: number) {
        let image = new Image()
        image.src = 'img/passiveEntities/trader.png'
        const scale = 0.5

        if (y === StaticPositions.OnGround) {
            y = 500
        }

        super(x, y, 50, 200, 128, 128, 10,
            [
                {
                    name: 'idle',
                    frames: 5
                },
                {
                    name: 'greet',
                    frames: 11
                },
                {
                    name: 'open',
                    frames: 11
                },
                {
                    name: 'dialogue',
                    frames: 4
                }
            ], image,
            {
                isGround: true /* is it a ground/flying troop */, name: 'trader' /* name of the enemy */, allignment: 'passive' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: false, interactable: true
            }, scale, [], worldElem, 'trader', id)
        this.worldElem = worldElem
        this.trade = trade
        this.init()
    }
    interact(): void {
        this.changeState('open')
        openTradingMenu(this.trade)
    }
}

class NPC extends Entity implements entity {
    conversation: String[]
    conversationCounter: number
    isSpeaking: boolean
    name: string
    worldElem: worldElementNames
    present: PresentItem[]
    hasGivenPresent: boolean
    quest: quest | null
    constructor(x: number, y: number, worldElem: worldElementNames, pathToImage: string, spriteWidth: number, spriteHeight: number, frameAmount: number, scale: number, conversation: String[], name: string, present: PresentItem[], id: number, quest: quest | null) {
        let image = new Image()
        image.src = pathToImage
        // samurai: SW:96 SH: 96 
        if (y === StaticPositions.OnGround) {
            y = groundY - 400 * scale
        }

        super(x, y, 50, 200, spriteWidth, spriteHeight, 10,
            [
                {
                    name: 'idle',
                    frames: frameAmount
                }
            ], image,
            {
                isGround: true /* is it a ground/flying troop */, name: 'NPC' /* name of the enemy */, allignment: 'passive' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: false, interactable: true
            }, scale, [], worldElem, name, id)

        this.worldElem = worldElem
        this.conversation = conversation
        this.conversationCounter = 0
        this.isSpeaking = false
        this.name = name
        this.present = present
        this.hasGivenPresent = false
        this.quest = quest
        this.init()
    }
    endConversation() {
        if (this.hasGivenPresent) return
        this.present.forEach(item => {
            player.addItem(item.item, item.amount)
        })
        this.hasGivenPresent = true
        if (this.quest) {
            activeQuests.push(this.quest)
            isQuestUIupdated = false
        }
    }

    speak(): void {
        const speakDiv = document.querySelector('#speakWrapper');
        speakDiv?.classList.remove('display-none')
        player.canMove = false
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
}

// player class
class Player implements entity {
    lootDrop: { amount: number, drop: item, chance: number }[]
    x: number
    y: number
    speed: number // current speed at which the player moves
    onGround: boolean // is the player touching the ground
    velocity_Y: number // speed of down-/upward movement
    img: HTMLImageElement
    spriteWidth: number
    health: number
    dragging: string | null
    selectedSlot: number
    interactionRange: number
    attackRangeMultiplier: number
    attackRange3Multiplier: number
    maxHealth: number
    attackDamageMultiplier: number
    attackDamage3Multiplier: number
    spriteHeight: number
    showingText: boolean
    currentState: string // current animation
    onCooldown: boolean // is the player on cooldown
    cooldownMultiplier: number
    cooldownMultiplier3: number
    onInventory: boolean
    onTradingMenu: boolean
    isMoving: boolean
    showedText: boolean
    onSecondaryInventory: boolean
    playerFrames: number // stores a counter which decides if the next frame should be shown
    frameLoc: number // current animation frame
    animationStates: AnimationState[]// stores each animation as an array
    spriteAnimations: Record<string, framesObj> // stores each animation as an object
    isInit: boolean // have the animations been initialised
    Ydirec: number // is the player moving upward/downward
    Xdirec: number // is the player moving right or left
    combo: number // counts the times the player has a combo  TODO
    inventory: Inventory
    armor: InventorySlot[]
    craftingInventory: Inventory
    interactionFocusContainer: container | null
    interactionFocusEntity: entity | null
    interactionFocusGrab: blocks | null
    type: typeObject // info about the type of object
    canMove: boolean
    effects: effectType[]
    effectTicks: number
    effectCounter: number
    id: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.attackRangeMultiplier = 1.3
        this.attackRange3Multiplier = 1.8
        this.speed = 20
        this.onGround = true
        this.onInventory = false
        this.onTradingMenu = false
        this.showedText = false
        this.onSecondaryInventory = false
        this.canMove = true
        this.isMoving = false
        this.velocity_Y = 0
        this.health = 100
        this.maxHealth = 100
        this.interactionRange = 125
        this.dragging = null
        this.selectedSlot = 1
        this.showingText = false
        this.attackDamageMultiplier = 1
        this.attackDamage3Multiplier = 2
        this.interactionFocusContainer = null
        this.interactionFocusEntity = null
        this.interactionFocusGrab = null
        this.inventory = [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            ['supernova', null, null, null, 'big_regeneration_potion'],
        ]
        this.armor = [null, null, null]
        this.craftingInventory = [[null, null, null], [null, null, null], [null, null, null]]
        this.effects = []
        this.effectTicks = 0
        this.Ydirec = 0
        this.Xdirec = 1
        this.img = new Image()
        this.img.src = 'img/player.png'
        this.spriteWidth = 162
        this.type = { isGround: true, name: 'player', allignment: 'passive', moving: false, attackable: false, interactable: false }
        this.spriteHeight = 162
        this.currentState = 'idle'
        this.onCooldown = false
        this.cooldownMultiplier = 1
        this.cooldownMultiplier3 = 1
        this.playerFrames = 0
        this.frameLoc = 0
        this.animationStates = [
            {
                name: 'idle',
                frames: 10
            },
            {
                name: 'attack1',
                frames: 7
            },
            {
                name: 'attack2',
                frames: 7
            },
            {
                name: 'attack3',
                frames: 8
            },
            {
                name: 'death',
                frames: 7
            },
            {
                name: 'fall',
                frames: 3
            },
            {
                name: 'jump',
                frames: 3
            },
            {
                name: 'run',
                frames: 8
            },
            {
                name: 'take_hit',
                frames: 3
            }
        ]
        this.spriteAnimations = {}
        this.isInit = false
        this.combo = 0
        this.effectCounter = 0
        this.lootDrop = []
        this.id = -1

        this.init()
    }

    update() {
        // check for effect ticks
        this.effects.forEach(effect => {
            effect.duration--
            if (effect.duration <= 0) {
                if (effect.effect.name === 'deaths_curse') this.health -= 100
                this.removeEffect(effect.index)
            }
            if (this.effectTicks % effect.effect.ticks === 0) {
                if (effect.effect.effected === undefined) {
                    effect.effect.onTick(this)
                } else {
                    if (effect.effect.effected === false) {
                        effect.effect.onTick(this)
                        effect.effect.effected = true
                    }
                }
            }

            if (document.querySelector(`#${effect.effect.name}`)) {
                const div = document.querySelector(`#${effect.effect.name}`);
                if (div!.querySelector('#duration')) {
                    div!.querySelector('#duration')!.innerHTML = `${effect.duration}`
                }
            }

        })


        // check if player is jumping
        if (!this.onGround && !(gameFrame % staggerFrames)) {
            if (this.Ydirec === 1) { // if he is moving upward 
                this.y -= this.velocity_Y * globalGravity // calculate new y position
                this.velocity_Y -= 0.2 // advance velocity
                if (this.currentState !== 'attack3' && this.currentState !== 'jump') player.changeState('jump')
            } else if (this.Ydirec === 2) {
                this.y += this.velocity_Y * globalGravity // calculate new y position
                this.velocity_Y += 0.2 // advance velocity
                if (this.currentState !== 'attack3' && this.currentState !== 'fall') player.changeState('fall')
            }

            if (this.velocity_Y <= 0) { // invert movement
                this.Ydirec = 2
            }
            if (this.y + this.spriteHeight >= groundY) { // check if player is on the ground
                this.y = groundY - this.spriteHeight
                this.onGround = true // reset values
                this.velocity_Y = 0
                this.Ydirec = 0
                if (this.currentState !== 'attack3') this.changeState('idle')
            } else {
                this.onGround = false
            }
        }

        this.playerFrames++
        if (this.playerFrames >= staggerFrames) { // check if next frame should be drawn
            this.playerFrames = 0 // reset frames
            this.frameLoc++ // advance to next frame
            const frameAmount = this.spriteAnimations[this.currentState].loc.length
            if (this.frameLoc >= frameAmount) { // check if the end of the animation is reached
                this.frameLoc = 0
                this.endOfAnimation() // check if any state should be changed at the end of its execution (one time animation)
            }
        }
        this.effectTicks++
    }

    draw() {
        let frameX = this.spriteAnimations[this.currentState].loc[this.frameLoc].x
        let frameY = this.spriteAnimations[this.currentState].loc[this.frameLoc].y
        if (this.Xdirec === 2) {
            ctx!.save() // save current state of the canvas
            const drawX = -(this.x + 400)
            ctx!.scale(-1, 1) // invert orientatian of the entity
            ctx!.drawImage(this.img, frameX, frameY, this.spriteWidth, this.spriteHeight, drawX, this.y, 450, 450)
            ctx!.restore()
        } else if (this.Xdirec === 1) {
            ctx!.drawImage(this.img, frameX, frameY, this.spriteWidth, this.spriteHeight, this.x, this.y, 450, 450)
        }// (image, sx, sy, sw, sh, dx, dy, dw, dh)
    }

    init() {
        this.animationStates.forEach((state, index) => {
            let frames: framesObj = {
                loc: []
            }
            for (let j = 0; j < state.frames; j++) {
                let positionX = j * this.spriteWidth
                let positionY = index * this.spriteHeight

                frames.loc.push({ x: positionX, y: positionY })
            }

            this.spriteAnimations[state.name] = frames
        })
    }
    changeState(state: string) {
        this.currentState = state
        this.frameLoc = 0 // reset animation
        this.playerFrames = 0
    }

    showHealthbar() {
        const exists = nonWorldElems.some(o =>
            o.type.name === 'healthbar' &&
            (o as healthbar).entity === this
        ); // check if healthbar already exists

        if (!exists) {
            const newHealthbar = new healthbar(this);
            nonWorldElems.push(newHealthbar);
        }
    }

    takeHit(damage: number): void {
        if (this.currentState !== 'attack1' && this.currentState !== 'attack3') this.changeState('take_hit')
        let protection = 100
        this.armor.forEach(armor => {
            if (armor !== null && items[armor].protection) {
                protection -= items[armor].protection
            }
        })
        this.health -= damage * (protection / 100)
        if (this.health < 0) this.health = 0
        this.setCooldown(200)
    }

    setCooldown(ms: number): void {
        this.onCooldown = true
        setTimeout(() => this.onCooldown = false, ms)
    }

    attack(): void {
        gameSpeed = 0 // make the player stop walking
        if (!this.onCooldown) {
            if (this.onGround) {
                this.changeState(`attack1`) // change to attack state
                playSound('slice')
                if (player.inventory[3][this.selectedSlot - 1] !== null) {
                    this.setCooldown(items[player.inventory[3][this.selectedSlot - 1]!].attackCooldown * this.cooldownMultiplier) // set a cooldown
                } else {
                    this.setCooldown(1000)
                }

                setTimeout(() => {
                    worlds[currentWorld].elements.forEach(obj => { // get each entity in range of the attack
                        if (!(obj instanceof Entity)) return
                        const itemKey = this.inventory[3][this.selectedSlot - 1]
                        const item = itemKey ? items[itemKey] : null
                        let rangeValue = (item?.attackRange ?? 150) * this.attackRangeMultiplier
                        if (this.Xdirec === 2) rangeValue + 30
                        const distance = (obj.x + (obj.spriteWidth / 2)) - (this.x + (this.spriteWidth / 2))

                        if (((this.Xdirec === 1 && distance >= 0) || (distance < 0 && this.Xdirec === 2)) && Math.abs(distance) <= rangeValue && obj.type.attackable) { // Xdirec === 1 --> rechts Xdirec === 2 --> Links
                            let attackDamage = (this.inventory[3][this.selectedSlot - 1] ? items[this.inventory[3][this.selectedSlot - 1]!].attackDamage : 1) * this.attackDamageMultiplier
                            if (this.checkEffect('strength').wasFound) {
                                attackDamage += (this.checkEffect('strength').effect?.factor! / 2) * 6
                            }
                            if (this.checkEffect('electrocute').wasFound) {
                                obj.addEffect('thunder_shock', 200, 1)
                            }
                            obj.takeHit(attackDamage)
                            const selectedSlot = this.inventory[3][this.selectedSlot - 1]
                            if (selectedSlot !== null) {
                                if (items[selectedSlot].attack) {
                                    items[selectedSlot].attack(obj)
                                }
                            }
                        }
                    })
                }, 300)
            } else {
                if (this.Ydirec !== 0) {
                    this.changeState(`attack3`) // change to attack state
                    playSound('slice')
                    if (player.inventory[3][this.selectedSlot - 1] !== null) {
                        this.setCooldown(items[player.inventory[3][this.selectedSlot - 1]!].attackCooldown * this.cooldownMultiplier3) // set a cooldown
                    } else {
                        this.setCooldown(1500)
                    }

                    setTimeout(() => {
                        worlds[currentWorld].elements.forEach(obj => { // get each entity in range of the attack
                            if (!(obj instanceof Entity)) return
                            const itemKey = this.inventory[3][this.selectedSlot - 1]
                            const item = itemKey ? items[itemKey] : null
                            let rangeValue = (item?.attackRange ?? 150) * this.attackRange3Multiplier
                            if (this.Xdirec === 2) rangeValue + 30
                            const distance = (obj.x + (obj.spriteWidth / 2)) - (this.x + (this.spriteWidth / 2))

                            if (((this.Xdirec === 1 && distance >= 0) || (distance < 0 && this.Xdirec === 2)) && Math.abs(distance) <= rangeValue && obj.type.attackable) { // Xdirec === 1 --> rechts Xdirec === 2 --> Links
                                let attackDamage = (this.inventory[3][this.selectedSlot - 1] ? items[this.inventory[3][this.selectedSlot - 1]!].attackDamage : 1) * this.attackDamage3Multiplier
                                if (this.checkEffect('strength').wasFound) {
                                    attackDamage += (this.checkEffect('strength').effect?.factor! / 2) * 6
                                }
                                if (this.checkEffect('electrocute').wasFound) {
                                    obj.addEffect('thunder_shock', 200, 1)
                                }
                                obj.takeHit(attackDamage)
                                const selectedSlot = this.inventory[3][this.selectedSlot - 1]
                                if (selectedSlot !== null) {
                                    if (items[selectedSlot].attack) {
                                        items[selectedSlot].attack(obj)
                                    }
                                }
                            }
                        })
                    }, 300)
                }
            }
        }
    }

    jump(): void {
        if (!player.onCooldown && player.onGround) {
            player.onGround = false
            player.velocity_Y = 1
            player.Ydirec = 1
        }
    }

    endOfAnimation(): void {
        if (this.currentState === 'attack1' || this.currentState === 'take_hit' || this.currentState === 'attack3') { // reset animation
            this.changeState('idle')
        }
    }

    useItem(): void {
        const currentItem = player.inventory[3][this.selectedSlot - 1]
        if (!currentItem) return
        if (items[player.inventory[3][this.selectedSlot - 1]!].clearsAfterUse) player.inventory[3][this.selectedSlot - 1] = null
        items[currentItem].use()
        updateHotbar()
    }

    heal(healAmount: number) {
        if (healAmount + this.health >= this.maxHealth) {
            this.health = this.maxHealth
        } else {
            this.health += healAmount
        }
    }

    interact() {
        if (this.interactionFocusContainer) this.interactionFocusContainer.interact()
        else if (this.interactionFocusEntity) this.interactionFocusEntity.interact()
        else if (this.interactionFocusGrab) this.interactionFocusGrab.interact()
    }

    addItem(item: item, amount: number) {
        let itemCounter = 0
        outerLoop: for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 5; x++) {
                if (player.inventory[y][x] === null) {
                    player.inventory[y][x] = item
                    itemCounter++

                    if (itemCounter >= amount) {
                        break outerLoop
                    }
                }
            }
        }
        if (itemCounter < amount) {
            displayInfo('Not enough space!')
        }

        updateHotbar()
    }

    addEffect(effect: effect, duration: number, factor: number) {
        let foundDuplicate = false
        this.effects.forEach(effect1 => {
            if (effect1.effect.name === effect) {
                effect1.duration = duration
                foundDuplicate = true
            }
        })
        if (!foundDuplicate) {
            const image = new Image()
            image.src = effects[effect].particle
            this.effects.push({ effect: effects[effect], duration, factor, index: this.effectCounter })
            particles.push(new particle(this, effects[effect].spriteWidth, effects[effect].spriteHeight, image, this.effectCounter, effects[effect].frameAmount))
            this.effectCounter++
            const innerDiv = document.createElement('div')
            innerDiv.id = `${effect}`
            const div = document.querySelector('.effect-icons-div');
            const effectIcon = document.createElement('div')
            effectIcon.title = effects[effect].name
            const durationDiv = document.createElement('h3')
            durationDiv.textContent = String(duration)
            durationDiv.id = 'duration'
            effectIcon.classList.add('effectIcon')
            effectIcon.style.backgroundImage = `url(${effects[effect].icon})`

            innerDiv?.appendChild(effectIcon)
            innerDiv?.appendChild(durationDiv)
            div?.appendChild(innerDiv)
        }
    }

    removeEffect(index: number) {
        for (let i = 0; i < this.effects.length; i++) {
            if (this.effects[i].index === index) {
                document.querySelector(`#${this.effects[i].effect.name}`)!.remove()
                if (this.effects[i].effect.name === 'healthboost') this.maxHealth = this.maxHealth / 1.5
                this.effects.splice(i, 1)
                break;
            }
        }

        let particleIndex = 0
        particles.forEach((particle, i) => {
            if (particle.counter === index) {
                particleIndex = i
            }
        })
        particles.splice(particleIndex, 1)


    }

    checkEffect(effect: effect): { wasFound: boolean; effect: effectType | null } {
        let foundEffect = false
        let effect2: effectType | null = null
        this.effects.forEach(effect1 => {
            if (effect1.effect.name === effect) {
                foundEffect = true
                effect2 = effect1
            }
        })
        return { wasFound: foundEffect, effect: effect2 }
    }
}

// inventory logic
function openInventory() {
    player.onInventory = true
    const inventoryDiv = document.querySelector('.inventory-div')
    const playerDiv = document.querySelector('.player-data')
    inventoryDiv?.classList.remove('display-none')

    renderInventory()
}

function parseSlotId(id: string) {
    const match = id.match(/(slot|secondarySlot|armorSlot|craftingSlot)(\d+)(\d+)/)
    if (!match) throw new Error('Invalid ID!')
    return {
        x: Number(match[2]),
        y: Number(match[3])
    }
}

function updateHotbar() {
    for (let x = 0; x < 5; x++) {
        const hotbarSlot = document.querySelector(`#hotbar${x + 1}`)!
        hotbarSlot.innerHTML = ''

        if (player.inventory[3][x] !== null) {
            const itemDivHotbar = document.createElement('div')
            itemDivHotbar.classList.add('slotItem')
            itemDivHotbar.style.scale = `${items[player.inventory[3][x]!].scale + 1}`
            itemDivHotbar.style.width = `${items[player.inventory[3][x]!].width}px`
            itemDivHotbar.style.height = `${items[player.inventory[3][x]!].height}px`
            itemDivHotbar.style.backgroundImage = `url(img/items/${items[player.inventory[3][x]!].src})`
            itemDivHotbar.style.backgroundPosition = `-${items[player.inventory[3][x]!].spriteX}px -${items[player.inventory[3][x]!].spriteY}px`
            hotbarSlot.appendChild(itemDivHotbar)
        }
    }
}

function advanceConversation(NPC: entity): void {
    const speakBtn = document.querySelector('#speakBtn') as HTMLButtonElement;
    const speak = document.querySelector('.speak') as HTMLElement;

    if (NPC.conversationCounter! >= NPC.conversation!.length) {
        const speakDiv = document.querySelector('#speakWrapper');
        speakDiv?.classList.add('display-none')
        NPC.conversationCounter = 0
        player.canMove = true
        NPC.isSpeaking = false
        if (!NPC.endConversation) return
        NPC.endConversation()
        return
    }

    const charArray = NPC.conversation![NPC.conversationCounter!].split('')
    let counter = 0
    let interval = setInterval(() => {
        speak.innerHTML += charArray[counter]
        counter++
        if (counter >= charArray.length) {
            clearInterval(interval)
            NPC.conversationCounter!++
            speakBtn.classList.remove('display-none')
            speakBtn.replaceWith(speakBtn.cloneNode(true) as HTMLButtonElement)
            const newSpeakBtn = document.querySelector('#speakBtn') as HTMLButtonElement;
            newSpeakBtn.addEventListener('click', () => {
                speak.innerHTML = ''
                newSpeakBtn.classList.add('display-none')
                advanceConversation(NPC)
            })
        }
    }, 50);
}

function renderInventory() {
    document.querySelector('.inventory-div')!.innerHTML = `<div class="armor-div"></div><div class="slots-div"></div><div class="player-data"></div>`

    const playerDiv = document.querySelector('.player-data')
    const armorDiv = document.querySelector('.armor-div')
    playerDiv!.innerHTML = `<h2>No item selected</h2>`

    // add each armor slot
    for (let i = 0; i < 3; i++) {
        const slot = document.createElement('div')
        if (i === 0) {
            slot.classList.add('helmet')
        } else if (i === 1) {
            slot.classList.add('chestplate')
        } else {
            slot.classList.add('boots')
        }
        slot.classList.add('armorSlot')
        slot.classList.add('inv-slot')
        slot.id = `armorSlot${i}0`
        armorDiv?.appendChild(slot)
    }
    // add each armor item
    for (let i = 0; i < 3; i++) {
        if (player.armor[i] !== null) {
            const itemDiv = document.createElement('div')
            itemDiv.classList.add('item')
            itemDiv.addEventListener('click', (e) => {
                e.stopPropagation()
                player.dragging = (e.target as HTMLDivElement).parentElement!.id
                document.querySelector('body')?.classList.add('grab')
                if (player.armor[i] !== null) {
                    if (items[player.armor[i]!].type === 'armor')
                        playerDiv!.innerHTML = `<h2>${player.armor[i]!.replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[player.armor[i]!].protection}%</h3>${items[player.armor[i]!].onUse !== '' ? '<br><h2>On use: ' + items[player.armor[i]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.armor[i]!].description} </h2>`
                }
            })
            itemDiv.addEventListener('mousedown', (e) => {
                e.stopPropagation()
                if (player.armor[i] !== null && e.button === 2 && items[player.armor[i]!].type === 'armor') {
                    playerDiv!.innerHTML = `<h2>${player.armor[i]!.replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[player.armor[i]!].protection}%</h3>${items[player.armor[i]!].onUse !== '' ? '<br><h2>On use: ' + items[player.armor[i]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.armor[i]!].description} </h2>`
                }
            })
            itemDiv.style.backgroundImage = `url(img/items/${items[player.armor[i]!].src})`
            itemDiv.style.width = `${items[player.armor[i]!].width}px`
            itemDiv.style.height = `${items[player.armor[i]!].height}px`
            itemDiv.style.scale = `${items[player.armor[i]!].scale}`
            itemDiv.style.backgroundPosition = `-${items[player.armor[i]!].spriteX}px -${items[player.armor[i]!].spriteY}px`
            document.querySelector(`#armorSlot${i}0`)!.appendChild(itemDiv)
        }
    }
    // add each slot
    for (let y = 0; y < player.inventory.length; y++) {
        for (let x = 0; x < player.inventory[y].length; x++) {
            const slot = document.createElement('div')
            slot.classList.add('inv-slot')
            slot.classList.add('primarySlot')
            slot.id = `slot${x}${y}`
            document.querySelector('.slots-div')?.appendChild(slot)
        }
    }
    // add each item
    for (let y = 0; y < player.inventory.length; y++) {
        for (let x = 0; x < player.inventory[y].length; x++) {

            if (player.inventory[y][x] !== null) {
                const itemDiv = document.createElement('div')
                itemDiv.classList.add('item')
                itemDiv.addEventListener('click', (e) => {
                    e.stopPropagation()
                    player.dragging = (e.target as HTMLDivElement).parentElement!.id
                    document.querySelector('body')?.classList.add('grab')
                    if (player.inventory[y][x] !== null) {
                        if (items[player.inventory[y][x]!].type === 'armor') {
                            playerDiv!.innerHTML = `<h2>${player.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[player.inventory[y][x]!].protection}%</h3>${items[player.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.inventory[y][x]!].description} </h2>`
                        } else if (items[player.inventory[y][x]!].type === 'weapon') {
                            playerDiv!.innerHTML = `<h2>${player.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br> <h3>Attack Damage: ${items[player.inventory[y][x]!].attackDamage}</h3> <br><h3>Attack Speed: ${items[player.inventory[y][x]!].attackCooldown / 1000}s</h3><br><h3>Attack Range: ${items[player.inventory[y][x]!].attackRange}</h3>${items[player.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.inventory[y][x]!].description} </h2>`
                        } else if (items[player.inventory[y][x]!].type === 'food') {
                            playerDiv!.innerHTML = `<h2>${player.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br> ${items[player.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.inventory[y][x]!].description} </h2>`
                        } else {
                            playerDiv!.innerHTML = `<h2>${player.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br>${items[player.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.inventory[y][x]!].description} </h2>`
                        }
                    }
                })
                itemDiv.addEventListener('mousedown', (e) => {
                    e.stopPropagation()
                    if (player.inventory[y][x] !== null && e.button === 2) {
                        if (items[player.inventory[y][x]!].type === 'armor') {
                            playerDiv!.innerHTML = `<h2>${player.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[player.inventory[y][x]!].protection}%</h3>${items[player.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.inventory[y][x]!].description} </h2>`
                        } else if (items[player.inventory[y][x]!].type === 'weapon') {
                            playerDiv!.innerHTML = `<h2>${player.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br> <h3>Attack Damage: ${items[player.inventory[y][x]!].attackDamage}</h3> <br><h3>Attack Speed: ${items[player.inventory[y][x]!].attackCooldown / 1000}s</h3><br><h3>Attack Range: ${items[player.inventory[y][x]!].attackRange}</h3>${items[player.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.inventory[y][x]!].description} </h2>`
                        } else if (items[player.inventory[y][x]!].type === 'food') {
                            playerDiv!.innerHTML = `<h2>${player.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br> ${items[player.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.inventory[y][x]!].description} </h2>`
                        } else {
                            playerDiv!.innerHTML = `<h2>${player.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br>${items[player.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.inventory[y][x]!].description} </h2>`
                        }
                    }
                })
                itemDiv.style.backgroundImage = `url(img/items/${items[player.inventory[y][x]!].src})`
                itemDiv.style.width = `${items[player.inventory[y][x]!].width}px`
                itemDiv.style.height = `${items[player.inventory[y][x]!].height}px`
                itemDiv.style.scale = `${items[player.inventory[y][x]!].scale}`
                itemDiv.style.backgroundPosition = `-${items[player.inventory[y][x]!].spriteX}px -${items[player.inventory[y][x]!].spriteY}px`
                document.querySelector(`#slot${x}${y}`)!.appendChild(itemDiv)

                if (y === 3) {
                    const itemDivHotbar = document.createElement('div')
                    itemDivHotbar.classList.add('slotItem')
                    itemDivHotbar.style.scale = `${items[player.inventory[y][x]!].scale + 1}`
                    itemDivHotbar.style.width = `${items[player.inventory[y][x]!].width}px`
                    itemDivHotbar.style.height = `${items[player.inventory[y][x]!].height}px`
                    itemDivHotbar.style.backgroundImage = `url(img/items/${items[player.inventory[y][x]!].src})`
                    itemDivHotbar.style.backgroundPosition = `-${items[player.inventory[y][x]!].spriteX}px -${items[player.inventory[y][x]!].spriteY}px`
                    document.querySelector(`#hotbar${x + 1}`)!.innerHTML = ''
                    document.querySelector(`#hotbar${x + 1}`)!.appendChild(itemDivHotbar)
                }
            } else {
                if (y === 3) {
                    document.querySelector(`#hotbar${x + 1}`)!.innerHTML = ''
                }
            }
        }
    }

    // crafting
    const craftingDiv = document.querySelector('.crafting-div');
    craftingDiv!.innerHTML = ''
    craftingDiv?.classList.remove('display-none')
    const innerDiv = document.createElement('div')
    innerDiv.classList.add('grid')
    const arrowDiv = document.createElement('div')
    arrowDiv.addEventListener('click', () => {
        const recipe = checkForRecipes()
        if (recipe.isValid && recipe.output) {
            player.addItem(recipe.output, 1)
            player.craftingInventory = [[null, null, null], [null, null, null], [null, null, null]]
            renderInventory()
        }
    })
    arrowDiv.classList.add('arrow')
    arrowDiv.classList.add('arrow1')
    const outputDiv = document.createElement('div')
    outputDiv.classList.add('crafting-slot')
    outputDiv.classList.add('inv-slot')
    outputDiv.id = 'output'
    outputDiv.addEventListener('click', () => {
        const recipe = checkForRecipes()
        if (recipe.isValid && recipe.output) {
            player.addItem(recipe.output, 1)
            player.craftingInventory = [[null, null, null], [null, null, null], [null, null, null]]
            renderInventory()
        }
    })

    arrowDiv.classList.add('margin-top')
    outputDiv.classList.add('margin-top')


    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            const slot = document.createElement('div')
            slot.classList.add('crafting-slot')
            slot.classList.add('inv-slot')
            slot.id = `craftingSlot${x}${y}`
            innerDiv?.appendChild(slot)
        }
    }
    craftingDiv?.appendChild(innerDiv)
    craftingDiv?.appendChild(arrowDiv)
    craftingDiv?.appendChild(outputDiv)

    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            if (player.craftingInventory[y][x] !== null) {
                const itemDiv = document.createElement('div')
                itemDiv.classList.add('item')
                itemDiv.addEventListener('click', (e) => {
                    e.stopPropagation()
                    player.dragging = (e.target as HTMLDivElement).parentElement!.id
                    document.querySelector('body')?.classList.add('grab')
                    if (player.craftingInventory[y][x] !== null) {
                        if (items[player.craftingInventory[y][x]!].type === 'armor') {
                            playerDiv!.innerHTML = `<h2>${player.craftingInventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[player.craftingInventory[y][x]!].protection}%</h3>${items[player.craftingInventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.craftingInventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.craftingInventory[y][x]!].description} </h2>`
                        } else if (items[player.craftingInventory[y][x]!].type === 'weapon') {
                            playerDiv!.innerHTML = `<h2>${player.craftingInventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br> <h3>Attack Damage: ${items[player.craftingInventory[y][x]!].attackDamage}</h3> <br><h3>Attack Speed: ${items[player.craftingInventory[y][x]!].attackCooldown / 1000}s</h3><br><h3>Attack Range: ${items[player.craftingInventory[y][x]!].attackRange}</h3>${items[player.craftingInventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.craftingInventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.craftingInventory[y][x]!].description} </h2>`
                        } else if (items[player.craftingInventory[y][x]!].type === 'food') {
                            playerDiv!.innerHTML = `<h2>${player.craftingInventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br> ${items[player.craftingInventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.craftingInventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.craftingInventory[y][x]!].description} </h2>`
                        } else {
                            playerDiv!.innerHTML = `<h2>${player.craftingInventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br>${items[player.craftingInventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.craftingInventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.craftingInventory[y][x]!].description} </h2>`
                        }
                    }
                })
                itemDiv.addEventListener('mousedown', (e) => {
                    e.stopPropagation()
                    if (player.craftingInventory[y][x] !== null && e.button === 2) {
                        if (items[player.craftingInventory[y][x]!].type === 'armor') {
                            playerDiv!.innerHTML = `<h2>${player.craftingInventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[player.craftingInventory[y][x]!].protection}%</h3>${items[player.craftingInventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.craftingInventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.craftingInventory[y][x]!].description} </h2>`
                        } else if (items[player.craftingInventory[y][x]!].type === 'weapon') {
                            playerDiv!.innerHTML = `<h2>${player.craftingInventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br> <h3>Attack Damage: ${items[player.craftingInventory[y][x]!].attackDamage}</h3> <br><h3>Attack Speed: ${items[player.craftingInventory[y][x]!].attackCooldown / 1000}s</h3><br><h3>Attack Range: ${items[player.craftingInventory[y][x]!].attackRange}</h3>${items[player.craftingInventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.craftingInventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.craftingInventory[y][x]!].description} </h2>`
                        } else if (items[player.craftingInventory[y][x]!].type === 'food') {
                            playerDiv!.innerHTML = `<h2>${player.craftingInventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br> ${items[player.craftingInventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.craftingInventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.craftingInventory[y][x]!].description} </h2>`
                        } else {
                            playerDiv!.innerHTML = `<h2>${player.craftingInventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br>${items[player.craftingInventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[player.craftingInventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.craftingInventory[y][x]!].description} </h2>`
                        }
                    }
                })
                itemDiv.style.backgroundImage = `url(img/items/${items[player.craftingInventory[y][x]!].src})`
                itemDiv.style.width = `${items[player.craftingInventory[y][x]!].width}px`
                itemDiv.style.height = `${items[player.craftingInventory[y][x]!].height}px`
                itemDiv.style.scale = `${items[player.craftingInventory[y][x]!].scale}`
                itemDiv.style.backgroundPosition = `-${items[player.craftingInventory[y][x]!].spriteX}px -${items[player.craftingInventory[y][x]!].spriteY}px`
                document.querySelector(`#craftingSlot${x}${y}`)!.appendChild(itemDiv)
            }
        }
    }
    const recipe = checkForRecipes()
    if (recipe.isValid && recipe.output) {
        const itemDiv = document.createElement('div')
        itemDiv.classList.add('item')
        itemDiv.style.backgroundImage = `url(img/items/${items[recipe.output].src})`
        itemDiv.style.width = `${items[recipe.output].width}px`
        itemDiv.style.height = `${items[recipe.output].height}px`
        itemDiv.style.scale = `${items[recipe.output].scale}`
        itemDiv.style.backgroundPosition = `-${items[recipe.output].spriteX}px -${items[recipe.output].spriteY}px`

        outputDiv.appendChild(itemDiv)
    }

    // add all of the drop logic
    document.querySelectorAll('.primarySlot').forEach(slot => {
        slot.addEventListener('click', e => {
            e.preventDefault();
            document.querySelector('body')?.classList.remove('grab')

            if (!player.dragging) return;

            const targetElement = (e.target as HTMLElement).closest('.inv-slot') as HTMLDivElement;

            const dragSlot = parseSlotId(player.dragging);
            const targetSlot = parseSlotId(targetElement.id);

            if (player.inventory[targetSlot.y][targetSlot.x] !== null) return;

            if (player.dragging.slice(0, 13) === 'secondarySlot') {
                const temp = player.interactionFocusContainer!.inventory[dragSlot.y][dragSlot.x]
                player.interactionFocusContainer!.inventory[dragSlot.y][dragSlot.x] = null
                player.inventory[targetSlot.y][targetSlot.x] = temp
            } else if (player.dragging.slice(0, 12) === 'craftingSlot') {
                const temp = player.craftingInventory[dragSlot.y][dragSlot.x]
                player.craftingInventory[dragSlot.y][dragSlot.x] = null
                player.inventory[targetSlot.y][targetSlot.x] = temp
            } else if (player.dragging.slice(0, 9) === 'armorSlot') {
                const temp = player.armor[dragSlot.x]
                player.armor[dragSlot.x] = null
                player.inventory[targetSlot.y][targetSlot.x] = temp
            } else if (player.dragging.slice(0, 4) === 'slot') {
                const temp = player.inventory[dragSlot.y][dragSlot.x]
                player.inventory[dragSlot.y][dragSlot.x] = null
                player.inventory[targetSlot.y][targetSlot.x] = temp
            }
            player.dragging = null
            renderInventory();
            if (player.onSecondaryInventory) renderSecondaryContainer(player.interactionFocusContainer!);
        });
    });

    document.querySelectorAll('.armorSlot').forEach(slot => {
        slot.addEventListener('click', e => {
            e.preventDefault();
            document.querySelector('body')?.classList.remove('grab')

            if (!player.dragging) return;

            const targetElement = (e.target as HTMLElement).closest('.inv-slot') as HTMLDivElement;

            const dragSlot = parseSlotId(player.dragging);
            const targetSlot = parseSlotId(targetElement.id);

            if (player.armor[targetSlot.x] !== null) return;

            if (player.dragging.slice(0, 13) === 'secondarySlot') {
                const temp = player.interactionFocusContainer!.inventory[dragSlot.y][dragSlot.x]
                if (items[temp!].type !== 'armor' || ((targetSlot.x === 0 && items[temp!].slot !== 'helmet') || (targetSlot.x === 1 && items[temp!].slot !== 'chestplate') || (targetSlot.x === 2 && items[temp!].slot !== 'boots'))) {
                    displayInfo('Item doesn\'t fit this slot!')
                    return;
                }
                player.interactionFocusContainer!.inventory[dragSlot.y][dragSlot.x] = null
                player.armor[targetSlot.x] = temp
            } else if (player.dragging.slice(0, 9) === 'armorSlot') {
                const temp = player.armor[dragSlot.x]
                if (items[temp!].type !== 'armor' || ((targetSlot.x === 0 && items[temp!].slot !== 'helmet') || (targetSlot.x === 1 && items[temp!].slot !== 'chestplate') || (targetSlot.x === 2 && items[temp!].slot !== 'boots'))) {
                    displayInfo('Item doesn\'t fit this slot!')
                    return;
                }
                player.armor[dragSlot.x] = null
                player.armor[targetSlot.x] = temp
            } else if (player.dragging.slice(0, 4) === 'slot') {
                const temp = player.inventory[dragSlot.y][dragSlot.x]
                if (items[temp!].type !== 'armor' || ((targetSlot.x === 0 && items[temp!].slot !== 'helmet') || (targetSlot.x === 1 && items[temp!].slot !== 'chestplate') || (targetSlot.x === 2 && items[temp!].slot !== 'boots'))) {
                    displayInfo('Item doesn\'t fit this slot!')
                    return;
                }
                player.inventory[dragSlot.y][dragSlot.x] = null
                player.armor[targetSlot.x] = temp
            } else if (player.dragging.slice(0, 12) === 'craftingSlot') {
                const temp = player.craftingInventory[dragSlot.y][dragSlot.x]
                if (items[temp!].type !== 'armor' || ((targetSlot.x === 0 && items[temp!].slot !== 'helmet') || (targetSlot.x === 1 && items[temp!].slot !== 'chestplate') || (targetSlot.x === 2 && items[temp!].slot !== 'boots'))) {
                    displayInfo('Item doesn\'t fit this slot!')
                    return;
                }
                player.craftingInventory[dragSlot.y][dragSlot.x] = null
                player.armor[targetSlot.x] = temp
            }

            player.dragging = null
            renderInventory();
            if (player.onSecondaryInventory) renderSecondaryContainer(player.interactionFocusContainer!);
        });
    });

    document.querySelectorAll('.crafting-slot').forEach(slot => {
        slot.addEventListener('click', e => {
            e.preventDefault();
            document.querySelector('body')?.classList.remove('grab')
            if (!player.dragging) return;

            const targetElement = (e.target as HTMLElement).closest('.inv-slot') as HTMLDivElement;

            const dragSlot = parseSlotId(player.dragging);
            const targetSlot = parseSlotId(targetElement.id);


            if (player.craftingInventory[targetSlot.y][targetSlot.x] !== null) return;

            if (player.dragging.slice(0, 13) === 'secondarySlot') {
                const temp = player.interactionFocusContainer!.inventory[dragSlot.y][dragSlot.x]
                player.interactionFocusContainer!.inventory[dragSlot.y][dragSlot.x] = null
                player.craftingInventory[targetSlot.y][targetSlot.x] = temp
            } else if (player.dragging.slice(0, 9) === 'armorSlot') {
                const temp = player.armor[dragSlot.x]
                player.armor[dragSlot.x] = null
                player.craftingInventory[targetSlot.y][targetSlot.x] = temp
            } else if (player.dragging.slice(0, 4) === 'slot') {
                const temp = player.inventory[dragSlot.y][dragSlot.x]
                player.inventory[dragSlot.y][dragSlot.x] = null
                player.craftingInventory[targetSlot.y][targetSlot.x] = temp
            } else if (player.dragging.slice(0, 12) === 'craftingSlot') {
                const temp = player.craftingInventory[dragSlot.y][dragSlot.x]
                player.craftingInventory[dragSlot.y][dragSlot.x] = null
                player.craftingInventory[targetSlot.y][targetSlot.x] = temp
            }
            player.dragging = null
            renderInventory();
            if (player.onSecondaryInventory) renderSecondaryContainer(player.interactionFocusContainer!);
        });
    });
}

function closeInventory() {
    const inventoryDiv = document.querySelector('.inventory-div')
    const craftingDiv = document.querySelector('.crafting-div');
    craftingDiv?.classList.add('display-none')
    inventoryDiv?.classList.add('display-none')
    document.querySelector('.slots-div')!.innerHTML = ''
    document.querySelector('.player-data')!.innerHTML = ''

    player.onInventory = false
    if (player.onSecondaryInventory) {
        const container = document.querySelector('.container')
        container!.classList.add('display-none')
        document.querySelector('#slot-div-container')!.innerHTML = ''
        player.onSecondaryInventory = false
    }
}

function openSecondaryContainer(container: container) {
    if (player.onSecondaryInventory) return;
    player.onSecondaryInventory = true
    const inventoryDiv = document.querySelector('.container')
    inventoryDiv!.classList.remove('display-none')

    container.changeState('open')

    renderSecondaryContainer(container)
}

function renderSecondaryContainer(container: container) {

    document.querySelector('.container')!.innerHTML = `<div div class="slots-div" id = "slot-div-container" > </div>`

    const playerDiv = document.querySelector('.player-data')
    for (let y = 0; y < container.inventory.length; y++) {
        for (let x = 0; x < container.inventory[y].length; x++) {
            const slot = document.createElement('div')
            slot.classList.add('inv-slot')
            slot.classList.add('secondarySlot')
            slot.id = `secondarySlot${x}${y}`
            document.querySelector('#slot-div-container')?.appendChild(slot)
        }
    }
    for (let y = 0; y < container.inventory.length; y++) {
        for (let x = 0; x < container.inventory[y].length; x++) {
            if (container.inventory[y][x] !== null) {
                const itemDiv = document.createElement('div')
                itemDiv.classList.add('item')
                itemDiv.addEventListener('click', (e) => {
                    e.stopPropagation()
                    player.dragging = (e.target as HTMLDivElement).parentElement!.id
                    document.querySelector('body')?.classList.add('grab')
                    if (player.inventory[y][x] !== null) {

                        if (items[container.inventory[y][x]!].type === 'armor') {
                            playerDiv!.innerHTML = `<h2>${container.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[container.inventory[y][x]!].protection}%</h3>${items[container.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]!].description} </h2>`
                        } else if (items[container.inventory[y][x]!].type === 'weapon') {
                            playerDiv!.innerHTML = `<h2>${container.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br> <h3>Attack Damage: ${items[container.inventory[y][x]!].attackDamage}</h3> <br><h3>Attack Speed: ${items[container.inventory[y][x]!].attackCooldown / 1000}s</h3><br><h3>Attack Range: ${items[container.inventory[y][x]!].attackRange}</h3>${items[container.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]!].description} </h2>`
                        } else if (items[container.inventory[y][x]!].type === 'food') {
                            playerDiv!.innerHTML = `<h2>${container.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br> ${items[container.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]!].description} </h2>`
                        } else {
                            playerDiv!.innerHTML = `<h2>${container.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br>${items[container.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]!].description} </h2>`
                        }
                    }
                })
                itemDiv.addEventListener('mousedown', (e) => {
                    e.stopPropagation()
                    if (container.inventory[y][x] !== null && e.button === 2) {
                        if (items[container.inventory[y][x]!].type === 'armor') {
                            playerDiv!.innerHTML = `<h2>${container.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[container.inventory[y][x]!].protection}%</h3>${items[container.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]!].description} </h2>`
                        } else if (items[container.inventory[y][x]!].type === 'weapon') {
                            playerDiv!.innerHTML = `<h2>${container.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br> <h3>Attack Damage: ${items[container.inventory[y][x]!].attackDamage}</h3> <br><h3>Attack Speed: ${items[container.inventory[y][x]!].attackCooldown / 1000}s</h3><br><h3>Attack Range: ${items[container.inventory[y][x]!].attackRange}</h3>${items[container.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]!].description} </h2>`
                        } else if (items[container.inventory[y][x]!].type === 'food') {
                            playerDiv!.innerHTML = `<h2>${container.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br> ${items[container.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]!].description} </h2>`
                        } else {
                            playerDiv!.innerHTML = `<h2>${container.inventory[y][x]!.replace(/_/g, ' ').toUpperCase()}</h2> <br>${items[container.inventory[y][x]!].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]!].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]!].description} </h2>`
                        }
                    }
                })

                itemDiv.style.backgroundImage = `url(img/items/${items[container.inventory[y][x]!].src})`
                itemDiv.style.width = `${items[container.inventory[y][x]!].width}px`
                itemDiv.style.height = `${items[container.inventory[y][x]!].height}px`
                itemDiv.style.scale = `${items[container.inventory[y][x]!].scale}`
                itemDiv.style.backgroundPosition = `-${items[container.inventory[y][x]!].spriteX}px -${items[container.inventory[y][x]!].spriteY}px`
                document.querySelector(`#secondarySlot${x}${y}`)!.appendChild(itemDiv)
            }
        }
    }
    document.querySelectorAll('.secondarySlot').forEach(slot => {

        slot.addEventListener('click', e => {
            e.preventDefault();

            if (!player.dragging) return;
            document.querySelector('body')?.classList.remove('grab')

            // Slot, auf den das Item fallen soll
            const targetElement = (e.target as HTMLElement).closest('.inv-slot') as HTMLDivElement;

            const dragSlot = parseSlotId(player.dragging); // { x, y }

            const targetSlot = parseSlotId(targetElement.id); // { x, y }

            if (player.interactionFocusContainer!.inventory[targetSlot.y][targetSlot.x] !== null) return;

            if (player.dragging.slice(0, 4) === 'slot') {
                const temp = player.inventory[dragSlot.y][dragSlot.x]
                player.inventory[dragSlot.y][dragSlot.x] = null
                player.interactionFocusContainer!.inventory[targetSlot.y][targetSlot.x] = temp
            } else if (player.dragging.slice(0, 9) === 'armorSlot') {
                const temp = player.armor[dragSlot.x]
                player.armor[dragSlot.x] = null
                player.interactionFocusContainer!.inventory[targetSlot.y][targetSlot.x] = temp
            } else if (player.dragging.slice(0, 13) === 'secondarySlot') {
                const temp = player.interactionFocusContainer!.inventory[dragSlot.y][dragSlot.x]
                player.interactionFocusContainer!.inventory[dragSlot.y][dragSlot.x] = null
                player.interactionFocusContainer!.inventory[targetSlot.y][targetSlot.x] = temp
            } else if (player.dragging.slice(0, 12) === 'craftingSlot') {
                const temp = player.craftingInventory[dragSlot.y][dragSlot.x]
                player.craftingInventory[dragSlot.y][dragSlot.x] = null
                player.interactionFocusContainer!.inventory[targetSlot.y][targetSlot.x] = temp
            }
            player.dragging = null
            renderInventory();
            if (player.onSecondaryInventory) renderSecondaryContainer(player.interactionFocusContainer!);
        });
    });

}

function changeSelectedSlot(slot: number) {
    player.selectedSlot = slot

    for (let i = 1; i < 6; i++) {
        document.querySelector(`#hotbar${i}`)!.classList.remove('selected')
    }

    document.querySelector(`#hotbar${slot}`)!.classList.add('selected')
}

function openTradingMenu(trades: Trade[][]) {
    player.onTradingMenu = true
    const tradingMenu = document.querySelector('#trading-menu');
    tradingMenu!.classList.remove('display-none')
    tradingMenu!.innerHTML = ''

    let i = 0
    trades.forEach(trade => {
        const itemGiveDiv = document.createElement('div')
        itemGiveDiv.style.backgroundImage = `url(img/items/${items[trade[0].item].src})`
        itemGiveDiv.style.width = `${items[trade[0].item].width}px`
        itemGiveDiv.style.height = `${items[trade[0].item].height}px`
        itemGiveDiv.style.scale = `${items[trade[0].item].scale}`
        itemGiveDiv.style.backgroundPosition = `-${items[trade[0].item].spriteX}px -${items[trade[0].item].spriteY}px`

        const itemTakeDiv = document.createElement('div')
        itemTakeDiv.style.backgroundImage = `url(img/items/${items[trade[1].item].src})`
        itemTakeDiv.style.width = `${items[trade[1].item].width}px`
        itemTakeDiv.style.height = `${items[trade[1].item].height}px`
        itemTakeDiv.style.scale = `${items[trade[1].item].scale}`
        itemTakeDiv.style.backgroundPosition = `-${items[trade[1].item].spriteX}px -${items[trade[1].item].spriteY}px`
        itemGiveDiv.style.margin = '25px'
        itemTakeDiv.style.margin = '25px'

        const innerDiv = document.createElement('div')
        innerDiv.id = `innerDiv${i}`
        innerDiv.classList.add('flex-center', 'innerDiv')
        tradingMenu!.appendChild(innerDiv)
        const innerDiv1 = document.querySelector(`#innerDiv${i}`)
        const arrow = document.createElement('div')
        arrow.classList.add('arrow')
        const amount1 = document.createElement('h3')
        const amount2 = document.createElement('h3')
        amount1.textContent = String(trade[0].amount)
        amount2.textContent = String(trade[1].amount)

        innerDiv1!.appendChild(itemGiveDiv)
        innerDiv1!.appendChild(amount1)
        innerDiv1!.appendChild(arrow)
        innerDiv1!.appendChild(itemTakeDiv)
        innerDiv1!.appendChild(amount2)

        const button = document.createElement('div')
        button.classList.add('margin-16', 'confirm-btn')
        button.addEventListener('click', () => confirmTrade(trade))
        innerDiv1!.appendChild(button)
        i++
    })
}

function closeTradingMenu() {
    document.querySelector('#trading-menu')!.innerHTML = ''
    document.querySelector('#trading-menu')!.classList.add('display-none')
    player.onTradingMenu = false
}

function confirmTrade(trade: Trade[]) {
    let itemAmount = 0
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 5; x++) {
            if (player.inventory[y][x] === trade[0]!.item) {
                itemAmount++
            }
        }
    }
    if (itemAmount >= trade[0].amount) {
        itemAmount = 0
        outerLoop: for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 5; x++) {
                if (player.inventory[y][x] === trade[0]!.item) {
                    player.inventory[y][x] = null
                    itemAmount++
                    if (itemAmount === trade[0].amount) {
                        player.addItem(trade[1].item, trade[1].amount)
                        break outerLoop
                    }
                }
            }
        }
    }

    updateHotbar()
}

function displayInfo(text: string) {
    const field = document.querySelector<HTMLElement>('#info')
    if (player.showingText) return;
    field!.innerHTML = text
    let opacity = 1
    let posX = 500
    player.showingText = true

    let interval = setInterval(() => {
        field!.style.opacity = `${opacity}`
        field!.parentElement!.style.top = `${posX}px`
        opacity -= 0.05
        posX -= 10

        if (opacity <= 0) {
            clearInterval(interval)
            player.showingText = false
            field!.innerHTML = ''
        }
    }, 50)
}

function checkForRecipes(): { output: item | null; isValid: boolean } {
    loop:
    for (const r of recipes) {
        for (let y = 0; y < 3; y++) {
            const invLine = player.craftingInventory[y]
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

function update(): void {
    ctx!.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // display fps
    const fpsDiv = document.querySelector('.fps-div');

    // performace.now() => returns a time
    const now = performance.now()
    frameCount++

    if (now - lastTime >= 1000) {
        fps = frameCount
        frameCount = 0
        lastTime = now
    }

    fpsDiv!.innerHTML = `<h1>${fps} FPS</h1>`

    // player logic
    player.isMoving = false
    let isBlocked = false
    // check for keydown/up inputs
    if ((keys['KeyD'] || keys['KeyW']) && !player.onInventory && !player.onTradingMenu && !player.onSecondaryInventory) {
        // check for obstacles
        worlds[currentWorld].elements.forEach(elem => {
            if (elem instanceof interactable && elem.isBlocking) {
                const distanceXToPlayer = Math.abs((player.x + player.spriteWidth + 50) - elem.x)
                if (distanceXToPlayer <= 7) {
                    isBlocked = true
                    if (player.currentState !== 'idle' && player.currentState !== 'jump' && player.currentState !== 'fall') player.changeState('idle')
                }
            }
        })

        if (!player.onCooldown && !isBlocked) {
            if (player.currentState !== 'run' && player.onGround) {
                player.changeState('run')
            }
            if (player.checkEffect('ice').wasFound) {
                gameSpeed = 3.5
                levelPos += 3.5
            } else {
                gameSpeed = 7
                levelPos += 7
            }
            player.Xdirec = 1
            player.isMoving = true
        }
    } else if ((keys['KeyA'] || keys['KeyS']) && !player.onInventory && !player.onTradingMenu && !player.onSecondaryInventory) {
        // check for obstacles
        worlds[currentWorld].elements.forEach(elem => {
            if (elem instanceof interactable && elem.isBlocking) {
                const distanceXToPlayer = Math.abs(player.x - (elem.x + elem.spriteWidth * elem.scale))
                if (distanceXToPlayer <= 7) {
                    isBlocked = true
                    if (player.currentState !== 'idle' && player.currentState !== 'jump' && player.currentState !== 'fall') player.changeState('idle')
                }
            }
        })
        if (!player.onCooldown && !isBlocked) {
            if (player.currentState !== 'run' && player.onGround) {
                player.changeState('run')
            }
            if (player.checkEffect('ice').wasFound) {
                gameSpeed = -3.5
                levelPos -= 3.5
            } else {
                gameSpeed = -7
                levelPos -= 7
            }
            player.Xdirec = 2
            player.isMoving = true
        }
    }

    if (isBlocked) gameSpeed = 0

    deadObjects.forEach(obj => { // delete all objects that have been marked as dead
        let indexHealthbar = -1
        for (let i = 0; i < nonWorldElems.length; i++) {
            if (nonWorldElems[i].type.name === 'healthbar' && (nonWorldElems[i] as healthbar).entity === obj) {
                indexHealthbar = i
                break
            }
        }
        if (indexHealthbar !== -1) {
            nonWorldElems.splice(indexHealthbar, 1)
        }

        worlds[currentWorld].elements.splice(worlds[currentWorld].elements.indexOf(obj), 1)

    })
    // reset deadobjects
    deadObjects = []

    backgroundLayers.forEach(Layer => {
        Layer.update()
        Layer.draw()
    })

    worlds[currentWorld].elements.forEach((element) => {
        const VIEW_LEFT = -400
        const VIEW_RIGHT = CANVAS_WIDTH + 400

        if ((keys['KeyD'] || keys['KeyW']) && element.type.moving === true && !isBlocked) {
            element.x -= gameSpeed
        } else if ((keys['KeyA'] || keys['KeyS']) && element.type.moving === true && !isBlocked) {
            element.x -= gameSpeed
        }

        element.update()

        if (element.x >= VIEW_LEFT && element.x <= VIEW_RIGHT) {
            element.draw()
        }
    });

    nonWorldElems.forEach(elem => {
        elem.update()
        elem.draw()
    })

    player.update()
    player.draw()

    particles.forEach(particle => {
        particle.update()
        particle.draw()
    })
    const questDiv = document.querySelector('#questDiv');
    if (activeQuests.length > 0) {
        questDiv?.classList.remove('display-none')
    } else {
        questDiv?.classList.add('display-none')
    }
    // check if any new events occured
    if (!isQuestUIupdated) {
        questDiv!.innerHTML = ''
        activeQuests.forEach(quest => {
            const questCompleted = quest.update() // update quest && check if it is completed

            questDiv!.innerHTML += `<hr class="background-color-black"><div><h2>${quest.text}</h2></div>`

            let amountOfCompleted = 0
            quest.entities.forEach(entity => {
                if (entity.completed) amountOfCompleted++
            })
            questDiv!.innerHTML += `<h1>${amountOfCompleted}/${quest.entities.length}</h1>`

            if (questCompleted) {
                questDiv!.innerHTML += `<button class="confirm-btn" id="questBtn" style="scale: 0.8;"></button>`
                document.querySelector('#questBtn')?.addEventListener('click', () => {
                    quest.finish()
                })
            }

        })

        isQuestUIupdated = true
    }

    currentEvents = []


    gameFrame++
    requestAnimationFrame(update)
}

// world logic
type worldElementNames = /* 'bush_fruit' | */ 'door_1' | 'teleporter' | 'trader' | 'wall_2' | 'wall_1' | 'goblin' | 'nightBorn' | 'skeleton' | 'tree_1' | 'tree_2' | 'rocks_1' | 'bush_1' | 'bush_2' | 'bush_3' | 'plant_1' | 'statue_1' | 'chest' | 'NPC'

const worldElements = {
    goblin: { class: goblin, args: [StaticPositions.OnGround, 'goblin'] },
    nightBorn: { class: nightBorn, args: [StaticPositions.OnGround, 'nightborn'] },
    skeleton: { class: skeleton, args: [StaticPositions.OnGround, 'skeleton'] },
    tree_1: { class: interactable, args: [320, 100, '/img/blocks/tree_1.png', 65, 60, 1, [{ amount: 1, item: 'stick' }], true, 2, 'tree_1', true, false, null] },
    tree_2: { class: interactable, args: [100, 500, '/img/blocks/tree_2.png', 85, 69, 1.5, [{ amount: 2, item: 'stick' }], true, 3, 'tree_2', true, false, null] },
    rocks_1: { class: interactable, args: [530, 150, '/img/blocks/rocks_1.png', 67, 39, 0.5, [{ amount: 2, item: 'stone' }], true, 1, 'rocks_1', true, false, null] },
    bush_1: { class: interactable, args: [560, 0, '/img/blocks/bush_1.png', 106, 43, 0.4, [], false, 1, 'bush_1', false, false, null] },
    bush_2: { class: interactable, args: [560, 0, '/img/blocks/bush_2.png', 101, 40, 0.4, [], false, 1, 'bush_2', false, false, null] },
    bush_3: { class: interactable, args: [560, 0, '/img/blocks/bush_3.png', 60, 31, 0.4, [], false, 1, 'bush_3', false, false, null] },
    wall_1: { class: interactable, args: [470, 0, '/img/blocks/wall_1.png', 139, 47, 0.6, [], false, 1, 'wall_1', false, false, null] },
    wall_2: { class: interactable, args: [530, 0, '/img/blocks/wall_2.png', 31, 63, 0.5, [], false, 1, 'wall_2', false, false, null] },
    plant_1: { class: interactable, args: [560, 50, '/img/blocks/plant_1.png', 34, 61, 0.4, [{ amount: 1, item: 'string' }], false, 1, 'plant_1', true, false, null] },
    //bush_fruit: { class: interactable, args: [605, 50, '/img/blocks/bush_fruit.png', 84, 55, 0.25, [{ amount: 1, item: 'fruit' }], false, 1, 'bush_fruit', true] },
    statue_1: { class: interactable, args: [310, 0, '/img/blocks/statue_1.png', 39, 83, 1, [], false, 1, 'statue_1', false, false, null] },
    chest: { class: chest, args: [StaticPositions.OnGround, 'chest'] },
    NPC: { class: NPC, args: ['NPC'] },
    trader: { class: trader, args: [StaticPositions.OnGround] },
    teleporter: { class: teleporter, args: [] }
}
/*
NOTE: everthing under 1500 is instantly being displayed
[[null, null, null, null],[null, null, null, null],[null, null, null, null],[null, null, null, null]]
*/

type worldName = keyof typeof worlds
let currentWorld: worldName = 'jungle'
type WorldElement = entity | blocks | container
// '/img/passiveEntities/elder.png', 32, 32, 4, 0.4, ['Ohh, welcome traveler!', 'Isn\'t that statue beautifull!', 'What, you don\'t know anything??', 'Well, that\'s probably for the best.', 'The goblin king has declared war on Norwyn!', 'You need to rescue the captured humans!', 'I mean you do look like a strong warrior!', 'So what are you waiting for and go right to find them!'], 'elder', []
const worlds: Record<string, {
    background: {
        imgs: string[]
        spriteWidth: number
        spriteHeight: number
    }
    elements: WorldElement[]
}> = {
    jungle: {
        background: {
            imgs: [
                'plx-1-jungle.png',
                'plx-2-jungle.png',
                'plx-3-jungle.png',
                'plx-4-jungle.png',
                'plx-5-jungle.png',
            ],
            spriteWidth: 2400,
            spriteHeight: 700
        },
        elements: [
            new interactable(600, 560, 0, '/img/blocks/bush_2.png', 101, 40, 0.4, [], false, 1, 'bush_2', false, false, null),
            new NPC(1400, 560, 'NPC', '/img/passiveEntities/elder.png', 32, 32, 4, 0.4, ['Ohh, welcome traveler!', 'Isn\'t that statue beautifull!', 'What, you don\'t remember anything??', 'Well, that\'s probably for the best.', 'The goblins have attacked us!', 'You need to rescue the captured humans!', 'I mean, you do look like a strong warrior!', 'So what are you waiting for and go north to find them!'], 'elder', [], 1, new quest('kill', [11, 12, 13], 'Defeat the goblins, who are guarding the captured humans!', [{ item: 'coin', amount: 1 }])),
            new interactable(200, 320, 100, '/img/blocks/tree_1.png', 65, 60, 1, [{ amount: 1, item: 'stick' }], true, 2, 'tree_1', true, false, null),
            new interactable(1900, 310, 0, '/img/blocks/statue_1.png', 39, 83, 1, [], false, 1, 'statue_1', false, false, null),
            new interactable(1000, 560, 50, '/img/blocks/plant_1.png', 34, 61, 0.4, [{ amount: 1, item: 'string' }], false, 1, 'plant_1', true, false, null),
            new trader(-600, StaticPositions.OnGround, [[{ amount: 1, item: 'coin' }, { amount: 2, item: 'string' }], [{ amount: 1, item: 'coin' }, { amount: 2, item: 'beer' }], [{ amount: 1, item: 'stone_sword' }, { amount: 2, item: 'coin' }]], 'trader', 3),
            new chest(1200, StaticPositions.OnGround, [[null, null, "leather", null, null], [null, null, "horn", null, null], [null, "leather", null, null, null], [null, "stone", null, null, null]], 'chest'),
            new skeleton(2600, StaticPositions.OnGround, 'skeleton', 10),
            new NPC(2700, 560, 'NPC', '/img/passiveEntities/stranger.png', 32, 32, 4, 0.4, ['The skeleton wanted to take me to the other prisoners!', 'If you want to save them you will need some good weapons', 'Here a little gift for saving me!'], 'stranger', [{ item: 'stone', amount: 1 }], 5, null),
            new goblin(3600, StaticPositions.OnGround, 'goblin', 11),
            new goblin(3700, StaticPositions.OnGround, 'goblin', 12),
            new goblin(3850, StaticPositions.OnGround, 'goblin', 13),
            new NPC(3800, 560, 'NPC', '/img/passiveEntities/beggar.png', 34, 34, 5, 0.4, ['Thanks, man!'], 'beggar', [], 6, null),
            new NPC(3950, 430, 'NPC', '/img/passiveEntities/samurai.png', 96, 96, 10, 0.8, ['Thank you for saving me!', 'Here use this! It is the least I can give you!'], 'samurai', [{ item: 'coin', amount: 1 }], 6, null),
            new teleporter(-1000, 625, 60, '/img/blocks/runeStone.png', 31, 34, 0.2, 1, 'teleporter', false, { dim: 'mountain', x: 650, y: 420 }),
            new interactable(-300, 505, 0, '/img/blocks/door_1.png', 189, 281, 0.5, [], false, 1, 'door_1', false, true, 'key'),
        ]
    },
    mountain: {
        background: {
            imgs: [
                'plx-6-mountain.png',
                'plx-5-mountain.png',
                'plx-4-mountain.png',
                'plx-3-mountain.png',
                'plx-2-mountain.png',
                'plx-1-mountain.png',
            ],
            spriteWidth: 1900,
            spriteHeight: 1000
        },
        elements: [
            new goblin(1500, StaticPositions.OnGround, 'goblin', 14),
            new goblin(1600, StaticPositions.OnGround, 'goblin', 14),
            new chest(1800, StaticPositions.OnGround, [[null, "iron_ingot", null, null, null], ["beer", null, null, null, null], [null, null, null, "coin", null], ["brocken_sword", null, null, null, null]], 'chest'),
            new goblin(1700, StaticPositions.OnGround, 'goblin', 14),
        ]
    }
}

function changeWorld(world: worldName) {
    backgroundLayers = []

    const spriteWidth = worlds[world].background.spriteWidth
    const spriteHeight = worlds[world].background.spriteHeight
    const base_path = '/img/background/'
    let speedModifier = 0.2
    for (let i = 0; i < worlds[world].background.imgs.length; i++) {
        let currentLayer = new Image()
        currentLayer.src = `${base_path}${worlds[world].background.imgs[i]}`

        backgroundLayers.push(new Layer(currentLayer, speedModifier, spriteWidth, spriteHeight))
        speedModifier += 0.2
    }

    nonWorldElems = []
    currentWorld = world

    player.showHealthbar()
}

// declare player
const player = new Player(650, 420)
player.showHealthbar()

// initialise && push layers
changeWorld('jungle')

/* containers.push(new chest(1000, 600, [["wood_sword", "stone_sword", "iron_sword", "copper_sword", "gold_sword"], ["wood_rapier", "stone_rapier", "iron_rapier", "copper_rapier", "gold_rapier"], ["wood_sickle", "stone_sickle", "iron_sickle", "copper_sickle", "gold_sickle"], ["brocken_sword", "beer", "heal_potion", "big_heal_potion", "coin"]]))
containers.push(new chest(1200, 600, [["iron_helmet", "gold_crown", "leather_hood", "berserker_helmet", "knights_helm"], ["iron_chestplate_tier_1", "iron_chestplate_tier_2", "iron_chestplate_tier_3", "steel_robe", "peasants_robe"], ["iron_boots", "leather_boots", "hardened_boots", null, null], ["flaming_saber", "holy_longsword", "poisoned_staff", "supernova", "null"]]))
containers.push(new chest(1400, 600, [["regeneration_potion", "big_regeneration_potion", "icing_rapier", "healthboost_potion", "lightning_potion"], ["mushroom", "stick", "iron_ingot", "iron_ingot", "iron_ingot"], ["leather", "leather", "leather", "stick", "copper_ingot"], ["gold_ingot", "copper_ingot", "gold_ingot", "string", "string"]]))
entities.push(new trader(1700, StaticPositions.OnGround, [[{ amount: 1, item: 'coin' }, { amount: 2, item: 'string' }], [{ amount: 1, item: 'coin' }, { amount: 2, item: 'beer' }], [{ amount: 1, item: 'stone_sword' }, { amount: 2, item: 'coin' }]]))
blocks.push(new interactable(2000, 320, 100, '/img/blocks/tree_1.png', 65, 60, 1, [{ amount: 1, item: 'stick' }], true, 2))
entities.push(new NPC(650, StaticPositions.OnGround, 'img/passiveEntities/samurai.png', 96, 96, ['Hello, traveller!', 'The Goblins have taken over this land!', 'Please help us and kill the king of the Goblins!', 'Otherwise...', '...', 'WE WILL ALL DIE!!!', 'NOW GO AND SAVE THE KINGDOM!!!'])) */

updateHotbar()
update()
