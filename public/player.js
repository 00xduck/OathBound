"use strict";
// player class
class Player {
    constructor(x, y) {
        let skin = localStorage.getItem('skinPath') || 'img/skins/player.png';
        this.pos = {
            x: x,
            y: y
        };
        this.worldPosX = {};
        this.sprite = {
            img: 'img/skins/player.png',
            spriteWidth: configs.properties.player.sprite.spriteWidth,
            spriteHeight: configs.properties.player.sprite.spriteHeight,
            frames: 0,
            frameLoc: 0,
            animationStates: configs.properties.player.sprite.animationStates,
            spriteAnimations: {},
            currentState: 'idle',
            scale: configs.properties.player.sprite.scale,
            hitbox: configs.properties.player.sprite.hitbox
        };
        const image = new Image();
        image.onload = () => {
            this.sprite.img = skin;
        };
        image.onerror = () => {
            console.warn('Skin path not found! Switching to default!');
        };
        image.src = skin;
        this.effectData = {
            effects: [],
            effectTicks: 0,
            effectCounter: 0
        };
        this.data = {
            onCompanionGUI: false,
            immune: false,
            onSpellCooldown: false,
            mana: configs.properties.player.data.mana,
            castingSpell: false,
            spellCooldown: 0,
            currentCooldown: 0,
            selectedSpell: null,
            magicInventory: configs.properties.player.data.magicInventory,
            spells: configs.properties.player.data.spells,
            isAttacking: false,
            class: "player",
            jumpOrigin: null,
            onGround: true,
            onBlock: { isOnBlock: false, block: null },
            onInventory: false,
            onTradingMenu: false,
            showedText: false,
            speed: configs.properties.player.data.speed,
            onSecondaryInventory: false,
            canMove: true,
            isMoving: false,
            velocity_Y: 0,
            health: configs.properties.player.data.health,
            maxHealth: configs.properties.player.data.health,
            jumpHeight: configs.properties.player.data.jumpHeight,
            interactionRange: configs.properties.player.data.interactionRange,
            dragging: null,
            selectedSlot: 1,
            showingText: false,
            interactionFocus: null,
            Ydirec: 0,
            Xdirec: 1,
            onCooldown: false,
            inventory: configs.properties.player.data.inventory,
            armor: configs.properties.player.data.armor,
            craftingInventory: [[null, null, null], [null, null, null], [null, null, null]],
            attackRange: configs.properties.player.data.attackRange,
            attackDamage: 5,
            drops: [],
            name: "player",
            isDead: false,
            seeRange: 0,
        };
        this.story = {
            freedNate: false,
            learntMagic: false
        };
        this.companions = [];
        this.hitbox = configs.properties.player.sprite.hitbox;
        this.type = { isGround: true, name: 'player', allignment: 'friendly', moving: false, attackable: false, interactable: false };
        this.isInit = false;
        this.lootDrop = [];
        this.id = -1;
        this.worldElem = 'player';
        this.init();
    }
    update() {
        if (!currentWorld || !worlds[currentWorld])
            return;
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            effect.duration--;
            if (effect.duration <= 0) {
                if (effectFunctions[effect.effect.name] && effectFunctions[effect.effect.name].end) {
                    effectFunctions[effect.effect.name].end(this);
                }
                this.removeEffect(effect.index);
            }
            if (this.effectData.effectTicks % effect.effect.ticks === 0) {
                if (effectFunctions[effect.effect.name] && effectFunctions[effect.effect.name].onTick) {
                    effectFunctions[effect.effect.name].onTick(this);
                }
            }
            if (document.querySelector(`#${effect.effect.name} `)) {
                const div = document.querySelector(`#${effect.effect.name} `);
                if (div.querySelector('#duration')) {
                    div.querySelector('#duration').innerHTML = `${effect.duration} `;
                }
            }
        });
        if (player.sprite.currentState !== 'attack1' && player.sprite.currentState !== 'attack3')
            player.data.isAttacking = false;
        this.updateHealthbar();
        const foundBlock = worlds[currentWorld].elements.find(el => {
            if (!(el instanceof block) || !el.blocking.isBlocking)
                return false;
            if (!checkCollision({ hitbox: el.hitbox, pos: el.pos }, { hitbox: this.sprite.hitbox, pos: this.pos }))
                return false;
            const playerBottom = this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height;
            const blockTop = el.pos.y + el.hitbox.offsetY;
            const playerLeft = this.pos.x + this.sprite.hitbox.offsetX;
            const playerRight = playerLeft + this.sprite.hitbox.width;
            const blockLeft = el.pos.x + el.hitbox.offsetX;
            const blockRight = blockLeft + el.hitbox.width;
            const xOverlap = playerRight > blockLeft && playerLeft < blockRight;
            return xOverlap && playerBottom <= blockTop + 20;
        });
        const onOtherBlock = {
            onBlock: !!foundBlock,
            block: foundBlock !== null && foundBlock !== void 0 ? foundBlock : null
        };
        this.data.onBlock = { isOnBlock: onOtherBlock.onBlock, block: onOtherBlock.block };
        if (this.data.onGround && !onOtherBlock.onBlock) {
            if (!checkCollision({ hitbox: player.hitbox, pos: player.pos }, { hitbox: { width: CANVAS_WIDTH, height: 40, offsetX: 0, offsetY: 0 }, pos: { x: 0, y: CANVAS_HEIGHT } })) {
                this.data.onGround = false;
                this.data.velocity_Y = 0.1;
            }
        }
        if (this.data.health <= 0 && this.sprite.currentState !== 'death' && !player.data.isDead) {
            stats.general.deaths.value++;
            for (let y = 0; y < player.data.inventory.length; y++) {
                for (let x = 0; x < player.data.inventory[y].length; x++) {
                    const slot = player.data.inventory[y][x];
                    if (slot !== null) {
                        droppedItems.push(new droppedItem({ x: player.pos.x + player.hitbox.offsetX + player.hitbox.width * Math.random(), y: player.pos.y + player.hitbox.height / 2 }, slot, currentWorld));
                    }
                }
            }
            player.data.inventory = [
                [null, null, null, null, null],
                [null, null, null, null, null],
                [null, null, null, null, null],
                [null, null, null, null, null],
            ];
            updateHotbar();
            renderInventory();
            closeCompanionGUI();
            closeInventory();
            closeTradingMenu();
            isQuestUIupdated = false;
            if (menu.checkSetting('Master Sound'))
                playSound('death.mp3', menu.values.effects / 100);
        }
        if (!this.data.onGround) {
            if (this.data.jumpOrigin && this.data.jumpOrigin - this.bottom >= this.data.jumpHeight && this.data.velocity_Y < 0) {
                this.data.velocity_Y = 0;
            }
            if (this.data.velocity_Y < 0) {
                this.pos.y += this.data.velocity_Y * globalGravity;
                this.data.velocity_Y += 0.1;
                if (this.sprite.spriteAnimations.jump) {
                    if (!(this.sprite.currentState === "attack3") && !(this.sprite.currentState === "jump"))
                        this.changeState("jump");
                }
                else {
                    if (!(this.sprite.currentState === "attack3") && !(this.sprite.currentState === "idle"))
                        this.changeState("idle");
                }
            }
            else {
                this.pos.y += this.data.velocity_Y * globalGravity;
                this.data.velocity_Y += 0.1;
                if (this.sprite.spriteAnimations.fall) {
                    if (!(this.sprite.currentState === "attack3") && !(this.sprite.currentState === "fall"))
                        this.changeState("fall");
                }
                else {
                    if (!(this.sprite.currentState === "attack3") && !(this.sprite.currentState === "idle"))
                        this.changeState("idle");
                }
            }
            if (checkCollision({ hitbox: player.hitbox, pos: player.pos }, { hitbox: { width: CANVAS_WIDTH, height: 40, offsetX: 0, offsetY: 0 }, pos: { x: 0, y: CANVAS_HEIGHT } }) && this.data.velocity_Y > 0) { // check if player is on the ground
                this.pos.y = groundY - player.hitbox.height;
                player.data.onBlock = { isOnBlock: false, block: null };
                this.data.onGround = true; // reset values
                this.data.velocity_Y = 0;
                this.data.jumpOrigin = null;
                if (this.sprite.currentState !== 'attack3' && this.sprite.currentState !== 'idle')
                    this.changeState('idle');
            }
            else if (onOtherBlock.onBlock && this.data.velocity_Y > 0) {
                this.pos.y = ((onOtherBlock.block.pos.y + onOtherBlock.block.hitbox.offsetY) - (player.hitbox.offsetY + player.hitbox.height)) + 1;
                this.data.onGround = true; // reset values
                this.data.velocity_Y = 0;
                this.data.jumpOrigin = null;
                if (this.sprite.currentState !== 'attack3' && this.sprite.currentState !== 'idle')
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
        // update companion
        this.companions.forEach(companion => {
            if (companion.selected) {
                companion.update();
            }
        });
        this.effectData.effectTicks++;
    }
    draw() {
        if (this.data.isDead)
            return;
        if (menu.checkSetting('Hitboxes')) {
            ctx.save();
            ctx.strokeStyle = this.type.allignment === 'enemy' ? 'red' : (this.type.allignment === 'passive' ? 'yellow' : 'green');
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x + this.sprite.hitbox.offsetX, this.pos.y + this.sprite.hitbox.offsetY, this.sprite.hitbox.width, this.sprite.hitbox.height);
            ctx.strokeStyle = "black";
            ctx.strokeRect(this.pos.x + this.sprite.hitbox.offsetX, this.pos.y + this.sprite.hitbox.offsetY, 5, 5);
            ctx.restore();
        }
        let frameX = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].x;
        let frameY = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].y;
        const image = getImage(this.sprite.img);
        if (this.data.Xdirec === 2) {
            ctx.save(); // save current state of the canvas
            const drawX = -(this.pos.x + 450);
            ctx.scale(-1, 1); // invert orientatian of the entity
            ctx.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX + shakeX, this.pos.y + shakeY, 450 * this.sprite.scale, 450 * this.sprite.scale);
            ctx.restore();
        }
        else if (this.data.Xdirec === 1) {
            ctx.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x + shakeX, this.pos.y + shakeY, 450 * this.sprite.scale, 450 * this.sprite.scale);
        } // (image, sx, sy, sw, sh, dx, dy, dw, dh)
        // draw companion
        this.companions.forEach(companion => {
            if (companion.selected) {
                companion.draw();
            }
        });
        // draw selectedItem
        const selectedItem = this.data.inventory[3][this.data.selectedSlot - 1];
        if (selectedItem !== null) {
            const image = new Image();
            image.src = `img/items/${items[selectedItem].src}`;
            let spriteX = items[selectedItem].spriteX;
            const animation = items[selectedItem].animation;
            if (animation) {
                const fps = animation.frames / animation.length; // Frames pro Sekunde
                const currentFrame = Math.floor(gameFrame / (60 / fps)) % animation.frames;
                spriteX = currentFrame * items[selectedItem].width;
            }
            let drawX = items[selectedItem].rendering ? (this.data.Xdirec === 1 ? this.pos.x + 245 + items[selectedItem].rendering.pos.x : (this.pos.x + 200 + (items[selectedItem].rendering.pos.x2 ? items[selectedItem].rendering.pos.x2 : items[selectedItem].rendering.pos.x))) : (this.data.Xdirec === 1 ? this.pos.x + 245 : (this.pos.x + 200));
            const drawY = items[selectedItem].rendering ? this.pos.y + 190 + items[selectedItem].rendering.pos.y : this.pos.y + 190;
            const scale = items[selectedItem].rendering ? 20 * items[selectedItem].rendering.scale : 20 * items[selectedItem].scale;
            let isMirrored = this.data.Xdirec === 2;
            if (items[selectedItem].rendering && items[selectedItem].rendering.isMirrored) {
                if (isMirrored) {
                    isMirrored = false;
                }
                else {
                    isMirrored = true;
                }
            }
            if (!isMirrored) {
                ctx.drawImage(image, spriteX, items[selectedItem].spriteY, items[selectedItem].width, items[selectedItem].height, drawX, drawY, scale, scale);
            }
            else {
                ctx.save();
                ctx.scale(-1, 1);
                drawX = -(drawX);
                ctx.drawImage(image, spriteX, items[selectedItem].spriteY, items[selectedItem].width, items[selectedItem].height, drawX, drawY, scale, scale);
                ctx.restore();
            }
        }
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
        if (this.sprite.currentState === 'death')
            return;
        if (this.sprite.currentState === state)
            return;
        if (!this.sprite.spriteAnimations[state]) {
            state = 'idle';
        }
        this.sprite.currentState = state;
        this.sprite.frameLoc = 0; // reset animation
        this.sprite.frames = 0;
    }
    showHealthbar() {
        return;
    }
    takeHit(damage) {
        if (!this.data.isAttacking)
            this.changeState('take_hit');
        if (this.data.immune)
            return;
        let protection = 100;
        this.data.armor.forEach(armor => {
            if (armor !== null && items[armor].protection) {
                protection -= items[armor].protection;
            }
        });
        this.data.health -= damage * (protection / 100);
        if (menu.checkSetting('Master Sound'))
            playSound('takeDamage', (menu.values.effects / 100) / 2, true);
        if (this.data.health < 0)
            this.data.health = 0;
        this.setCooldown(200);
    }
    drop() {
        var _a;
        if (this.data.dragging) {
            if (this.data.Xdirec === 1) {
                const parsedData = parseSlotId(this.data.dragging);
                const item = player.data.inventory[parsedData.y][parsedData.x];
                player.data.inventory[parsedData.y][parsedData.x] = null;
                if (!item)
                    return;
                droppedItems.push(new droppedItem({ x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width + 50, y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height + 10 }, item, currentWorld));
                this.data.dragging = null;
            }
            else {
                const parsedData = parseSlotId(this.data.dragging);
                const item = player.data.inventory[parsedData.y][parsedData.x];
                player.data.inventory[parsedData.y][parsedData.x] = null;
                if (!item)
                    return;
                droppedItems.push(new droppedItem({ x: this.pos.x + this.sprite.hitbox.offsetX - 75, y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height + 10 }, item, currentWorld));
                this.data.dragging = null;
            }
            (_a = document.querySelector('body')) === null || _a === void 0 ? void 0 : _a.classList.remove('grab');
        }
        else if (!player.data.onInventory && player.data.inventory[3][this.data.selectedSlot - 1]) {
            if (this.data.Xdirec === 1) {
                const item = player.data.inventory[3][this.data.selectedSlot - 1];
                if (!item)
                    return;
                player.data.inventory[3][this.data.selectedSlot - 1] = null;
                droppedItems.push(new droppedItem({ x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width + 50, y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height + 10 }, item, currentWorld));
            }
            else {
                const item = player.data.inventory[3][this.data.selectedSlot - 1];
                if (!item)
                    return;
                player.data.inventory[3][this.data.selectedSlot - 1] = null;
                droppedItems.push(new droppedItem({ x: this.pos.x + this.sprite.hitbox.offsetX - 75, y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height + 10 }, item, currentWorld));
            }
            if (menu.checkSetting('Master Sound'))
                playSound('drop', menu.values.effects / 100, true);
        }
        updateHotbar();
        renderInventory();
    }
    setCooldown(ms) {
        this.data.onCooldown = true;
        setTimeout(() => this.data.onCooldown = false, ms);
    }
    attack() {
        gameSpeed = 0; // make the player stop walking
        if (items[player.data.inventory[3][this.data.selectedSlot - 1]].type === 'wand' && player.story.learntMagic) {
            if (player.data.selectedSpell && player.data.spellCooldown <= 0) {
                stats.sorcery.casted_spells.value++;
                player.data.selectedSpell.castSpell();
            }
            return;
        }
        if (!this.data.onCooldown && !this.data.isAttacking) {
            this.data.isAttacking = true;
            if (this.data.onGround) {
                this.changeState(`attack1`); // change to attack state
                if (menu.checkSetting('Master Sound'))
                    playSound('slice.mp3', menu.values.effects / 100);
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
                        if (checkCollision({ hitbox: { offsetY: 0 + this.sprite.hitbox.offsetY, offsetX: this.data.Xdirec === 1 ? this.sprite.hitbox.offsetX + this.sprite.hitbox.width : this.sprite.hitbox.offsetX - attackRange, width: attackRange, height: this.sprite.hitbox.height }, pos: this.pos }, { hitbox: obj.sprite.hitbox, pos: obj.pos }) && obj.type.attackable) { // Xdirec === 1 --> rechts Xdirec === 2 --> Links
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
                                if (itemFunctions[selectedSlot] && itemFunctions[selectedSlot].attack) {
                                    itemFunctions[selectedSlot].attack(obj);
                                }
                            }
                        }
                    });
                }, 300);
            }
            else {
                this.changeState(`attack3`); // change to attack state
                if (menu.checkSetting('Master Sound'))
                    playSound('slice.mp3', menu.values.effects / 100);
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
                        if (checkCollision({ hitbox: { offsetY: 0 + this.sprite.hitbox.offsetY, offsetX: this.data.Xdirec === 1 ? this.sprite.hitbox.offsetX + this.sprite.hitbox.width : this.sprite.hitbox.offsetX - attackRange, width: attackRange, height: this.sprite.hitbox.height }, pos: this.pos }, { hitbox: obj.sprite.hitbox, pos: obj.pos }) && obj.type.attackable) { // Xdirec === 1 --> rechts Xdirec === 2 --> Links
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
                                if (itemFunctions[selectedSlot] && itemFunctions[selectedSlot].attack) {
                                    itemFunctions[selectedSlot].attack(obj);
                                }
                            }
                        }
                    });
                }, 300);
            }
        }
    }
    jump() {
        if (!player.data.onCooldown && player.data.onGround) {
            player.data.jumpOrigin = this.bottom;
            player.data.onGround = false;
            player.data.velocity_Y = -2;
        }
    }
    endOfAnimation() {
        if (this.sprite.currentState === 'attack1' || this.sprite.currentState === 'take_hit' || this.sprite.currentState === 'attack3') { // reset animation
            this.changeState('idle');
            this.data.isAttacking = false;
        }
        else if (this.sprite.currentState === 'death') {
            this.data.isDead = true;
            console.log('death');
            this.sprite.currentState = 'idle';
            this.sprite.frameLoc = 0;
            this.sprite.frames = 0;
            showDeathScreen();
        }
    }
    respawn() {
        player.data.health = player.data.maxHealth;
        player.data.isDead = false;
        this.sprite.currentState = 'idle';
        this.sprite.frameLoc = 0;
        this.sprite.frames = 0;
        closeDeathScreen();
        teleport(-player.worldPosX[currentWorld]);
    }
    useItem() {
        const currentItem = player.data.inventory[3][this.data.selectedSlot - 1];
        if (!currentItem)
            return;
        if (items[player.data.inventory[3][this.data.selectedSlot - 1]].clearsAfterUse)
            player.data.inventory[3][this.data.selectedSlot - 1] = null;
        if (itemFunctions[currentItem] && itemFunctions[currentItem].use) {
            itemFunctions[currentItem].use();
        }
        updateHotbar();
    }
    heal(healAmount) {
        if (healAmount + this.data.health >= this.data.maxHealth) {
            stats.general.healed.value += this.data.maxHealth - this.data.health;
            this.data.health = this.data.maxHealth;
        }
        else {
            this.data.health += healAmount;
            stats.general.healed.value += healAmount;
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
            for (let x = 0; x < amount - itemCounter; x++) {
                droppedItems.push(new droppedItem({ x: this.pos.x + this.sprite.hitbox.offsetX + Math.round(Math.random() * 80) - 40, y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height + 10 }, item, currentWorld));
            }
        }
        let fullInv = true;
        for (let y = 3; y >= 0; y--) {
            for (let x = 0; x < 5; x++) {
                if (player.data.inventory[y][x] === null) {
                    fullInv = false;
                }
            }
        }
        if (fullInv)
            grantAchievement('hoarder');
        updateHotbar();
    }
    hasFullInventory() {
        for (let y = 3; y >= 0; y--) {
            for (let x = 0; x < 5; x++) {
                if (player.data.inventory[y][x] === null) {
                    return false;
                }
            }
        }
        return true;
    }
    removeItems(items) {
        let success = true;
        items.forEach(item => {
            let counter = 0;
            for (let y = 0; y < player.data.inventory.length; y++) {
                for (let x = 0; x < player.data.inventory[y].length; x++) {
                    if (counter < item.amount) {
                        if (player.data.inventory[y][x] === item.item) {
                            counter++;
                            player.data.inventory[y][x] = null;
                        }
                    }
                }
            }
            if (counter < item.amount) {
                success = false;
            }
        });
        renderInventory();
        updateHotbar();
        return success;
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
            innerDiv.id = `${effect}`;
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
        if (effectFunctions[effect] && effectFunctions[effect].start) {
            effectFunctions[effect].start(this);
        }
    }
    removeEffect(index) {
        for (let i = 0; i < this.effectData.effects.length; i++) {
            if (this.effectData.effects[i].index === index) {
                document.querySelector(`#${this.effectData.effects[i].effect.name}`).remove();
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
    updateHealthbar() {
        const filler = document.querySelector('#healthbar-fill');
        const percent = player.data.health / player.data.maxHealth;
        const width = percent * 147;
        filler.style.width = `${width}px`;
        const heart = document.querySelector('#heart');
        if (this.data.health <= 0) {
            heart === null || heart === void 0 ? void 0 : heart.classList.add('display-none');
        }
        else {
            heart === null || heart === void 0 ? void 0 : heart.classList.remove('display-none');
        }
    }
    get center() {
        return {
            x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width / 2,
            y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height / 2
        };
    }
    get bottom() {
        return (this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height);
    }
    updateMana() {
        const div = document.querySelector('#manaBar-fill');
        const width = (this.data.mana / 100) * 106;
        div.style.width = `${width}px`;
    }
}
