// This file generates the order in which the bot will unlock the achievements in the game.
// It selects a random achievement from the top 20% most common achievements that haven't been unlocked yet,
// and repeats the process until all achievements have been scheduled for unlocking.

const util = require('util');

// Function to generate a random number within a specified range
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

// Function to select a random achievement from the top 20%
function selectRandomAchievement(achievements) {
    let size = Math.floor(achievements.length * 0.2);
    // If there are still achievements left, but the 20% slice results in a size of 0, adjust it to 1
    if (achievements.length > 0 && size === 0) {
        size = 1;
    }
    const topAchievements = achievements.slice(0, size);
    return topAchievements[Math.floor(randomBetween(0, topAchievements.length))];
}

// Function to generate the order of achievements
function generateAchievementOrder() {
    const achievements_stats = require('../data/achievements_stats.json');
    let botAchievements = []; // An array to hold the achievements the bot will unlock

    // While the bot hasn't unlocked all achievements
    while (botAchievements.length < achievements_stats.length) {
        // Get only the achievements that haven't been unlocked yet
        const lockedAchievements = achievements_stats.filter(a => !botAchievements.includes(a.id));

        // Sort them by rarity in descending order (from the most common to the least common)
        lockedAchievements.sort((a, b) => parseFloat(b.rare) - parseFloat(a.rare));

        // Select a random achievement from the top 20% of the most common achievements
        const randomAchievement = selectRandomAchievement(lockedAchievements);

        botAchievements.push(randomAchievement.id);
    }

    // Log the order of achievements
    console.log('The order of achievements is: ', util.inspect(botAchievements, { maxArrayLength: null }));
}

// Generate the order of achievements
generateAchievementOrder();
