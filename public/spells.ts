class healSpell implements spellType {
    name: string
    rendering: {
        icon: string
        spriteX: number
        spriteY: number
        width: number
        height: number
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
    constructor() {
        this.name = 'heal'
        this.rendering = {
            icon: 'img/items/itemsSheet.png',
            spriteX: 384,
            spriteY: 4672,
            width: 64,
            height: 64
        }
        this.cast = {
            start: {
                img: '',
                width: 512,
                height: 512,
                frameAmount: 36
            },
            idle: {
                img: 'img/spells/heal_idle.png',
                width: 64,
                height: 64,
                frameAmount: 10
            },
            castTime: 1000
        }
        this.startFrame = 0
        this.spellCooldown = 50
        this.manaCost = 35
        this.class = 'healSpell'
        this.tier = 'RARE'
    }

    async castSpell() {
        if (player.data.mana < this.manaCost) return
        player.data.canMove = false
        player.data.castingSpell = true
        player.data.mana -= this.manaCost
        player.updateMana()
        await this.cooldown()
        player.data.castingSpell = false

        let remover: number[] = []

        particles.forEach((particle, i) => {
            if ((particle.spriteWidth === this.cast.idle.width && particle.animationStates[0].frames === this.cast.idle.frameAmount) || (particle.spriteWidth === this.cast.start.width && particle.animationStates[0].frames === this.cast.start.frameAmount)) {
                remover.push(i)
            }
        })
        let counter = 0
        remover.forEach(i => {
            particles.splice(i - counter, 1)
            counter++
        })
        player.data.canMove = true
        player.data.spellCooldown = this.spellCooldown
        player.data.currentCooldown = this.spellCooldown
        player.addEffect('regeneration', 300, 1)
    }

    async checkEndOfCooldown(frameAmount: number): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                if (gameFrame - this.startFrame >= frameAmount * staggerFrames) {
                    resolve()
                } else {
                    requestAnimationFrame(check)
                }
            }
            requestAnimationFrame(check)
        })
    }

    async cooldown() {
        if (this.cast.start.img !== '') {
            const image = new Image()
            image.src = this.cast.start.img
            particles.push(new particle(player, this.cast.start.width, this.cast.start.height, image, this.cast.castTime, this.cast.start.frameAmount))

            this.startFrame = gameFrame

            await this.checkEndOfCooldown(this.cast.start.frameAmount)
        }

        const image = new Image()
        image.src = this.cast.idle.img
        particles.push(new particle(player, this.cast.idle.width, this.cast.idle.height, image, this.cast.castTime, this.cast.idle.frameAmount))

        await new Promise<void>(resolve => setTimeout(resolve, this.cast.castTime))
    }
}

class iceSpikeSpell implements spellType {
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
    constructor() {
        this.name = 'ice_spike'
        this.rendering = {
            icon: 'img/items/itemsSheet.png',
            spriteX: 512,
            spriteY: 4032,
            width: 64,
            height: 64
        }
        this.cast = {
            start: {
                img: '',
                width: 512,
                height: 512,
                frameAmount: 36
            },
            idle: {
                img: 'img/spells/iceSpike_idle.png',
                width: 96,
                height: 96,
                frameAmount: 10
            },
            castTime: 1000
        }
        this.startFrame = 0
        this.spellCooldown = 50
        this.manaCost = 20
        this.class = 'iceSpikeSpell'
        this.tier = 'RARE'
    }

    async castSpell() {
        if (player.data.mana < this.manaCost || player.data.onSpellCooldown) return
        player.data.onSpellCooldown = true
        player.data.canMove = false
        player.data.castingSpell = true
        player.data.mana -= this.manaCost
        player.updateMana()
        await this.cooldown()
        player.data.castingSpell = false

        let remover: number[] = []

        particles.forEach((particle, i) => {
            if ((particle.spriteWidth === this.cast.idle.width && particle.animationStates[0].frames === this.cast.idle.frameAmount) || (particle.spriteWidth === this.cast.start.width && particle.animationStates[0].frames === this.cast.start.frameAmount)) {
                remover.push(i)
            }
        })
        let counter = 0
        remover.forEach(i => {
            particles.splice(i - counter, 1)
            counter++
        })
        player.data.canMove = true
        player.data.spellCooldown = this.spellCooldown
        player.data.currentCooldown = this.spellCooldown
        player.data.onSpellCooldown = false

        particles.push(new projectile(player, 42, 23, 2, 'img/projectiles/ice_spike.png', [{ name: 'idle', frames: 5 }, { name: 'start', frames: 5 }, { name: 'impact', frames: 5 }], 700, 6, 15, { offsetX: 20, offsetY: 20, width: 30, height: 30 }, 'ice_spike', { effect: 'ice', time: 300 }))
    }

    async checkEndOfCooldown(frameAmount: number): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                if (gameFrame - this.startFrame >= frameAmount * staggerFrames) {
                    resolve()
                } else {
                    requestAnimationFrame(check)
                }
            }
            requestAnimationFrame(check)
        })
    }

    async cooldown() {
        if (this.cast.start.img !== '') {
            const image = new Image()
            image.src = this.cast.start.img
            particles.push(new particle(player, this.cast.start.width, this.cast.start.height, image, this.cast.castTime, this.cast.start.frameAmount))

            this.startFrame = gameFrame

            await this.checkEndOfCooldown(this.cast.start.frameAmount)
        }

        const image = new Image()
        image.src = this.cast.idle.img
        particles.push(new particle(player, this.cast.idle.width, this.cast.idle.height, image, this.cast.castTime, this.cast.idle.frameAmount))

        await new Promise<void>(resolve => setTimeout(resolve, this.cast.castTime))
    }
}

class teleportDartSpell implements spellType {
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
    constructor() {
        this.name = 'teleport_dart'
        this.rendering = {
            icon: 'img/items/itemsSheet.png',
            spriteX: 704,
            spriteY: 5632,
            width: 64,
            height: 64
        }
        this.cast = {
            start: {
                img: '',
                width: 512,
                height: 512,
                frameAmount: 36
            },
            idle: {
                img: 'img/spells/teleport_dart_idle.png',
                width: 96,
                height: 96,
                frameAmount: 10
            },
            castTime: 1000
        }
        this.startFrame = 0
        this.spellCooldown = 50
        this.manaCost = 40
        this.class = 'teleportDartSpell'
        this.tier = 'EPIC'
    }

    async castSpell() {
        if (player.data.mana < this.manaCost || player.data.onSpellCooldown) return
        player.data.onSpellCooldown = true
        player.data.canMove = false
        player.data.castingSpell = true
        player.data.mana -= this.manaCost
        player.updateMana()
        await this.cooldown()
        player.data.castingSpell = false

        let remover: number[] = []

        particles.forEach((particle, i) => {
            if ((particle.spriteWidth === this.cast.idle.width && particle.animationStates[0].frames === this.cast.idle.frameAmount) || (particle.spriteWidth === this.cast.start.width && particle.animationStates[0].frames === this.cast.start.frameAmount)) {
                remover.push(i)
            }
        })
        let counter = 0
        remover.forEach(i => {
            particles.splice(i - counter, 1)
            counter++
        })
        player.data.canMove = true
        player.data.spellCooldown = this.spellCooldown
        player.data.currentCooldown = this.spellCooldown
        player.data.onSpellCooldown = false

        particles.push(new projectile(player, 40, 32, 2, 'img/projectiles/teleport_dart.png', [{ name: 'idle', frames: 5 }, { name: 'impact', frames: 5 }], 600, 6, 5, { offsetX: 20, offsetY: 20, width: 30, height: 30 }, 'teleport_dart'))
    }

    async checkEndOfCooldown(frameAmount: number): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                if (gameFrame - this.startFrame >= frameAmount * staggerFrames) {
                    resolve()
                } else {
                    requestAnimationFrame(check)
                }
            }
            requestAnimationFrame(check)
        })
    }

    async cooldown() {
        if (this.cast.start.img !== '') {
            const image = new Image()
            image.src = this.cast.start.img
            particles.push(new particle(player, this.cast.start.width, this.cast.start.height, image, this.cast.castTime, this.cast.start.frameAmount))

            this.startFrame = gameFrame

            await this.checkEndOfCooldown(this.cast.start.frameAmount)
        }

        const image = new Image()
        image.src = this.cast.idle.img
        particles.push(new particle(player, this.cast.idle.width, this.cast.idle.height, image, this.cast.castTime, this.cast.idle.frameAmount))

        await new Promise<void>(resolve => setTimeout(resolve, this.cast.castTime))
    }
}

class lightningWaveSpell implements spellType {
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
    constructor() {
        this.name = 'lightning_wave'
        this.rendering = {
            icon: 'img/items/itemsSheet.png',
            spriteX: 512,
            spriteY: 4096,
            width: 64,
            height: 64
        }
        this.cast = {
            start: {
                img: '',
                width: 512,
                height: 512,
                frameAmount: 36
            },
            idle: {
                img: 'img/spells/lightning_wave_idle.png',
                width: 96,
                height: 96,
                frameAmount: 12
            },
            castTime: 2500
        }
        this.startFrame = 0
        this.spellCooldown = 50
        this.manaCost = 50
        this.class = 'lightningWaveSpell'
        this.tier = 'RARE'
    }

    async castSpell() {
        if (player.data.mana < this.manaCost || player.data.onSpellCooldown) return
        player.data.onSpellCooldown = true
        player.data.canMove = false
        player.data.castingSpell = true
        player.data.mana -= this.manaCost
        player.updateMana()
        await this.cooldown()
        player.data.castingSpell = false

        let remover: number[] = []

        particles.forEach((particle, i) => {
            if ((particle.spriteWidth === this.cast.idle.width && particle.animationStates[0].frames === this.cast.idle.frameAmount) || (particle.spriteWidth === this.cast.start.width && particle.animationStates[0].frames === this.cast.start.frameAmount)) {
                remover.push(i)
            }
        })
        let counter = 0
        remover.forEach(i => {
            particles.splice(i - counter, 1)
            counter++
        })
        player.data.canMove = true
        player.data.spellCooldown = this.spellCooldown
        player.data.currentCooldown = this.spellCooldown
        player.data.onSpellCooldown = false

        particles.push(new projectile(player, 95, 32, 2, 'img/projectiles/lightning_wave.png', [{ name: 'idle', frames: 4 }], 1000, 8, 10, { offsetX: 20, offsetY: 20, width: 90, height: 30 }, 'lightning_wave', { effect: 'stun', time: 500 }, { direc: 1 }))
        particles.push(new projectile(player, 95, 32, 2, 'img/projectiles/lightning_wave.png', [{ name: 'idle', frames: 4 }], 1000, 8, 10, { offsetX: 20, offsetY: 20, width: 90, height: 30 }, 'lightning_wave', { effect: 'stun', time: 500 }, { direc: 2 }))
    }

    async checkEndOfCooldown(frameAmount: number): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                if (gameFrame - this.startFrame >= frameAmount * staggerFrames) {
                    resolve()
                } else {
                    requestAnimationFrame(check)
                }
            }
            requestAnimationFrame(check)
        })
    }

    async cooldown() {
        if (this.cast.start.img !== '') {
            const image = new Image()
            image.src = this.cast.start.img
            particles.push(new particle(player, this.cast.start.width, this.cast.start.height, image, this.cast.castTime, this.cast.start.frameAmount))

            this.startFrame = gameFrame

            await this.checkEndOfCooldown(this.cast.start.frameAmount)
        }

        const image = new Image()
        image.src = this.cast.idle.img
        particles.push(new particle(player, this.cast.idle.width, this.cast.idle.height, image, this.cast.castTime, this.cast.idle.frameAmount))

        await new Promise<void>(resolve => setTimeout(resolve, this.cast.castTime))
    }
}

class wallOfSunSpell implements spellType {
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
    constructor() {
        this.name = 'wall_of_sun'
        this.rendering = {
            icon: 'img/items/itemsSheet.png',
            spriteX: 384,
            spriteY: 5376,
            width: 64,
            height: 64
        }
        this.cast = {
            start: {
                img: 'img/spells/wall_of_sun_start.png',
                width: 816,
                height: 816,
                frameAmount: 53
            },
            idle: {
                img: 'img/spells/wall_of_sun_idle.png',
                width: 816,
                height: 816,
                frameAmount: 48
            },
            castTime: 2000
        }
        this.startFrame = 0
        this.spellCooldown = 1000
        this.manaCost = 75
        this.tier = 'LEGENDARY'
        this.class = 'wallOfSunSpell'
    }

    async castSpell() {
        if (player.data.mana < this.manaCost || player.data.onSpellCooldown) return
        player.data.onSpellCooldown = true
        player.data.canMove = false
        player.data.castingSpell = true
        player.data.mana -= this.manaCost
        player.updateMana()
        await this.cooldown()
        player.data.castingSpell = false

        let remover: number[] = []

        particles.forEach((particle, i) => {
            if ((particle.spriteWidth === this.cast.idle.width && particle.animationStates[0].frames === this.cast.idle.frameAmount) || (particle.spriteWidth === this.cast.start.width && particle.animationStates[0].frames === this.cast.start.frameAmount)) {
                remover.push(i)
            }
        })
        let counter = 0
        remover.forEach(i => {
            particles.splice(i - counter, 1)
            counter++
        })
        player.data.canMove = true
        player.data.spellCooldown = this.spellCooldown
        player.data.currentCooldown = this.spellCooldown
        player.data.onSpellCooldown = false

        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 1 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 1, y: -90 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 1, y: -180 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 1, y: -270 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 1, y: -350 }))

        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 1, x: 100 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 1, y: -110, x: 100 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 1, y: -200, x: 100 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 1, y: -290, x: 100 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 1, y: -370, x: 100 }))

        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 2 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 2, y: -90 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 2, y: -180 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 2, y: -270 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 2, y: -350 }))

        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 2, x: -100 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 2, y: -110, x: -100 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 2, y: -200, x: -100 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 2, y: -290, x: -100 }))
        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/wall_of_sun.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 770, 2, 30, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'wall_of_sun', { effect: 'burning', time: 500 }, { direc: 2, y: -370, x: -100 }))

    }

    async checkEndOfCooldown(frameAmount: number): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                if (gameFrame - this.startFrame >= frameAmount * staggerFrames) {
                    resolve()
                } else {
                    requestAnimationFrame(check)
                }
            }
            requestAnimationFrame(check)
        })
    }

    async cooldown() {
        if (this.cast.start.img !== '') {
            const image = new Image()
            image.src = this.cast.start.img
            particles.push(new particle(player, this.cast.start.width, this.cast.start.height, image, this.cast.castTime, this.cast.start.frameAmount))

            this.startFrame = gameFrame

            await this.checkEndOfCooldown(this.cast.start.frameAmount)
        }

        const image = new Image()
        image.src = this.cast.idle.img
        particles.push(new particle(player, this.cast.idle.width, this.cast.idle.height, image, this.cast.castTime, this.cast.idle.frameAmount))

        await new Promise<void>(resolve => setTimeout(resolve, this.cast.castTime))
    }
}

class gaiasShieldSpell implements spellType {
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
    constructor() {
        this.name = 'gaias_shield'
        this.rendering = {
            icon: 'img/items/itemsSheet.png',
            spriteX: 896,
            spriteY: 5184,
            width: 64,
            height: 64
        }
        this.cast = {
            start: {
                img: '',
                width: 816,
                height: 816,
                frameAmount: 53
            },
            idle: {
                img: 'img/spells/gaias_shield.png',
                width: 100,
                height: 100,
                frameAmount: 10
            },
            castTime: 4000
        }
        this.startFrame = 0
        this.spellCooldown = 200
        this.manaCost = 40
        this.class = 'gaiasShieldSpell'
        this.tier = 'MYTHIC'
    }

    async castSpell() {
        if (player.data.mana < this.manaCost || player.data.onSpellCooldown) return
        player.data.immune = true
        player.data.onSpellCooldown = true
        player.data.canMove = false
        player.data.castingSpell = true
        player.data.mana -= this.manaCost
        player.updateMana()
        await this.cooldown()
        player.data.castingSpell = false

        let remover: number[] = []

        particles.forEach((particle, i) => {
            if ((particle.spriteWidth === this.cast.idle.width && particle.animationStates[0].frames === this.cast.idle.frameAmount) || (particle.spriteWidth === this.cast.start.width && particle.animationStates[0].frames === this.cast.start.frameAmount)) {
                remover.push(i)
            }
        })
        let counter = 0
        remover.forEach(i => {
            particles.splice(i - counter, 1)
            counter++
        })
        player.data.canMove = true
        player.data.spellCooldown = this.spellCooldown
        player.data.currentCooldown = this.spellCooldown
        player.data.onSpellCooldown = false

        player.data.immune = false
    }

    async checkEndOfCooldown(frameAmount: number): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                if (gameFrame - this.startFrame >= frameAmount * staggerFrames) {
                    resolve()
                } else {
                    requestAnimationFrame(check)
                }
            }
            requestAnimationFrame(check)
        })
    }

    async cooldown() {
        if (this.cast.start.img !== '') {
            const image = new Image()
            image.src = this.cast.start.img
            particles.push(new particle(player, this.cast.start.width, this.cast.start.height, image, this.cast.castTime, this.cast.start.frameAmount))

            this.startFrame = gameFrame

            await this.checkEndOfCooldown(this.cast.start.frameAmount)
        }

        const image = new Image()
        image.src = this.cast.idle.img
        particles.push(new particle(player, this.cast.idle.width, this.cast.idle.height, image, this.cast.castTime, this.cast.idle.frameAmount))

        await new Promise<void>(resolve => setTimeout(resolve, this.cast.castTime))
    }
}

class bloodVortexSpell implements spellType {
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
    constructor() {
        this.name = 'blood_vortex'
        this.rendering = {
            icon: 'img/items/itemsSheet.png',
            spriteX: 256,
            spriteY: 4864,
            width: 64,
            height: 64
        }
        this.cast = {
            start: {
                img: '',
                width: 816,
                height: 816,
                frameAmount: 53
            },
            idle: {
                img: 'img/spells/blood_vortex_idle.png',
                width: 96,
                height: 96,
                frameAmount: 10
            },
            castTime: 1000
        }
        this.startFrame = 0
        this.spellCooldown = 200
        this.manaCost = 60
        this.tier = 'EPIC'
        this.class = 'bloodVortexSpell'
    }

    async castSpell() {
        if (player.data.mana < this.manaCost || player.data.onSpellCooldown) return
        player.data.onSpellCooldown = true
        player.data.canMove = false
        player.data.castingSpell = true
        player.data.mana -= this.manaCost
        player.updateMana()
        await this.cooldown()
        player.data.castingSpell = false

        let remover: number[] = []

        particles.forEach((particle, i) => {
            if ((particle.spriteWidth === this.cast.idle.width && particle.animationStates[0].frames === this.cast.idle.frameAmount) || (particle.spriteWidth === this.cast.start.width && particle.animationStates[0].frames === this.cast.start.frameAmount)) {
                remover.push(i)
            }
        })
        let counter = 0
        remover.forEach(i => {
            particles.splice(i - counter, 1)
            counter++
        })
        player.data.canMove = true
        player.data.spellCooldown = this.spellCooldown
        player.data.currentCooldown = this.spellCooldown
        player.data.onSpellCooldown = false

        particles.push(new projectile(player, 100, 100, 2, 'img/projectiles/blood_vortex.png', [{ name: 'idle', frames: 8 }, { name: 'start', frames: 8 }, { name: 'impact', frames: 8 }], 450, 4, 20, { offsetX: 20, offsetY: 20, width: 100, height: 100 }, 'blood_vortex', { effect: undefined, time: undefined }, { y: -70 }))

    }

    async checkEndOfCooldown(frameAmount: number): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                if (gameFrame - this.startFrame >= frameAmount * staggerFrames) {
                    resolve()
                } else {
                    requestAnimationFrame(check)
                }
            }
            requestAnimationFrame(check)
        })
    }

    async cooldown() {
        if (this.cast.start.img !== '') {
            const image = new Image()
            image.src = this.cast.start.img
            particles.push(new particle(player, this.cast.start.width, this.cast.start.height, image, this.cast.castTime, this.cast.start.frameAmount))

            this.startFrame = gameFrame

            await this.checkEndOfCooldown(this.cast.start.frameAmount)
        }

        const image = new Image()
        image.src = this.cast.idle.img
        particles.push(new particle(player, this.cast.idle.width, this.cast.idle.height, image, this.cast.castTime, this.cast.idle.frameAmount))

        await new Promise<void>(resolve => setTimeout(resolve, this.cast.castTime))
    }
}

class supernovaSpell implements spellType {
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
    constructor() {
        this.name = 'supernova'
        this.rendering = {
            icon: 'img/items/itemsSheet.png',
            spriteX: 960,
            spriteY: 4416,
            width: 64,
            height: 64
        }
        this.cast = {
            start: {
                img: 'img/spells/supernova_start.png',
                width: 512,
                height: 512,
                frameAmount: 78
            },
            idle: {
                img: 'img/spells/supernova_idle.png',
                width: 512,
                height: 512,
                frameAmount: 64
            },
            castTime: 3000
        }
        this.startFrame = 0
        this.spellCooldown = 200
        this.manaCost = 90
        this.class = 'supernovaSpell'
        this.tier = 'ULTIMATE'
    }

    async castSpell() {
        if (player.data.mana < this.manaCost || player.data.onSpellCooldown) return
        player.data.onSpellCooldown = true
        player.data.canMove = false
        player.data.castingSpell = true
        player.data.mana -= this.manaCost
        player.updateMana()
        await this.cooldown()
        player.data.castingSpell = false

        let remover: number[] = []

        particles.forEach((particle, i) => {
            if ((particle.spriteWidth === this.cast.idle.width && particle.animationStates[0].frames === this.cast.idle.frameAmount) || (particle.spriteWidth === this.cast.start.width && particle.animationStates[0].frames === this.cast.start.frameAmount)) {
                remover.push(i)
            }
        })
        let counter = 0
        remover.forEach(i => {
            particles.splice(i - counter, 1)
            counter++
        })
        remover = []
        player.data.canMove = true
        player.data.spellCooldown = this.spellCooldown
        player.data.currentCooldown = this.spellCooldown
        player.data.onSpellCooldown = false

        let image = new Image()
        image.src = 'img/spells/supernova.png'
        particles.push(new particle(player, 100, 100, image, 0, 8));
        let tally = 0
        const inter = setInterval(() => {
            tally++
            worlds[currentWorld].elements.forEach(el => {
                if (el instanceof Entity && el.type.allignment === 'enemy') {
                    const distanceToPlayer = Math.abs(player.center.x - el.center.x)
                    console.log(distanceToPlayer);
                    if (distanceToPlayer < 400) {
                        el.takeHit(3)
                        if (player.center.x - el.center.x < 0) {
                            el.pos.x += 30
                        } else {
                            el.pos.x -= 30
                        }
                    }
                }
            });

            if (tally > 20) {
                clearInterval(inter)
                particles.forEach((particle, i) => {
                    if ((particle.spriteWidth === 100 && particle.animationStates[0].frames === 8) || (particle.spriteWidth === 100 && particle.animationStates[0].frames === 8)) {
                        remover.push(i)
                    }
                })

                remover.forEach(i => {
                    particles.splice(i - counter, 1)
                    counter++
                })
            }
        }, 500)
    }

    async checkEndOfCooldown(frameAmount: number): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                if (gameFrame - this.startFrame >= frameAmount * staggerFrames) {
                    resolve()
                } else {

                    requestAnimationFrame(check)
                }
            }

            requestAnimationFrame(check)
        })
    }

    async cooldown() {
        if (this.cast.start.img !== '') {
            const image = new Image()
            image.src = this.cast.start.img
            particles.push(new particle(player, this.cast.start.width, this.cast.start.height, image, this.cast.castTime, this.cast.start.frameAmount))

            this.startFrame = gameFrame

            await this.checkEndOfCooldown(this.cast.start.frameAmount)
        }

        const image = new Image()
        image.src = this.cast.idle.img
        particles.push(new particle(player, this.cast.idle.width, this.cast.idle.height, image, this.cast.castTime, this.cast.idle.frameAmount))

        await new Promise<void>(resolve => {
            setTimeout(resolve, this.cast.castTime)
        })
    }
}

class scorchSpell implements spellType {
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
    constructor() {
        this.name = 'scorch'
        this.rendering = {
            icon: 'img/items/itemsSheet.png',
            spriteX: 640,
            spriteY: 5312,
            width: 64,
            height: 64
        }
        this.cast = {
            start: {
                img: '',
                width: 512,
                height: 512,
                frameAmount: 36
            },
            idle: {
                img: 'img/spells/scorch.png',
                width: 64,
                height: 64,
                frameAmount: 8
            },
            castTime: 700
        }
        this.startFrame = 0
        this.spellCooldown = 50
        this.manaCost = 20
        this.class = 'scorchSpell'
        this.tier = 'RARE'
    }

    async castSpell() {
        if (player.data.mana < this.manaCost || player.data.onSpellCooldown) return
        player.data.onSpellCooldown = true
        player.data.canMove = false
        player.data.castingSpell = true
        player.data.mana -= this.manaCost
        player.updateMana()
        await this.cooldown()
        player.data.castingSpell = false

        let remover: number[] = []

        particles.forEach((particle, i) => {
            if ((particle.spriteWidth === this.cast.idle.width && particle.animationStates[0].frames === this.cast.idle.frameAmount) || (particle.spriteWidth === this.cast.start.width && particle.animationStates[0].frames === this.cast.start.frameAmount)) {
                remover.push(i)
            }
        })
        let counter = 0
        remover.forEach(i => {
            particles.splice(i - counter, 1)
            counter++
        })
        player.data.canMove = true
        player.data.spellCooldown = this.spellCooldown
        player.data.currentCooldown = this.spellCooldown
        player.data.onSpellCooldown = false

        particles.push(new projectile(player, 49, 49, 2, 'img/projectiles/scorch.png', [{ name: 'idle', frames: 4 }, { name: 'impact', frames: 6 }], 700, 6, 15, { offsetX: 20, offsetY: 20, width: 30, height: 30 }, 'ice_spike', { effect: 'burning', time: 400 }))
    }

    async checkEndOfCooldown(frameAmount: number): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                if (gameFrame - this.startFrame >= frameAmount * staggerFrames) {
                    resolve()
                } else {
                    requestAnimationFrame(check)
                }
            }
            requestAnimationFrame(check)
        })
    }

    async cooldown() {
        if (this.cast.start.img !== '') {
            const image = new Image()
            image.src = this.cast.start.img
            particles.push(new particle(player, this.cast.start.width, this.cast.start.height, image, this.cast.castTime, this.cast.start.frameAmount))

            this.startFrame = gameFrame

            await this.checkEndOfCooldown(this.cast.start.frameAmount)
        }

        const image = new Image()
        image.src = this.cast.idle.img
        particles.push(new particle(player, this.cast.idle.width, this.cast.idle.height, image, this.cast.castTime, this.cast.idle.frameAmount))

        await new Promise<void>(resolve => setTimeout(resolve, this.cast.castTime))
    }
}

class chainBoltSpell implements spellType {
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
    constructor() {
        this.name = 'chain_bolt'
        this.rendering = {
            icon: 'img/items/itemsSheet.png',
            spriteX: 320,
            spriteY: 4608,
            width: 64,
            height: 64
        }
        this.cast = {
            start: {
                img: '',
                width: 512,
                height: 512,
                frameAmount: 36
            },
            idle: {
                img: 'img/spells/chain_bolt.png',
                width: 96,
                height: 96,
                frameAmount: 8
            },
            castTime: 700
        }
        this.startFrame = 0
        this.spellCooldown = 50
        this.manaCost = 20
        this.class = 'chainBoltSpell'
        this.tier = 'MYTHIC'
    }

    async castSpell() {
        if (player.data.mana < this.manaCost || player.data.onSpellCooldown) return
        player.data.onSpellCooldown = true
        player.data.canMove = false
        player.data.castingSpell = true
        player.data.mana -= this.manaCost
        player.updateMana()
        await this.cooldown()
        player.data.castingSpell = false

        let remover: number[] = []

        particles.forEach((particle, i) => {
            if ((particle.spriteWidth === this.cast.idle.width && particle.animationStates[0].frames === this.cast.idle.frameAmount) || (particle.spriteWidth === this.cast.start.width && particle.animationStates[0].frames === this.cast.start.frameAmount)) {
                remover.push(i)
            }
        })
        let counter = 0
        remover.forEach(i => {
            particles.splice(i - counter, 1)
            counter++
        })
        player.data.canMove = true
        player.data.spellCooldown = this.spellCooldown
        player.data.currentCooldown = this.spellCooldown
        player.data.onSpellCooldown = false

        particles.push(new projectile(player, 32, 32, 2, 'img/projectiles/chain_bolt.png', [{ name: 'idle', frames: 4 }, { name: 'impact', frames: 6 }], 500, 6, 15, { offsetX: 20, offsetY: 20, width: 30, height: 30 }, 'chain_bolt', { effect: 'stun', time: 200 }))
    }

    async checkEndOfCooldown(frameAmount: number): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                if (gameFrame - this.startFrame >= frameAmount * staggerFrames) {
                    resolve()
                } else {
                    requestAnimationFrame(check)
                }
            }
            requestAnimationFrame(check)
        })
    }

    async cooldown() {
        if (this.cast.start.img !== '') {
            const image = new Image()
            image.src = this.cast.start.img
            particles.push(new particle(player, this.cast.start.width, this.cast.start.height, image, this.cast.castTime, this.cast.start.frameAmount))

            this.startFrame = gameFrame

            await this.checkEndOfCooldown(this.cast.start.frameAmount)
        }

        const image = new Image()
        image.src = this.cast.idle.img
        particles.push(new particle(player, this.cast.idle.width, this.cast.idle.height, image, this.cast.castTime, this.cast.idle.frameAmount))

        await new Promise<void>(resolve => setTimeout(resolve, this.cast.castTime))
    }
}

class blizzardSpell implements spellType {
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
    constructor() {
        this.name = 'blizzard'
        this.rendering = {
            icon: 'img/items/itemsSheet.png',
            spriteX: 384,
            spriteY: 4032,
            width: 64,
            height: 64
        }
        this.cast = {
            start: {
                img: '',
                width: 512,
                height: 512,
                frameAmount: 36
            },
            idle: {
                img: 'img/spells/blizzard_idle.png',
                width: 64,
                height: 64,
                frameAmount: 14
            },
            castTime: 700
        }
        this.startFrame = 0
        this.spellCooldown = 400
        this.manaCost = 40
        this.class = 'blizzardSpell'
        this.tier = 'EPIC'
    }

    async castSpell() {
        if (player.data.mana < this.manaCost || player.data.onSpellCooldown) return
        player.data.onSpellCooldown = true
        player.data.canMove = false
        player.data.castingSpell = true
        player.data.mana -= this.manaCost
        player.updateMana()
        await this.cooldown()
        player.data.castingSpell = false

        let remover: number[] = []

        particles.forEach((particle, i) => {
            if ((particle.spriteWidth === this.cast.idle.width && particle.animationStates[0].frames === this.cast.idle.frameAmount) || (particle.spriteWidth === this.cast.start.width && particle.animationStates[0].frames === this.cast.start.frameAmount)) {
                remover.push(i)
            }
        })
        let counter = 0
        remover.forEach(i => {
            particles.splice(i - counter, 1)
            counter++
        })
        player.data.canMove = true
        player.data.spellCooldown = this.spellCooldown
        player.data.currentCooldown = this.spellCooldown
        player.data.onSpellCooldown = false

        worlds[currentWorld].elements.forEach(el => {
            if (el instanceof Entity && el.type.allignment === 'enemy') {
                const distanceToPlayer = Math.abs(player.center.x - el.center.x)
                if (distanceToPlayer < 1500)
                    el.addEffect('ice', 500, 1)
            }
        })
    }

    async checkEndOfCooldown(frameAmount: number): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                if (gameFrame - this.startFrame >= frameAmount * staggerFrames) {
                    resolve()
                } else {
                    requestAnimationFrame(check)
                }
            }
            requestAnimationFrame(check)
        })
    }

    async cooldown() {
        if (this.cast.start.img !== '') {
            const image = new Image()
            image.src = this.cast.start.img
            particles.push(new particle(player, this.cast.start.width, this.cast.start.height, image, this.cast.castTime, this.cast.start.frameAmount))

            this.startFrame = gameFrame

            await this.checkEndOfCooldown(this.cast.start.frameAmount)
        }

        const image = new Image()
        image.src = this.cast.idle.img
        particles.push(new particle(player, this.cast.idle.width, this.cast.idle.height, image, this.cast.castTime, this.cast.idle.frameAmount))

        await new Promise<void>(resolve => setTimeout(resolve, this.cast.castTime))
    }
}

class avalancheSpell implements spellType {
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
    constructor() {
        this.name = 'avalanche'
        this.rendering = {
            icon: 'img/items/itemsSheet.png',
            spriteX: 320,
            spriteY: 4992,
            width: 64,
            height: 64
        }
        this.cast = {
            start: {
                img: '',
                width: 512,
                height: 512,
                frameAmount: 36
            },
            idle: {
                img: 'img/spells/avalanche.png',
                width: 64,
                height: 64,
                frameAmount: 10
            },
            castTime: 700
        }
        this.startFrame = 0
        this.spellCooldown = 200
        this.manaCost = 40
        this.class = 'avalancheSpell'
        this.tier = 'EPIC'
    }

    async castSpell() {
        if (player.data.mana < this.manaCost || player.data.onSpellCooldown) return
        player.data.onSpellCooldown = true
        player.data.canMove = false
        player.data.castingSpell = true
        player.data.mana -= this.manaCost
        player.updateMana()
        await this.cooldown()
        player.data.castingSpell = false

        let remover: number[] = []

        particles.forEach((particle, i) => {
            if ((particle.spriteWidth === this.cast.idle.width && particle.animationStates[0].frames === this.cast.idle.frameAmount) || (particle.spriteWidth === this.cast.start.width && particle.animationStates[0].frames === this.cast.start.frameAmount)) {
                remover.push(i)
            }
        })
        let counter = 0
        remover.forEach(i => {
            particles.splice(i - counter, 1)
            counter++
        })
        player.data.canMove = true
        player.data.spellCooldown = this.spellCooldown
        player.data.currentCooldown = this.spellCooldown
        player.data.onSpellCooldown = false

        particles.push(new projectile(player, 48, 48, 4, 'img/projectiles/avalanche.png', [{ name: 'start', frames: 6 }, { name: 'impact', frames: 6 }, { name: 'idle', frames: 1 }], 600, 3, 10, { offsetX: 20, offsetY: 20, width: 30, height: 30 }, 'avalanche'))
    }

    async checkEndOfCooldown(frameAmount: number): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                if (gameFrame - this.startFrame >= frameAmount * staggerFrames) {
                    resolve()
                } else {
                    requestAnimationFrame(check)
                }
            }
            requestAnimationFrame(check)
        })
    }

    async cooldown() {
        if (this.cast.start.img !== '') {
            const image = new Image()
            image.src = this.cast.start.img
            particles.push(new particle(player, this.cast.start.width, this.cast.start.height, image, this.cast.castTime, this.cast.start.frameAmount))

            this.startFrame = gameFrame

            await this.checkEndOfCooldown(this.cast.start.frameAmount)
        }

        const image = new Image()
        image.src = this.cast.idle.img
        particles.push(new particle(player, this.cast.idle.width, this.cast.idle.height, image, this.cast.castTime, this.cast.idle.frameAmount))

        await new Promise<void>(resolve => setTimeout(resolve, this.cast.castTime))
    }
}

const spells = {
    fire: [wallOfSunSpell, scorchSpell],
    ice: [iceSpikeSpell, blizzardSpell],
    void: [teleportDartSpell, supernovaSpell],
    lightning: [lightningWaveSpell, chainBoltSpell],
    earth: [gaiasShieldSpell, avalancheSpell],
    blood: [healSpell, bloodVortexSpell]
}

const spellRegistry: Record<string, new (...args: any[]) => any> = {
    healSpell: healSpell,
    iceSpikeSpell: iceSpikeSpell,
    teleportDartSpell: teleportDartSpell,
    lightningWaveSpell: lightningWaveSpell,
    wallOfSunSpell: wallOfSunSpell,
    gaiasShieldSpell: gaiasShieldSpell,
    bloodVortexSpell: bloodVortexSpell,
    supernovaSpell: supernovaSpell,
    scorchSpell: scorchSpell,
    chainBoltSpell: chainBoltSpell,
    blizzardSpell: blizzardSpell,
    avalancheSpell: avalancheSpell
}