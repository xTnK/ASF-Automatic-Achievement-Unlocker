// This file tests the "getTimeToNextAchievement" function, which calculates 
// the estimated time required to unlock the next achievement in a game, based on the
// current number of achievements already unlocked. 
// It uses an exponential model, with a steepening curve for the final 10% of achievements.

const config = require('../config/achievementConfig.json');

// Function to calculate the time to the next achievement.
// The base model is exponential, and there is an additional ramp factor 
// for the final few achievements.
function getTimeToNextAchievement(currentAchievements) {
    let estimatedTime = config.baseFactor * Math.exp(config.scaleFactor * currentAchievements / 167);

    if (currentAchievements >= config.finalRampTrigger) { // Check if the achievements are in the final ramp range
        const finalRamp = Math.exp(config.finalRampFactor * (currentAchievements - config.finalRampTrigger) / (167 - config.finalRampTrigger));
        estimatedTime *= finalRamp;
    }

    // Randomness is ignored for this test
    // const localRandomFactor = randomBetween(0.5, 1.5);
    // estimatedTime *= localRandomFactor * globalRandomFactor;

    return estimatedTime;
}

// Function to test the parameters.
// It iterates over all possible achievements counts, and for each one, it calculates the time 
// to the next achievement and adds it to a total playtime. This simulates a player unlocking 
// all achievements one after the other.
function generateAchievementTimeEstimation() {
    let totalPlaytime = 0;
    console.log('Achievements | Time to Next Achievement (hours) | Total Playtime (hours)');
    for (let i = 0; i <= 167; i++) {
        const timeToNextAchievement = getTimeToNextAchievement(i);
        totalPlaytime += timeToNextAchievement;
        console.log(`${i.toString().padStart(12)} | ${timeToNextAchievement.toFixed(2).padStart(34)} | ${totalPlaytime.toFixed(2).padStart(23)}`);
    }
}

// Call the test function with parameters from the config file
generateAchievementTimeEstimation();