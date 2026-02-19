"use strict";
// initialise canvas
const canvas = document.querySelector('#canvas');
if (!canvas)
    throw new Error('Canvas element not found');
const ctx = canvas.getContext('2d');
if (!ctx)
    throw new Error('2D context not supported');
// set dimensions
const CANVAS_WIDTH = canvas.width = 2000;
const CANVAS_HEIGHT = canvas.height = 700;
// initial values
let gameSpeed = 0; // game speed depending on the players movement
let gameFrame = 0; // counter for the frames
const staggerFrames = 7; // amount of ticks between each frame of animation
const globalGravity = 60; // gravity affecting the player
const groundY = 580; // is the y-coordinate of the ground
let fps = 0; // current fps
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
let particles = [];
let deadObjects = [];
// level design values
let levelPos = 0;
// sound logic
function playSound(sound) {
    const audio = new Audio(`sound/${sound}.mp3`);
    audio.play();
}
const recipes = [
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
];
const effects = {
    burning: {
        ticks: 50,
        onTick: (entity) => {
            entity.takeHit(3);
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
            entity.heal(2);
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
            entity.takeHit(2);
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
        particle: 'img/particles/strength.png',
        spriteWidth: 80,
        spriteHeight: 80,
        frameAmount: 4,
        icon: 'img/icons/strength_icon.png',
        name: 'strength'
    },
    electrocute: {
        ticks: 100,
        particle: 'img/particles/electrocute.png',
        spriteWidth: 128,
        spriteHeight: 128,
        frameAmount: 9,
        icon: 'img/icons/electrocute_icon.png',
        name: 'electrocute'
    },
    stun: {
        ticks: 2,
        onTick: (entity) => {
            entity.takeHit(0);
        },
        particle: 'img/particles/stun.png',
        spriteWidth: 96,
        spriteHeight: 96,
        frameAmount: 7,
        icon: 'img/icons/stun_icon.png',
        name: 'stun'
    },
    healthboost: {
        ticks: 100,
        start: (entity) => {
            entity.data.maxHealth = entity.data.maxHealth * 1.5;
            entity.data.health *= 1.5;
        },
        end: (entity) => {
            entity.data.maxHealth /= 1.5;
        },
        particle: 'img/particles/healthboost.png',
        spriteWidth: 64,
        spriteHeight: 64,
        frameAmount: 17,
        icon: 'img/icons/healthboost_icon.png',
        name: 'healthboost',
        isFirstTime: true
    },
    deaths_curse: {
        ticks: 100,
        particle: 'img/particles/deaths_curse.png',
        spriteWidth: 64,
        spriteHeight: 64,
        frameAmount: 48,
        icon: 'img/icons/deaths_curse_icon.png',
        name: 'deaths_curse',
        end: (entity) => {
            if (Math.round(Math.random() * entity.data.health) < 10) {
                entity.data.health = 0;
            }
        },
        isFirstTime: true
    },
    poison: {
        ticks: 5,
        onTick: (entity) => {
            if (entity.data.isMoving) {
                entity.takeHit(3);
            }
        },
        particle: 'img/particles/poison.png',
        spriteWidth: 128,
        spriteHeight: 128,
        frameAmount: 17,
        icon: 'img/icons/poison_icon.png',
        name: 'poison'
    }
};
const items = {
    wood_sword: {
        spriteX: 0,
        spriteY: 0,
        height: 16,
        width: 16,
        scale: 4,
        attackDamage: 6,
        src: 'weapons.png',
        use: () => {
            return;
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
            return;
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
            return;
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
            return;
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
            return;
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
            return;
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
            return;
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
            return;
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
            return;
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
            return;
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
            return;
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
            return;
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
            return;
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
            return;
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
            return;
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
            return;
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
            player.heal(5);
            return;
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
            player.heal(20);
            return;
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
            player.heal(35);
            return;
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
            return;
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
            player.heal(1000000);
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
            return;
        },
        attack(entity) {
            entity.addEffect('burning', 500, 1);
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
            player.addEffect('healthboost', 500, 1);
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
            return;
        },
        attack: (entity) => {
            entity.addEffect('poison', 1000, 1);
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
            player.addEffect('strength', 500, 1);
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
            return;
        },
        attack(entity) {
            player.takeHit(10);
            entity.addEffect('deaths_curse', 1500, 1);
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
            player.addEffect('regeneration', 600, 1);
            return;
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
            player.addEffect('regeneration', 1000, 1);
            return;
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
            return;
        },
        attack(entity) {
            entity.addEffect('ice', 1000, 1);
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
            player.addEffect('healthboost', 3000, 1);
            return;
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
            player.addEffect('electrocute', 1500, 1);
            return;
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
            let removeArr = [];
            player.effectData.effects.forEach((effect, i) => {
                removeArr.push(effect.index);
            });
            removeArr.forEach(i => {
                player.removeEffect(i);
            });
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
            player.heal(5);
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
            return;
        },
        onUse: '',
        clearsAfterUse: false,
        attackRange: 150,
        attackCooldown: 1000,
        description: 'Might unlock something',
        type: 'item'
    }
};
// inputs
document.querySelector('#game').addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousedown', event => {
    if (event.button === 2 && !player.data.onInventory) {
        player.useItem();
    }
    if (event.button === 0 && !player.data.onInventory) {
        player.attack();
    }
});
addEventListener('keyup', event => {
    if (!player.data.onInventory) {
        keys[event.code] = false;
        player.changeState('idle');
        gameSpeed = 0;
    }
});
addEventListener('keydown', event => {
    if (!player.data.onInventory && !player.data.onTradingMenu && !player.data.onSecondaryInventory && player.data.canMove)
        keys[event.code] = true;
    if (event.code === 'KeyR' && !player.data.isMoving) {
        if (!player.data.onSecondaryInventory) {
            player.interact();
        }
    }
    if (event.code === 'KeyE' && !player.data.isMoving) {
        if (player.data.onInventory && !player.data.onTradingMenu) {
            closeInventory();
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
    if (event.code === 'Space' && !player.data.onInventory) {
        player.jump();
    }
    if (event.code === 'Escape') {
        menu.toggleMenu();
    }
    if (!player.data.onInventory && event.code.slice(0, 5) === 'Digit' && (parseInt(event.code.slice(5, 6)) < 6)) {
        changeSelectedSlot(parseInt(event.code.slice(5, 6)));
    }
});
let scrollCount = 0;
window.addEventListener('wheel', (e) => {
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
                    { name: 'Master Sound', state: true }
                ]
            },
            video: {
                name: 'video',
                settings: [
                    { name: 'Fullscreen', state: false }
                ]
            },
            dev: {
                name: 'dev',
                settings: [
                    { name: 'No Clip', state: false },
                    { name: 'Inf Damage', state: false },
                    { name: 'No Aggro', state: false },
                    { name: 'Hitboxes', state: false },
                ]
            },
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
        const answer = prompt('Do you still want to proceed? [YES]');
        if (answer === 'YES') {
            location.href = '/';
        }
    }
    save() {
        alert('Saving has not been implemented yet!');
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
            div.innerHTML += `<div class="flex-between margin-top-32"><button onclick="menu.toggleMenu()" class="btn-small background-color-gray">Close</button><button onclick="menu.toggleSettingsScreen()" class="btn-small background-color-gray">Back</button></div>`;
        }
    }
    toggleSetting(setting /* keyof menuClass['settings']['dev'] */, group) {
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
}
class quest {
    constructor(event, entities, text, gift) {
        this.event = event;
        this.text = text;
        this.gift = gift;
        this.completed = false;
        this.entities = [];
        entities.forEach(entity => {
            this.entities.push({ entity: entity, completed: false });
        });
    }
    update() {
        currentEvents.forEach(event => {
            if (event.event === this.event) {
                this.entities.forEach(entity => {
                    if (entity.entity === event.entity.id) {
                        entity.completed = true;
                    }
                });
            }
        });
        let questCompleted = true;
        this.entities.forEach(entity => {
            if (!entity.completed) {
                questCompleted = false;
                this.completed = false;
            }
        });
        return questCompleted;
    }
    finish() {
        this.gift.forEach(gift => {
            player.addItem(gift.item, gift.amount);
        });
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
    }
}
// classes for objects in the game
// other objects classes
class Layer {
    constructor(img, speedModifier, spriteWidth, spriteHeight) {
        this.pos = {
            x: 0,
            y: 0
        };
        this.sprite = {
            img: img,
            spriteWidth: spriteWidth,
            spriteHeight: spriteHeight
        };
        this.speedModifier = speedModifier;
        this.speed = gameSpeed * this.speedModifier;
        this.isInit = false;
        this.type = { isGround: true /* is a ground troop/thing */, name: 'layer' /* name of the entity/thing */, allignment: 'passive' /* does it attack the player */, moving: false /* should it be moved when the player moves; to mimic movement */, attackable: false, interactable: false };
    }
    update() {
        this.speed = gameSpeed * this.speedModifier;
        this.pos.x = Math.floor(this.pos.x - this.speed);
        if (this.pos.x <= -this.sprite.spriteWidth) {
            this.pos.x += this.sprite.spriteWidth;
        }
        else if (this.pos.x >= this.sprite.spriteWidth) {
            this.pos.x -= this.sprite.spriteWidth;
        }
    }
    draw() {
        ctx.drawImage(this.sprite.img, this.pos.x, this.pos.y, this.sprite.spriteWidth, this.sprite.spriteHeight);
        ctx.drawImage(this.sprite.img, this.pos.x + this.sprite.spriteWidth, this.pos.y, this.sprite.spriteWidth, this.sprite.spriteHeight);
        ctx.drawImage(this.sprite.img, this.pos.x - this.sprite.spriteWidth, this.pos.y, this.sprite.spriteWidth, this.sprite.spriteHeight);
    }
}
class particle {
    constructor(entity, spriteWidth, spriteHeight, img, counter, frameAmount) {
        this.pos = {
            x: 0,
            y: 0,
        };
        this.entity = entity;
        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;
        this.frames = 0;
        this.frameLoc = 0;
        this.currentState = 'normal';
        this.type = { isGround: true /* is a ground troop/thing */, name: 'particle' /* name of the entity/thing */, allignment: 'passive' /* does it attack the player */, moving: false /* should it be moved when the player moves; to mimic movement */, attackable: false, interactable: false };
        this.animationStates = [
            {
                name: 'normal',
                frames: frameAmount
            }
        ];
        this.spriteAnimations = {};
        this.img = img;
        this.counter = counter;
        this.init();
    }
    update() {
        if (this.entity.data.Xdirec === 1) {
            this.pos.x = this.entity.pos.x + this.entity.sprite.spriteWidth;
        }
        else {
            this.pos.x = this.entity.pos.x + this.entity.sprite.spriteWidth / 2;
        }
        if (this.entity.type.name === 'goblin') {
            this.pos.x += 30;
        }
        this.pos.y = this.entity.pos.y + this.entity.sprite.spriteHeight;
        this.frames++;
        if (this.frames >= staggerFrames) { // check if next frame should be drawn
            this.frames = 0; // reset frames
            this.frameLoc++; // advance to next frame
            const frameAmount = this.spriteAnimations[this.currentState].loc.length;
            if (this.frameLoc >= frameAmount) { // check if the end of the animation is reached
                this.frameLoc = 0;
            }
        }
    }
    init() {
        this.animationStates.forEach((state, index) => {
            let frames = {
                loc: []
            };
            for (let j = 0; j < state.frames; j++) {
                let positionX = j * this.spriteWidth;
                let positionY = index * this.spriteHeight;
                frames.loc.push({ x: positionX, y: positionY });
            }
            this.spriteAnimations[state.name] = frames;
        });
    }
    draw() {
        var _a, _b;
        let frameX = this.spriteAnimations[this.currentState].loc[this.frameLoc].x;
        let frameY = this.spriteAnimations[this.currentState].loc[this.frameLoc].y;
        ctx.drawImage(this.img, frameX, frameY, this.spriteWidth, this.spriteHeight, this.pos.x, this.pos.y, 150 * ((_a = this.entity.sprite.scale) !== null && _a !== void 0 ? _a : 1), 150 * ((_b = this.entity.sprite.scale) !== null && _b !== void 0 ? _b : 1));
    }
}
class projectile {
    constructor(entity, spriteWidth, spriteHeight, scale, pathToImage, animationStates, range, speed, damage, hitbox) {
        this.pos = {
            x: entity.pos.x + entity.sprite.spriteWidth,
            y: entity.pos.y + entity.sprite.spriteHeight * 1.9
        };
        this.entity = entity;
        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;
        this.frames = 0;
        this.frameLoc = 0;
        this.currentState = 'flying';
        this.type = { isGround: true /* is a ground troop/thing */, name: 'projectile' /* name of the entity/thing */, allignment: 'passive' /* does it attack the player */, moving: true /* should it be moved when the player moves; to mimic movement */, attackable: false, interactable: false };
        this.animationStates = animationStates;
        this.spriteAnimations = {};
        this.img = new Image();
        this.img.src = pathToImage;
        this.range = range;
        this.speed = speed;
        this.damage = damage;
        this.scale = scale;
        this.startX = this.pos.x;
        this.Xdirec = this.entity.data.Xdirec;
        this.hitbox = hitbox;
        this.init();
    }
    update() {
        if (this.Xdirec === 1) {
            this.pos.x += this.speed;
        }
        else {
            this.pos.x -= this.speed;
        }
        let playerHit = checkCollision({ hitbox: this.hitbox, pos: this.pos }, { hitbox: player.hitbox, pos: player.pos });
        if (playerHit) {
            player.takeHit(this.damage);
        }
        if (playerHit || Math.abs(this.startX - this.pos.x) > this.range) {
            let remover = [];
            particles.forEach((elem, i) => {
                if (elem === this)
                    remover.push(i);
            });
            remover.forEach(i => {
                particles.splice(i, 1);
            });
        }
        this.frames++;
        if (this.frames >= staggerFrames) { // check if next frame should be drawn
            this.frames = 0; // reset frames
            this.frameLoc++; // advance to next frame
            const frameAmount = this.spriteAnimations[this.currentState].loc.length;
            if (this.frameLoc >= frameAmount) { // check if the end of the animation is reached
                this.frameLoc = 0;
            }
        }
    }
    init() {
        this.animationStates.forEach((state, index) => {
            let frames = {
                loc: []
            };
            for (let j = 0; j < state.frames; j++) {
                let positionX = j * this.spriteWidth;
                let positionY = index * this.spriteHeight;
                frames.loc.push({ x: positionX, y: positionY });
            }
            this.spriteAnimations[state.name] = frames;
        });
    }
    draw() {
        if (menu.checkSetting('Hitboxes')) {
            ctx.save();
            ctx.strokeStyle = this.type.allignment === 'enemy' ? 'red' : (this.type.allignment === 'passive' ? 'yellow' : 'green');
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x + this.hitbox.offsetX, this.pos.y + this.hitbox.offsetY, this.hitbox.width, this.hitbox.height);
            ctx.restore();
        }
        let frameX = this.spriteAnimations[this.currentState].loc[this.frameLoc].x;
        let frameY = this.spriteAnimations[this.currentState].loc[this.frameLoc].y;
        ctx.drawImage(this.img, frameX, frameY, this.spriteWidth, this.spriteHeight, this.pos.x, this.pos.y, 150 - 50, 150 * this.scale);
    }
}
class healthbar {
    constructor(entity) {
        this.x = 0;
        this.y = 0;
        this.entity = entity;
        this.spriteWidth = 100;
        this.spriteHeight = 50;
        this.type = { isGround: true /* is a ground troop/thing */, name: 'healthbar' /* name of the entity/thing */, allignment: 'passive' /* does it attack the player */, moving: true /* should it be moved when the player moves; to mimic movement */, attackable: false, interactable: false };
    }
    update() {
        this.x = this.entity.pos.x - 50;
        this.y = this.entity.pos.y;
        if (this.entity.data.health <= 0 && this.entity instanceof block) {
            const index = nonWorldElems.findIndex(elem => elem === this);
            if (index !== -1) {
                nonWorldElems.splice(index, 1);
            }
        }
        if (this.entity.type.name === 'player') {
            this.x += 60;
        }
        else if (this.entity.type.name === 'nightBorn') {
            this.x += 60;
        }
        else if (this.entity.type.name === 'teleporter') {
            this.y -= 130;
            this.x -= 100;
        }
        else if (this.entity.worldElem === 'crate') {
            this.y -= 200;
        }
        else if (this.entity.type.name === 'skeleton') {
            this.y -= 90;
        }
        else if (this.entity.type.name === 'archer') {
            this.y -= 90;
        }
    }
    draw() {
        var _a;
        const backgroundColor = this.entity.type.name === 'interactable' || this.entity.type.name === 'teleporter' ? "rgb(215, 215, 215)" : "rgb(184, 0, 0)";
        const overColor = this.entity.type.name === 'interactable' ? "rgb(101, 101, 101)" : (this.entity.type.name === 'teleporter' ? "rgb(29, 93, 190)" : "rgb(0, 184, 3)");
        let scale;
        if ((this.entity instanceof block || this.entity instanceof teleporter) && this.entity.interactData) {
            scale = this.entity.interactData.healthBarScale;
        }
        else {
            scale = 1;
        }
        let drawMaxHealth;
        if ((this.entity instanceof block || this.entity instanceof teleporter) && this.entity.interactData) {
            drawMaxHealth = this.entity.interactData.cooldown;
        }
        else {
            drawMaxHealth = (_a = this.entity.data.maxHealth) !== null && _a !== void 0 ? _a : 1;
        }
        let drawHealth = this.entity.data.health;
        if (drawMaxHealth > 100 && this.entity === player && drawHealth > 100) {
            drawHealth = drawHealth - 100;
            ctx.fillStyle = "rgb(184, 0, 0)";
            ctx.fillRect(this.x + this.entity.sprite.spriteWidth, this.y + 90, 100, 20);
            ctx.fillStyle = "rgb(222, 236, 24)";
            ctx.fillRect(this.x + this.entity.sprite.spriteWidth, this.y + 90, ((drawHealth / 50) * 100 < 0) ? 0 : (drawHealth / 50) * 100, 20);
            drawHealth = 100;
            drawMaxHealth = 100;
        }
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(this.x + this.entity.sprite.spriteWidth, this.y + 120, 100 * scale, 20 * scale);
        ctx.fillStyle = overColor;
        ctx.fillRect(this.x + this.entity.sprite.spriteWidth, this.y + 120, (((drawHealth / drawMaxHealth) * 100 < 0) ? 0 : (drawHealth / drawMaxHealth) * 100) * scale, 20 * scale);
    }
    interact() {
        return;
    }
}
class chest {
    constructor(x, y, inventory, worldElem) {
        if (y === StaticPositions.OnGround) {
            y = 600;
        }
        this.pos = {
            x: x,
            y: y
        };
        this.spriteWidth = 43;
        this.spriteHeight = 40;
        this.hitbox = { offsetX: -30, offsetY: 0, width: 175, height: 100 };
        this.frames = 0;
        this.frameLoc = 0;
        this.scale = 0.3;
        this.showedText = false;
        this.isInit = false;
        this.currentState = 'normal';
        this.img = new Image();
        this.img.src = 'img/items/dropChest.png';
        this.inventory = inventory;
        this.spriteAnimations = {};
        this.animationStates = [
            {
                name: 'open',
                frames: 4
            },
            {
                name: 'normal',
                frames: 1
            }
        ];
        this.type = { isGround: true /* is a ground troop/thing */, name: 'chest' /* name of the entity/thing */, allignment: 'passive' /* does it attack the player */, moving: true /* should it be moved when the player moves; to mimic movement */, attackable: false, interactable: true };
        this.worldElem = worldElem;
        this.init();
    }
    update() {
        if (checkCollision({ hitbox: this.hitbox, pos: this.pos }, { hitbox: player.hitbox, pos: player.pos }) && !player.data.onCooldown && player.data.onGround) {
            if (!this.showedText) {
                this.showedText = true;
                displayInfo('Press "R" to interact');
            }
            player.data.interactionFocus = this;
            /*             player.data.interactionFocusEntity = null
                        player.data.interactionFocusGrab = null */
        }
        else {
            if (player.data.interactionFocus === this) {
                player.data.interactionFocus = null;
            }
            this.showedText = false;
        }
        this.frames++;
        if (this.frames >= staggerFrames) {
            this.frames = 0;
            this.frameLoc++;
            const frameAmount = this.spriteAnimations[this.currentState].loc.length;
            if (this.frameLoc >= frameAmount) {
                this.frameLoc = 0;
                if (this.currentState === 'open') {
                    this.currentState = 'normal';
                }
            }
        }
    }
    draw() {
        if (menu.checkSetting('Hitboxes')) {
            ctx.save();
            ctx.strokeStyle = this.type.allignment === 'enemy' ? 'red' : (this.type.allignment === 'passive' ? 'yellow' : 'green');
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x + this.hitbox.offsetX, this.pos.y + this.hitbox.offsetY, this.hitbox.width, this.hitbox.height);
            ctx.restore();
        }
        let frameX = this.spriteAnimations[this.currentState].loc[this.frameLoc].x; // get current locations of the animation
        let frameY = this.spriteAnimations[this.currentState].loc[this.frameLoc].y;
        ctx.drawImage(this.img, frameX, frameY, this.spriteWidth, this.spriteHeight, this.pos.x, this.pos.y, 400 * this.scale, 400 * this.scale);
    }
    init() {
        this.isInit = true;
        // initialise spriteAnimation object
        this.animationStates.forEach((state, index) => {
            let frames = {
                loc: []
            };
            for (let j = 0; j < state.frames; j++) { // iterate for each frame
                let positionX = j * this.spriteWidth; // calculate the corresponding position of said frame
                let positionY = 0;
                frames.loc.push({ x: positionX, y: positionY }); // push these positions onto the frames object
            }
            this.spriteAnimations[state.name] = frames; // create a key on the spriteAnimations object to store this data
        });
    }
    changeState(state) {
        this.currentState = state;
        this.frames = 0;
        this.frameLoc = 0;
    }
    interact() {
        openInventory();
        openSecondaryContainer(this);
    }
    fill() { }
}
class block {
    constructor(pos, sprite, interact, blocking, worldElem, id) {
        this.pos = { x: pos.x, y: pos.y };
        this.sprite = {
            img: new Image(),
            pathToImage: sprite.pathToImage,
            spriteWidth: sprite.spriteWidth,
            spriteHeight: sprite.spriteHeight,
            scale: sprite.scale,
        };
        this.sprite.img.src = sprite.pathToImage;
        if (interact) {
            this.interactData = {
                cooldown: interact === null || interact === void 0 ? void 0 : interact.cooldown,
                output: interact.output,
                isInfinite: interact.isInfinite,
                healthBarScale: interact.healthBarScale,
                interactCooldown: 300
            };
        }
        else {
            this.interactData = null;
        }
        this.blocking = {
            isBlocking: blocking.isBlocking,
            removeItem: blocking.removeItem,
            text: blocking.text
        };
        this.data = {
            showedText: false,
            spawnedHealthbar: false,
            wasCollected: false,
            healthbar: null,
            health: 0
        };
        this.type = { isGround: true /* is a ground troop/thing */, name: 'interactable' /* name of the entity/thing */, allignment: 'passive' /* does it attack the player */, moving: true /* should it be moved when the player moves; to mimic movement */, attackable: false, interactable: true };
        if (this.pos.y === StaticPositions.OnGround) {
            this.pos.y = groundY - (this.sprite.scale * 400);
        }
        this.onCooldown = false;
        this.worldElem = worldElem;
        this.id = id;
    }
    update() {
        if (this.interactData) {
            const distanceXToPlayer = Math.abs((player.pos.x + player.sprite.spriteWidth / 2) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale));
            if (distanceXToPlayer <= player.data.interactionRange && !player.data.onCooldown && player.data.onGround) {
                if (!this.data.showedText) {
                    this.data.showedText = true;
                    /* if (!this.wasCollected && this.isInfinite) displayInfo('Hold "R" to interact') */
                }
                player.data.interactionFocus = this;
            }
            else {
                if (player.data.interactionFocus === this) {
                    player.data.interactionFocus = null;
                }
                this.data.showedText = false;
            }
        }
        if (this.blocking.removeItem) {
            const distanceXToPlayer = Math.abs((player.pos.x + player.sprite.spriteWidth / 2) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale));
            if (distanceXToPlayer <= player.data.interactionRange + 75 && !player.data.onCooldown && player.data.onGround) {
                if (!this.data.showedText) {
                    this.data.showedText = true;
                    displayInfo('Press "R" to unlock');
                }
                player.data.interactionFocus = this;
            }
            else {
                if (player.data.interactionFocus === this) {
                    player.data.interactionFocus = null;
                }
                this.data.showedText = false;
            }
        }
        if (this.sprite.pathToImage === '/img/blocks/door_1.png' && this.blocking.isBlocking === false) {
            this.sprite.img.src = '/img/blocks/door_1_open.png';
        }
    }
    draw() {
        ctx.drawImage(this.sprite.img, 0, 0, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale);
    }
    interact() {
        if (this.interactData && !this.onCooldown) {
            if (this.data.wasCollected && !this.interactData.isInfinite)
                return;
            if (!this.data.spawnedHealthbar) {
                nonWorldElems.push(new healthbar(this));
                this.data.spawnedHealthbar = true;
            }
            if (keys['KeyR']) {
                this.data.health += 1;
            }
            else {
                this.data.health = 0;
            }
            if (this.data.health >= this.interactData.cooldown) {
                this.interactData.output.forEach(element => {
                    var _a;
                    player.addItem(element.item, element.amount);
                    this.data.spawnedHealthbar = false;
                    this.data.wasCollected = true;
                    this.data.health = 0;
                    this.onCooldown = true;
                    setTimeout(() => {
                        this.onCooldown = false;
                    }, (_a = this.interactData) === null || _a === void 0 ? void 0 : _a.interactCooldown);
                });
            }
        }
        else if (this.blocking.removeItem) {
            if (player.data.inventory[3][player.data.selectedSlot - 1] === this.blocking.removeItem) {
                this.blocking.isBlocking = false;
                this.blocking.removeItem = null;
                player.data.inventory[3][player.data.selectedSlot - 1] = null;
                updateHotbar();
            }
            else {
                displayInfo(`Use a ${this.blocking.removeItem} `);
            }
        }
    }
}
class teleporter {
    constructor(pos, sprite, interact, blocking, destination, worldElem, id) {
        this.pos = { x: pos.x, y: pos.y };
        this.sprite = {
            img: new Image(),
            pathToImage: sprite.pathToImage,
            spriteWidth: sprite.spriteWidth,
            spriteHeight: sprite.spriteHeight,
            scale: sprite.scale,
        };
        this.sprite.img.src = sprite.pathToImage;
        if (interact) {
            this.interactData = {
                cooldown: interact === null || interact === void 0 ? void 0 : interact.cooldown,
                output: [],
                isInfinite: true,
                healthBarScale: interact.healthBarScale,
                interactCooldown: 50
            };
        }
        else {
            this.interactData = null;
        }
        this.blocking = {
            isBlocking: blocking.isBlocking,
            removeItem: blocking.removeItem
        };
        this.data = {
            showedText: false,
            spawnedHealthbar: false,
            wasCollected: false,
            healthbar: null,
            health: 0
        };
        this.type = { isGround: true /* is a ground troop/thing */, name: 'teleporter' /* name of the entity/thing */, allignment: 'passive' /* does it attack the player */, moving: true /* should it be moved when the player moves; to mimic movement */, attackable: false, interactable: true };
        if (this.pos.y === StaticPositions.OnGround) {
            this.pos.y = groundY - (this.sprite.scale * 400);
        }
        this.id = id;
        this.onCooldown = false;
        this.worldElem = worldElem;
        this.destination = destination;
    }
    update() {
        const distanceXToPlayer = Math.abs((player.pos.x + player.sprite.spriteWidth / 2) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale));
        if (distanceXToPlayer <= player.data.interactionRange && !player.data.onCooldown && player.data.onGround) {
            if (!this.data.showedText) {
                this.data.showedText = true;
                if (!this.data.wasCollected)
                    displayInfo('Hold "R" to interact');
            }
            player.data.interactionFocus = this;
        }
        else {
            if (player.data.interactionFocus === this) {
                player.data.interactionFocus = null;
            }
            this.data.showedText = false;
        }
    }
    draw() {
        ctx.drawImage(this.sprite.img, 0, 0, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale);
    }
    interact() {
        var _a;
        if (!this.data.spawnedHealthbar && !this.onCooldown) {
            nonWorldElems.push(new healthbar(this));
            this.data.spawnedHealthbar = true;
        }
        if (keys['KeyR']) {
            this.data.health += 1;
        }
        else {
            this.data.health = 0;
        }
        let cooldown;
        if (this.interactData) {
            cooldown = this.interactData.cooldown;
        }
        else {
            cooldown = 50;
        }
        if (this.data.health >= cooldown) {
            changeWorld(this.destination.dim);
            player.data.interactionFocus = null;
            player.pos.x = this.destination.x;
            this.data.health = 0;
            this.data.spawnedHealthbar = false;
            this.onCooldown = true;
            setTimeout(() => {
                this.onCooldown = false;
            }, (_a = this.interactData) === null || _a === void 0 ? void 0 : _a.interactCooldown);
            /* player.pos.y = this.destination.y */
        }
    }
}
// enemy classes
class Entity {
    constructor(pos, sprite, data, type, worldElem, id) {
        this.pos = {
            x: pos.x,
            y: pos.y
        };
        this.sprite = {
            img: sprite.img,
            spriteWidth: sprite.spriteWidth,
            spriteHeight: sprite.spriteHeight,
            scale: sprite.scale,
            animationStates: sprite.animationStates,
            spriteAnimations: {},
            frames: 0,
            frameLoc: 0,
            currentState: 'idle',
        };
        this.data = {
            health: data.maxHealth,
            maxHealth: data.maxHealth,
            attackDamage: data.attackDamage,
            attackRange: data.attackRange,
            drops: data.drops,
            name: data.name,
            onCooldown: false,
            isDead: false,
            isMoving: false,
            showedText: false,
            Xdirec: 2,
            seeRange: 500
        };
        this.effectData = {
            effects: [],
            effectTicks: 0,
            effectCounter: 0
        };
        this.hitbox = sprite.hitbox;
        this.type = type;
        this.worldElem = worldElem;
        this.id = id;
    }
    init() {
        // initialise spriteAnimation object
        this.sprite.animationStates.forEach((state, index) => {
            let frames = {
                loc: []
            };
            for (let j = 0; j < state.frames; j++) { // iterate for each frame
                let positionX = j * this.sprite.spriteWidth; // calculate the corresponding position of said frame
                let positionY = index * this.sprite.spriteHeight;
                frames.loc.push({ x: positionX, y: positionY }); // push these positions onto the frames object
            }
            this.sprite.spriteAnimations[state.name] = frames; // create a key on the spriteAnimations object to store this data
        });
    }
    update() {
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            effect.duration--;
            if (effect.effect.isFirstTime && effect.effect.start) {
                effect.effect.start(this);
                effect.effect.isFirstTime = false;
            }
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
        if (this.type.interactable) {
            if (checkCollision({ hitbox: player.hitbox, pos: player.pos }, { hitbox: this.hitbox, pos: this.pos }) && !player.data.onCooldown && player.data.onGround) {
                if (!this.data.showedText) {
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
            this.data.drops.forEach(drop => {
                if (Math.floor(Math.random() * 100) <= drop.chance) {
                    player.addItem(drop.drop, Math.floor(Math.random() * drop.amount));
                }
            });
            this.changeState('death');
            this.data.onCooldown = true;
            currentEvents.push({ event: 'kill', entity: this });
            isQuestUIupdated = false;
            if (menu.checkSetting('Master Sound'))
                playSound('death');
        }
        if (!menu.checkSetting('No Aggro')) {
            const playerPosX = player.pos.x;
            const distanceXToPlayer = Math.abs((playerPosX + (player.sprite.spriteWidth / 2) * player.sprite.scale) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale));
            const playerDirec = this.pos.x - player.pos.x;
            if (distanceXToPlayer <= this.data.attackRange && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy') {
                this.attack();
                this.setCooldown(1500);
            }
            else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy') {
                this.attack();
                this.setCooldown(1200);
            }
            else if (distanceXToPlayer <= this.data.seeRange && !this.data.onCooldown && this.type.allignment === 'enemy') {
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
                if (this.sprite.currentState === 'run')
                    this.changeState('idle');
            }
        }
        this.effectData.effectTicks++;
    }
    draw() {
        if (menu.checkSetting('Hitboxes')) {
            ctx.save();
            ctx.strokeStyle = this.type.allignment === 'enemy' ? 'red' : (this.type.allignment === 'passive' ? 'yellow' : 'green');
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x + this.hitbox.offsetX, this.pos.y + this.hitbox.offsetY, this.hitbox.width, this.hitbox.height);
            ctx.restore();
        }
        let frameX = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].x; // get current locations of the animation
        let frameY = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].y;
        let orientation = (player.pos.x + player.sprite.spriteWidth / 2) - (this.pos.x + this.sprite.spriteWidth / 2);
        if (this.data.name === 'elder') {
            orientation = -orientation;
        }
        if (orientation <= 0 && !this.type.isNotTurning) {
            this.data.Xdirec = 2;
            ctx.save(); // save current state of the canvas
            const drawX = -(this.pos.x + 400 * this.sprite.scale);
            ctx.scale(-1, 1); // invert orientatian of the entity
            ctx.drawImage(this.sprite.img, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale);
            ctx.restore();
        }
        else {
            this.data.Xdirec = 1;
            ctx.drawImage(this.sprite.img, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale);
        }
    }
    changeState(state) {
        this.sprite.currentState = state;
        this.sprite.frameLoc = 0; // reset animation
        this.sprite.frames = 0;
    }
    takeHit(damage) {
        if (this.data.health <= 0)
            return;
        this.changeState('take_hit');
        this.data.health -= damage;
        this.showHealthbar();
    }
    setCooldown(ms) {
        this.data.onCooldown = true;
        setTimeout(() => this.data.onCooldown = false, ms);
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
                    particles.push(new projectile(this, this.type.attackType.projectile.spriteWidth, this.type.attackType.projectile.spriteHeight, this.type.attackType.projectile.scale, this.type.attackType.projectile.pathToImage, this.type.attackType.projectile.animationStates, this.type.attackType.projectile.range, this.type.attackType.projectile.speed, this.type.attackType.projectile.damage, this.type.attackType.projectile.hitbox));
                }
                else {
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
                this.changeState('idle');
            }
        }
        if (this.type.name === 'trader' && this.sprite.currentState === 'open') {
            this.changeState('dialogue');
        }
    }
    attack() {
        if (!this.data.onCooldown) {
            this.changeState('attack');
        }
    }
    showHealthbar() {
        const exists = nonWorldElems.some(o => o.type.name === 'healthbar' &&
            o.entity === this);
        if (!exists) {
            const newHealthbar = new healthbar(this);
            nonWorldElems.push(newHealthbar);
        }
    }
    addEffect(effect, duration, factor) {
        let foundDuplicate = false;
        this.effectData.effects.forEach(effect1 => {
            if (effect1.effect.name === effect) {
                effect1.duration = duration;
                foundDuplicate = true;
            }
        });
        if (!foundDuplicate) {
            const image = new Image();
            image.src = effects[effect].particle;
            this.effectData.effects.push({ effect: effects[effect], duration, factor, index: this.effectData.effectCounter });
            particles.push(new particle(this, effects[effect].spriteWidth, effects[effect].spriteHeight, image, this.effectData.effectCounter, effects[effect].frameAmount));
            this.effectData.effectCounter++;
        }
    }
    removeEffect(index) {
        for (let i = 0; i < this.effectData.effects.length; i++) {
            if (this.effectData.effects[i].index === index) {
                this.effectData.effects.splice(i, 1);
                break;
            }
        }
        let particleIndex = 0;
        particles.forEach((particle, i) => {
            if (particle.counter === index) {
                particleIndex = i;
            }
        });
        particles.splice(particleIndex, 1);
    }
    heal(healAmount) {
        if (healAmount + this.data.health >= this.data.maxHealth) {
            this.data.health = this.data.maxHealth;
        }
        else {
            this.data.health += healAmount;
        }
    }
    checkEffect(effect) {
        let foundEffect = false;
        let effect2 = null;
        this.effectData.effects.forEach(effect1 => {
            if (effect1.effect.name === effect) {
                foundEffect = true;
                effect2 = effect1;
            }
        });
        return { wasFound: foundEffect, effect: effect2 };
    }
}
class enemy extends Entity {
    constructor(pos, sprite, data, type, worldElem, id) {
        let image = new Image();
        image.src = sprite.pathToImage;
        super({ x: pos.x, y: pos.y }, {
            img: image, spriteWidth: sprite.spriteWidth, spriteHeight: sprite.spriteHeight, scale: sprite.scale,
            animationStates: sprite.animationStates, hitbox: sprite.hitbox
        }, {
            maxHealth: data.maxHealth, attackDamage: data.attackDamage, attackRange: data.attackRange, drops: data.drops, name: data.name
        }, type, worldElem, id);
        this.init();
    }
    interact() {
        return;
    }
}
class nightBorn extends Entity {
    constructor(x, y, worldElem, id) {
        let image = new Image();
        image.src = 'img/enemies/nightBorn.png';
        const scale = 1.5;
        if (y === StaticPositions.OnGround) {
            y = 230;
        }
        super({ x, y }, {
            img: image, spriteWidth: 300, spriteHeight: 300, scale: scale,
            animationStates: [
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
            ], hitbox: { offsetX: 100, offsetY: 100, width: 100, height: 100 }
        }, {
            maxHealth: 300, attackDamage: 80, attackRange: 80, drops: [{ amount: 1, drop: "silver_ingot", chance: 100 }], name: 'nightborn'
        }, {
            isGround: true /* is it a ground/flying troop */, name: 'nightBorn' /* name of the enemy */, allignment: 'enemy' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: true, interactable: false
        }, worldElem, id);
        this.worldElem = worldElem;
        this.init();
    }
    interact() {
        return;
    }
}
class goblin extends Entity {
    constructor(x, y, worldElem, id) {
        let image = new Image();
        image.src = 'img/enemies/goblin.png';
        const scale = 1;
        if (y === StaticPositions.OnGround) {
            y = 430;
        }
        super({ x, y }, {
            img: image, spriteWidth: 150, spriteHeight: 150, scale: scale,
            animationStates: [
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
            ], hitbox: { offsetX: 150, offsetY: 160, width: 80, height: 100 }
        }, {
            maxHealth: 50, attackDamage: 8, attackRange: 75, drops: [{ amount: 2, drop: "leather", chance: 25 }, { amount: 1, drop: "cloth", chance: 5 }, { amount: 1, drop: "string", chance: 10 }], name: 'goblin'
        }, {
            isGround: true /* is it a ground/flying troop */, name: 'goblin' /* name of the enemy */, allignment: 'enemy' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: true, interactable: false
        }, worldElem, id);
        this.worldElem = worldElem;
        this.init();
    }
    interact() {
        return;
    }
}
class skeleton extends Entity {
    constructor(x, y, worldElem, id) {
        let image = new Image();
        image.src = 'img/enemies/skeleton.png';
        const scale = 0.5;
        if (y === StaticPositions.OnGround) {
            y = 500;
        }
        super({ x, y }, {
            img: image, spriteWidth: 96, spriteHeight: 64, scale: scale,
            animationStates: [
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
            ], hitbox: { offsetX: 85, offsetY: 80, width: 50, height: 100 }
        }, {
            maxHealth: 35, attackDamage: 10, attackRange: 100, drops: [{ amount: 1, drop: "stone", chance: 25 }], name: 'skeleton'
        }, {
            isGround: true /* is it a ground/flying troop */, name: 'skeleton' /* name of the enemy */, allignment: 'enemy' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: true, interactable: false
        }, worldElem, id);
        this.worldElem = worldElem;
        this.init();
    }
    interact() {
        return;
    }
}
class trader extends Entity {
    constructor(pos, sprite, trade, worldElem, isNotTurning, id) {
        let image = new Image();
        image.src = sprite.img;
        if (pos.y === StaticPositions.OnGround) {
            pos.y = 500;
        }
        super({ x: pos.x, y: pos.y }, {
            img: image, spriteWidth: sprite.spriteWidth, spriteHeight: sprite.spriteHeight, scale: sprite.scale,
            animationStates: [
                {
                    name: 'idle',
                    frames: sprite.frameAmount
                }
            ], hitbox: { offsetX: 100, offsetY: 100, width: 100, height: 100 }
        }, {
            maxHealth: 50, attackDamage: 15, attackRange: 50, drops: [{ amount: 1, drop: "stone", chance: 75 }], name: 'trader'
        }, {
            isGround: true /* is it a ground/flying troop */, name: 'trader' /* name of the enemy */, allignment: 'passive' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: false, interactable: true, isNotTurning: isNotTurning
        }, worldElem, id);
        this.worldElem = worldElem;
        this.trade = trade;
        this.init();
    }
    interact() {
        openTradingMenu(this.trade);
    }
}
class NPC extends Entity {
    constructor(pos, sprite, worldElem, conversation, name, present, id, quest, story) {
        let image = new Image();
        image.src = sprite.pathToImage;
        // samurai: SW:96 SH: 96 
        if (pos.y === StaticPositions.OnGround) {
            pos.y = groundY - 400 * sprite.scale;
        }
        super({ x: pos.x, y: pos.y }, {
            img: image, spriteWidth: sprite.spriteWidth, spriteHeight: sprite.spriteHeight, scale: sprite.scale, animationStates: [{ name: 'idle', frames: sprite.frameAmount }], hitbox: sprite.hitbox
        }, { maxHealth: 100, attackRange: 1, attackDamage: 1, drops: [], name: name }, {
            isGround: true /* is it a ground/flying troop */, name: 'NPC' /* name of the enemy */, allignment: 'passive' /* does it attack the player */, moving: true /* does it need to move while the player moves */, attackable: false, interactable: true
        }, worldElem, id);
        this.worldElem = worldElem;
        this.conversation = conversation;
        this.conversationCounter = 0;
        this.isSpeaking = false;
        this.name = name;
        this.present = present;
        this.hasGivenPresent = false;
        this.quest = quest;
        this.story = story;
        this.init();
    }
    endConversation() {
        if (this.hasGivenPresent)
            return;
        this.present.forEach(item => {
            player.addItem(item.item, item.amount);
        });
        this.hasGivenPresent = true;
        if (this.quest) {
            activeQuests.push(this.quest);
            isQuestUIupdated = false;
        }
        if (this.story) {
            this.story.forEach(elem => {
                if (elem.action === 'destroy') {
                    removeWorldElements(elem.ids, ['id'], elem.dim);
                }
                else if (elem.action === 'spawn') {
                    spawnElements(elem.extra, elem.dim);
                }
            });
        }
    }
    speak() {
        const speakDiv = document.querySelector('#speakWrapper');
        speakDiv === null || speakDiv === void 0 ? void 0 : speakDiv.classList.remove('display-none');
        player.data.canMove = false;
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
}
// player classs
class Player {
    constructor(x, y) {
        this.pos = {
            x: x,
            y: y
        };
        this.sprite = {
            img: new Image(),
            spriteWidth: 162,
            spriteHeight: 162,
            frames: 0,
            frameLoc: 0,
            animationStates: [
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
            ],
            spriteAnimations: {},
            currentState: 'idle',
            scale: 1
        };
        this.sprite.img.src = 'img/player.png';
        this.effectData = {
            effects: [],
            effectTicks: 0,
            effectCounter: 0
        };
        this.data = {
            onGround: true,
            onInventory: false,
            onTradingMenu: false,
            showedText: false,
            speed: 20,
            onSecondaryInventory: false,
            canMove: true,
            isMoving: false,
            velocity_Y: 0,
            health: 100,
            maxHealth: 100,
            interactionRange: 125,
            dragging: null,
            selectedSlot: 1,
            showingText: false,
            interactionFocus: null,
            Ydirec: 0,
            Xdirec: 1,
            onCooldown: false,
            inventory: [
                [null, null, null, null, null],
                [null, null, null, null, null],
                [null, null, null, null, null],
                [null, null, null, null, null],
            ],
            armor: [null, null, null],
            craftingInventory: [[null, null, null], [null, null, null], [null, null, null]],
            attackRange: 150,
            attackDamage: 5,
            drops: [],
            name: "player",
            isDead: false,
            seeRange: 0,
        };
        this.hitbox = { offsetX: 195, offsetY: 170, width: 60, height: 110 };
        this.type = { isGround: true, name: 'player', allignment: 'friendly', moving: false, attackable: false, interactable: false };
        this.isInit = false;
        this.lootDrop = [];
        this.id = -1;
        this.worldElem = 'player';
        this.init();
    }
    update() {
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            effect.duration--;
            if (effect.effect.isFirstTime && effect.effect.start) {
                effect.effect.start(this);
                effect.effect.isFirstTime = false;
            }
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
        // check if player is jumping
        if (!this.data.onGround && !(gameFrame % staggerFrames)) {
            if (this.data.Ydirec === 1) { // if he is moving upward 
                this.pos.y -= this.data.velocity_Y * globalGravity; // calculate new y position
                this.data.velocity_Y -= 0.2; // advance velocity
                if (this.sprite.currentState !== 'attack3' && this.sprite.currentState !== 'jump')
                    player.changeState('jump');
            }
            else if (this.data.Ydirec === 2) {
                this.pos.y += this.data.velocity_Y * globalGravity; // calculate new y position
                this.data.velocity_Y += 0.2; // advance velocity
                if (this.sprite.currentState !== 'attack3' && this.sprite.currentState !== 'fall')
                    player.changeState('fall');
            }
            if (this.data.velocity_Y <= 0) { // invert movement
                this.data.Ydirec = 2;
            }
            if (this.pos.y + this.sprite.spriteHeight >= groundY) { // check if player is on the ground
                this.pos.y = groundY - this.sprite.spriteHeight;
                this.data.onGround = true; // reset values
                this.data.velocity_Y = 0;
                this.data.Ydirec = 0;
                if (this.sprite.currentState !== 'attack3')
                    this.changeState('idle');
            }
            else {
                this.data.onGround = false;
            }
        }
        this.sprite.frames++;
        if (this.sprite.frames >= staggerFrames) { // check if next frame should be drawn
            this.sprite.frames = 0; // reset frames
            this.sprite.frameLoc++; // advance to next frame
            const frameAmount = this.sprite.spriteAnimations[this.sprite.currentState].loc.length;
            if (this.sprite.frameLoc >= frameAmount) { // check if the end of the animation is reached
                this.sprite.frameLoc = 0;
                this.endOfAnimation(); // check if any state should be changed at the end of its execution (one time animation)
            }
        }
        this.effectData.effectTicks++;
    }
    draw() {
        if (menu.checkSetting('Hitboxes')) {
            ctx.save();
            ctx.strokeStyle = this.type.allignment === 'enemy' ? 'red' : (this.type.allignment === 'passive' ? 'yellow' : 'green');
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x + this.hitbox.offsetX, this.pos.y + this.hitbox.offsetY, this.hitbox.width, this.hitbox.height);
            ctx.restore();
        }
        let frameX = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].x;
        let frameY = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].y;
        if (this.data.Xdirec === 2) {
            ctx.save(); // save current state of the canvas
            const drawX = -(this.pos.x + 450);
            ctx.scale(-1, 1); // invert orientatian of the entity
            ctx.drawImage(this.sprite.img, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX, this.pos.y, 450, 450);
            ctx.restore();
        }
        else if (this.data.Xdirec === 1) {
            ctx.drawImage(this.sprite.img, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, 450, 450);
        } // (image, sx, sy, sw, sh, dx, dy, dw, dh)
    }
    init() {
        this.sprite.animationStates.forEach((state, index) => {
            let frames = {
                loc: []
            };
            for (let j = 0; j < state.frames; j++) {
                let positionX = j * this.sprite.spriteWidth;
                let positionY = index * this.sprite.spriteHeight;
                frames.loc.push({ x: positionX, y: positionY });
            }
            this.sprite.spriteAnimations[state.name] = frames;
        });
    }
    changeState(state) {
        this.sprite.currentState = state;
        this.sprite.frameLoc = 0; // reset animation
        this.sprite.frames = 0;
    }
    showHealthbar() {
        const exists = nonWorldElems.some(o => o.type.name === 'healthbar' &&
            o.entity === this); // check if healthbar already exists
        if (!exists) {
            const newHealthbar = new healthbar(this);
            nonWorldElems.push(newHealthbar);
        }
    }
    takeHit(damage) {
        if (this.sprite.currentState !== 'attack1' && this.sprite.currentState !== 'attack3')
            this.changeState('take_hit');
        let protection = 100;
        this.data.armor.forEach(armor => {
            if (armor !== null && items[armor].protection) {
                protection -= items[armor].protection;
            }
        });
        this.data.health -= damage * (protection / 100);
        if (this.data.health < 0)
            this.data.health = 0;
        this.setCooldown(200);
    }
    setCooldown(ms) {
        this.data.onCooldown = true;
        setTimeout(() => this.data.onCooldown = false, ms);
    }
    attack() {
        gameSpeed = 0; // make the player stop walking
        if (!this.data.onCooldown) {
            if (this.data.onGround) {
                this.changeState(`attack1`); // change to attack state
                if (menu.checkSetting('Master Sound'))
                    playSound('slice');
                if (player.data.inventory[3][this.data.selectedSlot - 1] !== null) {
                    this.setCooldown(items[player.data.inventory[3][this.data.selectedSlot - 1]].attackCooldown); // set a cooldown
                }
                else {
                    this.setCooldown(1000);
                }
                setTimeout(() => {
                    worlds[currentWorld].elements.forEach(obj => {
                        var _a;
                        if (!(obj instanceof Entity))
                            return;
                        let attackRange = 100;
                        const item = this.data.inventory[3][this.data.selectedSlot - 1];
                        if (item !== null) {
                            attackRange = items[item].attackRange;
                        }
                        if (checkCollision({ hitbox: { offsetY: 0 + this.hitbox.offsetY, offsetX: this.data.Xdirec === 1 ? this.hitbox.offsetX + this.hitbox.width : this.hitbox.offsetX - attackRange, width: attackRange, height: this.hitbox.height }, pos: this.pos }, { hitbox: obj.hitbox, pos: obj.pos }) && obj.type.attackable) { // Xdirec === 1 --> rechts Xdirec === 2 --> Links
                            let attackDamage = (this.data.inventory[3][this.data.selectedSlot - 1] ? items[this.data.inventory[3][this.data.selectedSlot - 1]].attackDamage : 1);
                            if (menu.checkSetting('Inf Damage'))
                                attackDamage = 10000;
                            if (this.checkEffect('strength').wasFound) {
                                attackDamage += (((_a = this.checkEffect('strength').effect) === null || _a === void 0 ? void 0 : _a.factor) / 2) * 6;
                            }
                            if (this.checkEffect('electrocute').wasFound) {
                                obj.addEffect('stun', 200, 1);
                            }
                            obj.takeHit(attackDamage);
                            const selectedSlot = this.data.inventory[3][this.data.selectedSlot - 1];
                            if (selectedSlot !== null) {
                                if (items[selectedSlot].attack) {
                                    items[selectedSlot].attack(obj);
                                }
                            }
                        }
                    });
                }, 300);
            }
            else {
                if (this.data.Ydirec !== 0) {
                    this.changeState(`attack3`); // change to attack state
                    if (menu.checkSetting('Master Sound'))
                        playSound('slice');
                    if (player.data.inventory[3][this.data.selectedSlot - 1] !== null) {
                        this.setCooldown(items[player.data.inventory[3][this.data.selectedSlot - 1]].attackCooldown); // set a cooldown
                    }
                    else {
                        this.setCooldown(1500);
                    }
                    setTimeout(() => {
                        worlds[currentWorld].elements.forEach(obj => {
                            var _a;
                            if (!(obj instanceof Entity))
                                return;
                            let attackRange = 100;
                            const item = this.data.inventory[3][this.data.selectedSlot - 1];
                            if (item !== null) {
                                attackRange = items[item].attackRange;
                            }
                            if (checkCollision({ hitbox: { offsetY: 0 + this.hitbox.offsetY, offsetX: this.data.Xdirec === 1 ? this.hitbox.offsetX + this.hitbox.width : this.hitbox.offsetX - attackRange, width: attackRange, height: this.hitbox.height }, pos: this.pos }, { hitbox: obj.hitbox, pos: obj.pos }) && obj.type.attackable) { // Xdirec === 1 --> rechts Xdirec === 2 --> Links
                                let attackDamage = (this.data.inventory[3][this.data.selectedSlot - 1] ? items[this.data.inventory[3][this.data.selectedSlot - 1]].attackDamage : 1);
                                if (menu.checkSetting('Inf Damage'))
                                    attackDamage = 10000;
                                if (this.checkEffect('strength').wasFound) {
                                    attackDamage += (((_a = this.checkEffect('strength').effect) === null || _a === void 0 ? void 0 : _a.factor) / 2) * 6;
                                }
                                if (this.checkEffect('electrocute').wasFound) {
                                    obj.addEffect('stun', 200, 1);
                                }
                                obj.takeHit(attackDamage);
                                const selectedSlot = this.data.inventory[3][this.data.selectedSlot - 1];
                                if (selectedSlot !== null) {
                                    if (items[selectedSlot].attack) {
                                        items[selectedSlot].attack(obj);
                                    }
                                }
                            }
                        });
                    }, 300);
                }
            }
        }
    }
    jump() {
        if (!player.data.onCooldown && player.data.onGround) {
            player.data.onGround = false;
            player.data.velocity_Y = 1;
            player.data.Ydirec = 1;
        }
    }
    endOfAnimation() {
        if (this.sprite.currentState === 'attack1' || this.sprite.currentState === 'take_hit' || this.sprite.currentState === 'attack3') { // reset animation
            this.changeState('idle');
        }
    }
    useItem() {
        const currentItem = player.data.inventory[3][this.data.selectedSlot - 1];
        if (!currentItem)
            return;
        if (items[player.data.inventory[3][this.data.selectedSlot - 1]].clearsAfterUse)
            player.data.inventory[3][this.data.selectedSlot - 1] = null;
        items[currentItem].use();
        updateHotbar();
    }
    heal(healAmount) {
        if (healAmount + this.data.health >= this.data.maxHealth) {
            this.data.health = this.data.maxHealth;
        }
        else {
            this.data.health += healAmount;
        }
    }
    interact() {
        if (this.data.interactionFocus)
            this.data.interactionFocus.interact();
    }
    addItem(item, amount) {
        let itemCounter = 0;
        outerLoop: for (let y = 3; y >= 0; y--) {
            for (let x = 0; x < 5; x++) {
                if (player.data.inventory[y][x] === null) {
                    player.data.inventory[y][x] = item;
                    itemCounter++;
                    if (itemCounter >= amount) {
                        break outerLoop;
                    }
                }
            }
        }
        if (itemCounter < amount) {
            displayInfo('Not enough space!');
        }
        updateHotbar();
    }
    addEffect(effect, duration, factor) {
        let foundDuplicate = false;
        this.effectData.effects.forEach(effect1 => {
            if (effect1.effect.name === effect) {
                effect1.duration = duration;
                foundDuplicate = true;
            }
        });
        if (!foundDuplicate) {
            const image = new Image();
            image.src = effects[effect].particle;
            this.effectData.effects.push({ effect: effects[effect], duration, factor, index: this.effectData.effectCounter });
            particles.push(new particle(this, effects[effect].spriteWidth, effects[effect].spriteHeight, image, this.effectData.effectCounter, effects[effect].frameAmount));
            this.effectData.effectCounter++;
            const innerDiv = document.createElement('div');
            innerDiv.id = `${effect} `;
            const div = document.querySelector('.effect-icons-div');
            const effectIcon = document.createElement('div');
            effectIcon.title = effects[effect].name;
            const durationDiv = document.createElement('h3');
            durationDiv.textContent = String(duration);
            durationDiv.id = 'duration';
            effectIcon.classList.add('effectIcon');
            effectIcon.style.backgroundImage = `url(${effects[effect].icon})`;
            innerDiv === null || innerDiv === void 0 ? void 0 : innerDiv.appendChild(effectIcon);
            innerDiv === null || innerDiv === void 0 ? void 0 : innerDiv.appendChild(durationDiv);
            div === null || div === void 0 ? void 0 : div.appendChild(innerDiv);
        }
    }
    removeEffect(index) {
        for (let i = 0; i < this.effectData.effects.length; i++) {
            if (this.effectData.effects[i].index === index) {
                document.querySelector(`#${this.effectData.effects[i].effect.name} `).remove();
                this.effectData.effects.splice(i, 1);
                break;
            }
        }
        let particleIndex = 0;
        particles.forEach((particle, i) => {
            if (particle.counter === index) {
                particleIndex = i;
            }
        });
        particles.splice(particleIndex, 1);
    }
    checkEffect(effect) {
        let foundEffect = false;
        let effect2 = null;
        this.effectData.effects.forEach(effect1 => {
            if (effect1.effect.name === effect) {
                foundEffect = true;
                effect2 = effect1;
            }
        });
        return { wasFound: foundEffect, effect: effect2 };
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
        worlds[dim].elements.splice(i, 1);
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
// inventory logic
function openInventory() {
    player.data.onInventory = true;
    const inventoryDiv = document.querySelector('.inventory-div');
    const playerDiv = document.querySelector('.player-data');
    inventoryDiv === null || inventoryDiv === void 0 ? void 0 : inventoryDiv.classList.remove('display-none');
    renderInventory();
}
function parseSlotId(id) {
    const match = id.match(/(slot|secondarySlot|armorSlot|craftingSlot)(\d+)(\d+)/);
    if (!match)
        throw new Error('Invalid ID!');
    return {
        x: Number(match[2]),
        y: Number(match[3])
    };
}
function updateHotbar() {
    for (let x = 0; x < 5; x++) {
        const hotbarSlot = document.querySelector(`#hotbar${x + 1}`);
        hotbarSlot.innerHTML = '';
        if (player.data.inventory[3][x] !== null) {
            const itemDivHotbar = document.createElement('div');
            itemDivHotbar.classList.add('slotItem');
            itemDivHotbar.style.scale = `${items[player.data.inventory[3][x]].scale + 1} `;
            itemDivHotbar.style.width = `${items[player.data.inventory[3][x]].width}px`;
            itemDivHotbar.style.height = `${items[player.data.inventory[3][x]].height}px`;
            itemDivHotbar.style.backgroundImage = `url(img/items/${items[player.data.inventory[3][x]].src})`;
            itemDivHotbar.style.backgroundPosition = `-${items[player.data.inventory[3][x]].spriteX}px -${items[player.data.inventory[3][x]].spriteY}px`;
            hotbarSlot.appendChild(itemDivHotbar);
        }
    }
}
function advanceConversation(NPC) {
    var _a, _b;
    const speakBtn = document.querySelector('#speakBtn');
    const speak = document.querySelector('.speak');
    let currentConversation;
    if (!NPC.hasGivenPresent && NPC.conversation) {
        currentConversation = NPC.conversation.first;
    }
    else if (NPC.quest && NPC.quest.completed && ((_a = NPC.conversation) === null || _a === void 0 ? void 0 : _a.questCompleted)) {
        currentConversation = NPC.conversation.questCompleted;
    }
    else {
        if ((_b = NPC.conversation) === null || _b === void 0 ? void 0 : _b.second) {
            currentConversation = NPC.conversation.second;
        }
        else {
            currentConversation = NPC.conversation.first;
        }
    }
    if (NPC.conversationCounter >= currentConversation.length) {
        const speakDiv = document.querySelector('#speakWrapper');
        speakDiv === null || speakDiv === void 0 ? void 0 : speakDiv.classList.add('display-none');
        NPC.conversationCounter = 0;
        player.data.canMove = true;
        NPC.isSpeaking = false;
        if (!NPC.endConversation)
            return;
        NPC.endConversation();
        return;
    }
    const charArray = currentConversation[NPC.conversationCounter].split('');
    let counter = 0;
    let interval = setInterval(() => {
        speak.innerHTML += charArray[counter];
        counter++;
        if (counter >= charArray.length) {
            clearInterval(interval);
            NPC.conversationCounter++;
            speakBtn.classList.remove('display-none');
            speakBtn.replaceWith(speakBtn.cloneNode(true));
            const newSpeakBtn = document.querySelector('#speakBtn');
            newSpeakBtn.addEventListener('click', () => {
                speak.innerHTML = '';
                newSpeakBtn.classList.add('display-none');
                advanceConversation(NPC);
            });
        }
    }, 50);
}
function renderInventory() {
    var _a;
    document.querySelector('.inventory-div').innerHTML = `<div class="armor-div"></div><div class="slots-div"></div > <div class="player-data" > </div>`;
    const playerDiv = document.querySelector('.player-data');
    const armorDiv = document.querySelector('.armor-div');
    playerDiv.innerHTML = `<h2>No item selected</h2>`;
    // add each armor slot
    for (let i = 0; i < 3; i++) {
        const slot = document.createElement('div');
        if (i === 0) {
            slot.classList.add('helmet');
        }
        else if (i === 1) {
            slot.classList.add('chestplate');
        }
        else {
            slot.classList.add('boots');
        }
        slot.classList.add('armorSlot');
        slot.classList.add('inv-slot');
        slot.id = `armorSlot${i}0`;
        armorDiv === null || armorDiv === void 0 ? void 0 : armorDiv.appendChild(slot);
    }
    // add each armor item
    for (let i = 0; i < 3; i++) {
        if (player.data.armor[i] !== null) {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item');
            itemDiv.addEventListener('click', (e) => {
                var _a;
                e.stopPropagation();
                player.data.dragging = e.target.parentElement.id;
                (_a = document.querySelector('body')) === null || _a === void 0 ? void 0 : _a.classList.add('grab');
                if (player.data.armor[i] !== null) {
                    if (items[player.data.armor[i]].type === 'armor')
                        playerDiv.innerHTML = `<h2>${player.data.armor[i].replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[player.data.armor[i]].protection}%</h3>${items[player.data.armor[i]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.armor[i]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.armor[i]].description} </h2>`;
                }
            });
            itemDiv.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                if (player.data.armor[i] !== null && e.button === 2 && items[player.data.armor[i]].type === 'armor') {
                    playerDiv.innerHTML = `<h2>${player.data.armor[i].replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[player.data.armor[i]].protection}%</h3>${items[player.data.armor[i]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.armor[i]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.armor[i]].description} </h2>`;
                }
            });
            itemDiv.style.backgroundImage = `url(img/items/${items[player.data.armor[i]].src})`;
            itemDiv.style.width = `${items[player.data.armor[i]].width}px`;
            itemDiv.style.height = `${items[player.data.armor[i]].height}px`;
            itemDiv.style.scale = `${items[player.data.armor[i]].scale}`;
            itemDiv.style.backgroundPosition = `-${items[player.data.armor[i]].spriteX}px -${items[player.data.armor[i]].spriteY}px`;
            document.querySelector(`#armorSlot${i}0`).appendChild(itemDiv);
        }
    }
    // add each slot
    for (let y = 0; y < player.data.inventory.length; y++) {
        for (let x = 0; x < player.data.inventory[y].length; x++) {
            const slot = document.createElement('div');
            slot.classList.add('inv-slot');
            slot.classList.add('primarySlot');
            slot.id = `slot${x}${y}`;
            (_a = document.querySelector('.slots-div')) === null || _a === void 0 ? void 0 : _a.appendChild(slot);
        }
    }
    // add each item
    for (let y = 0; y < player.data.inventory.length; y++) {
        for (let x = 0; x < player.data.inventory[y].length; x++) {
            if (player.data.inventory[y][x] !== null) {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('item');
                itemDiv.addEventListener('click', (e) => {
                    var _a;
                    e.stopPropagation();
                    player.data.dragging = e.target.parentElement.id;
                    (_a = document.querySelector('body')) === null || _a === void 0 ? void 0 : _a.classList.add('grab');
                    if (player.data.inventory[y][x] !== null) {
                        if (items[player.data.inventory[y][x]].type === 'armor') {
                            playerDiv.innerHTML = `<h2>${player.data.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[player.data.inventory[y][x]].protection}%</h3>${items[player.data.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.inventory[y][x]].description} </h2>`;
                        }
                        else if (items[player.data.inventory[y][x]].type === 'weapon') {
                            playerDiv.innerHTML = `<h2>${player.data.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br> <h3>Attack Damage: ${items[player.data.inventory[y][x]].attackDamage}</h3> <br><h3>Attack Speed: ${items[player.data.inventory[y][x]].attackCooldown / 1000}s</h3><br><h3>Attack Range: ${items[player.data.inventory[y][x]].attackRange}</h3>${items[player.data.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.inventory[y][x]].description} </h2>`;
                        }
                        else if (items[player.data.inventory[y][x]].type === 'food') {
                            playerDiv.innerHTML = `<h2>${player.data.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br> ${items[player.data.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.inventory[y][x]].description} </h2>`;
                        }
                        else {
                            playerDiv.innerHTML = `<h2>${player.data.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br>${items[player.data.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.inventory[y][x]].description} </h2>`;
                        }
                    }
                });
                itemDiv.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    if (player.data.inventory[y][x] !== null && e.button === 2) {
                        if (items[player.data.inventory[y][x]].type === 'armor') {
                            playerDiv.innerHTML = `<h2>${player.data.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[player.data.inventory[y][x]].protection}%</h3>${items[player.data.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.inventory[y][x]].description} </h2>`;
                        }
                        else if (items[player.data.inventory[y][x]].type === 'weapon') {
                            playerDiv.innerHTML = `<h2>${player.data.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br> <h3>Attack Damage: ${items[player.data.inventory[y][x]].attackDamage}</h3> <br><h3>Attack Speed: ${items[player.data.inventory[y][x]].attackCooldown / 1000}s</h3><br><h3>Attack Range: ${items[player.data.inventory[y][x]].attackRange}</h3>${items[player.data.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.inventory[y][x]].description} </h2>`;
                        }
                        else if (items[player.data.inventory[y][x]].type === 'food') {
                            playerDiv.innerHTML = `<h2>${player.data.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br> ${items[player.data.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.inventory[y][x]].description} </h2>`;
                        }
                        else {
                            playerDiv.innerHTML = `<h2>${player.data.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br>${items[player.data.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.inventory[y][x]].description} </h2>`;
                        }
                    }
                });
                itemDiv.style.backgroundImage = `url(img/items/${items[player.data.inventory[y][x]].src})`;
                itemDiv.style.width = `${items[player.data.inventory[y][x]].width}px`;
                itemDiv.style.height = `${items[player.data.inventory[y][x]].height}px`;
                itemDiv.style.scale = `${items[player.data.inventory[y][x]].scale}`;
                itemDiv.style.backgroundPosition = `-${items[player.data.inventory[y][x]].spriteX}px -${items[player.data.inventory[y][x]].spriteY}px`;
                document.querySelector(`#slot${x}${y}`).appendChild(itemDiv);
                if (y === 3) {
                    const itemDivHotbar = document.createElement('div');
                    itemDivHotbar.classList.add('slotItem');
                    itemDivHotbar.style.scale = `${items[player.data.inventory[y][x]].scale + 1}`;
                    itemDivHotbar.style.width = `${items[player.data.inventory[y][x]].width}px`;
                    itemDivHotbar.style.height = `${items[player.data.inventory[y][x]].height}px`;
                    itemDivHotbar.style.backgroundImage = `url(img/items/${items[player.data.inventory[y][x]].src})`;
                    itemDivHotbar.style.backgroundPosition = `-${items[player.data.inventory[y][x]].spriteX}px -${items[player.data.inventory[y][x]].spriteY}px`;
                    document.querySelector(`#hotbar${x + 1}`).innerHTML = '';
                    document.querySelector(`#hotbar${x + 1}`).appendChild(itemDivHotbar);
                }
            }
            else {
                if (y === 3) {
                    document.querySelector(`#hotbar${x + 1}`).innerHTML = '';
                }
            }
        }
    }
    // crafting
    const craftingDiv = document.querySelector('.crafting-div');
    craftingDiv.innerHTML = '';
    craftingDiv === null || craftingDiv === void 0 ? void 0 : craftingDiv.classList.remove('display-none');
    const innerDiv = document.createElement('div');
    innerDiv.classList.add('grid');
    const arrowDiv = document.createElement('div');
    arrowDiv.addEventListener('click', () => {
        const recipe = checkForRecipes();
        if (recipe.isValid && recipe.output) {
            player.addItem(recipe.output, 1);
            player.data.craftingInventory = [[null, null, null], [null, null, null], [null, null, null]];
            renderInventory();
        }
    });
    arrowDiv.classList.add('arrow');
    arrowDiv.classList.add('arrow1');
    const outputDiv = document.createElement('div');
    outputDiv.classList.add('crafting-slot');
    outputDiv.classList.add('inv-slot');
    outputDiv.id = 'output';
    outputDiv.addEventListener('click', () => {
        const recipe = checkForRecipes();
        if (recipe.isValid && recipe.output) {
            player.addItem(recipe.output, 1);
            player.data.craftingInventory = [[null, null, null], [null, null, null], [null, null, null]];
            renderInventory();
        }
    });
    arrowDiv.classList.add('margin-top');
    outputDiv.classList.add('margin-top');
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            const slot = document.createElement('div');
            slot.classList.add('crafting-slot');
            slot.classList.add('inv-slot');
            slot.id = `craftingSlot${x}${y}`;
            innerDiv === null || innerDiv === void 0 ? void 0 : innerDiv.appendChild(slot);
        }
    }
    craftingDiv === null || craftingDiv === void 0 ? void 0 : craftingDiv.appendChild(innerDiv);
    craftingDiv === null || craftingDiv === void 0 ? void 0 : craftingDiv.appendChild(arrowDiv);
    craftingDiv === null || craftingDiv === void 0 ? void 0 : craftingDiv.appendChild(outputDiv);
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            if (player.data.craftingInventory[y][x] !== null) {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('item');
                itemDiv.addEventListener('click', (e) => {
                    var _a;
                    e.stopPropagation();
                    player.data.dragging = e.target.parentElement.id;
                    (_a = document.querySelector('body')) === null || _a === void 0 ? void 0 : _a.classList.add('grab');
                    if (player.data.craftingInventory[y][x] !== null) {
                        if (items[player.data.craftingInventory[y][x]].type === 'armor') {
                            playerDiv.innerHTML = `<h2>${player.data.craftingInventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[player.data.craftingInventory[y][x]].protection}%</h3>${items[player.data.craftingInventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.craftingInventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.craftingInventory[y][x]].description} </h2>`;
                        }
                        else if (items[player.data.craftingInventory[y][x]].type === 'weapon') {
                            playerDiv.innerHTML = `<h2>${player.data.craftingInventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br> <h3>Attack Damage: ${items[player.data.craftingInventory[y][x]].attackDamage}</h3> <br><h3>Attack Speed: ${items[player.data.craftingInventory[y][x]].attackCooldown / 1000}s</h3><br><h3>Attack Range: ${items[player.data.craftingInventory[y][x]].attackRange}</h3>${items[player.data.craftingInventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.craftingInventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.craftingInventory[y][x]].description} </h2>`;
                        }
                        else if (items[player.data.craftingInventory[y][x]].type === 'food') {
                            playerDiv.innerHTML = `<h2>${player.data.craftingInventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br> ${items[player.data.craftingInventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.craftingInventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.craftingInventory[y][x]].description} </h2>`;
                        }
                        else {
                            playerDiv.innerHTML = `<h2>${player.data.craftingInventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br>${items[player.data.craftingInventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.craftingInventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.craftingInventory[y][x]].description} </h2>`;
                        }
                    }
                });
                itemDiv.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    if (player.data.craftingInventory[y][x] !== null && e.button === 2) {
                        if (items[player.data.craftingInventory[y][x]].type === 'armor') {
                            playerDiv.innerHTML = `<h2>${player.data.craftingInventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[player.data.craftingInventory[y][x]].protection}%</h3>${items[player.data.craftingInventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.craftingInventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.craftingInventory[y][x]].description} </h2>`;
                        }
                        else if (items[player.data.craftingInventory[y][x]].type === 'weapon') {
                            playerDiv.innerHTML = `<h2>${player.data.craftingInventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br> <h3>Attack Damage: ${items[player.data.craftingInventory[y][x]].attackDamage}</h3> <br><h3>Attack Speed: ${items[player.data.craftingInventory[y][x]].attackCooldown / 1000}s</h3><br><h3>Attack Range: ${items[player.data.craftingInventory[y][x]].attackRange}</h3>${items[player.data.craftingInventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.craftingInventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.craftingInventory[y][x]].description} </h2>`;
                        }
                        else if (items[player.data.craftingInventory[y][x]].type === 'food') {
                            playerDiv.innerHTML = `<h2>${player.data.craftingInventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br> ${items[player.data.craftingInventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.craftingInventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.craftingInventory[y][x]].description} </h2>`;
                        }
                        else {
                            playerDiv.innerHTML = `<h2>${player.data.craftingInventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br>${items[player.data.craftingInventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.craftingInventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.craftingInventory[y][x]].description} </h2>`;
                        }
                    }
                });
                itemDiv.style.backgroundImage = `url(img/items/${items[player.data.craftingInventory[y][x]].src})`;
                itemDiv.style.width = `${items[player.data.craftingInventory[y][x]].width}px`;
                itemDiv.style.height = `${items[player.data.craftingInventory[y][x]].height}px`;
                itemDiv.style.scale = `${items[player.data.craftingInventory[y][x]].scale}`;
                itemDiv.style.backgroundPosition = `-${items[player.data.craftingInventory[y][x]].spriteX}px -${items[player.data.craftingInventory[y][x]].spriteY}px`;
                document.querySelector(`#craftingSlot${x}${y}`).appendChild(itemDiv);
            }
        }
    }
    const recipe = checkForRecipes();
    if (recipe.isValid && recipe.output) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('item');
        itemDiv.style.backgroundImage = `url(img/items/${items[recipe.output].src})`;
        itemDiv.style.width = `${items[recipe.output].width}px`;
        itemDiv.style.height = `${items[recipe.output].height}px`;
        itemDiv.style.scale = `${items[recipe.output].scale}`;
        itemDiv.style.backgroundPosition = `-${items[recipe.output].spriteX}px -${items[recipe.output].spriteY}px`;
        outputDiv.appendChild(itemDiv);
    }
    // add all of the drop logic
    document.querySelectorAll('.primarySlot').forEach(slot => {
        slot.addEventListener('click', e => {
            var _a;
            e.preventDefault();
            (_a = document.querySelector('body')) === null || _a === void 0 ? void 0 : _a.classList.remove('grab');
            if (!player.data.dragging)
                return;
            const targetElement = e.target.closest('.inv-slot');
            const dragSlot = parseSlotId(player.data.dragging);
            const targetSlot = parseSlotId(targetElement.id);
            if (player.data.inventory[targetSlot.y][targetSlot.x] !== null)
                return;
            if (player.data.dragging.slice(0, 13) === 'secondarySlot') {
                if (player.data.interactionFocus instanceof chest) {
                    const temp = player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x];
                    player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x] = null;
                    player.data.inventory[targetSlot.y][targetSlot.x] = temp;
                }
            }
            else if (player.data.dragging.slice(0, 12) === 'craftingSlot') {
                const temp = player.data.craftingInventory[dragSlot.y][dragSlot.x];
                player.data.craftingInventory[dragSlot.y][dragSlot.x] = null;
                player.data.inventory[targetSlot.y][targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 9) === 'armorSlot') {
                const temp = player.data.armor[dragSlot.x];
                player.data.armor[dragSlot.x] = null;
                player.data.inventory[targetSlot.y][targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 4) === 'slot') {
                const temp = player.data.inventory[dragSlot.y][dragSlot.x];
                player.data.inventory[dragSlot.y][dragSlot.x] = null;
                player.data.inventory[targetSlot.y][targetSlot.x] = temp;
            }
            player.data.dragging = null;
            renderInventory();
            if (player.data.onSecondaryInventory && player.data.interactionFocus instanceof chest)
                renderSecondaryContainer(player.data.interactionFocus);
        });
    });
    document.querySelectorAll('.armorSlot').forEach(slot => {
        slot.addEventListener('click', e => {
            var _a;
            e.preventDefault();
            (_a = document.querySelector('body')) === null || _a === void 0 ? void 0 : _a.classList.remove('grab');
            if (!player.data.dragging)
                return;
            const targetElement = e.target.closest('.inv-slot');
            const dragSlot = parseSlotId(player.data.dragging);
            const targetSlot = parseSlotId(targetElement.id);
            if (player.data.armor[targetSlot.x] !== null)
                return;
            if (player.data.dragging.slice(0, 13) === 'secondarySlot') {
                if (player.data.interactionFocus instanceof chest) {
                    const temp = player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x];
                    if (items[temp].type !== 'armor' || ((targetSlot.x === 0 && items[temp].slot !== 'helmet') || (targetSlot.x === 1 && items[temp].slot !== 'chestplate') || (targetSlot.x === 2 && items[temp].slot !== 'boots'))) {
                        displayInfo('Item doesn\'t fit this slot!');
                        return;
                    }
                    player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x] = null;
                    player.data.armor[targetSlot.x] = temp;
                }
            }
            else if (player.data.dragging.slice(0, 9) === 'armorSlot') {
                const temp = player.data.armor[dragSlot.x];
                if (items[temp].type !== 'armor' || ((targetSlot.x === 0 && items[temp].slot !== 'helmet') || (targetSlot.x === 1 && items[temp].slot !== 'chestplate') || (targetSlot.x === 2 && items[temp].slot !== 'boots'))) {
                    displayInfo('Item doesn\'t fit this slot!');
                    return;
                }
                player.data.armor[dragSlot.x] = null;
                player.data.armor[targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 4) === 'slot') {
                const temp = player.data.inventory[dragSlot.y][dragSlot.x];
                if (items[temp].type !== 'armor' || ((targetSlot.x === 0 && items[temp].slot !== 'helmet') || (targetSlot.x === 1 && items[temp].slot !== 'chestplate') || (targetSlot.x === 2 && items[temp].slot !== 'boots'))) {
                    displayInfo('Item doesn\'t fit this slot!');
                    return;
                }
                player.data.inventory[dragSlot.y][dragSlot.x] = null;
                player.data.armor[targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 12) === 'craftingSlot') {
                const temp = player.data.craftingInventory[dragSlot.y][dragSlot.x];
                if (items[temp].type !== 'armor' || ((targetSlot.x === 0 && items[temp].slot !== 'helmet') || (targetSlot.x === 1 && items[temp].slot !== 'chestplate') || (targetSlot.x === 2 && items[temp].slot !== 'boots'))) {
                    displayInfo('Item doesn\'t fit this slot!');
                    return;
                }
                player.data.craftingInventory[dragSlot.y][dragSlot.x] = null;
                player.data.armor[targetSlot.x] = temp;
            }
            player.data.dragging = null;
            renderInventory();
            if (player.data.onSecondaryInventory && player.data.interactionFocus instanceof chest)
                renderSecondaryContainer(player.data.interactionFocus);
        });
    });
    document.querySelectorAll('.crafting-slot').forEach(slot => {
        slot.addEventListener('click', e => {
            var _a;
            e.preventDefault();
            (_a = document.querySelector('body')) === null || _a === void 0 ? void 0 : _a.classList.remove('grab');
            if (!player.data.dragging)
                return;
            const targetElement = e.target.closest('.inv-slot');
            const dragSlot = parseSlotId(player.data.dragging);
            const targetSlot = parseSlotId(targetElement.id);
            if (player.data.craftingInventory[targetSlot.y][targetSlot.x] !== null)
                return;
            if (player.data.dragging.slice(0, 13) === 'secondarySlot') {
                if (player.data.interactionFocus instanceof chest) {
                    const temp = player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x];
                    player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x] = null;
                    player.data.craftingInventory[targetSlot.y][targetSlot.x] = temp;
                }
            }
            else if (player.data.dragging.slice(0, 9) === 'armorSlot') {
                const temp = player.data.armor[dragSlot.x];
                player.data.armor[dragSlot.x] = null;
                player.data.craftingInventory[targetSlot.y][targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 4) === 'slot') {
                const temp = player.data.inventory[dragSlot.y][dragSlot.x];
                player.data.inventory[dragSlot.y][dragSlot.x] = null;
                player.data.craftingInventory[targetSlot.y][targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 12) === 'craftingSlot') {
                const temp = player.data.craftingInventory[dragSlot.y][dragSlot.x];
                player.data.craftingInventory[dragSlot.y][dragSlot.x] = null;
                player.data.craftingInventory[targetSlot.y][targetSlot.x] = temp;
            }
            player.data.dragging = null;
            renderInventory();
            if (player.data.onSecondaryInventory && player.data.interactionFocus instanceof chest)
                renderSecondaryContainer(player.data.interactionFocus);
        });
    });
}
function closeInventory() {
    const inventoryDiv = document.querySelector('.inventory-div');
    const craftingDiv = document.querySelector('.crafting-div');
    craftingDiv === null || craftingDiv === void 0 ? void 0 : craftingDiv.classList.add('display-none');
    inventoryDiv === null || inventoryDiv === void 0 ? void 0 : inventoryDiv.classList.add('display-none');
    document.querySelector('.slots-div').innerHTML = '';
    document.querySelector('.player-data').innerHTML = '';
    player.data.onInventory = false;
    if (player.data.onSecondaryInventory) {
        const container = document.querySelector('.container');
        container.classList.add('display-none');
        document.querySelector('#slot-div-container').innerHTML = '';
        player.data.onSecondaryInventory = false;
    }
}
function openSecondaryContainer(container) {
    if (player.data.onSecondaryInventory)
        return;
    player.data.onSecondaryInventory = true;
    const inventoryDiv = document.querySelector('.container');
    inventoryDiv.classList.remove('display-none');
    container.changeState('open');
    renderSecondaryContainer(container);
}
function renderSecondaryContainer(container) {
    var _a;
    document.querySelector('.container').innerHTML = `<div div class="slots-div" id = "slot-div-container" > </div>`;
    const playerDiv = document.querySelector('.player-data');
    for (let y = 0; y < container.inventory.length; y++) {
        for (let x = 0; x < container.inventory[y].length; x++) {
            const slot = document.createElement('div');
            slot.classList.add('inv-slot');
            slot.classList.add('secondarySlot');
            slot.id = `secondarySlot${x}${y}`;
            (_a = document.querySelector('#slot-div-container')) === null || _a === void 0 ? void 0 : _a.appendChild(slot);
        }
    }
    for (let y = 0; y < container.inventory.length; y++) {
        for (let x = 0; x < container.inventory[y].length; x++) {
            if (container.inventory[y][x] !== null) {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('item');
                itemDiv.addEventListener('click', (e) => {
                    var _a;
                    e.stopPropagation();
                    player.data.dragging = e.target.parentElement.id;
                    (_a = document.querySelector('body')) === null || _a === void 0 ? void 0 : _a.classList.add('grab');
                    if (player.data.inventory[y][x] !== null) {
                        if (items[container.inventory[y][x]].type === 'armor') {
                            playerDiv.innerHTML = `<h2>${container.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[container.inventory[y][x]].protection}%</h3>${items[container.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]].description} </h2>`;
                        }
                        else if (items[container.inventory[y][x]].type === 'weapon') {
                            playerDiv.innerHTML = `<h2>${container.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br> <h3>Attack Damage: ${items[container.inventory[y][x]].attackDamage}</h3> <br><h3>Attack Speed: ${items[container.inventory[y][x]].attackCooldown / 1000}s</h3><br><h3>Attack Range: ${items[container.inventory[y][x]].attackRange}</h3>${items[container.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]].description} </h2>`;
                        }
                        else if (items[container.inventory[y][x]].type === 'food') {
                            playerDiv.innerHTML = `<h2>${container.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br> ${items[container.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]].description} </h2>`;
                        }
                        else {
                            playerDiv.innerHTML = `<h2>${container.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br>${items[container.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]].description} </h2>`;
                        }
                    }
                });
                itemDiv.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    if (container.inventory[y][x] !== null && e.button === 2) {
                        if (items[container.inventory[y][x]].type === 'armor') {
                            playerDiv.innerHTML = `<h2>${container.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[container.inventory[y][x]].protection}%</h3>${items[container.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]].description} </h2>`;
                        }
                        else if (items[container.inventory[y][x]].type === 'weapon') {
                            playerDiv.innerHTML = `<h2>${container.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br> <h3>Attack Damage: ${items[container.inventory[y][x]].attackDamage}</h3> <br><h3>Attack Speed: ${items[container.inventory[y][x]].attackCooldown / 1000}s</h3><br><h3>Attack Range: ${items[container.inventory[y][x]].attackRange}</h3>${items[container.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]].description} </h2>`;
                        }
                        else if (items[container.inventory[y][x]].type === 'food') {
                            playerDiv.innerHTML = `<h2>${container.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br> ${items[container.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]].description} </h2>`;
                        }
                        else {
                            playerDiv.innerHTML = `<h2>${container.inventory[y][x].replace(/_/g, ' ').toUpperCase()}</h2> <br>${items[container.inventory[y][x]].onUse !== '' ? '<br><h2>On use: ' + items[container.inventory[y][x]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[container.inventory[y][x]].description} </h2>`;
                        }
                    }
                });
                itemDiv.style.backgroundImage = `url(img/items/${items[container.inventory[y][x]].src})`;
                itemDiv.style.width = `${items[container.inventory[y][x]].width}px`;
                itemDiv.style.height = `${items[container.inventory[y][x]].height}px`;
                itemDiv.style.scale = `${items[container.inventory[y][x]].scale}`;
                itemDiv.style.backgroundPosition = `-${items[container.inventory[y][x]].spriteX}px -${items[container.inventory[y][x]].spriteY}px`;
                document.querySelector(`#secondarySlot${x}${y}`).appendChild(itemDiv);
            }
        }
    }
    document.querySelectorAll('.secondarySlot').forEach(slot => {
        slot.addEventListener('click', e => {
            var _a;
            e.preventDefault();
            if (!player.data.dragging)
                return;
            (_a = document.querySelector('body')) === null || _a === void 0 ? void 0 : _a.classList.remove('grab');
            // Slot, auf den das Item fallen soll
            const targetElement = e.target.closest('.inv-slot');
            const dragSlot = parseSlotId(player.data.dragging); // { x, y }
            const targetSlot = parseSlotId(targetElement.id); // { x, y }
            if (player.data.interactionFocus instanceof chest) {
                if (player.data.interactionFocus.inventory[targetSlot.y][targetSlot.x] !== null)
                    return;
                if (player.data.dragging.slice(0, 4) === 'slot') {
                    const temp = player.data.inventory[dragSlot.y][dragSlot.x];
                    player.data.inventory[dragSlot.y][dragSlot.x] = null;
                    player.data.interactionFocus.inventory[targetSlot.y][targetSlot.x] = temp;
                }
                else if (player.data.dragging.slice(0, 9) === 'armorSlot') {
                    const temp = player.data.armor[dragSlot.x];
                    player.data.armor[dragSlot.x] = null;
                    player.data.interactionFocus.inventory[targetSlot.y][targetSlot.x] = temp;
                }
                else if (player.data.dragging.slice(0, 13) === 'secondarySlot') {
                    const temp = player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x];
                    player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x] = null;
                    player.data.interactionFocus.inventory[targetSlot.y][targetSlot.x] = temp;
                }
                else if (player.data.dragging.slice(0, 12) === 'craftingSlot') {
                    const temp = player.data.craftingInventory[dragSlot.y][dragSlot.x];
                    player.data.craftingInventory[dragSlot.y][dragSlot.x] = null;
                    player.data.interactionFocus.inventory[targetSlot.y][targetSlot.x] = temp;
                }
                player.data.dragging = null;
                renderInventory();
                if (player.data.onSecondaryInventory)
                    renderSecondaryContainer(player.data.interactionFocus);
            }
        });
    });
}
function changeSelectedSlot(slot) {
    player.data.selectedSlot = slot;
    for (let i = 1; i < 6; i++) {
        document.querySelector(`#hotbar${i}`).classList.remove('selected');
    }
    document.querySelector(`#hotbar${slot}`).classList.add('selected');
}
function openTradingMenu(trades) {
    player.data.onTradingMenu = true;
    const tradingMenu = document.querySelector('#trading-menu');
    tradingMenu.classList.remove('display-none');
    tradingMenu.innerHTML = '';
    let i = 0;
    trades.forEach(trade => {
        const itemGiveDiv = document.createElement('div');
        itemGiveDiv.style.backgroundImage = `url(img/items/${items[trade[0].item].src})`;
        itemGiveDiv.style.width = `${items[trade[0].item].width}px`;
        itemGiveDiv.style.height = `${items[trade[0].item].height}px`;
        itemGiveDiv.style.scale = `${items[trade[0].item].scale}`;
        itemGiveDiv.style.backgroundPosition = `-${items[trade[0].item].spriteX}px -${items[trade[0].item].spriteY}px`;
        const itemTakeDiv = document.createElement('div');
        itemTakeDiv.style.backgroundImage = `url(img/items/${items[trade[1].item].src})`;
        itemTakeDiv.style.width = `${items[trade[1].item].width}px`;
        itemTakeDiv.style.height = `${items[trade[1].item].height}px`;
        itemTakeDiv.style.scale = `${items[trade[1].item].scale}`;
        itemTakeDiv.style.backgroundPosition = `-${items[trade[1].item].spriteX}px -${items[trade[1].item].spriteY}px`;
        itemGiveDiv.style.margin = '25px';
        itemTakeDiv.style.margin = '25px';
        const innerDiv = document.createElement('div');
        innerDiv.id = `innerDiv${i}`;
        innerDiv.classList.add('flex-center', 'innerDiv');
        tradingMenu.appendChild(innerDiv);
        const innerDiv1 = document.querySelector(`#innerDiv${i}`);
        const arrow = document.createElement('div');
        arrow.classList.add('arrow');
        const amount1 = document.createElement('h3');
        const amount2 = document.createElement('h3');
        amount1.textContent = String(trade[0].amount);
        amount2.textContent = String(trade[1].amount);
        innerDiv1.appendChild(itemGiveDiv);
        innerDiv1.appendChild(amount1);
        innerDiv1.appendChild(arrow);
        innerDiv1.appendChild(itemTakeDiv);
        innerDiv1.appendChild(amount2);
        const button = document.createElement('div');
        button.classList.add('margin-16', 'confirm-btn');
        button.addEventListener('click', () => confirmTrade(trade));
        innerDiv1.appendChild(button);
        i++;
    });
}
function closeTradingMenu() {
    document.querySelector('#trading-menu').innerHTML = '';
    document.querySelector('#trading-menu').classList.add('display-none');
    player.data.onTradingMenu = false;
}
function confirmTrade(trade) {
    let itemAmount = 0;
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 5; x++) {
            if (player.data.inventory[y][x] === trade[0].item) {
                itemAmount++;
            }
        }
    }
    if (itemAmount >= trade[0].amount) {
        itemAmount = 0;
        outerLoop: for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 5; x++) {
                if (player.data.inventory[y][x] === trade[0].item) {
                    player.data.inventory[y][x] = null;
                    itemAmount++;
                    if (itemAmount === trade[0].amount) {
                        player.addItem(trade[1].item, trade[1].amount);
                        break outerLoop;
                    }
                }
            }
        }
    }
    updateHotbar();
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
function update() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // display fps
    const fpsDiv = document.querySelector('.fps-div');
    // performace.now() => returns a time
    const now = performance.now();
    frameCount++;
    if (now - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = now;
        fpsDiv.innerHTML = `<h1>${fps} FPS</h1>`;
    }
    // player logic
    player.data.isMoving = false;
    let isBlocked = false;
    // check for keydown/up inputs
    if ((keys['KeyD'] || keys['KeyW']) && !player.data.onInventory && !player.data.onTradingMenu && !player.data.onSecondaryInventory) {
        // check for obstacles
        if (!menu.checkSetting('No Clip')) {
            worlds[currentWorld].elements.forEach(elem => {
                if (elem instanceof block && elem.blocking.isBlocking) {
                    const distanceXToPlayer = Math.abs((player.pos.x + player.sprite.spriteWidth + 50) - elem.pos.x);
                    if (distanceXToPlayer <= 7) {
                        isBlocked = true;
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
            if (player.sprite.currentState !== 'run' && player.data.onGround) {
                player.changeState('run');
            }
            if (player.checkEffect('ice').wasFound) {
                gameSpeed = 3.5;
                levelPos += 3.5;
            }
            else {
                gameSpeed = 7;
                levelPos += 7;
            }
            player.data.Xdirec = 1;
            player.data.isMoving = true;
        }
    }
    else if ((keys['KeyA'] || keys['KeyS']) && !player.data.onInventory && !player.data.onTradingMenu && !player.data.onSecondaryInventory) {
        // check for obstacles
        if (!menu.checkSetting('No Clip')) {
            worlds[currentWorld].elements.forEach(elem => {
                if (elem instanceof block && elem.blocking.isBlocking) {
                    const distanceXToPlayer = Math.abs(player.pos.x - (elem.pos.x + elem.sprite.spriteWidth * elem.sprite.scale));
                    if (distanceXToPlayer <= 7) {
                        isBlocked = true;
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
            if (player.sprite.currentState !== 'run' && player.data.onGround) {
                player.changeState('run');
            }
            if (player.checkEffect('ice').wasFound) {
                gameSpeed = -3.5;
                levelPos -= 3.5;
            }
            else {
                gameSpeed = -7;
                levelPos -= 7;
            }
            player.data.Xdirec = 2;
            player.data.isMoving = true;
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
    player.update();
    player.draw();
    particles.forEach(particle => {
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
            var _a;
            const questCompleted = quest.update(); // update quest && check if it is completed
            questDiv.innerHTML += `<hr class="background-color-black"><div><h2>${quest.text}</h2></div>`;
            let amountOfCompleted = 0;
            quest.entities.forEach(entity => {
                if (entity.completed)
                    amountOfCompleted++;
            });
            questDiv.innerHTML += `<h1>${amountOfCompleted}/${quest.entities.length}</h1>`;
            if (questCompleted) {
                questDiv.innerHTML += `<button class="confirm-btn" id="questBtn" style="scale: 0.8;"></button>`;
                (_a = document.querySelector('#questBtn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
                    quest.finish();
                });
            }
        });
        isQuestUIupdated = true;
    }
    currentEvents = [];
    gameFrame++;
    requestAnimationFrame(update);
}
const worldElements = {
    goblin: { class: goblin, args: [StaticPositions.OnGround, 'goblin'] },
    nightBorn: { class: nightBorn, args: [StaticPositions.OnGround, 'nightborn'] },
    skeleton: { class: skeleton, args: [StaticPositions.OnGround, 'skeleton'] },
    tree_1: { class: block, args: [320, 100, '/img/blocks/tree_1.png', 65, 60, 1, [{ amount: 1, item: 'stick' }], true, 2, 'tree_1', true, false, null] },
    tree_2: { class: block, args: [100, 500, '/img/blocks/tree_2.png', 85, 69, 1.5, [{ amount: 2, item: 'stick' }], true, 3, 'tree_2', true, false, null] },
    rocks_1: { class: block, args: [530, 150, '/img/blocks/rocks_1.png', 67, 39, 0.5, [{ amount: 2, item: 'stone' }], true, 1, 'rocks_1', true, false, null] },
    bush_1: { class: block, args: [560, 0, '/img/blocks/bush_1.png', 106, 43, 0.4, [], false, 1, 'bush_1', false, false, null] },
    bush_2: { class: block, args: [560, 0, '/img/blocks/bush_2.png', 101, 40, 0.4, [], false, 1, 'bush_2', false, false, null] },
    bush_3: { class: block, args: [560, 0, '/img/blocks/bush_3.png', 60, 31, 0.4, [], false, 1, 'bush_3', false, false, null] },
    wall_1: { class: block, args: [470, 0, '/img/blocks/wall_1.png', 139, 47, 0.6, [], false, 1, 'wall_1', false, false, null] },
    wall_2: { class: block, args: [530, 0, '/img/blocks/wall_2.png', 31, 63, 0.5, [], false, 1, 'wall_2', false, false, null] },
    plant_1: { class: block, args: [560, 50, '/img/blocks/plant_1.png', 34, 61, 0.4, [{ amount: 1, item: 'string' }], false, 1, 'plant_1', true, false, null] },
    //bush_fruit: { class: interactable, args: [605, 50, '/img/blocks/bush_fruit.png', 84, 55, 0.25, [{ amount: 1, item: 'fruit' }], false, 1, 'bush_fruit', true] },
    statue_1: { class: block, args: [310, 0, '/img/blocks/statue_1.png', 39, 83, 1, [], false, 1, 'statue_1', false, false, null] },
    chest: { class: chest, args: [StaticPositions.OnGround, 'chest'] },
    NPC: { class: NPC, args: ['NPC'] },
    trader: { class: trader, args: [StaticPositions.OnGround] },
    teleporter: { class: teleporter, args: [] }
};
let currentWorld = 'jungle';
const worlds = {
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
            // start area
            new block({ x: 1800, y: 0 }, { pathToImage: '', spriteWidth: 1, spriteHeight: 1, scale: 1 }, null, { isBlocking: true, removeItem: null, text: 'This path is dangerous!' }, 'invisWall', 20),
            new NPC({ x: 1400, y: 560 }, { pathToImage: '/img/passiveEntities/elder.png', spriteWidth: 32, spriteHeight: 32, frameAmount: 4, scale: 0.4, hitbox: { offsetX: -40, offsetY: 0, width: 250, height: 150 } }, 'NPC', { first: ['Ohh, welcome traveler!', 'Isn\'t that statue beautifull!', 'What, you don\'t remember anything??', 'Well, that\'s probably for the best.', 'The goblins have attacked us!', 'You need to rescue the captured humans!', 'I mean, you do look like a strong warrior!', 'So what are you waiting for and go north to find them!'], second: ['Please, recue them!'], questCompleted: ['Thank you so much!', 'The samurai was my friend!'] }, 'elder', [], 1, new quest('kill', [11, 12, 13], 'Defeat the goblins, who are guarding the captured humans!', [{ item: 'key', amount: 1 }]), [{ action: 'destroy', ids: [20], dim: 'jungle' }]),
            new block({ x: 200, y: 320 }, { pathToImage: '/img/blocks/tree_1.png', spriteWidth: 65, spriteHeight: 60, scale: 1 }, { cooldown: 100, output: [{ amount: 1, item: 'stick' }], isInfinite: true, healthBarScale: 2.5 }, { isBlocking: false, removeItem: null }, 'tree_1', 0),
            new block({ x: 1900, y: 310 }, { pathToImage: '/img/blocks/statue_1.png', spriteWidth: 39, spriteHeight: 83, scale: 1 }, null, { isBlocking: false, removeItem: null }, 'statue_1', 0),
            new block({ x: 1000, y: 560 }, { pathToImage: '/img/blocks/plant_1.png', spriteWidth: 34, spriteHeight: 61, scale: 0.4 }, { cooldown: 50, output: [{ amount: 1, item: 'string' }], isInfinite: false, healthBarScale: 1 }, { isBlocking: false, removeItem: null }, 'plant_1', 0),
            new block({ x: 2500, y: 560 }, { pathToImage: '/img/blocks/plant_1.png', spriteWidth: 34, spriteHeight: 61, scale: 0.4 }, { cooldown: 50, output: [{ amount: 1, item: 'string' }], isInfinite: false, healthBarScale: 1 }, { isBlocking: false, removeItem: null }, 'plant_1', 0),
            new block({ x: 600, y: 560 }, { pathToImage: '/img/blocks/bush_2.png', spriteWidth: 101, spriteHeight: 40, scale: 0.4 }, null, { isBlocking: false, removeItem: null }, 'bush_2', 0),
            new chest(1200, StaticPositions.OnGround, [[null, null, "leather", null, null], [null, null, "horn", null, null], [null, "leather", null, null, null], [null, "stone", null, null, null]], 'chest'),
            // captured humans area
            new block({ x: 4500, y: 0 }, { pathToImage: '', spriteWidth: 1, spriteHeight: 1, scale: 1 }, null, { isBlocking: true, removeItem: null, text: 'Are you crazy?' }, 'invisWall', 1111),
            new block({ x: 3700, y: 470 }, { pathToImage: '/img/blocks/wall_1.png', spriteWidth: 139, spriteHeight: 47, scale: 0.6 }, null, { isBlocking: false, removeItem: null }, 'wall_1', 0),
            new block({ x: 3200, y: 560 }, { pathToImage: '/img/blocks/bush_2.png', spriteWidth: 101, spriteHeight: 40, scale: 0.4 }, null, { isBlocking: false, removeItem: null }, 'bush_2', 0),
            new skeleton(2600, StaticPositions.OnGround, 'skeleton', 10),
            new NPC({ x: 2700, y: 560 }, { pathToImage: '/img/passiveEntities/stranger.png', spriteWidth: 32, spriteHeight: 32, frameAmount: 4, scale: 0.4, hitbox: { offsetX: -40, offsetY: 0, width: 250, height: 150 } }, 'NPC', { first: ['The skeleton wanted to take me to the other prisoners!', 'If you want to save them you will need some good weapons', 'Here a little gift for saving me!'], second: ['Thank you!'] }, 'stranger', [{ item: 'stone', amount: 1 }], 5, null, null),
            new goblin(3600, StaticPositions.OnGround, 'goblin', 11),
            new goblin(3700, StaticPositions.OnGround, 'goblin', 12),
            new goblin(3850, StaticPositions.OnGround, 'goblin', 13),
            new NPC({ x: 3800, y: 560 }, { pathToImage: '/img/passiveEntities/beggar.png', spriteWidth: 34, spriteHeight: 34, frameAmount: 5, scale: 0.4, hitbox: { offsetX: -40, offsetY: 0, width: 250, height: 150 } }, 'NPC', { first: ['Thanks, man!'] }, 'beggar', [], 6, null, null),
            new NPC({ x: 3950, y: 430 }, { pathToImage: '/img/passiveEntities/samurai.png', spriteWidth: 96, spriteHeight: 96, frameAmount: 10, scale: 0.8, hitbox: { offsetX: 75, offsetY: 175, width: 150, height: 100 } }, 'NPC', { first: ['Thank you for saving me!', 'Here use this! It is the least I can give you!'], second: ['Thank you for saving me!'] }, 'samurai', [{ item: 'coin', amount: 1 }], 6, null, null),
            // village
            new block({ x: -3600, y: 0 }, { pathToImage: '', spriteWidth: 1, spriteHeight: 1, scale: 1 }, null, { isBlocking: true, removeItem: null, text: '' }, 'invisWall', 2001),
            new block({ x: -2800, y: 0 }, { pathToImage: '', spriteWidth: 1, spriteHeight: 1, scale: 1 }, null, { isBlocking: true, removeItem: null, text: 'Explore other parts of the village first!' }, 'invisWall', 30),
            new block({ x: -300, y: 505 }, { pathToImage: '/img/blocks/door_1.png', spriteWidth: 189, spriteHeight: 281, scale: 0.5 }, null, { isBlocking: true, removeItem: 'key' }, 'door_1', 0),
            new trader({ x: -1200, y: 505 }, { img: '/img/passiveEntities/blacksmith.png', spriteWidth: 96, spriteHeight: 96, frameAmount: 7, scale: 0.6 }, [[{ amount: 1, item: 'coin' }, { amount: 2, item: 'stone' }], [{ amount: 2, item: 'coin' }, { amount: 1, item: 'iron_ingot' }]], 'trader', true, 2),
            new block({ x: -1600, y: 305 }, { pathToImage: '/img/blocks/house_1.png', spriteWidth: 88, spriteHeight: 171, scale: 1 }, null, { isBlocking: false, removeItem: null }, 'house', 0),
            new teleporter({ x: -2600, y: 305 }, { pathToImage: '/img/blocks/house_2.png', spriteWidth: 355, spriteHeight: 703, scale: 1 }, { cooldown: 25, healthBarScale: 1, interactCooldown: 200 }, { isBlocking: false, removeItem: null }, { dim: 'house_1', x: 650, y: 420 }, 'house', 0),
            new block({ x: -3100, y: 305 }, { pathToImage: '/img/blocks/house_3.png', spriteWidth: 355, spriteHeight: 703, scale: 1 }, null, { isBlocking: false, removeItem: null }, 'house', 0),
            new block({ x: -2300, y: 100 }, { pathToImage: '/img/blocks/tree_2.png', spriteWidth: 85, spriteHeight: 69, scale: 1.5 }, { cooldown: 200, output: [{ amount: 2, item: 'stick' }], isInfinite: true, healthBarScale: 3 }, { isBlocking: false, removeItem: null }, 'tree_2', 0),
            new block({ x: -1000, y: 560 }, { pathToImage: '/img/blocks/bush_3.png', spriteWidth: 60, spriteHeight: 31, scale: 0.4 }, null, { isBlocking: false, removeItem: null }, 'bush_3', 0),
            new NPC({ x: -2000, y: 560 }, { pathToImage: '/img/passiveEntities/villager_1.png', spriteWidth: 34, spriteHeight: 34, frameAmount: 5, scale: 0.4, hitbox: { offsetX: 0, offsetY: 0, width: 210, height: 150 } }, 'NPC', { first: ['Why does everybody leave their garbage on the street?!'], second: ['Did you do that?'] }, 'mopper', [], -2, null, null),
            new block({ x: -1700, y: 620 }, { pathToImage: '/img/blocks/crate.png', spriteWidth: 44, spriteHeight: 43, scale: 0.2 }, { cooldown: 75, output: [{ item: 'coin', amount: 1 }], isInfinite: false, healthBarScale: 1 }, { isBlocking: false, removeItem: null }, 'crate', 0),
            new block({ x: -1770, y: 630 }, { pathToImage: '/img/blocks/crate.png', spriteWidth: 44, spriteHeight: 43, scale: 0.2 }, null, { isBlocking: false, removeItem: null }, 'crate', 0),
            new block({ x: -1700, y: 540 }, { pathToImage: '/img/blocks/barrel.png', spriteWidth: 27, spriteHeight: 35, scale: 0.2 }, null, { isBlocking: false, removeItem: null }, 'barrel', 0),
            new NPC({ x: -3000, y: 555 }, { pathToImage: '/img/passiveEntities/adventurer.png', spriteWidth: 32, spriteHeight: 34, frameAmount: 4, scale: 0.4, hitbox: { offsetX: -40, offsetY: 0, width: 250, height: 150 } }, 'NPC', { first: ['Please, help us!', 'We need to stop the goblins!', 'Here use this to defend yourself!', 'Now defeat the goblins!'], second: ['THEY ARE COMING!'], questCompleted: ['Finally the goblins have been stopped!', 'From attacking our village at least!'] }, 'elder', [{ item: 'peasants_robe', amount: 1 }], -2, new quest('kill', [21, 22, 23, 24, 25], 'Defend the village from the goblins', [{ item: 'iron_ingot', amount: 1 }, { item: 'coin', amount: 2 }]), [{
                    action: 'spawn', ids: [], dim: 'jungle', extra: [
                        new goblin(-250, StaticPositions.OnGround, 'goblin', 21),
                        new goblin(-300, StaticPositions.OnGround, 'goblin', 22),
                        new goblin(-310, StaticPositions.OnGround, 'goblin', 23),
                        new goblin(1150, StaticPositions.OnGround, 'goblin', 24),
                        new goblin(1400, StaticPositions.OnGround, 'goblin', 25),
                    ]
                },
                {
                    action: 'destroy', ids: [2001], dim: 'jungle'
                }
            ]),
            new teleporter({ x: -3900, y: 305 }, { pathToImage: '/img/blocks/house_4.png', spriteWidth: 355, spriteHeight: 703, scale: 1 }, { cooldown: 25, healthBarScale: 1, interactCooldown: 200 }, { isBlocking: false, removeItem: null }, { dim: 'house_2', x: 650, y: 420 }, 'house', 0),
            // goblin hideout
            new block({ x: 4500, y: 560 }, { pathToImage: '/img/blocks/plant_1.png', spriteWidth: 34, spriteHeight: 61, scale: 0.4 }, { cooldown: 50, output: [{ amount: 1, item: 'string' }], isInfinite: false, healthBarScale: 1 }, { isBlocking: false, removeItem: null }, 'plant_1', 0),
            new block({ x: 4800, y: 560 }, { pathToImage: '/img/blocks/bush_3.png', spriteWidth: 60, spriteHeight: 31, scale: 0.4 }, null, { isBlocking: false, removeItem: null }, 'bush_3', 0),
            new block({ x: 5360, y: 320 }, { pathToImage: '/img/blocks/tree_1.png', spriteWidth: 65, spriteHeight: 60, scale: 1 }, { cooldown: 100, output: [{ amount: 1, item: 'stick' }], isInfinite: true, healthBarScale: 2.5 }, { isBlocking: false, removeItem: null }, 'tree_1', 0),
            new block({ x: 5500, y: -45 }, { pathToImage: '/img/blocks/goblin_house_1.png', spriteWidth: 353, spriteHeight: 707, scale: 2 }, null, { isBlocking: false, removeItem: null }, 'house', 0),
            new block({ x: 6300, y: 325 }, { pathToImage: '/img/blocks/goblin_house_2.png', spriteWidth: 408, spriteHeight: 612, scale: 1 }, null, { isBlocking: false, removeItem: null }, 'house', 0),
            new block({ x: 5000, y: 365 }, { pathToImage: '/img/blocks/goblin_house_3.png', spriteWidth: 408, spriteHeight: 612, scale: 1 }, null, { isBlocking: false, removeItem: null }, 'house', 0),
            new goblin(5300, StaticPositions.OnGround, 'goblin', 1112),
            new goblin(5500, StaticPositions.OnGround, 'goblin', 1113),
            new goblin(5700, StaticPositions.OnGround, 'goblin', 1114),
            new goblin(5950, StaticPositions.OnGround, 'goblin', 1115),
            new goblin(6100, StaticPositions.OnGround, 'goblin', 1116),
            new enemy({ x: 6400, y: 500 }, { pathToImage: '/img/enemies/archer.png', spriteWidth: 64, spriteHeight: 64, scale: 0.5, animationStates: [{ name: 'idle', frames: 5 }, { name: 'attack', frames: 11 }, { name: 'run', frames: 8 }, { name: 'take_hit', frames: 5 }, { name: 'death', frames: 6 }], hitbox: { offsetX: 35, offsetY: 90, width: 100, height: 110 } }, { maxHealth: 100, attackRange: 500, attackDamage: 10, drops: [], name: 'archer' }, {
                allignment: 'enemy', attackable: true, interactable: false, isGround: true, moving: true, name: 'archer', attackType: {
                    type: 'rangedCombat', projectile: { spriteWidth: 30, scale: 0.05, damage: 10, range: 550, speed: 12, spriteHeight: 5, pathToImage: '/img/projectiles/arrow.png', animationStates: [{ name: 'flying', frames: 1 }], hitbox: { offsetX: 0, offsetY: -5, width: 100, height: 20 } }
                }
            }, 'enemy', 1117),
            new chest(6900, StaticPositions.OnGround, [[null, null, "leather", null, null], ["stone", null, "heal_potion", null, null], [null, null, null, null, null], [null, null, null, null, "fruit"]], 'chest'),
            new block({ x: 7300, y: 0 }, { pathToImage: '', spriteWidth: 1, spriteHeight: 1, scale: 1 }, null, { isBlocking: true, removeItem: null, text: '' }, 'invisWall', 20),
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
    },
    house_1: {
        background: {
            imgs: [
                'plx-1-house_1.png',
            ],
            spriteWidth: 2000,
            spriteHeight: 1546
        },
        elements: [
            new block({ x: -1000, y: 0 }, { pathToImage: '', spriteWidth: 1, spriteHeight: 1, scale: 1 }, null, { isBlocking: true, removeItem: null }, 'invisWall', 0),
            new block({ x: 1150, y: 0 }, { pathToImage: '', spriteWidth: 1, spriteHeight: 1, scale: 1 }, null, { isBlocking: true, removeItem: null }, 'invisWall', 0),
            new chest(-500, StaticPositions.OnGround, [[null, null, null, null, "string"], ["beer", null, null, null, null], [null, null, null, "coin", null], ["string", null, null, null, null]], 'chest'),
            new trader({ x: -300, y: 545 }, { img: '/img/passiveEntities/witch.png', spriteWidth: 34, spriteHeight: 34, frameAmount: 5, scale: 0.4 }, [[{ item: 'coin', amount: 1 }, { item: 'heal_potion', amount: 1 }], [{ item: 'coin', amount: 1 }, { item: 'regeneration_potion', amount: 1 }]], 'NPC', true, -2),
            new NPC({ x: 500, y: 560 }, { pathToImage: '/img/passiveEntities/shady_guy.png', spriteWidth: 34, spriteHeight: 34, frameAmount: 5, scale: 0.4, hitbox: { offsetX: -40, offsetY: 0, width: 250, height: 150 } }, 'NPC', { first: ['I overheard some knights!', 'They were talking about an invasion!', 'An invasion from the goblins attacking our very village!', 'They even wanted to desert!'] }, 'idk', [], -2, null, [{ action: 'destroy', ids: [30], dim: 'jungle' }]),
            new block({ x: 900, y: 620 }, { pathToImage: '/img/blocks/crate.png', spriteWidth: 44, spriteHeight: 43, scale: 0.2 }, null, { isBlocking: false, removeItem: null }, 'crate', 0),
            new block({ x: 0, y: 630 }, { pathToImage: '/img/blocks/crate.png', spriteWidth: 44, spriteHeight: 43, scale: 0.2 }, null, { isBlocking: false, removeItem: null }, 'crate', 0),
            new block({ x: -10, y: 620 }, { pathToImage: '/img/blocks/crate.png', spriteWidth: 44, spriteHeight: 43, scale: 0.2 }, null, { isBlocking: false, removeItem: null }, 'crate', 0),
            //new block({ x: -300, y: 505 }, { pathToImage: '/img/blocks/door_1.png', spriteWidth: 189, spriteHeight: 281, scale: 0.5 }, null, { isBlocking: true, removeItem: 'key' }, 'door_1'),
            new teleporter({ x: 900, y: 505 }, { pathToImage: '/img/blocks/door_1.png', spriteWidth: 189, spriteHeight: 281, scale: 0.5 }, { cooldown: 25, healthBarScale: 1, interactCooldown: 200 }, { isBlocking: false, removeItem: null }, { dim: 'jungle', x: 650, y: 420 }, 'door_1', 0)
        ]
    },
    house_2: {
        background: {
            imgs: [
                'plx-1-house_1.png',
            ],
            spriteWidth: 2000,
            spriteHeight: 1546
        },
        elements: [
            new block({ x: -1000, y: 0 }, { pathToImage: '', spriteWidth: 1, spriteHeight: 1, scale: 1 }, null, { isBlocking: true, removeItem: null }, 'invisWall', 0),
            new block({ x: 1150, y: 0 }, { pathToImage: '', spriteWidth: 1, spriteHeight: 1, scale: 1 }, null, { isBlocking: true, removeItem: null }, 'invisWall', 0),
            new NPC({ x: 500, y: 555 }, { pathToImage: '/img/passiveEntities/villager_2.png', spriteWidth: 34, spriteHeight: 34, frameAmount: 5, scale: 0.4, hitbox: { offsetX: -40, offsetY: 0, width: 250, height: 150 } }, 'NPC', { first: ['Hey!', 'Are you the guy who stopped the goblins?', 'Hahahaha...', 'I bet on a gold ingot you can\'t even defeat a single goblin!', 'Well, then show me by going to the goblin hideout!'], second: ['Too scared to go?'], questCompleted: ['WHAT!?', 'HOW...', 'This is impossible!', 'You definitly cheated!'] }, 'idk', [], 0, new quest('kill', [1112, 1113, 1114, 1115, 1116, 1117], 'Raid the goblin village in the far north!', [{ item: 'gold_ingot', amount: 1 }, { item: 'coin', amount: 1 }]), [{ action: "destroy", ids: [1111], dim: 'jungle' }]),
            new teleporter({ x: 900, y: 505 }, { pathToImage: '/img/blocks/door_1.png', spriteWidth: 189, spriteHeight: 281, scale: 0.5 }, { cooldown: 25, healthBarScale: 1, interactCooldown: 200 }, { isBlocking: false, removeItem: null }, { dim: 'jungle', x: 650, y: 420 }, 'door_1', 0)
        ]
    }
};
function changeWorld(world) {
    backgroundLayers = [];
    const spriteWidth = worlds[world].background.spriteWidth;
    const spriteHeight = worlds[world].background.spriteHeight;
    const base_path = '/img/background/';
    let speedModifier = 0.2;
    for (let i = 0; i < worlds[world].background.imgs.length; i++) {
        let currentLayer = new Image();
        currentLayer.src = `${base_path}${worlds[world].background.imgs[i]}`;
        backgroundLayers.push(new Layer(currentLayer, speedModifier, spriteWidth, spriteHeight));
        speedModifier += 0.2;
    }
    nonWorldElems = [];
    currentWorld = world;
    player.showHealthbar();
}
// declare player
const player = new Player(650, 420);
player.showHealthbar();
const menu = new menuClass();
// initialise && push layers
changeWorld('jungle');
updateHotbar();
update();
