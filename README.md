# ASF Automatic Achievement Unlocker

The ASF Automatic Achievement Unlocker is a tool designed to unlock CS:GO achievements periodically and automatically for your [ArchiSteamFarm](https://github.com/JustArchiNET/ArchiSteamFarm) (ASF) instances. This tool uses IPC (Inter-Process Communication) to execute commands on ASF.

## Features

- Automatic and Periodic Achievements Unlocking: The tool systematically unlocks achievements at varying intervals.
- Natural Progression Mimicry: The unlocking pattern follows a rarity-based ramp, simulating a natural human-like progression.
- Integrated with ASF: Efficient game handling is achieved through integration with ASF and the ASF Achievement Manager Plugin.
- Human-like Behavior Simulation: Alongside a realistic unlocking progression, the tool also ensures a believable play time and game activity pattern.
- Multi-account and Multi-instance Support: The tool is capable of managing multiple ASF instances and accounts.
- Game Compatibility: Although primarily designed for CS:GO, the tool can potentially be adapted to support other games with some modifications.

## Pre-Requisites

1. Node.js installed. You can download it [here](https://nodejs.org/en/download/).
2. [ArchiSteamFarm](https://github.com/JustArchiNET/ArchiSteamFarm) (ASF) installed with [ASF Achievement Manager Plugin](https://github.com/Ryzhehvost/ASF-Achievement-Manager)

## Getting Started

1. Rename `ASFConfig.example.json` to `ASFConfig.json`.
2. Modify `ASFConfig.json` with your data.
3. `achievementConfig.json` can also be edited but the default parameters work well for most use cases.
4. Install the dependencies: `npm install`
5. Run the application: `node index.js`

## Adjusting for Other Games

While the tool is built primarily for CS:GO, it can be adjusted for other games as well. Here's what you need to do:

1. **Adjust the `finalRampTrigger` setting:** This setting should be adjusted to the total number of achievements of the other game. Alternatively, a percentage can be used to match any game.

2. **Modify the `achievements_stats.json` system:** The current system uses data for CS:GO achievements. This would need to be modified to have the achievement data of the game you want to use.

3. **Specify the `appId` of the game:** The current `appId` is hard-coded for CS:GO (730). This will need to be made a parameter or configuration setting for other games. Some work has been done on this already, but it's not fully complete.

## Contribution

Feel free to contribute and enhance the functionalities of this tool by a standard Pull Request.

## Potential Improvements

1. **Removing Magic Numbers:** Several important values used in the tool are currently hardcoded as "magic numbers", especially in `ASFBot.js`. These should be made into parameters or configuration settings for easier modification and understanding.
2. **Support for Other Games:** Currently, the tool is primarily designed to support CS:GO. However, with some modifications, it could be adapted to handle achievements for other games. Here are some steps to consider:
   - Refactor the achievement system: The current system is tied to CS:GO achievements. Refactoring this system to be more game-agnostic would increase the tool's versatility.
   - Parameterize the `appId`: The `appId` is currently hardcoded for CS:GO. Making this a parameter or configuration setting would allow easier support for other games.
