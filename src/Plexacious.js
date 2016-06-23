// Import libraries
const PlexAPI = require('plex-api');
const jsonfile = require('jsonfile');
const moment = require('moment');

// Override the logger to add a timestamp
console._log = console.log;
console.log = (...args) => {
  console._log(`[${moment().format('HH:mm:ss.SS')}]`, args.join(' '));
};

// Define the main class
class Plexacious {
  constructor(config) {
    this.config = config;
    const options = {
      hostname: config.hostname,
      port: config.port,
      https: config.https,
      token: config.token,
    };
    console.log(`Instantiating Plex API object to ${options.https ? 'https' : 'http'}://${options.hostname}:${options.port}...`)
    this.plex = new PlexAPI(options);
    this.hooks = {};
    this.cache = this._readCache();

    // Start the digest
    this.setRefreshDuration(config.refreshDuration);
    this._digest();
  }

  /***********************
  *                      *
  * Public API functions *
  *                      *
  ***********************/

  /**
   * Modify the refresh duration (aka the digest timer)
   *
   * @param {integer} timer - The time between digest() calls in minutes
   */
  setRefreshDuration (timer) {
    if (this._interval) {
      // Clear the existing intervalObject if present
      clearInterval(this._interval);
    }

    this._interval = setInterval(this._digest.bind(this), timer * 60000);

    return this;
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

    return this;
  }

  /**
   * Return the callback functions that have been attached
   *
   * @param {string} event - If provided, specifies the event to get the callback function for. Will return undefined if this event has no callback attached.
   * @return {Array|function}
   */
  events (event) {
    if (event) return this.hooks[event];
    else return this.hooks;
  }

  /*************************
  *                        *
  * THE DIGEST             *
  *                        *
  *************************/

  /**
   * The digest function which is run on an interval specified by the refreshDuration setting.
   *
   * It will check what's going on with the server periodically, pulling data from it and then calling the attached callback functions if any.
   */
  async _digest () {
    console.log('Starting digest...');

    // Iterate through the recently added media in each section, and call the attached callback function (if any) on any media added since the last digest

    let recentlyAdded = [];

    for (let section of await this.getSections()) {
      console.log(`Now looking in section #${section.key}: ${section.title}...`);

      for (let item of await this.getRecentlyAdded(section.key)) {
        if (!(item.ratingKey in this.cache.recentlyAdded)) { // Check if it's a new item that we haven't already seen
          if (this.hooks['mediaAdded']) { // Check if there's a callback attached
            this.hooks['mediaAdded'](item);
          }
        }

        this.cache.recentlyAdded[item.ratingKey] = item;
      }
    }
    // Write cache to file
    this._writeCache();
  }

  /*************************
  *                        *
  * Data Getters           *
  * Convenience functions  *
  *                        *
  *************************/

  query (uri) {
    //console.log(`Getting data from ${uri}...`);
    return this.plex.query(uri).then(response => response._children);
  }

  getImage (uri) {
    return this.plex.query(uri);
  }

  getSections () {
    console.log('Looking for library sections');
    return this.query('/library/sections');
  }

  getSessions () {
    return this.query('/status/sessions');
  }

  getServers () {
    return this.query('/servers');
  }

  getOnDeck () {
    return this.query('/library/onDeck');
  }

  getRecentlyAdded (sectionKey = null) {
    let uri = '';
    if (sectionKey) {
      uri = `/library/sections/${sectionKey}/recentlyAdded`;
    }
    else {
      uri = '/library/recentlyAdded';
    }
    return this.query(uri);
  }

  /***********************
  *                      *
  * Internal functions   *
  *                      *
  ***********************/

  _getFullUri (uri) {
    return `${this.config.https ? 'https' : 'http'}://${this.config.hostname}:${this.config.port}/${uri}`;
  }

  _readCache () {
    let cache = {
      recentlyAdded: {},
      servers: {},
      sessions: {},
    };
    try {
      cache = jsonfile.readFileSync('cache.json');
      console.log('Read successfully from cache file.')
    }
    catch (e) {
      switch(e.name) {
        case 'Error':
          console.log('Cache file not found. Starting with empty cache.');
          break;
        case 'SyntaxError':
          console.log('Error parsing cache file JSON. Starting with empty cache instead.')
          break;
        default:
          console.error(e);
      }
    }
    return cache;
  }

  _writeCache () {
    jsonfile.writeFile('cache.json', this.cache, {spaces: 2}, err => {
      if (err) {
        throw err;
      }
      else {
        console.log('Cache written to file.');
      }
    });
  }
}

module.exports = Plexacious;