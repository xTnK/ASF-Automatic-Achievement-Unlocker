const fs = require('fs');
const path = require('path');
const logger = require('./util/logger');
const ASFBot = require('./class/ASFBot');
const config = require('./config/ASFConfig.json');

const bots = new Map(); // Create a new Map to hold our ASFBot instances
const accountConfigFolder = path.join(__dirname, 'config', 'account');

if (!fs.existsSync(accountConfigFolder)) {
    logger.warn('Account config folder not found, creating...');
    fs.mkdirSync(accountConfigFolder);
    logger.success('Created account config folder');
}

async function createBot(name, ip, port, password) {
    const bot = new ASFBot(name, ip, port, password);
    bots.set(name, bot); // Store the ASFBot instance in our Map
    await bot.initialize();
    await bot.startGamingLoop(730);
}

async function startBots() {
    for (const vps of config.vps) {
        for (const bot of vps.bots) {
            createBot(bot, vps.ip, vps.port, config.ipc_password);
        }
    }
}

// Create a cleanup function to stop all active bots
async function cleanup(reason) {
    logger.warn(`${reason} received. Stopping all active gaming sessions.`);
    let botsToStop = [];
    for (let bot of bots.values()) {
        if (bot.isPlaying) {
            botsToStop.push(bot.stopGame());
        }
    }
    await Promise.all(botsToStop);
}

// Catch unhandled exceptions and promise rejections, then cleanup
process.on('uncaughtException', async (err) => {
    logger.error(`Unhandled Exception: ${err}`);
    await cleanup('uncaughtException');
    process.exit(1);
});
process.on('unhandledRejection', async (err) => {
    logger.error(`Unhandled Rejection: ${err}`);
    await cleanup('unhandledRejection');
    process.exit(1);
});

// Listen for shutdown signals and cleanup
process.on('SIGINT', async () => {
    await cleanup('SIGINT');
    process.exit();
});
process.on('SIGTERM', async () => {
    await cleanup('SIGTERM');
    process.exit();
});

startBots();