// Import libraries
const PlexAPI = require('plex-api');
const jsonfile = require('jsonfile');
require('tinylog');

// Add server defaults
const SERVER_DEFAULT = {
  hostname: 'localhost',
  port: 32400,
  https: false
}

// Define the main class
class Plexacious {
  constructor() {
    this.hooks = {};
    this.cache = this._readCache();
  }

  /***********************
  *                      *
  * Public API functions *
  *                      *
  ***********************/

  /**
   * Establish a connection to a specified Plex server
   * 
   * @param {Object} config - The Plex server
   * @param {?string} config.hostname - The server host name (eg localhost, plex.server.com), defaults to 'localhost'
   * @param {?number} config.port - The server port, defaults to 32400
   * @param {?boolean} config.https - Set to true if HTTPS connection is required, defaults to false
   * @param {token} config.token - The Plex Authentication token
   * @param {?number} config.refreshDuration - The refresh timer in minutes, defaults to 15
   * 
   * @return {Plexacious} - Returns the Plexacious object itself for method chaining
   */
  init (config) {
    this.config = {
      hostname: config.hostname || SERVER_DEFAULT.hostname,
      port: config.port || SERVER_DEFAULT.port,
      https: config.https || SERVER_DEFAULT.https,
      token: config.token,
      refreshDuration: config.refreshDuration || SERVER_DEFAULT.refreshDuration,
    }

    this._callEventHook('init');

    console.log(`Instantiating Plex API object to ${this.config.https ? 'https' : 'http'}://${this.config.hostname}:${this.config.port}...`);
    this.plex = new PlexAPI(this.config);

    this.setRefreshDuration(this.config.refreshDuration);

    return this;
  }

  /**
   * Modify the refresh duration (aka the digest timer), and runs the digest function immediately
   *
   * @param {integer} timer - The time between digest() calls in minutes
   * 
   * @return {Plexacious} - Returns the Plexacious object itself for method chaining
   */
  setRefreshDuration (timer = 15) {
    if (this._intervalObj) {
      // Clear the existing intervalObject if present
      clearInterval(this._intervalObj);
    }

    this._intervalObj = setInterval(this._digest.bind(this), timer * 60000);
    setImmediate(this._digest.bind(this));

    return this;
  }

  /**
   * Bind or unbind a callback function to an event
   *
   * @param {string} event - The event to which to bind or unbind the callback function
   * @param {function} callback - The callback function to be called when the event occurs. If not provided, any existing callback function for the specified event will be removed.
   * 
   * @return {Plexacious} - Returns the Plexacious object itself for method chaining
   */
  on (eventName, callback) {
    if (eventName) {
      if (callback) {
        log(`Attaching callback to event '${eventName}'`);
        this.hooks[eventName] = callback;
      }
      else if (this.hooks[eventName]){
        log(`Removing callback from event '${eventName}'`);
        delete this.hooks[eventName];
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
  eventFunctions (event) {
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
   *
   * If init is passed as true, (ie the first time the digest is run when the bot starts up), event hooks will not be triggered.
   */
  async _digest (init = false) {
    console.log('Starting digest...');

    // Iterate through the recently added media in each section, and call the attached callback function (if any) on any media added since the last digest
    let recentlyAdded = [];

    for (let section of await this.getSections()) {
      console.log(`Now looking in section #${section.key}: ${section.title}...`);

      for (let item of await this.getRecentlyAdded(section.key)) {
        if (!(item.ratingKey in this.cache.recentlyAdded)) { // Check if it's a new item that we haven't already seen
          if (!init && this.hooks['mediaAdded']) { // Check if there's a callback attached
            this._callEventHook('mediaAdded', item);
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

  _callEventHook(eventName, ...args) {
    console.log(`Calling function on event '${eventName}''`);
    if (this.hooks[eventName]) {
      this.hooks[eventName].apply(args);
    }
  }

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