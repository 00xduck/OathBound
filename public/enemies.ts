abstract class Entity {
    abstract sprite: {
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
        }
    }
    abstract data: {
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
    abstract type: {
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
        }
    }
    pos: { x: number, y: number }
    effectData: { effects: effectType[], effectTicks: number, effectCounter: number }
    worldElem: worldElementNames
    img: HTMLImageElement | {}
    id: number

    constructor(pos: { x: number, y: number }, worldElem: worldElementNames, id: number) {
        this.pos = {
            x: pos.x,
            y: pos.y
        }

        this.img = {}

        this.effectData = {
            effects: [],
            effectTicks: 0,
            effectCounter: 0
        }
        this.worldElem = worldElem
        this.id = id
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
        console.log(state)
        console.log(this.data.class)
        this.sprite.currentState = state
        this.sprite.frameLoc = 0 // reset animation
        this.sprite.frames = 0
    }
    setCooldown(ms: number): void {
        this.data.onCooldown = true
        setTimeout(() => this.data.onCooldown = false, ms)
    }
    showHealthbar() {

        const exists = nonWorldElems.some(o =>
            o.type.name === 'healthbar' &&
            (o as healthbar).entity === (this as unknown as entity)
        );

        if (!exists) {
            const newHealthbar = new healthbar((this as unknown as entity));
            nonWorldElems.push(newHealthbar);
        }
    }
    addEffect(effect: effect, duration: number, factor: number) {
        let foundDuplicate = false
        this.effectData.effects.forEach(effect1 => {
            if (effect1.effect.name === effect) {
                effect1.duration = duration
                foundDuplicate = true
            }
        })
        if (!foundDuplicate) {
            const image = new Image()
            image.src = effects[effect].particle
            this.effectData.effects.push({ effect: effects[effect], duration, factor, index: this.effectData.effectCounter })
            particles.push(new particle((this as unknown as entity), effects[effect].spriteWidth, effects[effect].spriteHeight, image, this.effectData.effectCounter, effects[effect].frameAmount))
            this.effectData.effectCounter++
        }

        const effectName = effects[effect].name as keyof typeof effectFunctions
        if (effectFunctions[effectName]?.start) {

            effectFunctions[effectName].start(this as unknown as entity)
        }
    }
    removeEffect(index: number) {
        for (let i = 0; i < this.effectData.effects.length; i++) {
            if (this.effectData.effects[i].index === index) {
                this.effectData.effects.splice(i, 1)
                console.log(this);
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
        if (healAmount + this.data.health >= this.data.maxHealth) {
            this.data.health = this.data.maxHealth
        } else {
            this.data.health += healAmount
        }
    }
    checkEffect(effect: effect): { wasFound: boolean; effect: effectType | null } {
        let foundEffect = false
        let effect2: effectType | null = null
        this.effectData.effects.forEach(effect1 => {
            if (effect1.effect.name === effect) {
                foundEffect = true
                effect2 = effect1
            }
        })
        return { wasFound: foundEffect, effect: effect2 }
    }
    get center() {
        return {
            x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width / 2,
            y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height / 2
        }
    }

    abstract interact(): void

    abstract takeHit(damage: number): void
}

class enemyArcher extends Entity implements entity {
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
    constructor(pos: { x: number, y: number }) {
        super(pos, 'enemy', -1)

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
        }

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
        }

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
        }

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

        if (this.data.health <= 0 || player.data.isDead) return

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
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale)
            ctx!.restore()
        } else {
            this.data.Xdirec = 1
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale)
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
                    particles.push(new projectile(this, this.type.attackType.projectile.spriteWidth, this.type.attackType.projectile.spriteHeight, this.type.attackType.projectile.scale, this.type.attackType.projectile.pathToImage, this.type.attackType.projectile.animationStates, this.type.attackType.projectile.range, this.type.attackType.projectile.speed, this.type.attackType.projectile.damage, this.type.attackType.projectile.hitbox, this.type.attackType.type))
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

    }
}
class nightBorn extends Entity implements entity {
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
    constructor(x: number, y: number, worldElem: worldElementNames, id: number) {
        if (y === StaticPositions.OnGround) y = 230

        super({ x, y }, worldElem, id)

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
        }

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
        }

        this.type = {
            isGround: true,
            name: 'nightBorn',
            allignment: 'enemy',
            moving: true,
            attackable: true,
            interactable: false
        }

        this.worldElem = worldElem
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

        if (this.data.health <= 0 || player.data.isDead) return

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
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale)
            ctx!.restore()
        } else {
            this.data.Xdirec = 1
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale)
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
            let tally = 0
            let deadParticles: number[] = []
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i)
                }
            })
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle - tally, 1)
                tally++
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

    }
}

class goblin extends Entity implements entity {
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
    constructor(x: number, y: number, worldElem: worldElementNames, id: number) {
        if (y === StaticPositions.OnGround) y = 430

        super({ x, y }, worldElem, id)

        this.sprite = {
            img: configs!.properties.goblin.sprite.img,
            pathToImage: configs!.properties.goblin.sprite.img,
            spriteWidth: configs!.properties.goblin.sprite.spriteWidth,
            spriteHeight: configs!.properties.goblin.sprite.spriteHeight,
            scale: configs!.properties.goblin.sprite.scale,
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
            hitbox: configs!.properties.goblin.sprite.hitbox
        }

        this.data = {
            isAttacking: false,
            class: 'goblin',
            health: configs!.properties.goblin.data.health,
            maxHealth: configs!.properties.goblin.data.health,
            attackDamage: configs!.properties.goblin.data.attackDamage,
            attackRange: configs!.properties.goblin.data.attackRange,
            drops: configs!.properties.goblin.data.drops,
            name: 'goblin',
            onCooldown: false,
            isDead: false,
            isMoving: false,
            showedText: false,
            Xdirec: 1,
            seeRange: configs!.properties.goblin.data.seeRange,
            attackFocus: null
        }

        this.type = {
            isGround: true,
            name: 'goblin',
            allignment: 'enemy',
            moving: true,
            attackable: true,
            interactable: false
        }

        this.worldElem = worldElem
        this.init()
    }
    async update(): Promise<void> {
        if (this.data.isDead) return
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            effect.duration--

            if (effect.duration <= 0) {
                const effectName = effect.effect.name as keyof typeof effectFunctions
                if (effectFunctions[effectName]?.end) {

                    effectFunctions[effectName].end(this)
                }
                this.removeEffect(effect.index)
            }
            if (effect.duration % effect.effect.ticks === 0) {
                const effectName = effect.effect.name as keyof typeof effectFunctions
                if (effectFunctions[effectName]?.onTick) {

                    effectFunctions[effectName].onTick(this)
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

        if (this.data.health <= 0 || player.data.isDead) return

        if (!menu.checkSetting('No Aggro')) {
            const playerPosX = player.pos.x
            const distanceXToPlayer = Math.abs((playerPosX + (player.sprite.spriteWidth / 2) * player.sprite.scale) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale))
            const playerDirec = this.pos.x - player.pos.x
            const playerHiddenFromGoblins = player.data.armor[0] === 'goblin_mask' && this.data.name === 'goblin'
            if (distanceXToPlayer <= this.data.attackRange && !this.data.onCooldown && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                if ((!playerHiddenFromGoblins || player.story.freedNate) && player.pos.y + this.data.attackRange >= this.pos.y) {
                    if (Math.random() > 0.6) {
                        this.data.attackFocus = player
                        this.attack()
                    }
                }else {
                    if(this.sprite.currentState !== 'idle') this.changeState('idle')
                }
            } else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && !this.data.onCooldown && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                if ((!playerHiddenFromGoblins || player.story.freedNate) && player.pos.y + this.data.attackRange >= this.pos.y ) {
                    if (Math.random() > 0.6) {
                        this.data.attackFocus = player
                        this.attack()
                    }
                }else {
                    if(this.sprite.currentState !== 'idle') this.changeState('idle')
                }
            } else if (distanceXToPlayer <= this.data.seeRange && !this.data.onCooldown && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player
                    let hasEntityInFront = false

                    if (!hasEntityInFront) {
                        if (this.sprite.currentState !== 'run') this.changeState('run')
                        if (playerPosX > this.pos.x) {
                            if (this.checkEffect('ice').wasFound) {
                                this.pos.x += 2
                            } else
                                this.pos.x += 4
                        } else {
                            if (this.checkEffect('ice').wasFound) {
                                this.pos.x -= 2
                            } else
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
                }
            } else {
                if (this.sprite.currentState === 'run') { this.changeState('idle') }

                this.data.attackFocus = null
            }
        }

        this.effectData.effectTicks++
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
            let tally = 0
            let deadParticles: number[] = []
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i)
                }
            })
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle - tally, 1)
                tally++
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
    get center() {
        return {
            x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width / 2,
            y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height / 2
        }
    }

    interact(): void {

    }
}

class stoneGolem extends Entity implements entity {
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
    constructor(x: number, y: number, worldElem: worldElementNames, id: number) {
        if (y === StaticPositions.OnGround) y = 430

        super({ x, y }, worldElem, id)
        this.sprite = {
            img: configs!.properties.stoneGolem.sprite.img,
            pathToImage: configs!.properties.stoneGolem.sprite.img,
            spriteWidth: configs!.properties.stoneGolem.sprite.spriteWidth,
            spriteHeight: configs!.properties.stoneGolem.sprite.spriteHeight,
            scale: configs!.properties.stoneGolem.sprite.scale,
            spriteAnimations: {},
            frames: 0,
            frameLoc: 0,
            currentState: 'idle',
            animationStates: configs!.properties.stoneGolem.sprite.animationStates,
            hitbox: configs!.properties.stoneGolem.sprite.hitbox
        }

        this.data = {
            isAttacking: false,
            class: 'stoneGolem',
            health: configs!.properties.stoneGolem.data.health,
            maxHealth: configs!.properties.stoneGolem.data.health,
            attackDamage: configs!.properties.stoneGolem.data.attackDamage,
            attackRange: configs!.properties.stoneGolem.data.attackRange,
            drops: configs!.properties.stoneGolem.data.drops,
            name: 'stoneGolem',
            onCooldown: false,
            isDead: false,
            isMoving: false,
            showedText: false,
            Xdirec: 1,
            seeRange: configs!.properties.stoneGolem.data.seeRange,
            attackFocus: null
        }

        this.type = {
            isGround: true,
            name: 'stoneGolem',
            allignment: 'enemy',
            moving: true,
            attackable: true,
            interactable: false
        }

        this.worldElem = worldElem
        this.init()
    }
    async update(): Promise<void> {
        if (this.data.isDead) return
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            effect.duration--

            if (effect.duration <= 0) {
                const effectName = effect.effect.name as keyof typeof effectFunctions
                if (effectFunctions[effectName]?.end) {

                    effectFunctions[effectName].end(this)
                }
                this.removeEffect(effect.index)
            }
            if (effect.duration % effect.effect.ticks === 0) {
                const effectName = effect.effect.name as keyof typeof effectFunctions
                if (effectFunctions[effectName]?.onTick) {

                    effectFunctions[effectName].onTick(this)
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

        if (this.data.health <= 0 || player.data.isDead) return

        if (!menu.checkSetting('No Aggro')) {
            const playerPosX = player.pos.x
            const distanceXToPlayer = Math.abs((playerPosX + (player.sprite.spriteWidth / 2) * player.sprite.scale) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale))
            const playerDirec = this.pos.x - player.pos.x
            const playerHiddenFromGoblins = false
            if (distanceXToPlayer <= this.data.attackRange && !this.data.onCooldown && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                if ((!playerHiddenFromGoblins || player.story.freedNate) && player.pos.y + this.data.attackRange >= this.pos.y) {
                    if (Math.random() > 0.6) {
                        this.data.attackFocus = player
                        this.attack()
                    }
                }else {
                    if(this.sprite.currentState !== 'idle') this.changeState('idle')
                }
            } else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && !this.data.onCooldown && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                if ((!playerHiddenFromGoblins || player.story.freedNate) && player.pos.y + this.data.attackRange >= this.pos.y ) {
                    if (Math.random() > 0.6) {
                        this.data.attackFocus = player
                        this.attack()
                    }
                }else {
                    if(this.sprite.currentState !== 'idle') this.changeState('idle')
                }
            } else if (distanceXToPlayer <= this.data.seeRange && !this.data.onCooldown && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player
                    let hasEntityInFront = false

                    if (!hasEntityInFront) {
                        if (this.sprite.currentState !== 'idle') this.changeState('idle')
                        if (playerPosX > this.pos.x) {
                            if (this.checkEffect('ice').wasFound) {
                                this.pos.x += 2
                            } else
                                this.pos.x += 4
                        } else {
                            if (this.checkEffect('ice').wasFound) {
                                this.pos.x -= 2
                            } else
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
                }
            } else {
                if (this.sprite.currentState === 'run') { this.changeState('idle') }

                this.data.attackFocus = null
            }
        }

        this.effectData.effectTicks++
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
            let tally = 0
            let deadParticles: number[] = []
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i)
                }
            })
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle - tally, 1)
                tally++
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
    get center() {
        return {
            x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width / 2,
            y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height / 2
        }
    }

    interact(): void {

    }
}

class ogre extends Entity implements entity {
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
    constructor(x: number, y: number, worldElem: worldElementNames, id: number) {
        if (y === StaticPositions.OnGround) y = 400

        super({ x, y }, worldElem, id)

        this.sprite = {
            img: configs!.properties.ogre.sprite.img,
            pathToImage: configs!.properties.ogre.sprite.img,
            spriteWidth: configs!.properties.ogre.sprite.spriteWidth,
            spriteHeight: configs!.properties.ogre.sprite.spriteHeight,
            scale: configs!.properties.ogre.sprite.scale,
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
            hitbox: configs!.properties.ogre.sprite.hitbox
        }

        this.data = {
            isAttacking: false,
            class: 'ogre',
            health: configs!.properties.ogre.data.health,
            maxHealth: configs!.properties.ogre.data.health,
            attackDamage: configs!.properties.ogre.data.attackDamage,
            attackRange: configs!.properties.ogre.data.attackRange,
            drops: configs!.properties.ogre.data.drops,
            name: 'ogre',
            onCooldown: false,
            isDead: false,
            isMoving: false,
            showedText: false,
            Xdirec: 1,
            seeRange: configs!.properties.ogre.data.seeRange,
            attackFocus: null
        }

        this.type = {
            isGround: true,
            name: 'ogre',
            allignment: 'enemy',
            moving: true,
            attackable: true,
            interactable: false
        }

        this.worldElem = worldElem
        this.init()
    }
    async update(): Promise<void> {
        if (this.data.isDead) return
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            effect.duration--

            if (effect.duration <= 0) {
                const effectName = effect.effect.name as keyof typeof effectFunctions
                if (effectFunctions[effectName]?.end) {

                    effectFunctions[effectName].end(this)
                }
                this.removeEffect(effect.index)
            }
            if (effect.duration % effect.effect.ticks === 0) {
                const effectName = effect.effect.name as keyof typeof effectFunctions
                if (effectFunctions[effectName]?.onTick) {

                    effectFunctions[effectName].onTick(this)
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

        if (this.data.health <= 0 || player.data.isDead) return

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

                    if (playerPosX > this.pos.x) {
                        if (this.checkEffect('ice')) {
                            this.pos.x += 3
                        } else
                            this.pos.x += 6
                        if (this.sprite.currentState !== 'run') this.changeState('run')
                    } else {
                        if (this.checkEffect('ice')) {
                            this.pos.x -= 3
                        } else
                            this.pos.x -= 6
                        if (this.sprite.currentState !== 'run') this.changeState('run')
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
        }

        this.effectData.effectTicks++
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
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX+ shakeX, this.pos.y + shakeY, 400 * this.sprite.scale, 400 * this.sprite.scale)
            ctx!.restore()
        } else {
            this.data.Xdirec = 1
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x + shakeX, this.pos.y + shakeY, 400 * this.sprite.scale, 400 * this.sprite.scale)
        }

    }

    takeHit(damage: number): void {
        if (this.data.health <= 0) return;
        this.changeState('idle')
        if (Math.random() * 100 < 80)
            this.setCooldown(1000)
        this.data.health -= damage
        this.showHealthbar()
    }

    endOfAnimation(frameAmount: number): void {
        if (this.sprite.currentState === 'death') {
            let tally = 0
            let deadParticles: number[] = []
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i)
                }
            })
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle - tally, 1)
                tally++
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
            }, 750)
        }
    }
    get center() {
        return {
            x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width / 2,
            y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height / 2
        }
    }

    interact(): void {

    }
}

class goblinKing extends Entity implements entity {
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
    type: typeObject
    immune: boolean
    portrait: string
    conversationCounter: number
    conversation: {first: string[], second: string[]}
    worldElem: worldElementNames
    speaking: boolean
    isJumping: boolean
    isSlamming: boolean
    isRaisingWall: boolean
    isJumpingOnWall: boolean
    loweringWall: boolean
    isSummoningGoblins: boolean
    slamTarget: number
    wall: block
    hasGivenPresent: boolean
    isSpeaking: boolean

    constructor(x: number, y: number, worldElem: worldElementNames, id: number) {
        if (y === StaticPositions.OnGround) y = 400

        super({ x, y }, worldElem, id)

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
                { name: 'speak', frames: 6 },
                { name: 'jump', frames: 6 },
                { name: 'land', frames: 7 },
            ],
            hitbox: { offsetX: 100, offsetY: 90, width: 200, height: 300 }
        }

        this.data = {
            isAttacking: false,
            class: 'goblinKing',
            health: 6,
            maxHealth: 6,
            attackDamage: 0,
            attackRange: 0,
            drops: [],
            name: 'ogre',
            onCooldown: false,
            isDead: false,
            isMoving: false,
            showedText: false,
            Xdirec: 1,
            seeRange: 400,
            attackFocus: null
        }

        this.type = {
            isGround: true,
            name: 'Goblin King',
            allignment: 'enemy',
            moving: true,
            attackable: true,
            interactable: false,
            bossbar: true
        }

        this.conversation = {
            first: [
                "I have been expecting you ELRIC! HAHAHA",
                "Surprised?",
                "I should have killed you the first time we met!",
                "But I'll clean you up now then!"
            ],
            second: [
                "Grahhh!!",
                "You are so stupid!",
                "Can't you realize how the humans are at fault here!",
                "Destroying our nature and destroying everything in your path!",
                "...",
                "This is not the last time we see each other!"
            ]
        }
        this.conversationCounter = 0
        this.portrait = 'img/portraits/goblinKing.png'
        this.worldElem = worldElem
        this.isJumping = false
        this.isSlamming = false
        this.isRaisingWall = false
        this.isJumpingOnWall = false
        this.loweringWall = false
        this.isSummoningGoblins = false
        this.isSpeaking = false
        this.slamTarget = 0
        this.speaking = false
        this.immune = false
        this.hasGivenPresent = false
        this.wall = new block(
            { x: 1800, y: groundY + 100 },
            { pathToImage: 'img/blocks/wall_2.png', hitbox: { offsetX: 40, offsetY: 0, width: 420, height: 889 }, spriteWidth: 31, spriteHeight: 63, scale: 13 },
            null,
            { isBlocking: true, removeItem: null },
            "wall_1",
            60003
        )

        this.init()
    }

    async update(): Promise<void> {
        if (this.data.isDead) return

        this.effectData.effects.forEach(effect => {
            effect.duration--

            if (effect.duration <= 0) {
                const effectName = effect.effect.name as keyof typeof effectFunctions
                if (effectFunctions[effectName]?.end) {
                    effectFunctions[effectName].end(this)
                }
                this.removeEffect(effect.index)
            }
            if (effect.duration % effect.effect.ticks === 0) {
                const effectName = effect.effect.name as keyof typeof effectFunctions
                if (effectFunctions[effectName]?.onTick) {
                    effectFunctions[effectName].onTick(this)
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
                    droppedItems.push(new droppedItem(
                        { x: this.pos.x + this.sprite.hitbox.offsetX + Math.round(Math.random() * 80) - 40, y: this.pos.y + this.sprite.hitbox.offsetY },
                        drop.drop,
                        currentWorld
                    ))
                }
            })
            this.changeState('death')
            this.data.onCooldown = true
            currentEvents.push({ event: 'kill', entity: this })
            isQuestUIupdated = false
            if (menu.checkSetting('Master Sound')) playSound('death.mp3', menu.values.effects / 100)
        }

        if (this.data.health <= 0 || player.data.isDead) return

        if (this.isSlamming) {
            if (player.pos.x > this.pos.x) {
                this.pos.x += 4
            } else {
                this.pos.x -= 4
            }
            this.pos.y += 8

            if (this.pos.y >= 300) {
                this.isSlamming = false
                this.changeState('land')
                screenShake(100)

                if (checkCollision({ hitbox: this.sprite.hitbox, pos: this.pos }, { hitbox: player.hitbox, pos: player.pos })) {
                    player.takeHit(20)
                }
            }
        }

        if (this.isRaisingWall) {
            screenShake(5)
            this.wall.pos.y -= 1.5
            if (this.wall.pos.y <= 300) {
                this.isRaisingWall = false
                this.pos.x = this.wall.pos.x + 20
                this.isJumpingOnWall = true
                this.changeState('jump')
            }
        }

        if (this.isJumpingOnWall) {
            this.pos.y += 5
            if (this.pos.y > this.wall.pos.y - 410) {
                this.isJumpingOnWall = false
                this.changeState('land')
                screenShake(100)
            }
        }

        if (this.loweringWall) {
            screenShake(5)
            this.wall.pos.y += 1.5
            if (this.wall.pos.y > groundY + 160) {
                this.loweringWall = false
            }
        }

        if (this.isSummoningGoblins) {
            const goblinIds = [60004, 60005, 60006, 60007, 60008, 60009]
            const allDead = !worlds[currentWorld].elements.some(el =>
                el instanceof goblin && goblinIds.includes(el.id)
            )
            if (allDead) {
                this.isSummoningGoblins = false
            }
        }
        

        this.effectData.effectTicks++
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

        let frameX = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].x
        let frameY = this.sprite.spriteAnimations[this.sprite.currentState].loc[this.sprite.frameLoc].y

        let orientation = (player.pos.x + player.sprite.spriteWidth / 2) - (this.pos.x + this.sprite.spriteWidth / 2)

        if (this.data.name === 'elder' || this.sprite.invertOrientation) {
            orientation = -orientation
        }

        const image = getImage(this.sprite.img)
        if (orientation <= 0 && !this.type.isNotTurning) {
            this.data.Xdirec = 2
            ctx!.save()
            const drawX = -(this.pos.x + 400 * this.sprite.scale)
            ctx!.scale(-1, 1)
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale)
            ctx!.restore()
        } else {
            this.data.Xdirec = 1
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale)
        }
    }

    takeHit(damage: number): void {
        if (this.data.health <= 0) return
        if (this.immune) return
        this.data.health -= 1
        this.showHealthbar()
        this.immune = true
        this.changeState('scared')
        this.waitForIdle()
        this.proceedNextPhase()
    }

    endOfAnimation(frameAmount: number): void {
        if (this.sprite.currentState === 'death') {
            let tally = 0
            playSound("rumble", menu.values.effects / 100, true)
            let deadParticles: number[] = []
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i)
                }
            })
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle - tally, 1);
                tally++
            })

            if (this.data.isDead) return
            this.data.isDead = true
            this.sprite.frameLoc = frameAmount - 1
            deadObjects.push(this)
            return
        }

        if (this.sprite.currentState === 'take_hit') {
            this.changeState('idle')
        } else if (this.sprite.currentState === 'attack') {
            if (this.type.attackType?.type !== 'rangedCombat') {
            } else {
                particles.push(new projectile(
                    this,
                    this.type.attackType.projectile.spriteWidth,
                    this.type.attackType.projectile.spriteHeight,
                    this.type.attackType.projectile.scale,
                    this.type.attackType.projectile.pathToImage,
                    this.type.attackType.projectile.animationStates,
                    this.type.attackType.projectile.range,
                    this.type.attackType.projectile.speed,
                    this.type.attackType.projectile.damage,
                    this.type.attackType.projectile.hitbox,
                    'arrow'
                ))
            }
            this.changeState('idle')
            this.data.isAttacking = false
        } else if (
            this.sprite.currentState === 'speak' ||
            this.sprite.currentState === 'scared' ||
            this.sprite.currentState === 'land' ||
            this.sprite.currentState === 'load' ||
            this.sprite.currentState === 'throw'
        ) {
            this.changeState('idle')
        }  else if (this.sprite.currentState === 'jump') {
            if (this.isJumping || this.isSlamming || this.isJumpingOnWall) {
                this.sprite.frameLoc = frameAmount - 1
            } else {
                this.changeState('idle')
            }
        }
    }

    waitForIdle(): Promise<void> {
        return new Promise(resolve => {
            const check = setInterval(() => {
                if (this.sprite.currentState === 'idle') {
                    clearInterval(check)
                    resolve()
                }
            }, 100)
        })
    }

    jump(): Promise<void> {
        return new Promise(resolve => {
            this.changeState('jump')
            this.isJumping = true

            const rise = () => {
                this.pos.y -= 10
                if (this.pos.y <= -600) {
                    this.isJumping = false
                    resolve()
                } else {
                    requestAnimationFrame(rise)
                }
            }
            requestAnimationFrame(rise)
        })
    }

    raiseWall(): Promise<void> {
        return new Promise(resolve => {
            playSound("rumble", menu.values.effects / 100, true)

            if (!worlds[currentWorld].elements.includes(this.wall)) {
                worlds[currentWorld].elements.push(this.wall)
            }

            this.wall.pos.y = groundY + 100
            this.isRaisingWall = true

            const check = setInterval(() => {
                if (!this.isRaisingWall && !this.isJumpingOnWall) {
                    clearInterval(check)
                    resolve()
                }
            }, 100)
        })
    }

    lowerWall(): Promise<void> {
        return new Promise(async resolve => {
            playSound("rumble", menu.values.effects / 100, true)
            this.loweringWall = true
            await this.jump()

            const check = setInterval(() => {
                if (!this.loweringWall) {
                    clearInterval(check)
                    resolve()
                }
            }, 100)
        })
    }

    slam(): Promise<void> {
        return new Promise(resolve => {
            this.isSlamming = true
            this.pos.x = player.center.x
            this.changeState('jump')

            const check = setInterval(() => {
                if (!this.isSlamming) {
                    clearInterval(check)
                    resolve()
                }
            }, 100)
        })
    }

    spawnGoblins(): Promise<void> {
        return new Promise(async resolve => {
            this.changeState('speak')
            await this.waitForIdle()

            this.isSummoningGoblins = true

            for (let i = 1; i < 6; i++) {
                worlds[currentWorld].elements.push(
                    new goblin(100 * i, StaticPositions.OnGround, "goblin", 60003 + i)
                )
            }

            const check = setInterval(() => {
                if (!this.isSummoningGoblins) {
                    clearInterval(check)
                    resolve()
                }
            }, 500)
        })
    }

    throw(): Promise<void> {
        return new Promise(async resolve => {
            this.changeState('load')
            await this.waitForIdle()

            this.changeState('throw')
            particles.push(new projectile(
                this, 30, 5, 1,
                "img/projectiles/arrow.png",
                [{ name: "idle", frames: 1 }],
                3000, 15, 8,
                { height: 40, width: 120, offsetX: 0, offsetY: 0 },
                'goblinKing'
            ))

            await this.waitForIdle()
            resolve()
        })
    }

    async wallPhase(): Promise<void> {
        await this.jump()
        await this.raiseWall()
        await this.spawnGoblins()
        await this.lowerWall()
        await this.slam()
        this.immune = false
    }

    async throwPhase(): Promise<void> {
        await this.jump()
        await this.raiseWall()

        await this.throw()
        await sleep(2000)
        await this.throw()
        await sleep(1000)
        await this.throw()
        await this.throw()
        await this.throw()
        await this.throw()
        await this.throw()

        await this.jump()
        await this.lowerWall()
        await this.slam()
        this.immune = false
    }

    async proceedNextPhase(): Promise<void> {
        this.changeState('scared')
        await this.waitForIdle()

        if (this.data.health === 5) {
            await this.wallPhase()
        } else if (this.data.health === 4) {
            await this.throwPhase()
        } else if (this.data.health === 3) {
            await this.wallPhase()
        } else if (this.data.health === 2) {
            await this.throwPhase()
        }else if (this.data.health === 1) {
            await this.endPhase()
        }
    }

    async endPhase(): Promise<void> {
        await this.jump()
        await this.raiseWall()

        await this.speakEnd()
    }

    async speakEnd(): Promise<void> {
        return new Promise(resolve => {

            this.isSpeaking = true
            this.speak()

            const interval = setInterval(async () => {
                if(!this.isSpeaking) {
                    clearInterval(interval)

                    await this.jump()
                    const drop = new droppedItem({x: this.pos.x, y: this.pos.y}, 'earth_gem', currentWorld)
                    const drop2 = new droppedItem({x: this.pos.x + 30, y: this.pos.y}, 'gold_ingot', currentWorld)
                    droppedItems.push(drop)
                    droppedItems.push(drop2)

                    const interval2 = setInterval(() => {
                        this.wall.pos.y += 5
                        screenShake(3)
                        playSound("rumble", menu.values.effects / 100, true)
                        if(this.wall.pos.y > groundY + 160) {
                            clearInterval(interval2)
                        }
                    }, 100)

                    this.data.health = 0

                    resolve()
                }
            }, 1000)
        })
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
                    const distanceXToPlayer = Math.abs(
                        (playerPosX + (player.sprite.spriteWidth / 2) * player.sprite.scale) -
                        (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale)
                    )
                    if (playerDirec <= 0 && distanceXToPlayer <= this.data.attackRange && player.pos.y + this.data.attackRange >= this.pos.y) {
                        player.takeHit(this.data.attackDamage)
                    } else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && player.pos.y + this.data.attackRange >= this.pos.y) {
                        player.takeHit(this.data.attackDamage)
                    }
                }
            }, 750)
        }
    }

    get center() {
        return {
            x: this.pos.x + this.sprite.hitbox.offsetX + this.sprite.hitbox.width / 2,
            y: this.pos.y + this.sprite.hitbox.offsetY + this.sprite.hitbox.height / 2
        }
    }

    interact(): void {}

    async endConversation() {
        const portrait = document.querySelector('#portrait') as HTMLElement
        portrait!.style.background = ``
        stats.entities.talked_to_NPC.value++

        const speakDiv = document.querySelector('#speakingDiv')
        speakDiv?.classList.add('display-none')
        player.data.immune = false
        this.speaking = false
        this.hasGivenPresent = true
        this.showHealthbar()

        await this.jump()
        await this.slam()
    }

    speak(): void {
        const speakDiv = document.querySelector('#speakingDiv')
        speakDiv?.classList.remove('display-none')
        const portrait = document.querySelector('#portrait') as HTMLElement
        if (this.portrait) {
            portrait!.style.background = `url(${this.portrait})`
        } else {
            portrait!.style.background = `url(img/portraits/defaultNPC.png)`
        }
        this.speaking = true
        player.data.canMove = false

        currentEvents.push({ event: 'talk', entity: this })
        isQuestUIupdated = false
        advanceConversation(this, true)
    }
}

class skeleton extends Entity implements entity {
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
    constructor(x: number, y: number, worldElem: worldElementNames, id: number) {
        if (y === StaticPositions.OnGround) y = 500

        super({ x, y }, worldElem, id)

        this.sprite = {
            img: configs!.properties.skeleton.sprite.img,
            pathToImage: configs!.properties.skeleton.sprite.img,
            spriteWidth: configs!.properties.skeleton.sprite.spriteWidth,
            spriteHeight: configs!.properties.skeleton.sprite.spriteHeight,
            scale: configs!.properties.skeleton.sprite.scale,
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
            hitbox: configs!.properties.skeleton.sprite.hitbox
        }

        this.data = {
            isAttacking: false,
            class: 'skeleton',
            health: configs!.properties.skeleton.data.health,
            maxHealth: configs!.properties.skeleton.data.health,
            attackDamage: configs!.properties.skeleton.data.attackDamage,
            attackRange: configs!.properties.skeleton.data.attackRange,
            drops: configs!.properties.skeleton.data.drops,
            name: 'skeleton',
            onCooldown: false,
            isDead: false,
            isMoving: false,
            showedText: false,
            Xdirec: 1,
            seeRange: configs!.properties.skeleton.data.seeRange,
            attackFocus: null
        }

        this.type = {
            isGround: true,
            name: 'skeleton',
            allignment: 'enemy',
            moving: true,
            attackable: true,
            interactable: false
        }

        this.worldElem = worldElem
        this.init()
    }
    async update(): Promise<void> {
        if (this.data.isDead) return
        // check for effect ticks
        this.effectData.effects.forEach(effect => {
            effect.duration--

            if (effect.duration <= 0) {
                const effectName = effect.effect.name as keyof typeof effectFunctions
                if (effectFunctions[effectName]?.end) {

                    effectFunctions[effectName].end(this)
                }
                this.removeEffect(effect.index)
            }
            if (this.effectData.effectTicks % effect.effect.ticks === 0) {
                const effectName = effect.effect.name as keyof typeof effectFunctions
                if (effectFunctions[effectName]?.onTick) {

                    effectFunctions[effectName].onTick(this)
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

        if (this.data.health <= 0 || player.data.isDead) return

        if (!menu.checkSetting('No Aggro')) {
            const playerPosX = player.pos.x
            const distanceXToPlayer = Math.abs((playerPosX + (player.sprite.spriteWidth / 2) * player.sprite.scale) - (this.pos.x + (this.sprite.spriteWidth / 2) * this.sprite.scale))
            const playerDirec = this.pos.x - player.pos.x
            const playerHiddenFromGoblins = player.data.armor[0] === 'goblin_mask' && this.data.name === 'goblin'

            if (distanceXToPlayer <= this.data.attackRange && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player
                    this.attack()
                }
            } else if (playerDirec > 0 && distanceXToPlayer <= this.data.attackRange * 2 && !this.data.onCooldown && player.pos.y + this.data.attackRange >= this.pos.y && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    if (Math.random() > 0.6) {
                        this.data.attackFocus = player
                        this.attack()
                    }
                }
            } else if (distanceXToPlayer <= this.data.seeRange && !this.data.onCooldown && this.type.allignment === 'enemy' && !this.checkEffect('stun').wasFound) {
                if (!playerHiddenFromGoblins || player.story.freedNate) {
                    this.data.attackFocus = player
                    let hasEntityInFront = false

                    if (!hasEntityInFront) {
                        if (this.sprite.currentState !== 'run') this.changeState('run')
                        if (playerPosX > this.pos.x) {
                            if (this.checkEffect('ice').wasFound) {
                                this.pos.x += 2
                            } else
                                this.pos.x += 4
                        } else {
                            if (this.checkEffect('ice')) {
                                this.pos.x -= 2
                            } else
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
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, drawX, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale)
            ctx!.restore()
        } else {
            this.data.Xdirec = 1
            ctx!.drawImage(image, frameX, frameY, this.sprite.spriteWidth, this.sprite.spriteHeight, this.pos.x, this.pos.y, 400 * this.sprite.scale, 400 * this.sprite.scale)
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
            let tally = 0
            let deadParticles: number[] = []
            particles.forEach((particle, i) => {
                if (particle.entity === this) {
                    deadParticles.push(i)
                }
            })
            deadParticles.forEach(deadParticle => {
                particles.splice(deadParticle - tally, 1)
                tally++
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

    }
}