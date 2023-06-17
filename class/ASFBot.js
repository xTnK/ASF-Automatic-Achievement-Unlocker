const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('../util/logger');
const rateLimiter = require('./rateLimiter');
const config = require('../config/achievementConfig.json');
const achievements_stats = require('../data/achievements_stats.json');

// Constants
const CSGO_APPID = 730;

class ASFBot {
    // Constructor
    constructor(name, ip, port, password) {
        this.botName = name;
        this.ASFServerIP = ip;
        this.ASFServerPort = port;
        this.ASFServerIPCPassword = password;
        this.isPlaying = false;

        this.achievementData = null;
        this.lastExecutionTime = null;

        this.configPath = path.join(__dirname, '../config/account', `${this.botName}.json`);

        logger.success(`[${name}] ASFBot instance created`);
    }

    // Initialize the bot, this function should be called before starting the gaming loop
    async initialize() {
        await this.updateAchievementsStatus(); // Update achievements status on initialize
        this.loadConfig();
    }

    // Load the config from a file or create a new one with default values if it doesn't exist
    loadConfig() {
        // Check if the config file exists
        if (fs.existsSync(this.configPath)) {
            // If it does, load the config
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            this.globalRandomAchievementFactor = config.globalRandomAchievementFactor; // Determines how fast the bot will unlock achievements compared to the standard model.
            this.remainingPlaytime = config.remainingPlaytime; // The remaining playtime before the bot unlocks the next achievement. This is used to resume the bot after a restart.
            this.activeHoursDuration = config.activeHoursDuration; // How many hours the bot is active each day. Some bot play for longer periods than others.
            this.activeHoursOffset = config.activeHoursOffset; // Determines when the bot starts being active each day. Some bot play in the morning, others in the afternoon.
            this.daysOffProbability = config.daysOffProbability; // The probability of the bot taking a day off. Some bot take more days off than others.
            this.daysOff = config.daysOff; // An array of days (expressed as numbers from 0 to 6) when the bot takes a day off. In case you want a day to always be off.
            logger.success(`[${this.botName}] Loaded config`);
        } else {
            // If it doesn't, create a new config with default values and save it
            this.globalRandomAchievementFactor = this.randomFloatBetween(0.75, 1.25); // The bot can unlock achievements between 25% faster or 25% slower than the standard model.
            this.remainingPlaytime = this.getTimeToNextAchievement(); // The remaining playtime before the bot unlocks the next achievement. This is used to resume the bot after a restart.
            this.activeHoursDuration = this.randomFloatBetween(2, 8); // Random number between 2 and 8 to simulate different playtimes
            this.activeHoursOffset = this.randomFloatBetween(0, 24); // Random number between 0 and 24 to simulate different timezones
            this.daysOffProbability = this.randomFloatBetween(0, 1) / 2; // Random number between 0 (never) and 0.5 (50% chance) to simulate different probability of taking a day off
            this.daysOff = [];
            const numberOfDaysOff = this.randomIntBetween(0, 3); // Random number between 0 and 3 to simulate different amount of days off
            const availableDays = [0, 1, 2, 3, 4, 5, 6];

            for (let i = 0; i < numberOfDaysOff; i++) {
                const randomDayIndex = this.randomIntBetween(0, availableDays.length - 1); // Random number between 0 and the number of available days
                this.daysOff.push(availableDays[randomDayIndex]);
                availableDays.splice(randomDayIndex, 1); // remove the selected day from the available days
            }
            logger.error(`[${this.botName}] No config file found, created a new one`);
            this.saveConfig();
            logger.success(`[${this.botName}] Config file saved`);
        }
        logger.info(`[${this.botName}] Config: [globalRandomAchievementFactor: ${this.globalRandomAchievementFactor.toFixed(2)} | remainingPlaytime: ${this.remainingPlaytime.toFixed(2)} | activeHoursDuration: ${this.activeHoursDuration.toFixed(2)} | activeHoursOffset: ${this.activeHoursOffset.toFixed(2)} | daysOffProbability: ${this.daysOffProbability.toFixed(2)} | daysOff: ${this.daysOff}]`);
    }

    // Save the config to a file
    saveConfig() {
        const config = {
            globalRandomAchievementFactor: this.globalRandomAchievementFactor,
            remainingPlaytime: this.remainingPlaytime,
            activeHoursDuration: this.activeHoursDuration,
            activeHoursOffset: this.activeHoursOffset,
            daysOffProbability: this.daysOffProbability,
            daysOff: this.daysOff
        };
        fs.writeFileSync(this.configPath, JSON.stringify(config));
    }

    // Execute a command on ASF
    async executeASFCommand(command) {
        logger.info(`[${this.botName}] Executing command '${command}'`);

        // This is global and it'll delay all the bots if they have the same IP
        await rateLimiter.limit(this.ASFServerIP);

        try {
            const response = await axios({
                method: 'post',
                url: `http://${this.ASFServerIP}:${this.ASFServerPort}/Api/Command`,
                headers: {
                    Authentication: this.ASFServerIPCPassword
                },
                data: {
                    Command: command
                }
            });
            return response.data.Result;
        } catch (error) {
            logger.error(`[${this.botName}] Error executing command: ${error}`);
        }
    }

    // Retrieve the achievements status from ASF
    async updateAchievementsStatus() {
        try {
            const data = await this.executeASFCommand(`alist ${this.botName} ${CSGO_APPID}`);

            const lines = data.split('\n');
            const locked = [];
            const unlocked = [];

            lines.forEach((line) => {
                const splitLine = line.split(' ');
                const id = splitLine[0];

                if (line.includes('\u274C')) {
                    locked.push(id);
                } else if (line.includes('\u2705')) {
                    unlocked.push(id);
                }
            });

            this.achievementData = { unlocked, locked };

            logger.success(`[${this.botName}] Achievements data updated: ${this.achievementData.unlocked.length}/${achievements_stats.length}`);
        } catch (error) {
            logger.error(`[${this.botName}] Error while getting achievement data: ${error}`);
        }
    }

    // Start the game session
    async startGame(appId) {
        const response = await this.executeASFCommand(`play ${this.botName} ${appId}`);
        if (response !== `<${this.botName}> Playing selected gameIDs: ${appId}`) {
            logger.error(`[${this.botName}] Error starting the game: ${response}`);
            throw new Error('Error starting the game');
        }
        logger.success(`[${this.botName}] Game session started: ${appId}`);
        this.isPlaying = true;
    }

    // Stop the game session
    async stopGame() {
        const response = await this.executeASFCommand(`reset ${this.botName}`);
        if (response !== `<${this.botName}> Done!`) {
            logger.error(`[${this.botName}] Error stopping the game: ${response}`);
            throw new Error('Error stopping the game');
        }
        logger.success(`[${this.botName}] Game session finished`);
        this.isPlaying = false;
    }

    // Unlock an achievement for a specified game
    async unlockAchievement(appId, achievement) {
        // Log that we are about to unlock the achievement
        logger.info(`[${this.botName}] Unlocking achievement: ${achievement.id}. ${achievement.name} (${achievement.rare}%)`);

        // Send the command to ASF to unlock the achievement
        const response = await this.executeASFCommand(`aset ${this.botName} ${appId} ${achievement.id}`);

        // Check the response from ASF for success or failure
        const successMessage = `Success!`;
        const alreadyUnlockedMessage = `Achievement #${achievement.id} is already unlocked`;

        if (response.includes(successMessage)) {
            logger.success(`[${this.botName}] Achievement unlocked: ${achievement.id}. ${achievement.name} (${achievement.rare}%)`);

            // Update achievementData
            this.achievementData.unlocked.push(achievement.id);
            const index = this.achievementData.locked.indexOf(achievement.id);
            if (index !== -1) {
                this.achievementData.locked.splice(index, 1);
            }
        } else if (response.includes(alreadyUnlockedMessage)) {
            logger.error(`[${this.botName}] Achievement is already unlocked: ${achievement.id}`);
        } else {
            logger.error(`[${this.botName}] Unexpected response from ASF: ${response}`);
        }
    }

    // Play a game for a specified amount of time
    async playGame(appId, playTime) {
        const minChunkSizeInHours = 0.00833; // 30 seconds in hours
        const maxChunkSizeInHours = 0.025; // 90 seconds in hours
        let chunkSize = this.randomFloatBetween(minChunkSizeInHours, maxChunkSizeInHours); // Random value between minChunkSizeInHours and maxChunkSizeInHours

        logger.info(`[${this.botName}] Playing game ${appId} for ${playTime.toFixed(2)} hour(s)`);
        logger.info(`[${this.botName}] Remaining playtime for the next achievement: ${this.remainingPlaytime.toFixed(2)} hour(s)`);

        await this.startGame(appId).catch((error) => {
            return;
        });

        for (let elapsed = 0; elapsed < playTime; elapsed += chunkSize) {
            await sleep(chunkSize * 60 * 60 * 1000); // Wait for chunk duration

            // Decrease remaining playtime by the chunk duration
            this.remainingPlaytime -= chunkSize;

            // Save the updated remaining playtime to the config
            this.saveConfig();

            // Check if enough time has passed to unlock an achievement
            if (this.remainingPlaytime <= 0) {
                // Get the next achievement
                const nextAchievement = await this.getNextAchievement();

                logger.success(`[${this.botName}] Time to unlock an achievement: ${nextAchievement.id}. ${nextAchievement.name} (${nextAchievement.rare}%)`);

                // Unlock the achievement
                await this.unlockAchievement(appId, nextAchievement);

                // Calculate playtime needed for the next achievement
                this.remainingPlaytime = this.getTimeToNextAchievement();
                logger.info(`[${this.botName}] Remaining playtime for the next achievement: ${this.remainingPlaytime.toFixed(2)} hour(s)`);

                // Calculate a new chunk size for the next iteration
                chunkSize = this.randomFloatBetween(minChunkSizeInHours, maxChunkSizeInHours);
            }
        }

        await this.stopGame().catch((error) => {
            return;
        });
    }

    // Generate a random float within a specified range
    randomFloatBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Generate a random integer within a specified range
    randomIntBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // Start a gaming loop that simulates realistic gamer activity
    async startGamingLoop(appId) {
        let isDayOff;
        let currentDay;

        // Loop indefinitely
        while (true) {
            const now = new Date();

            // Update the isDayOff flag only if the day has changed
            if (now.getDate() !== currentDay) {
                currentDay = now.getDate();
                isDayOff = this.daysOff.includes(now.getDay()) || Math.random() < this.daysOffProbability;
                logger.info(`[${this.botName}] New day. Is it a day off? ${isDayOff ? 'Yes' : 'No'}`);
            }

            // The bot should be active if the current hour is within the bot's active hours range
            const isActiveHour = ((now.getHours() - this.activeHoursOffset + 24) % 24) < this.activeHoursDuration;

            if (isActiveHour && !isDayOff) {
                logger.info(`[${this.botName}] Active hour and not a day off. Time to play!`);

                // Play game for a random duration within the bot's session duration range
                const sessionDuration = this.randomFloatBetween(0.5, 5);
                await this.playGame(appId, sessionDuration);

                // Then wait for a random duration within the bot's break duration range
                const breakDuration = this.randomFloatBetween(0.5, 5);
                logger.info(`[${this.botName}] Finished playing. Taking a break for ${breakDuration.toFixed(2)} hour(s).`);
                await sleep(breakDuration * 60 * 60 * 1000); // convert hours to milliseconds
            } else {
                logger.info(`[${this.botName}] Not an active hour or it's a day off. Waiting until conditions are met.`);
                // Wait for a random duration before checking again
                const breakDuration = this.randomFloatBetween(1, 2); // Wait between 1 and 2 hours
                await sleep(breakDuration * 60 * 60 * 1000); // convert hours to milliseconds
            }
        }
    }

    // Function to calculate the time that need to be player before unlocking the next achievement.
    getTimeToNextAchievement() {
        let estimatedTime = config.baseFactor * Math.exp(config.scaleFactor * this.achievementData.unlocked.length / achievements_stats.length);

        if (this.achievementData.unlocked.length >= config.finalRampTrigger) {
            const finalRamp = Math.exp(config.finalRampFactor * (this.achievementData.unlocked.length - config.finalRampTrigger) / (achievements_stats.length - config.finalRampTrigger));
            estimatedTime *= finalRamp;
        }

        const localRandomAchievementFactor = this.randomFloatBetween(0.75, 1.25); // Allow the bot to unlock the next achievement between 25% faster or 25% slower than the standard model.
        return estimatedTime * localRandomAchievementFactor * this.globalRandomAchievementFactor; // Multiply the estimated time by the global and local random factors
    }

    // Function to select a random achievement from the top 20%
    selectRandomAchievement(achievements) {
        let size = Math.floor(achievements.length * 0.2);
        // If there are still achievements left, but the 20% slice results in a size of 0, adjust it to 1
        if (achievements.length > 0 && size === 0) {
            size = 1;
        }
        const topAchievements = achievements.slice(0, size);
        return topAchievements[this.randomIntBetween(0, topAchievements.length)];
    }

    // Function to get the next achievement to unlock
    async getNextAchievement() {
        // Update achievements status
        await this.updateAchievementsStatus();

        // Get only the achievements that haven't been unlocked yet
        const lockedAchievements = achievements_stats.filter(a => !this.achievementData.unlocked.includes(a.id));

        // Sort them by rarity in descending order (from the most common to the least common)
        lockedAchievements.sort((a, b) => parseFloat(b.rare) - parseFloat(a.rare));

        // Select a random achievement from the top 20% of the most common achievements
        const nextAchievement = this.selectRandomAchievement(lockedAchievements);

        return nextAchievement;
    }
}

// Wait for a specified amount of time
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = ASFBot;
