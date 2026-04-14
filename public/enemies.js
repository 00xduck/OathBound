"use strict";
class Entity {
    constructor(pos, worldElem, id) {
        this.pos = {
            x: pos.x,
            y: pos.y
        };
        this.img = {};
        this.effectData = {
            effects: [],
            effectTicks: 0,
            effectCounter: 0
        };
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
        this.img = new Image();
        if (this.img instanceof HTMLImageElement)
            this.img.src = this.sprite.img;
    }
    changeState(state) {
        this.sprite.currentState = state;
        this.sprite.frameLoc = 0; // reset animation
        this.sprite.frames = 0;
    }
    setCooldown(ms) {
        this.data.onCooldown = true;
        setTimeout(() => this.data.onCooldown = false, ms);
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
        var _a;
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
        const effectName = effects[effect].name;
        if ((_a = effectFunctions[effectName]) === null || _a === void 0 ? void 0 : _a.start) {
            effectFunctions[effectName].start(this);
        }
    }
    removeEffect(index) {
        for (let i = 0; i < this.effectData.effects.length; i++) {
            if (this.effectData.effects[i].index === index) {
                this.effectData.effects.splice(i, 1);
                console.log(this);
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
    get center() {
        return {
            x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width / 2,
            y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height / 2
        };
    }
}
class enemyArcher extends Entity {
    constructor(pos) {
        super(pos, 'enemy', -1);
        this.sprite = {
            img: 'img/enemies/archer.png',
            pathToImage: 'img/enemies/archer.png',
            spriteWidth: 64,
            spriteHeight: 64,
            scale: 0.5,
            spriteAnimations: {},
            frames: 0,
            frameLoc: 0,
            currentState: 'idle',
            animationStates: [
                { name: 'idle', frames: 5 },
                { name: 'attack', frames: 11 },
                { name: 'run', frames: 8 },
                { name: 'take_hit', frames: 5 },
                { name: 'death', frames: 6 }
            ],
            hitbox: { offsetX: 35, offsetY: 90, width: 100, height: 110 }
        };
        this.data = {
            isAttacking: false,
            class: 'enemyArcher',
            health: 100,
            maxHealth: 100,
            attackDamage: 10,
            attackRange: 500,
            drops: [],
            name: 'enemyArcher',
            onCooldown: false,
            isDead: false,
            isMoving: false,
            showedText: false,
            Xdirec: 2,
            seeRange: 500,
            attackFocus: null
        };
        this.type = {
            allignment: 'enemy',
            attackable: true,
            interactable: false,
            isGround: true,
            moving: true,
            name: 'archer',
            attackType: {
                type: 'rangedCombat',
                projectile: {
                    spriteWidth: 30,
                    scale: 0.05,
                    damage: 10,
                    range: 550,
                    speed: 12,
                    spriteHeight: 5,
                    pathToImage: 'img/projectiles/arrow.png',
                    animationStates: [{ name: 'flying', frames: 1 }],
                    hitbox: { offsetX: 0, offsetY: -5, width: 100, height: 20 }
                }
            }
        };
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
                    particles.push(new projectile(this, this.type.attackType.projectile.spriteWidth, this.type.attackType.projectile.spriteHeight, this.type.attackType.projectile.scale, this.type.attackType.projectile.pathToImage, this.type.attackType.projectile.animationStates, this.type.attackType.projectile.range, this.type.attackType.projectile.speed, this.type.attackType.projectile.damage, this.type.attackType.projectile.hitbox, this.type.attackType.type));
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
    }
}
class nightBorn extends Entity {
    constructor(x, y, worldElem, id) {
        if (y === StaticPositions.OnGround)
            y = 230;
        super({ x, y }, worldElem, id);
        this.sprite = {
            img: 'img/enemies/nightBorn.png',
            pathToImage: 'img/enemies/nightBorn.png',
            spriteWidth: 300,
            spriteHeight: 300,
            scale: 1.5,
            spriteAnimations: {},
            frames: 0,
            frameLoc: 0,
            currentState: 'idle',
            animationStates: [
                { name: 'idle', frames: 9 },
                { name: 'run', frames: 6 },
                { name: 'attack', frames: 12 },
                { name: 'take_hit', frames: 5 },
                { name: 'death', frames: 23 }
            ],
            hitbox: { offsetX: 100, offsetY: 100, width: 100, height: 100 }
        };
        this.data = {
            isAttacking: false,
            class: 'nightBorn',
            health: 300,
            maxHealth: 300,
            attackDamage: 80,
            attackRange: 80,
            drops: [{ amount: 1, drop: 'silver_ingot', chance: 100 }],
            name: 'nightborn',
            onCooldown: false,
            isDead: false,
            isMoving: false,
            showedText: false,
            Xdirec: 1,
            seeRange: 400,
            attackFocus: null
        };
        this.type = {
            isGround: true,
            name: 'nightBorn',
            allignment: 'enemy',
            moving: true,
            attackable: true,
            interactable: false
        };
        this.worldElem = worldElem;
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
            let tally = 0;
            let deadParticles = [];
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i);
                }
            });
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle - tally, 1);
                tally++;
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
    }
}
class goblin extends Entity {
    constructor(x, y, worldElem, id) {
        if (y === StaticPositions.OnGround)
            y = 430;
        super({ x, y }, worldElem, id);
        this.sprite = {
            img: 'img/enemies/goblin.png',
            pathToImage: 'img/enemies/goblin.png',
            spriteWidth: 150,
            spriteHeight: 150,
            scale: 1,
            spriteAnimations: {},
            frames: 0,
            frameLoc: 0,
            currentState: 'idle',
            animationStates: [
                { name: 'idle', frames: 4 },
                { name: 'attack', frames: 8 },
                { name: 'attack2', frames: 8 },
                { name: 'death', frames: 4 },
                { name: 'run', frames: 8 },
                { name: 'take_hit', frames: 4 }
            ],
            hitbox: { offsetX: 150, offsetY: 160, width: 80, height: 100 }
        };
        this.data = {
            isAttacking: false,
            class: 'goblin',
            health: 50,
            maxHealth: 50,
            attackDamage: 4,
            attackRange: 75,
            drops: [
                { amount: 2, drop: 'leather', chance: 35 },
                { amount: 1, drop: 'string', chance: 15 }
            ],
            name: 'goblin',
            onCooldown: false,
            isDead: false,
            isMoving: false,
            showedText: false,
            Xdirec: 1,
            seeRange: 400,
            attackFocus: null
        };
        this.type = {
            isGround: true,
            name: 'goblin',
            allignment: 'enemy',
            moving: true,
            attackable: true,
            interactable: false
        };
        this.worldElem = worldElem;
        this.init();
    }
    async update() {
        if (this.data.isDead)
            return;
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            var _a, _b;
            effect.duration--;
            if (effect.duration <= 0) {
                const effectName = effect.effect.name;
                if ((_a = effectFunctions[effectName]) === null || _a === void 0 ? void 0 : _a.end) {
                    effectFunctions[effectName].end(this);
                }
                this.removeEffect(effect.index);
            }
            if (effect.duration % effect.effect.ticks === 0) {
                const effectName = effect.effect.name;
                if ((_b = effectFunctions[effectName]) === null || _b === void 0 ? void 0 : _b.onTick) {
                    effectFunctions[effectName].onTick(this);
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
            if (distanceXToPlayer <= this.data.attackRange && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player;
                    this.attack();
                }
            }
            else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player;
                    this.attack();
                }
            }
            else if (distanceXToPlayer <= this.data.seeRange && !this.data.onCooldown && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                let isBlocked = false;
                let direcBlocked;
                worlds[currentWorld].elements.forEach(el => {
                    if (el instanceof block && el.blocking.isBlocking && checkCollision({ hitbox: this.sprite.hitbox, pos: this.pos }, { hitbox: el.hitbox, pos: el.pos })) {
                        if (el.center.x > this.center.x) {
                            direcBlocked = 1;
                        }
                        else {
                            direcBlocked = 2;
                        }
                    }
                });
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player;
                    if (playerPosX > this.pos.x && direcBlocked !== 1) {
                        if (this.checkEffect('ice')) {
                            this.pos.x += 3;
                        }
                        else
                            this.pos.x += 6;
                        if (this.sprite.currentState !== 'run')
                            this.changeState('run');
                    }
                    else if (direcBlocked !== 2) {
                        if (this.checkEffect('ice')) {
                            this.pos.x -= 3;
                        }
                        else
                            this.pos.x -= 6;
                        if (this.sprite.currentState !== 'run')
                            this.changeState('run');
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
        }
        this.effectData.effectTicks++;
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
            let tally = 0;
            let deadParticles = [];
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i);
                }
            });
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle - tally, 1);
                tally++;
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
    get center() {
        return {
            x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width / 2,
            y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height / 2
        };
    }
    interact() {
    }
}
class ogre extends Entity {
    constructor(x, y, worldElem, id) {
        if (y === StaticPositions.OnGround)
            y = 400;
        super({ x, y }, worldElem, id);
        this.sprite = {
            img: 'img/enemies/ogre.png',
            pathToImage: 'img/enemies/ogre.png',
            spriteWidth: 144,
            spriteHeight: 80,
            scale: 0.75,
            spriteAnimations: {},
            frames: 0,
            frameLoc: 0,
            currentState: 'idle',
            animationStates: [
                { name: 'run', frames: 6 },
                { name: 'idle', frames: 4 },
                { name: 'attack', frames: 8 },
                { name: 'death', frames: 6 },
            ],
            hitbox: { offsetX: 100, offsetY: 90, width: 100, height: 200 }
        };
        this.data = {
            isAttacking: false,
            class: 'ogre',
            health: 150,
            maxHealth: 150,
            attackDamage: 15,
            attackRange: 75,
            drops: [
                { amount: 2, drop: 'leather', chance: 50 },
                { amount: 1, drop: 'string', chance: 25 },
                { amount: 1, drop: 'iron_ingot', chance: 15 }
            ],
            name: 'ogre',
            onCooldown: false,
            isDead: false,
            isMoving: false,
            showedText: false,
            Xdirec: 1,
            seeRange: 400,
            attackFocus: null
        };
        this.type = {
            isGround: true,
            name: 'ogre',
            allignment: 'enemy',
            moving: true,
            attackable: true,
            interactable: false
        };
        this.worldElem = worldElem;
        this.init();
    }
    async update() {
        if (this.data.isDead)
            return;
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            var _a, _b;
            effect.duration--;
            if (effect.duration <= 0) {
                const effectName = effect.effect.name;
                if ((_a = effectFunctions[effectName]) === null || _a === void 0 ? void 0 : _a.end) {
                    effectFunctions[effectName].end(this);
                }
                this.removeEffect(effect.index);
            }
            if (effect.duration % effect.effect.ticks === 0) {
                const effectName = effect.effect.name;
                if ((_b = effectFunctions[effectName]) === null || _b === void 0 ? void 0 : _b.onTick) {
                    effectFunctions[effectName].onTick(this);
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
                let isBlocked = false;
                let direcBlocked;
                worlds[currentWorld].elements.forEach(el => {
                    if (el instanceof block && el.blocking.isBlocking && checkCollision({ hitbox: this.sprite.hitbox, pos: this.pos }, { hitbox: el.hitbox, pos: el.pos })) {
                        if (el.center.x > this.center.x) {
                            direcBlocked = 1;
                        }
                        else {
                            direcBlocked = 2;
                        }
                    }
                });
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player;
                    if (playerPosX > this.pos.x && direcBlocked !== 1) {
                        if (this.checkEffect('ice')) {
                            this.pos.x += 3;
                        }
                        else
                            this.pos.x += 6;
                        if (this.sprite.currentState !== 'run')
                            this.changeState('run');
                    }
                    else if (direcBlocked !== 2) {
                        if (this.checkEffect('ice')) {
                            this.pos.x -= 3;
                        }
                        else
                            this.pos.x -= 6;
                        if (this.sprite.currentState !== 'run')
                            this.changeState('run');
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
        }
        this.effectData.effectTicks++;
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
        this.data.health -= damage;
        this.showHealthbar();
    }
    endOfAnimation(frameAmount) {
        var _a;
        if (this.sprite.currentState === 'death') {
            let tally = 0;
            let deadParticles = [];
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i);
                }
            });
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle - tally, 1);
                tally++;
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
            }, 750);
        }
    }
    get center() {
        return {
            x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width / 2,
            y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height / 2
        };
    }
    interact() {
    }
}
class goblinKing extends Entity {
    constructor(x, y, worldElem, id) {
        if (y === StaticPositions.OnGround)
            y = 400;
        super({ x, y }, worldElem, id);
        this.sprite = {
            img: 'img/enemies/goblin_king.png',
            pathToImage: 'img/enemies/goblin_king.png',
            spriteWidth: 64,
            spriteHeight: 64,
            scale: 1,
            spriteAnimations: {},
            frames: 0,
            frameLoc: 0,
            currentState: 'idle',
            animationStates: [
                { name: 'idle', frames: 4 },
                { name: 'run', frames: 6 },
                { name: 'scared', frames: 8 },
                { name: 'load', frames: 12 },
                { name: 'throw', frames: 8 },
                { name: 'eat', frames: 16 },
                { name: 'angry', frames: 4 },
                { name: 'death', frames: 11 },
                { name: 'command', frames: 6 },
                { name: 'jump', frames: 6 },
                { name: 'land', frames: 7 },
            ],
            hitbox: { offsetX: 100, offsetY: 90, width: 100, height: 200 }
        };
        this.data = {
            isAttacking: false,
            class: 'goblinKing',
            health: 500,
            maxHealth: 500,
            attackDamage: 0,
            attackRange: 0,
            drops: [
                { amount: 2, drop: 'leather', chance: 50 },
                { amount: 1, drop: 'string', chance: 25 },
                { amount: 1, drop: 'iron_ingot', chance: 15 }
            ],
            name: 'ogre',
            onCooldown: false,
            isDead: false,
            isMoving: false,
            showedText: false,
            Xdirec: 1,
            seeRange: 400,
            attackFocus: null
        };
        this.type = {
            isGround: true,
            name: 'ogre',
            allignment: 'enemy',
            moving: true,
            attackable: true,
            interactable: false
        };
        this.worldElem = worldElem;
        this.init();
    }
    async update() {
        if (this.data.isDead)
            return;
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            var _a, _b;
            effect.duration--;
            if (effect.duration <= 0) {
                const effectName = effect.effect.name;
                if ((_a = effectFunctions[effectName]) === null || _a === void 0 ? void 0 : _a.end) {
                    effectFunctions[effectName].end(this);
                }
                this.removeEffect(effect.index);
            }
            if (effect.duration % effect.effect.ticks === 0) {
                const effectName = effect.effect.name;
                if ((_b = effectFunctions[effectName]) === null || _b === void 0 ? void 0 : _b.onTick) {
                    effectFunctions[effectName].onTick(this);
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
                let isBlocked = false;
                let direcBlocked;
                worlds[currentWorld].elements.forEach(el => {
                    if (el instanceof block && el.blocking.isBlocking && checkCollision({ hitbox: this.sprite.hitbox, pos: this.pos }, { hitbox: el.hitbox, pos: el.pos })) {
                        if (el.center.x > this.center.x) {
                            direcBlocked = 1;
                        }
                        else {
                            direcBlocked = 2;
                        }
                    }
                });
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player;
                    if (playerPosX > this.pos.x && direcBlocked !== 1) {
                        if (this.checkEffect('ice')) {
                            this.pos.x += 3;
                        }
                        else
                            this.pos.x += 6;
                        if (this.sprite.currentState !== 'run')
                            this.changeState('run');
                    }
                    else if (direcBlocked !== 2) {
                        if (this.checkEffect('ice')) {
                            this.pos.x -= 3;
                        }
                        else
                            this.pos.x -= 6;
                        if (this.sprite.currentState !== 'run')
                            this.changeState('run');
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
        }
        this.effectData.effectTicks++;
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
        this.data.health -= damage;
        this.showHealthbar();
    }
    endOfAnimation(frameAmount) {
        var _a;
        if (this.sprite.currentState === 'death') {
            let tally = 0;
            let deadParticles = [];
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i);
                }
            });
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle - tally, 1);
                tally++;
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
            }, 750);
        }
    }
    get center() {
        return {
            x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width / 2,
            y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height / 2
        };
    }
    interact() {
    }
}
class skeleton extends Entity {
    constructor(x, y, worldElem, id) {
        if (y === StaticPositions.OnGround)
            y = 500;
        super({ x, y }, worldElem, id);
        this.sprite = {
            img: 'img/enemies/skeleton.png',
            pathToImage: 'img/enemies/skeleton.png',
            spriteWidth: 96,
            spriteHeight: 64,
            scale: 0.5,
            spriteAnimations: {},
            frames: 0,
            frameLoc: 0,
            currentState: 'idle',
            animationStates: [
                { name: 'idle', frames: 8 },
                { name: 'attack', frames: 10 },
                { name: 'death', frames: 13 },
                { name: 'run', frames: 10 },
                { name: 'take_hit', frames: 5 }
            ],
            hitbox: { offsetX: 85, offsetY: 80, width: 50, height: 100 }
        };
        this.data = {
            isAttacking: false,
            class: 'skeleton',
            health: 35,
            maxHealth: 35,
            attackDamage: 5,
            attackRange: 100,
            drops: [{ amount: 1, drop: 'stone', chance: 40 }],
            name: 'skeleton',
            onCooldown: false,
            isDead: false,
            isMoving: false,
            showedText: false,
            Xdirec: 1,
            seeRange: 400,
            attackFocus: null
        };
        this.type = {
            isGround: true,
            name: 'skeleton',
            allignment: 'enemy',
            moving: true,
            attackable: true,
            interactable: false
        };
        this.worldElem = worldElem;
        this.init();
    }
    async update() {
        if (this.data.isDead)
            return;
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            var _a, _b;
            effect.duration--;
            if (effect.duration <= 0) {
                const effectName = effect.effect.name;
                if ((_a = effectFunctions[effectName]) === null || _a === void 0 ? void 0 : _a.end) {
                    effectFunctions[effectName].end(this);
                }
                this.removeEffect(effect.index);
            }
            if (this.effectData.effectTicks % effect.effect.ticks === 0) {
                const effectName = effect.effect.name;
                if ((_b = effectFunctions[effectName]) === null || _b === void 0 ? void 0 : _b.onTick) {
                    effectFunctions[effectName].onTick(this);
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
            if (distanceXToPlayer <= this.data.attackRange && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player;
                    this.attack();
                }
            }
            else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player;
                    this.attack();
                }
            }
            else if (distanceXToPlayer <= this.data.seeRange && !this.data.onCooldown && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player;
                    if (this.sprite.currentState !== 'run')
                        this.changeState('run');
                    if (playerPosX > this.pos.x) {
                        if (this.checkEffect('ice')) {
                            this.pos.x += 3;
                        }
                        else
                            this.pos.x += 7;
                    }
                    else {
                        if (this.checkEffect('ice')) {
                            this.pos.x -= 3;
                        }
                        else
                            this.pos.x -= 7;
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
            let tally = 0;
            let deadParticles = [];
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i);
                }
            });
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle - tally, 1);
                tally++;
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
    }
}
