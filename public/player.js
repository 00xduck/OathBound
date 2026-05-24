"use strict";
// player classs
class Player {
    constructor(x, y) {
        this.pos = {
            x: x,
            y: y
        };
        this.sprite = {
            img: 'img/player.png',
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
            scale: 1,
            hitbox: { offsetX: 195, offsetY: 170, width: 60, height: 110 }
        };
        this.effectData = {
            effects: [],
            effectTicks: 0,
            effectCounter: 0
        };
        this.data = {
            immune: false,
            onSpellCooldown: false,
            mana: 100,
            castingSpell: false,
            spellCooldown: 0,
            currentCooldown: 0,
            selectedSpell: null,
            magicInventory: [null, null, null, null, null, null, null, null, null],
            spells: [null, null, null, null, null, null, null, null, null],
            isAttacking: false,
            class: "player",
            jumpOrigin: null,
            onGround: true,
            onBlock: { isOnBlock: false, block: null },
            onInventory: false,
            onTradingMenu: false,
            showedText: false,
            speed: 7,
            onSecondaryInventory: false,
            canMove: true,
            isMoving: false,
            velocity_Y: 0,
            health: 100,
            maxHealth: 100,
            jumpHeight: 200,
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
        this.story = {
            freedNate: false,
            learntMagic: true
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
            return playerBottom <= blockTop + 20;
        });
        const onOtherBlock = {
            onBlock: !!foundBlock,
            block: foundBlock !== null && foundBlock !== void 0 ? foundBlock : null
        };
        this.data.onBlock = { isOnBlock: onOtherBlock.onBlock, block: onOtherBlock.block };
        if (this.data.onGround && !onOtherBlock.onBlock && this.bottom - 118 < groundY) {
            this.data.onGround = false;
        }
        if (!this.data.onGround) {
            if (this.data.jumpOrigin && this.data.jumpOrigin - this.bottom >= this.data.jumpHeight && this.data.velocity_Y < 0) {
                this.data.velocity_Y = 0;
            }
            if (this.data.velocity_Y < 0) {
                this.pos.y += this.data.velocity_Y * globalGravity;
                this.data.velocity_Y += 0.1;
                if (!(this.sprite.currentState === "attack3") && !(this.sprite.currentState === "jump"))
                    this.changeState("jump");
            }
            else {
                this.pos.y += this.data.velocity_Y * globalGravity;
                this.data.velocity_Y += 0.1;
                if (!(this.sprite.currentState === "attack3") && !(this.sprite.currentState === "fall"))
                    this.changeState("fall");
            }
            if (this.bottom - 118 >= groundY && this.data.velocity_Y > 0) { // check if player is on the ground
                this.pos.y = groundY - this.sprite.spriteHeight;
                player.data.onBlock = { isOnBlock: false, block: null };
                this.data.onGround = true; // reset values
                this.data.velocity_Y = 0;
                this.data.jumpOrigin = null;
                if (this.sprite.currentState !== 'attack3')
                    this.changeState('idle');
            }
            else if (onOtherBlock.onBlock && this.data.velocity_Y > 0) {
                this.pos.y = ((onOtherBlock.block.pos.y + onOtherBlock.block.hitbox.offsetY) - (player.hitbox.offsetY + player.hitbox.height)) + 1;
                this.data.onGround = true; // reset values
                this.data.velocity_Y = 0;
                this.data.jumpOrigin = null;
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
            ctx.strokeRect(this.pos.x + this.sprite.hitbox.offsetX, this.pos.y + this.sprite.hitbox.offsetY, this.sprite.hitbox.width, this.sprite.hitbox.height);
            ctx.strokeStyle = "black";
            ctx.strokeRect(this.pos.x + this.sprite.hitbox.offsetX, this.pos.y + this.sprite.hitbox.offsetY, 5, 5);
            ctx.restore();
        }
        let frameX = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].x;
        let frameY = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].y;
        const image = new Image();
        image.src = this.sprite.img;
        if (this.data.Xdirec === 2) {
            ctx.save(); // save current state of the canvas
            const drawX = -(this.pos.x + 450);
            ctx.scale(-1, 1); // invert orientatian of the entity
            ctx.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX, this.pos.y, 450, 450);
            ctx.restore();
        }
        else if (this.data.Xdirec === 1) {
            ctx.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, 450, 450);
        } // (image, sx, sy, sw, sh, dx, dy, dw, dh)
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
            playSound('takeDamage', (menu.sounds.effects / 100) / 2, true);
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
                playSound('drop', menu.sounds.effects / 100, true);
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
                    playSound('slice.mp3', menu.sounds.effects / 100);
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
                    playSound('slice.mp3', menu.sounds.effects / 100);
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
                    if (player.data.inventory[y][x] === item.item) {
                        counter++;
                        player.data.inventory[y][x] = null;
                    }
                }
            }
            if (counter < item.amount) {
                success = false;
            }
        });
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
