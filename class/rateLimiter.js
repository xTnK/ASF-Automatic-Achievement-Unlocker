const logger = require('../util/logger');

// One request is allowed ever DELAY_DURATION_MS milliseconds per IP. 
const DELAY_DURATION_MS = 10000; // Limit to 1 request every 10 seconds per IP

class RateLimiter {
    constructor() {
        // Store the timestamps of the last request for each IP
        // Structure: { ip: timestampOfLastRequest, ... }
        this.requestTimestamps = {};

        // Queue to hold the promises
        this.queue = {};
    }

    async limit(ip) {
        // Check if there was a previous request for this IP
        if (this.requestTimestamps[ip]) {
            // Get the current time
            const currentTime = Date.now();

            // Calculate the time difference between the current time and the timestamp of the last request
            const timeDifference = currentTime - this.requestTimestamps[ip];

            // If the time difference is less than the delay duration, delay the request
            if (timeDifference < DELAY_DURATION_MS) {
                const delay = DELAY_DURATION_MS - timeDifference;

                if (!this.queue[ip]) {
                    this.queue[ip] = Promise.resolve();
                }

                this.queue[ip] = this.queue[ip].then(() => {
                    logger.log(`[${ip}] Next request delayed by ${delay} ms`);
                    return new Promise(resolve => setTimeout(resolve, delay));
                });
                
                await this.queue[ip];
            }
        }

        // Update the timestamp of the last request for this IP
        this.requestTimestamps[ip] = Date.now();
    }
}

// Export an instance of RateLimiter
module.exports = new RateLimiter();