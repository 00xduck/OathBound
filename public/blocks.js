"use strict";
class chest {
    constructor(x, y, inventory, worldElem) {
        if (y === StaticPositions.OnGround) {
            y = 600;
        }
        this.imgReal = {};
        this.pos = {
            x: x,
            y: y
        };
        this.data = { class: "chest" };
        this.spriteWidth = 43;
        this.spriteHeight = 40;
        this.hitbox = { offsetX: -30, offsetY: 0, width: 175, height: 100 };
        this.frames = 0;
        this.frameLoc = 0;
        this.scale = 0.3;
        this.showedText = false;
        this.isInit = false;
        this.currentState = 'normal';
        this.img = 'img/passiveEntities/dropChest.png';
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
        if (checkCollision({ hitbox: this.hitbox, pos: this.pos }, { hitbox: player.hitbox, pos: player.pos }) && !player.data.onCooldown && player.data.onGround && menu.checkSetting('labels')) {
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
        /*         let image = new Image()
                if (!(this.imgReal instanceof HTMLImageElement)) {
                    image.src = this.img
                } else {
                    image = this.imgReal
                } */
        const image = getImage(this.img);
        if (!(this.imgReal instanceof HTMLImageElement))
            return;
        ctx.drawImage(image, frameX, frameY, this.spriteWidth, this.spriteHeight, this.pos.x, this.pos.y, 400 * this.scale, 400 * this.scale);
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
        this.imgReal = new Image();
        if (this.imgReal instanceof HTMLImageElement)
            this.imgReal.src = this.img;
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
            img: sprite.pathToImage,
            pathToImage: sprite.pathToImage,
            spriteWidth: sprite.spriteWidth,
            spriteHeight: sprite.spriteHeight,
            scale: sprite.scale,
        };
        this.hitbox = sprite.hitbox;
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
            class: "block",
            showedText: false,
            spawnedHealthbar: false,
            wasCollected: false,
            healthbar: null,
            health: 0
        };
        this.img = {};
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
            if (checkCollision({ hitbox: this.hitbox, pos: this.pos }, { hitbox: player.hitbox, pos: player.pos }) && !player.data.onCooldown && player.data.onGround) {
                if (!this.data.showedText && menu.checkSetting('labels')) {
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
            if (checkCollision({ hitbox: this.hitbox, pos: this.pos }, { hitbox: player.hitbox, pos: player.pos }) && !player.data.onCooldown && player.data.onGround) {
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
        if (this.sprite.pathToImage === 'img/blocks/door_1.png' && this.blocking.isBlocking === false) {
            this.sprite.img = 'img/blocks/door_1_open.png';
        }
    }
    draw() {
        if (menu.checkSetting('Hitboxes')) {
            ctx.save();
            ctx.strokeStyle = this.type.allignment === 'enemy' ? 'red' : (this.type.allignment === 'passive' ? 'yellow' : 'green');
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x + this.hitbox.offsetX, this.pos.y + this.hitbox.offsetY, this.hitbox.width, this.hitbox.height);
            ctx.strokeStyle = "black";
            ctx.strokeRect(this.pos.x + this.hitbox.offsetX, this.pos.y + this.hitbox.offsetY, 5, 5);
            ctx.restore();
        }
        /*         let image = new Image()
                if (!(this.img instanceof HTMLImageElement)) {
                    image.src = this.sprite.img
                } else {
                    image = this.img
                }
                if (!(this.img instanceof HTMLImageElement)) return */
        const image = getImage(this.sprite.img);
        ctx.drawImage(image, 0, 0, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, this.sprite.spriteWidth * this.sprite.scale, this.sprite.spriteHeight * this.sprite.scale);
    }
    init() {
        this.img = new Image();
        if (this.img instanceof HTMLImageElement)
            this.img.src = this.sprite.img;
    }
    interact() {
        if (this.interactData && !this.onCooldown) {
            if (this.data.wasCollected && !this.interactData.isInfinite)
                return;
            if (!this.data.spawnedHealthbar) {
                let remover = [];
                nonWorldElems.forEach((elem, i) => {
                    if (elem instanceof healthbar && (elem.entity instanceof block || elem.entity instanceof teleporter)) {
                        elem.entity.data.spawnedHealthbar = false;
                        elem.entity.data.health = 0;
                        remover.push(i);
                    }
                });
                remover.forEach(i => {
                    nonWorldElems.splice(i, 1);
                });
                nonWorldElems.push(new healthbar(this));
                this.data.spawnedHealthbar = true;
            }
            if (keys['KeyR']) {
                if (this.data.health === 0 && menu.checkSetting("Master Sound")) {
                    playSound("taking.wav", menu.sounds.effects / 100);
                }
                this.data.health += 1;
            }
            else {
                this.data.health = 0;
            }
            if (this.data.health >= this.interactData.cooldown) {
                this.interactData.output.forEach(element => {
                    var _a;
                    for (let x = 0; x < element.amount; x++) {
                        console.log(x);
                        droppedItems.push(new droppedItem({
                            x: this.pos.x + this.hitbox.offsetX + Math.random() * this.hitbox.width,
                            y: this.pos.y + this.hitbox.offsetY
                        }, element.item, currentWorld));
                    }
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
                if (this.id === 5432) {
                    player.story.freedNate = true;
                    grantAchievement('free_nate');
                }
                updateHotbar();
            }
            else {
                displayInfo(`Use a ${this.blocking.removeItem} `);
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
class teleporter {
    constructor(pos, sprite, interact, blocking, destination, worldElem, id) {
        this.pos = { x: pos.x, y: pos.y };
        this.sprite = {
            img: sprite.pathToImage,
            pathToImage: sprite.pathToImage,
            spriteWidth: sprite.spriteWidth,
            spriteHeight: sprite.spriteHeight,
            scale: sprite.scale,
        };
        this.hitbox = sprite.hitbox;
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
            class: "teleporter",
            showedText: false,
            spawnedHealthbar: false,
            wasCollected: false,
            healthbar: null,
            health: 0
        };
        this.img = {};
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
        if (checkCollision({ hitbox: this.hitbox, pos: this.pos }, { hitbox: player.hitbox, pos: player.pos }) && !player.data.onCooldown && player.data.onGround) {
            if (!this.data.showedText && menu.checkSetting('labels')) {
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
        if (menu.checkSetting('Hitboxes')) {
            ctx.save();
            ctx.strokeStyle = this.type.allignment === 'enemy' ? 'red' : (this.type.allignment === 'passive' ? 'yellow' : 'green');
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x + this.hitbox.offsetX, this.pos.y + this.hitbox.offsetY, this.hitbox.width, this.hitbox.height);
            ctx.restore();
        }
        /*         let image = new Image()
                if (!(this.img instanceof HTMLImageElement)) {
                    image.src = this.sprite.img
                } else {
                    image = this.img
                }
                if (!(this.img instanceof HTMLImageElement)) return */
        const image = getImage(this.sprite.img);
        ctx.drawImage(image, 0, 0, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale);
    }
    init() {
        this.img = new Image();
        if (this.img instanceof HTMLImageElement)
            this.img.src = this.sprite.img;
    }
    interact() {
        var _a;
        if (!this.data.spawnedHealthbar && !this.onCooldown) {
            let remover = [];
            nonWorldElems.forEach((elem, i) => {
                if (elem instanceof healthbar && (elem.entity instanceof block || elem.entity instanceof teleporter)) {
                    elem.entity.data.spawnedHealthbar = false;
                    elem.entity.data.health = 0;
                    remover.push(i);
                }
            });
            remover.forEach(i => {
                nonWorldElems.splice(i, 1);
            });
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
    get center() {
        return {
            x: this.pos.x + this.hitbox.offsetX + this.hitbox.width / 2,
            y: this.pos.y + this.hitbox.offsetY + this.hitbox.height / 2
        };
    }
}
