"use strict";
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
class droppedItem {
    constructor(pos, item, dim) {
        this.pos = pos;
        this.item = item;
        this.hitbox = {
            offsetX: 0,
            offsetY: 0,
            width: 50,
            height: 50
        };
        this.baseSize = 30;
        this.dim = dim;
        this.wasPickedUp = false;
        this.spawnFrame = gameFrame;
    }
    update() {
        // make them collide with blocks if blocking
        const bottomOfItem = this.pos.y + this.hitbox.offsetY + this.hitbox.height;
        const isBlocked = () => {
            return worlds[currentWorld].elements.some(el => {
                if (!(el instanceof block) || !el.blocking.isBlocking)
                    return false;
                if (el.worldElem === 'invisWall')
                    return false;
                const blockTop = el.pos.y + el.hitbox.offsetY;
                if (bottomOfItem < blockTop)
                    return false; // Block ist noch unterhalb
                return checkCollision({ hitbox: el.hitbox, pos: el.pos }, { hitbox: this.hitbox, pos: this.pos });
            });
        };
        if (bottomOfItem - 120 < groundY && (!isBlocked())) {
            this.pos.y += 5;
        }
        else if (bottomOfItem - 120 > groundY) {
            this.pos.y = groundY - this.hitbox.height + 165;
        }
        // check if the player picks up the item
        if (checkCollision({ hitbox: this.hitbox, pos: this.pos }, { hitbox: player.hitbox, pos: player.pos }) && !player.hasFullInventory() && !this.wasPickedUp && this.dim === currentWorld && !player.data.isDead && player.sprite.currentState !== 'death' && gameFrame - this.spawnFrame > 60) {
            player.addItem(this.item, 1);
            updateHotbar();
            renderInventory();
            this.wasPickedUp = true;
            stats.items.picked_up_items.value++;
            if (menu.checkSetting('Master Sound'))
                playSound('pickup', menu.sounds.effects / 100, true);
        }
    }
    draw() {
        if (this.dim !== currentWorld)
            return;
        if (menu.checkSetting('Hitboxes')) {
            ctx.save();
            ctx.strokeStyle = "green";
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x + this.hitbox.offsetX, this.pos.y + this.hitbox.offsetY, this.hitbox.width, this.hitbox.height);
            ctx.strokeStyle = "black";
            ctx.strokeRect(this.pos.x + this.hitbox.offsetX, this.pos.y + this.hitbox.offsetY, 5, 5);
            ctx.restore();
        }
        let spriteX = items[this.item].spriteX;
        const animation = items[this.item].animation;
        if (animation) {
            const fps = animation.frames / animation.length; // Frames pro Sekunde
            const currentFrame = Math.floor(gameFrame / (60 / fps)) % animation.frames;
            spriteX = currentFrame * items[this.item].width;
        }
        const image = new Image();
        image.src = `img/items/${items[this.item].src}`;
        ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(image, spriteX, items[this.item].spriteY, items[this.item].width, items[this.item].height, this.pos.x, this.pos.y, this.hitbox.width, this.hitbox.height);
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
            this.pos.x = this.entity.pos.x + this.entity.sprite.spriteWidth;
        }
        if (this.entity.type.name === 'goblin') {
            this.pos.x -= 20;
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
    constructor(entity, spriteWidth, spriteHeight, scale, pathToImage, animationStates, range, speed, damage, hitbox, name, effect, customData) {
        let x;
        if (entity.data.Xdirec === 1) {
            x = (customData === null || customData === void 0 ? void 0 : customData.x) ? customData.x + entity.pos.x + entity.sprite.hitbox.offsetX + entity.sprite.hitbox.width : entity.pos.x + entity.sprite.hitbox.offsetX + entity.sprite.hitbox.width;
        }
        else {
            x = (customData === null || customData === void 0 ? void 0 : customData.x) ? customData.x + entity.pos.x + entity.sprite.hitbox.offsetX : entity.pos.x + entity.sprite.hitbox.offsetX;
        }
        this.name = name;
        this.pos = {
            x: x,
            y: (customData === null || customData === void 0 ? void 0 : customData.y) ? customData.y + entity.pos.y + entity.sprite.hitbox.offsetY : entity.pos.y + entity.sprite.hitbox.offsetY
        };
        this.entity = entity;
        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;
        this.frames = 0;
        this.frameLoc = 0;
        this.currentState = 'idle';
        this.type = { isGround: true /* is a ground troop/thing */, name: 'projectile' /* name of the entity/thing */, allignment: 'passive' /* does it attack the player */, moving: true /* should it be moved when the player moves; to mimic movement */, attackable: false, interactable: false };
        this.animationStates = animationStates;
        this.spriteAnimations = {};
        this.img = new Image();
        this.img.src = pathToImage;
        this.range = range;
        this.speed = speed;
        this.damage = damage;
        this.scale = scale;
        this.traveled = 0;
        this.Xdirec = (customData === null || customData === void 0 ? void 0 : customData.direc) ? customData === null || customData === void 0 ? void 0 : customData.direc : this.entity.data.Xdirec;
        this.hitbox = hitbox;
        this.isDestroyed = false;
        this.effect = effect;
        this.noDamage = false;
        this.alreadyHit = [];
        this.init();
        if (this.spriteAnimations.start) {
            this.currentState = 'start';
        }
    }
    update() {
        if (this.Xdirec === 1) {
            this.pos.x += this.speed;
            this.traveled += this.speed;
        }
        else {
            this.pos.x -= this.speed;
            this.traveled -= this.speed;
        }
        let hitEntity;
        let hitWall;
        let hitPlayer;
        let hit;
        if (this.entity === player) {
            worlds[currentWorld].elements.forEach(element => {
                if (element instanceof Entity && element.type.allignment === 'enemy' && !this.alreadyHit.includes(element) && checkCollision({ hitbox: this.hitbox, pos: this.pos }, { hitbox: element.sprite.hitbox, pos: element.pos })) {
                    hit = true;
                    hitEntity = element;
                }
                else if (element instanceof block && element.blocking.isBlocking && checkCollision({ hitbox: this.hitbox, pos: this.pos }, { hitbox: element.hitbox, pos: element.pos })) {
                    hit = true;
                    hitWall = true;
                }
            });
        }
        else {
            hit = checkCollision({ hitbox: this.hitbox, pos: this.pos }, { hitbox: player.hitbox, pos: player.pos });
            hitPlayer = true;
        }
        if (hit && !this.isDestroyed) {
            if (hitEntity) {
                this.alreadyHit.push(hitEntity);
                if (hitEntity.takeHit && !this.noDamage) {
                    hitEntity.takeHit(this.damage);
                    if (this.name === 'blood_vortex') {
                        player.heal(this.damage / 2);
                    }
                    if (this.effect && this.effect.effect && this.effect.time) {
                        hitEntity.addEffect(this.effect.effect, this.effect.time, 1);
                    }
                }
            }
            else if (hitPlayer && !this.noDamage) {
                player.takeHit(this.damage);
                if (this.effect && this.effect.effect && this.effect.time) {
                    player.addEffect(this.effect.effect, this.effect.time, 1);
                }
            }
        }
        if (hit || Math.abs(this.traveled) > this.range) {
            this.isDestroyed = true;
            if (hit && this.name === 'chain_bolt') {
                this.isDestroyed = false;
                this.traveled /= 2;
            }
            else {
                if (this.spriteAnimations.impact)
                    this.currentState = 'impact';
                this.speed = 0;
            }
        }
        this.frames++;
        if (this.frames >= staggerFrames) { // check if next frame should be drawn
            this.frames = 0; // reset frames
            this.frameLoc++; // advance to next frame
            const frameAmount = this.spriteAnimations[this.currentState].loc.length;
            if (this.frameLoc >= frameAmount) { // check if the end of the animation is reached
                this.frameLoc = 0;
                this.endOfAnimation();
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
        if (this.Xdirec === 1) {
            ctx.drawImage(this.img, frameX, frameY, this.spriteWidth, this.spriteHeight, this.pos.x, this.pos.y, this.hitbox.width * this.scale, this.hitbox.height * this.scale);
        }
        else {
            ctx.save(); // save current state of the canvas
            const drawX = -(this.pos.x + this.hitbox.width * this.scale);
            ctx.scale(-1, 1); // invert orientatian of the entity
            ctx.drawImage(this.img, frameX, frameY, this.spriteWidth, this.spriteHeight, drawX, this.pos.y, this.hitbox.width * this.scale, this.hitbox.height * this.scale);
            ctx.restore();
        }
    }
    endOfAnimation() {
        if (this.currentState === 'start') {
            this.currentState = 'idle';
            this.frameLoc = 0;
            this.frames = 0;
        }
        else if (this.currentState === 'impact' || this.isDestroyed) {
            let remover = [];
            particles.forEach((elem, i) => {
                if (elem === this)
                    remover.push(i);
            });
            remover.forEach(i => {
                particles.splice(i, 1);
            });
            if (this.name === 'teleport_dart') {
                playSound('teleport', menu.sounds.effects / 100, true);
                this.pos.x -= this.traveled;
                teleport(this.traveled);
            }
            else if (this.name === 'avalanche') {
                worlds[currentWorld].elements.forEach(el => {
                    if (el instanceof Entity && el.type.allignment === 'enemy') {
                        const distance = Math.abs(this.center.x - el.center.x);
                        if (distance < 300) {
                            el.takeHit(7);
                        }
                    }
                });
            }
        }
    }
    get center() {
        return {
            x: this.pos.x + this.hitbox.offsetX + this.hitbox.width / 2,
            y: this.pos.y + this.hitbox.offsetY + this.hitbox.height / 2
        };
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
        else if (this.entity.type.name === 'goblin') {
            this.x += 30;
        }
        else if (this.entity.type.name === 'ogre') {
            this.y -= 60;
        }
        else if (this.entity.type.name === 'passiveEntity') {
            this.y -= 160;
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
        if (this.entity instanceof block || this.entity instanceof teleporter) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(CANVAS_WIDTH * 0.85, 200, 200, 40);
            ctx.fillStyle = overColor;
            ctx.fillRect(CANVAS_WIDTH * 0.85, 200, (((drawHealth / drawMaxHealth) * 200 < 0) ? 0 : (drawHealth / drawMaxHealth) * 200), 40);
            const image = new Image();
            image.src = this.entity.sprite.img;
            ctx.drawImage(image, 0, 0, this.entity.sprite.spriteWidth, this.entity.sprite.spriteHeight, CANVAS_WIDTH * 0.825, 200, 40, 40);
        }
        else {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(this.x + this.entity.sprite.spriteWidth, this.y + 120, 100 * scale, 20 * scale);
            ctx.fillStyle = overColor;
            ctx.fillRect(this.x + this.entity.sprite.spriteWidth, this.y + 120, (((drawHealth / drawMaxHealth) * 100 < 0) ? 0 : (drawHealth / drawMaxHealth) * 100) * scale, 20 * scale);
        }
    }
    interact() {
        return;
    }
}
class storyStarter {
    constructor(x, name) {
        this.x = x;
        this.y = 0;
        this.name = name;
        this.hitbox = { offsetX: 0, offsetY: 0, width: 100, height: 700 };
    }
    update() {
        const isColliding = checkCollision({ hitbox: player.hitbox, pos: player.pos }, { hitbox: this.hitbox, pos: { x: this.x, y: this.y } });
        if (isColliding) {
            if (this.name === 'goblinKingEntry') {
                // Do shit
            }
        }
    }
}
