// Import libraries
const PlexAPI = require('plex-api');

// Import classes
const Video = require('./Classes/Video');

// Import configuration
const config = require('./config');
const npmConfig = require('./package')

// Define the main class
class Plexacious {
  constructor() {
    const options = {
      hostname: config.hostname,
      port: config.port,
      https: config.https,
      username: config.username,
      password: config.password,
      token: config.token,
      options: {
        identifier: "Plexacious Chat Bot",
        product: "Plexacious",
        version: npmConfig.version,
        deviceName: "Plexacious",
      }
    };
    console.log(`Instantiating Plex API object to ${options.hostname}...`)
    this.plex = new PlexAPI(options);
    this.refreshDuration = config.refreshDuration * 60 * 1000; // Convert from minutes to milliseconds
    this.hooks = {};

    // Start the digest
    setInterval(this.digest, this.refreshDuration);
    this.digest();
  }

  get sessions () {
    return this.plex.query('/status/sessions').then(response => response._children);
  }

  get servers () {
    return this.plex.query('/servers').then(response => response._children);
  }

  get onDeck () {
    return this.plex.query('/library/onDeck').then(response => response._children);
  }

  get recentlyAdded () {
    return this.plex.query('/library/recentlyAdded').then(response => response._children);
  }

  query (key) {
    return this.plex.query(key).then(response => response._children);
  }

  /**
   * Bind or unbind a callback function to an event
   *
   * @param {string} event - The event to which to bind or unbind the callback function
   * @param {function} callback - The callback function to be called when the event occurs. If not provided, any existing callback function for the specified event will be removed.
   */
  on (event, callback) {
    if (event) {
      if (callback) {
        this.hooks[event] = callback;
      }
      else if (this.hooks[event]){
        delete this.hooks[event];
      }
    }
  }

  /**
   * Return the callback functions that have been attached
   *
   * @param {string} event - If provided, specifies the event to get the callback function for. Will return undefined if this event has no callback attached.
   * @return {Array|function}
   */
  events(event) {
    if (event) return this.hooks[event];
    else return this.hooks;
  }

  async digest () {
    console.log('Starting digest...');

    // Iterate through the recently added media, and call the attached callback function (if any) on any media added since the last notification
    console.log('Looking for recently added media...');
    const recentlyAdded = await this.recentlyAdded;
    for (const item of recentlyAdded) {
      const media = await this.query(item.key);
    }
  }
}

module.exports = Plexacious;