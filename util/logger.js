// Import necessary modules
const chalk = require('chalk');
const moment = require('moment');

// Define function to generate timestamp
const timestamp = () => `[${moment().format('DD/MM/YY HH:mm:ss.SSS')}]`;

// Define function to log messages with color
const log = (message, color = chalk.white) => {
    console.log(`${timestamp()} ${color(message)}`);
}

// Export color-coded logging functions
module.exports = {
    log: (message) => log(message),                 // Normal messages
    info: (message) => log(message, chalk.yellow),  // Information messages
    error: (message) => log(message, chalk.red),    // Error messages
    warn: (message) => log(message, chalk.cyan),    // Warning messages
    success: (message) => log(message, chalk.green),// Success messages
};