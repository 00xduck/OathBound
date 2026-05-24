window.api.onArduinoData((msg: string) => {
    switch (msg) {
        case 'walkLeft':
            canvas!.dispatchEvent(new KeyboardEvent('keydown', { key: 's', code: 'KeyS', bubbles: true }));
            break;
        case 'walkRight':
            canvas!.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', code: 'KeyW', bubbles: true }));
            break;
        case 'stopWalk':
            canvas!.dispatchEvent(new KeyboardEvent('keyup', { key: 's', code: 'KeyS', bubbles: true }));
            canvas!.dispatchEvent(new KeyboardEvent('keyup', { key: 'w', code: 'KeyW', bubbles: true }));
            break;
        case 'jump':
            player.jump();
            break;
        case 'attack':
            player.attack()
            break;
        case 'interact':
            player.interact()
    }
})