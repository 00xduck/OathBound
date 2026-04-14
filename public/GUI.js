"use strict";
function openStaffGUI(staffTier) {
    const div = document.querySelector('.magicDiv');
    div === null || div === void 0 ? void 0 : div.classList.remove('display-none');
    const innerDiv = document.querySelector('.innerMagicDiv');
    innerDiv.innerHTML = '';
    openInventory();
    renderStaffGUI(staffTier);
}
function renderStaffGUI(staffTier) {
    var _a;
    const playerDiv = document.querySelector('.player-data');
    const innerDiv = document.querySelector('.innerMagicDiv');
    innerDiv.innerHTML = '';
    const div = document.querySelector('.magicDiv');
    // add slots
    for (let x = 0; x < 9; x++) {
        innerDiv.innerHTML += `<div class="magicSlot" id="magicSlot${x}0"></div>`;
    }
    let tier = 0;
    if (staffTier === 'iron_staff')
        tier = 2;
    if (staffTier === 'gold_staff')
        tier = 4;
    if (staffTier === 'advanced_staff')
        tier = 6;
    if (staffTier === 'master_staff')
        tier = 9;
    for (let x = 9; x > tier; x--) {
        (_a = document.querySelector(`#magicSlot${x}0`)) === null || _a === void 0 ? void 0 : _a.classList.add('unusable');
    }
    // add items
    for (let i = 0; i < 9; i++) {
        if (player.data.magicInventory[i] !== null) {
            player.data.magicInventory.forEach((scroll, i) => {
                if (scroll !== null && player.data.spells[i] === null) {
                    let spell;
                    if (scroll === 'ice_scroll') {
                        spell = spells.ice[Math.floor(Math.random() * spells.ice.length)];
                    }
                    else if (scroll === 'fire_scroll') {
                        spell = spells.fire[Math.floor(Math.random() * spells.fire.length)];
                    }
                    else if (scroll === 'earth_scroll') {
                        spell = spells.earth[Math.floor(Math.random() * spells.earth.length)];
                    }
                    else if (scroll === 'void_scroll') {
                        spell = spells.void[Math.floor(Math.random() * spells.void.length)];
                    }
                    else if (scroll === 'lightning_scroll') {
                        spell = spells.lightning[Math.floor(Math.random() * spells.lightning.length)];
                    }
                    else if (scroll === 'blood_scroll') {
                        spell = spells.blood[Math.floor(Math.random() * spells.blood.length)];
                    }
                    if (spell)
                        player.data.spells[i] = new spell();
                }
            });
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item');
            itemDiv.addEventListener('mouseover', (e) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                e.stopPropagation();
                if (player.data.magicInventory[i] !== null) {
                    let color = ((_a = player.data.spells[i]) === null || _a === void 0 ? void 0 : _a.tier) === 'RARE' ? 'green' : (((_b = player.data.spells[i]) === null || _b === void 0 ? void 0 : _b.tier) === 'EPIC' ? 'purple' : (((_c = player.data.spells[i]) === null || _c === void 0 ? void 0 : _c.tier) === 'MYTHIC' ? 'red' : ((_d = player.data.spells[i]) === null || _d === void 0 ? void 0 : _d.tier) === 'LEGENDARY' ? 'yellow' : 'rgb(41, 94, 192)'));
                    playerDiv.innerHTML = `<h2>${(_e = player.data.spells[i]) === null || _e === void 0 ? void 0 : _e.name.toUpperCase()}</h2><br><h3>Mana: ${(_f = player.data.spells[i]) === null || _f === void 0 ? void 0 : _f.manaCost}</h3><br><h3>Cast Time: ${(_g = player.data.spells[i]) === null || _g === void 0 ? void 0 : _g.cast.castTime}</h3><br><h3>Cooldown: ${(_h = player.data.spells[i]) === null || _h === void 0 ? void 0 : _h.spellCooldown}</h3><br><h2 class="shadow padding-16" style="justify-self: center;;color: ${color};">${(_j = player.data.spells[i]) === null || _j === void 0 ? void 0 : _j.tier}</h2>`;
                }
            });
            itemDiv.addEventListener('click', () => {
                document.querySelectorAll('.selectedSpell').forEach(el => {
                    el.classList.remove('selectedSpell');
                });
                itemDiv.classList.add('selectedSpell');
                player.data.selectedSpell = player.data.spells[i];
                document.querySelector(`.selectedSpellDiv`).innerHTML = '';
                const spellDiv = document.createElement('div');
                if (!player.data.selectedSpell)
                    return;
                const spell = player.data.spells[i];
                spellDiv.style.backgroundImage = `url(${spell.rendering.icon})`;
                spellDiv.style.backgroundPosition = `-${spell.rendering.spriteX}px -${spell.rendering.spriteY}px`;
                spellDiv.style.width = `${spell.rendering.scale ? spell.rendering.width * spell.rendering.scale : spell.rendering.width}px`;
                spellDiv.style.height = `${spell.rendering.scale ? spell.rendering.height * spell.rendering.scale : spell.rendering.height}px`;
                spellDiv.style.backgroundSize = 'auto';
                document.querySelector(`.selectedSpellDiv`).appendChild(spellDiv);
            });
            const spell = player.data.spells[i];
            itemDiv.style.backgroundImage = `url(${spell.rendering.icon})`;
            itemDiv.style.backgroundPosition = `-${spell.rendering.spriteX}px -${spell.rendering.spriteY}px`;
            itemDiv.style.width = `${spell.rendering.width}px`;
            itemDiv.style.height = `${spell.rendering.height}px`;
            itemDiv.style.backgroundSize = 'auto';
            document.querySelector(`#magicSlot${i}0`).appendChild(itemDiv);
        }
    }
    document.querySelectorAll('.magicSlot').forEach(slot => {
        slot.addEventListener('click', e => {
            var _a;
            e.preventDefault();
            (_a = document.querySelector('body')) === null || _a === void 0 ? void 0 : _a.classList.remove('grab');
            if (menu.checkSetting('Master Sound'))
                playSound('click', menu.sounds.effects / 100, true);
            if (!player.data.dragging)
                return;
            const targetElement = e.target.closest('.magicSlot');
            if (targetElement.classList.contains('unusable'))
                return;
            const dragSlot = parseSlotId(player.data.dragging);
            const targetSlot = parseSlotId(targetElement.id);
            if (player.data.dragging.slice(0, 13) === 'secondarySlot') {
                if (player.data.interactionFocus instanceof chest) {
                    const temp = player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x];
                    if (items[player.data.magicInventory[targetSlot.x]].type !== 'magic') {
                        displayInfo('Item doesn\'t fit this slot!');
                        return;
                    }
                    player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x] = null;
                    player.data.magicInventory[targetSlot.x] = temp;
                }
            }
            else if (player.data.dragging.slice(0, 9) === 'armorSlot') {
                const temp = player.data.armor[dragSlot.x];
                if (items[player.data.armor[dragSlot.x]].type !== 'magic') {
                    displayInfo('Item doesn\'t fit this slot!');
                    return;
                }
                player.data.armor[dragSlot.x] = null;
                player.data.magicInventory[targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 4) === 'slot') {
                const temp = player.data.inventory[dragSlot.y][dragSlot.x];
                if (items[player.data.inventory[dragSlot.y][dragSlot.x]].type !== 'magic') {
                    displayInfo('Item doesn\'t fit this slot!');
                    return;
                }
                player.data.inventory[dragSlot.y][dragSlot.x] = null;
                player.data.magicInventory[targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 12) === 'craftingSlot') {
                const temp = player.data.craftingInventory[dragSlot.y][dragSlot.x];
                if (items[player.data.craftingInventory[dragSlot.y][dragSlot.x]].type !== 'magic') {
                    displayInfo('Item doesn\'t fit this slot!');
                    return;
                }
                player.data.craftingInventory[dragSlot.y][dragSlot.x] = null;
                player.data.magicInventory[targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 9) === 'magicSlot') {
                const temp = player.data.magicInventory[dragSlot.x];
                if (items[player.data.magicInventory[dragSlot.x]].type !== 'magic') {
                    displayInfo('Item doesn\'t fit this slot!');
                    return;
                }
                player.data.magicInventory[dragSlot.x] = null;
                player.data.magicInventory[dragSlot.x] = temp;
            }
            if (menu.checkSetting('Master Sound'))
                playSound('equipSpell', menu.sounds.effects / 100, true);
            player.data.dragging = null;
            renderInventory();
            openStaffGUI(staffTier);
            if (player.data.onSecondaryInventory && player.data.interactionFocus instanceof chest)
                renderSecondaryContainer(player.data.interactionFocus);
        });
    });
}
function closeStaffGUI() {
    const div = document.querySelector('.magicDiv');
    div === null || div === void 0 ? void 0 : div.classList.add('display-none');
    const innerDiv = document.querySelector('.innerMagicDiv');
    innerDiv.innerHTML = '';
}
function openInventory() {
    player.data.onInventory = true;
    const inventoryDiv = document.querySelector('.inventory-div');
    const playerDiv = document.querySelector('.player-data');
    const craftingDiv = document.querySelector('.crafting-div');
    inventoryDiv === null || inventoryDiv === void 0 ? void 0 : inventoryDiv.classList.remove('display-none');
    playSound('UIopen', menu.sounds.effects / 100, true);
    craftingDiv === null || craftingDiv === void 0 ? void 0 : craftingDiv.classList.remove('display-none');
    renderInventory();
}
function parseSlotId(id) {
    const match = id.match(/(slot|secondarySlot|armorSlot|craftingSlot|slot-|magicSlot)(\d+)(\d+)/);
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
            // item animation
            const animation = items[player.data.inventory[3][x]].animation;
            if (animation) {
                const keyframeName = `sprite-inv-${items[player.data.inventory[3][x]].src.slice(0, 6)}`;
                const animationWidth = items[player.data.inventory[3][x]].width * animation.frames;
                let styleEl = document.getElementById(keyframeName);
                if (!styleEl) {
                    styleEl = document.createElement('style');
                    styleEl.id = keyframeName;
                    document.head.appendChild(styleEl);
                }
                styleEl.textContent += `
                        @keyframes ${keyframeName} {
                            from { background-position: 0px 0px; }
                            to   { background-position: -${animationWidth}px 0px; }
                        }`;
                itemDivHotbar.style.animation = `${keyframeName} ${animation.length}s steps(${animation.frames}) infinite`;
            }
            hotbarSlot.appendChild(itemDivHotbar);
        }
    }
}
function advanceConversation(NPC) {
    var _a, _b;
    const speakBtn = document.querySelector('#speakBtn');
    const speak = document.querySelector('#speak');
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
    if (NPC.conversationCounter >= currentConversation.length || menu.checkSetting('Insta Skip')) {
        const speakDiv = document.querySelector('#speakWrapper');
        speakDiv === null || speakDiv === void 0 ? void 0 : speakDiv.classList.add('display-none');
        NPC.conversationCounter = 0;
        player.data.canMove = true;
        NPC.isSpeaking = false;
        if (NPC.endConversation)
            NPC.endConversation();
        return;
    }
    const charArray = currentConversation[NPC.conversationCounter].split('');
    let counter = 0;
    let interval = setInterval(() => {
        if (menu.checkSetting('Master Sound') && counter % 2 === 0)
            playSound('speak', menu.sounds.effects / 150, true);
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
    // add each armor itemplaySound('click', menu.sounds.effects / 100, true)
    for (let i = 0; i < 3; i++) {
        if (player.data.armor[i] !== null) {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item');
            itemDiv.addEventListener('click', (e) => {
                var _a, _b;
                e.stopPropagation();
                if (!(player.data.dragging === null)) {
                    console.log('here');
                    (_a = itemDiv.parentElement) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new Event('click'));
                    return;
                }
                player.data.dragging = e.target.parentElement.id;
                (_b = document.querySelector('body')) === null || _b === void 0 ? void 0 : _b.classList.add('grab');
                if (player.data.armor[i] !== null) {
                    if (items[player.data.armor[i]].type === 'armor')
                        playerDiv.innerHTML = `<h2>${player.data.armor[i].replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[player.data.armor[i]].protection}%</h3>${items[player.data.armor[i]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.armor[i]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.armor[i]].description} </h2>`;
                }
            });
            itemDiv.addEventListener('mouseover', (e) => {
                e.stopPropagation();
                if (player.data.armor[i] !== null && items[player.data.armor[i]].type === 'armor') {
                    playerDiv.innerHTML = `<h2>${player.data.armor[i].replace(/_/g, ' ').toUpperCase()}</h2> <br><h3>Protection: ${items[player.data.armor[i]].protection}%</h3>${items[player.data.armor[i]].onUse !== '' ? '<br><h2>On use: ' + items[player.data.armor[i]].onUse + '</h2>' : ''}<br><h2 style="font-weight: 200; font-family: cursive;">${items[player.data.armor[i]].description} </h2>`;
                }
            });
            itemDiv.style.backgroundImage = `url(img/items/${items[player.data.armor[i]].src})`;
            itemDiv.style.width = `${items[player.data.armor[i]].width}px`;
            itemDiv.style.height = `${items[player.data.armor[i]].height}px`;
            itemDiv.style.scale = `${items[player.data.armor[i]].scale}`;
            itemDiv.style.backgroundPosition = `-${items[player.data.armor[i]].spriteX}px -${items[player.data.armor[i]].spriteY}px`;
            // item animation
            const animation = items[player.data.armor[i]].animation;
            if (animation) {
                const keyframeName = `sprite-inv-${items[player.data.armor[i]].src.slice(0, 6)}`;
                const animationWidth = items[player.data.armor[i]].width * animation.frames;
                let styleEl = document.getElementById(keyframeName);
                if (!styleEl) {
                    styleEl = document.createElement('style');
                    styleEl.id = keyframeName;
                    document.head.appendChild(styleEl);
                }
                styleEl.textContent += `
                        @keyframes ${keyframeName} {
                            from { background-position: 0px 0px; }
                            to   { background-position: -${animationWidth}px 0px; }
                        }`;
                itemDiv.style.animation = `${keyframeName} ${animation.length}s steps(${animation.frames}) infinite`;
            }
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
                    var _a, _b;
                    e.stopPropagation();
                    if (!(player.data.dragging === null)) {
                        (_a = itemDiv.parentElement) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new Event('click'));
                        return;
                    }
                    player.data.dragging = e.target.parentElement.id;
                    (_b = document.querySelector('body')) === null || _b === void 0 ? void 0 : _b.classList.add('grab');
                    if (menu.checkSetting('Master Sound'))
                        playSound('click', menu.sounds.effects / 100, true);
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
                itemDiv.addEventListener('mouseover', (e) => {
                    e.stopPropagation();
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
                itemDiv.style.backgroundImage = `url(img/items/${items[player.data.inventory[y][x]].src})`;
                itemDiv.style.width = `${items[player.data.inventory[y][x]].width}px`;
                itemDiv.style.height = `${items[player.data.inventory[y][x]].height}px`;
                itemDiv.style.scale = `${items[player.data.inventory[y][x]].scale}`;
                itemDiv.style.backgroundPosition = `-${items[player.data.inventory[y][x]].spriteX}px -${items[player.data.inventory[y][x]].spriteY}px`;
                // item animation
                const animation = items[player.data.inventory[y][x]].animation;
                if (animation) {
                    const keyframeName = `sprite-inv-${items[player.data.inventory[y][x]].src.slice(0, 6)}`;
                    const animationWidth = items[player.data.inventory[y][x]].width * animation.frames;
                    let styleEl = document.getElementById(keyframeName);
                    if (!styleEl) {
                        styleEl = document.createElement('style');
                        styleEl.id = keyframeName;
                        document.head.appendChild(styleEl);
                    }
                    styleEl.textContent += `
                        @keyframes ${keyframeName} {
                            from { background-position: 0px 0px; }
                            to   { background-position: -${animationWidth}px 0px; }
                        }`;
                    itemDiv.style.animation = `${keyframeName} ${animation.length}s steps(${animation.frames}) infinite`;
                }
                document.querySelector(`#slot${x}${y}`).appendChild(itemDiv);
                if (y === 3) {
                    updateHotbar();
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
    const innerDiv = document.createElement('div');
    innerDiv.classList.add('grid');
    const arrowDiv = document.createElement('div');
    arrowDiv.addEventListener('click', () => {
        const recipe = checkForRecipes();
        if (recipe.isValid && recipe.output) {
            player.addItem(recipe.output, 1);
            grantAchievement('craft');
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
            grantAchievement('craft');
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
                    var _a, _b;
                    e.stopPropagation();
                    if (!(player.data.dragging === null)) {
                        console.log('here');
                        (_a = itemDiv.parentElement) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new Event('click'));
                        return;
                    }
                    player.data.dragging = e.target.parentElement.id;
                    (_b = document.querySelector('body')) === null || _b === void 0 ? void 0 : _b.classList.add('grab');
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
                itemDiv.addEventListener('mouseover', (e) => {
                    var _a;
                    e.stopPropagation();
                    if (player.data.craftingInventory[y][x] !== null) {
                        if (!player.data.dragging === null) {
                            (_a = itemDiv.parentElement) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new Event('click'));
                            return;
                        }
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
                // item animation
                const animation = items[player.data.craftingInventory[y][x]].animation;
                if (animation) {
                    const keyframeName = `sprite-inv-${items[player.data.craftingInventory[y][x]].src.slice(0, 6)}`;
                    const animationWidth = items[player.data.craftingInventory[y][x]].width * animation.frames;
                    let styleEl = document.getElementById(keyframeName);
                    if (!styleEl) {
                        styleEl = document.createElement('style');
                        styleEl.id = keyframeName;
                        document.head.appendChild(styleEl);
                    }
                    styleEl.textContent += `
                        @keyframes ${keyframeName} {
                            from { background-position: 0px 0px; }
                            to   { background-position: -${animationWidth}px 0px; }
                        }`;
                    itemDiv.style.animation = `${keyframeName} ${animation.length}s steps(${animation.frames}) infinite`;
                }
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
            if (menu.checkSetting('Master Sound'))
                playSound('click', menu.sounds.effects / 100, true);
            if (!player.data.dragging)
                return;
            const targetElement = e.target.closest('.inv-slot');
            const dragSlot = parseSlotId(player.data.dragging);
            const targetSlot = parseSlotId(targetElement.id);
            if (player.data.dragging.slice(0, 13) === 'secondarySlot') {
                if (player.data.interactionFocus instanceof chest) {
                    const temp = player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x];
                    player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x] = player.data.inventory[targetSlot.y][targetSlot.x];
                    player.data.inventory[targetSlot.y][targetSlot.x] = temp;
                }
            }
            else if (player.data.dragging.slice(0, 12) === 'craftingSlot') {
                const temp = player.data.craftingInventory[dragSlot.y][dragSlot.x];
                player.data.craftingInventory[dragSlot.y][dragSlot.x] = player.data.inventory[targetSlot.y][targetSlot.x];
                player.data.inventory[targetSlot.y][targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 9) === 'armorSlot') {
                const temp = player.data.armor[dragSlot.x];
                player.data.armor[dragSlot.x] = null;
                player.data.inventory[targetSlot.y][targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 4) === 'slot') {
                const temp = player.data.inventory[dragSlot.y][dragSlot.x];
                player.data.inventory[dragSlot.y][dragSlot.x] = player.data.inventory[targetSlot.y][targetSlot.x];
                player.data.inventory[targetSlot.y][targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 9) === 'magicSlot') {
                const temp = player.data.magicInventory[dragSlot.x];
                player.data.magicInventory[dragSlot.x] = null;
                player.data.inventory[targetSlot.y][targetSlot.x] = temp;
                renderStaffGUI('');
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
            if (menu.checkSetting('Master Sound'))
                playSound('click', menu.sounds.effects / 100, true);
            if (!player.data.dragging)
                return;
            const targetElement = e.target.closest('.inv-slot');
            const dragSlot = parseSlotId(player.data.dragging);
            const targetSlot = parseSlotId(targetElement.id);
            if (player.data.dragging.slice(0, 13) === 'secondarySlot') {
                if (player.data.interactionFocus instanceof chest) {
                    const temp = player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x];
                    if (items[temp].type !== 'armor' || ((targetSlot.x === 0 && items[temp].slot !== 'helmet') || (targetSlot.x === 1 && items[temp].slot !== 'chestplate') || (targetSlot.x === 2 && items[temp].slot !== 'boots'))) {
                        displayInfo('Item doesn\'t fit this slot!');
                        return;
                    }
                    player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x] = null;
                    player.data.armor[targetSlot.x] = temp;
                    grantAchievement('new_look');
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
                grantAchievement('new_look');
            }
            else if (player.data.dragging.slice(0, 4) === 'slot') {
                const temp = player.data.inventory[dragSlot.y][dragSlot.x];
                if (items[temp].type !== 'armor' || ((targetSlot.x === 0 && items[temp].slot !== 'helmet') || (targetSlot.x === 1 && items[temp].slot !== 'chestplate') || (targetSlot.x === 2 && items[temp].slot !== 'boots'))) {
                    displayInfo('Item doesn\'t fit this slot!');
                    return;
                }
                player.data.inventory[dragSlot.y][dragSlot.x] = null;
                player.data.armor[targetSlot.x] = temp;
                grantAchievement('new_look');
            }
            else if (player.data.dragging.slice(0, 12) === 'craftingSlot') {
                const temp = player.data.craftingInventory[dragSlot.y][dragSlot.x];
                if (items[temp].type !== 'armor' || ((targetSlot.x === 0 && items[temp].slot !== 'helmet') || (targetSlot.x === 1 && items[temp].slot !== 'chestplate') || (targetSlot.x === 2 && items[temp].slot !== 'boots'))) {
                    displayInfo('Item doesn\'t fit this slot!');
                    return;
                }
                grantAchievement('new_look');
                player.data.craftingInventory[dragSlot.y][dragSlot.x] = null;
                player.data.armor[targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 9) === 'magicSlot') {
                const temp = player.data.magicInventory[dragSlot.x];
                player.data.magicInventory[dragSlot.x] = null;
                player.data.armor[targetSlot.x] = temp;
                renderStaffGUI('');
            }
            if (menu.checkSetting('Master Sound'))
                playSound('equip', menu.sounds.effects / 100, true);
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
            if (menu.checkSetting('Master Sound'))
                playSound('click', menu.sounds.effects / 100, true);
            if (!player.data.dragging)
                return;
            const targetElement = e.target.closest('.inv-slot');
            const dragSlot = parseSlotId(player.data.dragging);
            const targetSlot = parseSlotId(targetElement.id);
            if (player.data.dragging.slice(0, 13) === 'secondarySlot') {
                if (player.data.interactionFocus instanceof chest) {
                    const temp = player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x];
                    player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x] = player.data.craftingInventory[targetSlot.y][targetSlot.x];
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
                player.data.inventory[dragSlot.y][dragSlot.x] = player.data.craftingInventory[targetSlot.y][targetSlot.x];
                player.data.craftingInventory[targetSlot.y][targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 12) === 'craftingSlot') {
                const temp = player.data.craftingInventory[dragSlot.y][dragSlot.x];
                player.data.craftingInventory[dragSlot.y][dragSlot.x] = player.data.craftingInventory[targetSlot.y][targetSlot.x];
                player.data.craftingInventory[targetSlot.y][targetSlot.x] = temp;
            }
            else if (player.data.dragging.slice(0, 9) === 'magicSlot') {
                const temp = player.data.magicInventory[dragSlot.x];
                player.data.magicInventory[dragSlot.x] = null;
                player.data.craftingInventory[targetSlot.y][targetSlot.x] = temp;
                renderStaffGUI('');
            }
            player.data.dragging = null;
            renderInventory();
            if (player.data.onSecondaryInventory && player.data.interactionFocus instanceof chest)
                renderSecondaryContainer(player.data.interactionFocus);
        });
    });
}
function switchHotbarSlot(e, slot) {
    var _a, _b;
    if (player.data.dragging === null) {
        if (!player.data.inventory[3][slot])
            return;
        let id = Array.from(e.target.parentElement.classList);
        if (id[0] === 'slot-div') {
            id = Array.from(e.target.classList);
        }
        const slotClass = id.find(c => c.startsWith('slot-'));
        if (!slotClass)
            return;
        player.data.dragging = slotClass;
        (_a = document.querySelector('body')) === null || _a === void 0 ? void 0 : _a.classList.add('grab');
        console.log(player.data.dragging);
    }
    else {
        console.log(player.data.dragging);
        const moveSlot = parseSlotId(player.data.dragging);
        const temp = player.data.inventory[moveSlot.y][moveSlot.x];
        player.data.inventory[moveSlot.y][moveSlot.x] = player.data.inventory[3][slot];
        player.data.inventory[3][slot] = temp;
        (_b = document.querySelector('body')) === null || _b === void 0 ? void 0 : _b.classList.remove('grab');
        player.data.dragging = null;
    }
    renderInventory();
    updateHotbar();
}
function closeInventory() {
    const inventoryDiv = document.querySelector('.inventory-div');
    const craftingDiv = document.querySelector('.crafting-div');
    craftingDiv === null || craftingDiv === void 0 ? void 0 : craftingDiv.classList.add('display-none');
    inventoryDiv === null || inventoryDiv === void 0 ? void 0 : inventoryDiv.classList.add('display-none');
    document.querySelector('.slots-div').innerHTML = '';
    document.querySelector('.player-data').innerHTML = '';
    playSound('UIclose', menu.sounds.effects / 100, true);
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
                    var _a, _b;
                    e.stopPropagation();
                    if (!(player.data.dragging === null)) {
                        console.log('here');
                        (_a = itemDiv.parentElement) === null || _a === void 0 ? void 0 : _a.dispatchEvent(new Event('click'));
                        return;
                    }
                    player.data.dragging = e.target.parentElement.id;
                    (_b = document.querySelector('body')) === null || _b === void 0 ? void 0 : _b.classList.add('grab');
                    if (menu.checkSetting('Master Sound'))
                        playSound('click', menu.sounds.effects / 100, true);
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
                itemDiv.addEventListener('mouseover', (e) => {
                    e.stopPropagation();
                    if (container.inventory[y][x] !== null) {
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
                // item animation
                const animation = items[container.inventory[y][x]].animation;
                if (animation) {
                    const keyframeName = `sprite-inv-${items[container.inventory[y][x]].src.slice(0, 6)}`;
                    const animationWidth = items[container.inventory[y][x]].width * animation.frames;
                    let styleEl = document.getElementById(keyframeName);
                    if (!styleEl) {
                        styleEl = document.createElement('style');
                        styleEl.id = keyframeName;
                        document.head.appendChild(styleEl);
                    }
                    styleEl.textContent += `
                        @keyframes ${keyframeName} {
                            from { background-position: 0px 0px; }
                            to   { background-position: -${animationWidth}px 0px; }
                        }`;
                    itemDiv.style.animation = `${keyframeName} ${animation.length}s steps(${animation.frames}) infinite`;
                }
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
            if (menu.checkSetting('Master Sound'))
                playSound('click', menu.sounds.effects / 100, true);
            (_a = document.querySelector('body')) === null || _a === void 0 ? void 0 : _a.classList.remove('grab');
            const targetElement = e.target.closest('.inv-slot');
            const dragSlot = parseSlotId(player.data.dragging); // { x, y }
            const targetSlot = parseSlotId(targetElement.id); // { x, y }
            if (player.data.interactionFocus instanceof chest) {
                if (player.data.dragging.slice(0, 4) === 'slot') {
                    const temp = player.data.inventory[dragSlot.y][dragSlot.x];
                    player.data.inventory[dragSlot.y][dragSlot.x] = player.data.interactionFocus.inventory[targetSlot.y][targetSlot.x];
                    player.data.interactionFocus.inventory[targetSlot.y][targetSlot.x] = temp;
                }
                else if (player.data.dragging.slice(0, 9) === 'armorSlot') {
                    const temp = player.data.armor[dragSlot.x];
                    player.data.armor[dragSlot.x] = null;
                    player.data.interactionFocus.inventory[targetSlot.y][targetSlot.x] = temp;
                }
                else if (player.data.dragging.slice(0, 13) === 'secondarySlot') {
                    const temp = player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x];
                    player.data.interactionFocus.inventory[dragSlot.y][dragSlot.x] = player.data.interactionFocus.inventory[targetSlot.y][targetSlot.x];
                    player.data.interactionFocus.inventory[targetSlot.y][targetSlot.x] = temp;
                }
                else if (player.data.dragging.slice(0, 12) === 'craftingSlot') {
                    const temp = player.data.craftingInventory[dragSlot.y][dragSlot.x];
                    player.data.craftingInventory[dragSlot.y][dragSlot.x] = player.data.interactionFocus.inventory[targetSlot.y][targetSlot.x];
                    player.data.interactionFocus.inventory[targetSlot.y][targetSlot.x] = temp;
                }
                else if (player.data.dragging.slice(0, 9) === 'magicSlot') {
                    const temp = player.data.magicInventory[dragSlot.x];
                    player.data.magicInventory[dragSlot.x] = null;
                    player.data.interactionFocus.inventory[targetSlot.y][targetSlot.x] = temp;
                    renderStaffGUI('');
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
    playSound('UIopen', menu.sounds.effects / 100, true);
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
    playSound('UIclose', menu.sounds.effects / 100, true);
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
                        grantAchievement('deal');
                        break outerLoop;
                    }
                }
            }
        }
    }
    updateHotbar();
}
