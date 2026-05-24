const DiscordRPC = require('discord-rpc');

const CLIENT_ID = '1488324606208245790';

const client = new DiscordRPC.Client({ transport: 'ipc' });
let rpcReady = false;
let startTime = new Date();

client.on('ready', () => {
    console.log('[Discord RPC] Verbunden!');
    rpcReady = true;
    setStatus('idle');
});

/**
 * Setzt den Discord Rich Presence Status
 * @param {'idle'|'stats'|'playing'} mode 
 * @param {{ username?: string, amount?: number, message?: string }} extra 
 */
function setStatus(mode, extra = {}) {
    if (!rpcReady) return;

    const base = {
        largeImageKey: 'oathbound_logo',      // Name des Bildes aus dem Dev Portal (Rich Presence → Art Assets)
        largeImageText: 'OathBound',
        startTimestamp: startTime,       // Zeigt "seit X Minuten" im Profil
    };

    const modi = {
        idle: {
            details: '🚀 In main menu!',
            state: 'Selecting Save file...',
        },
        stats: {
            details: '🚀 In main menu!',
            state: `Looking at stats...`,
        },
        playing: {
            details: '⚔️ Playing OathBound',
            state: `In world: ${extra.message}...`,
        }
    };

    client.setActivity({ ...base, ...modi[mode] });
}

/**
 * Verbindet mit dem lokalen Discord Client
 * Schlägt still fehl wenn Discord nicht offen ist
 */
function connect() {
    DiscordRPC.register(CLIENT_ID);
    client.login({ clientId: CLIENT_ID }).catch(err => {
        console.warn('[Discord RPC] Discord nicht offen oder RPC deaktiviert:', err.message);
    });
}

/**
 * Trennt die Verbindung sauber – beim App-Close aufrufen!
 */
function disconnect() {
    if (rpcReady) {
        client.destroy();
        console.log('[Discord RPC] Verbindung getrennt.');
    }
}

module.exports = { connect, disconnect, setStatus };