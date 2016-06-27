// Import libraries
const PlexAPI = require('plex-api');
const jsonfile = require('jsonfile');
require('tinylog');
const EventEmitter = require('events');

// Add server defaults
const SERVER_DEFAULT = {
  hostname: 'localhost',
  port: 32400,
  https: false,
}

// Define the main class
class Plexacious {
  constructor() {
    this.cache = this._readCache();
    this._eventEmitter = new EventEmitter();

    // Declare default listeners for logging purposes
    this
      .on('newListener', (event) => console.log(`Listener added to event '${event}'`))
      .on('removeListener', (event) => console.log(`Listener removed from event '${event}'`))
      .on('init', config => console.log(`Instantiating Plex API object to ${config.https ? 'https' : 'http'}://${config.hostname}:${config.port}...`))
      .on('query', uri => console.log(`Getting data from ${uri}`))
      .on('queryComplete', uri => console.log(`Finished getting data from ${uri}`))
      .on('startDigest', () => console.log('Starting digest...'))
      .on('endDigest', () => console.log('Digest complete.'));
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

    this._init = true;

    this._eventEmitter.emit('init', config);
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
    this._digest();

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
        this._eventEmitter.on(eventName, callback);
      }
      else {
        this._eventEmitter.removeAllListeners(eventName);
      }
    }

    return this;
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
  _digest () {
    this._eventEmitter.emit('startDigest');

    Promise.all([this._processSections()])
      .then(() => {
        this._init = false;
        this._writeCache();
        this._eventEmitter.emit('endDigest');
      })
      .catch(console.error.bind(console));
  }

  /*************************
  *                        *
  * Data Getters           *
  * Convenience functions  *
  *                        *
  *************************/

  query (uri) {
    this._eventEmitter.emit('query', uri);
    return this.plex.query(uri).then(response => {
      this._eventEmitter.emit('queryComplete', uri);
      return response._children;
    });
  }

  getImage (uri) {
    return this.plex.query(uri);
  }

  getSections () {
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

  _processSections() {
    return this.getSections().then(sections => {
      return Promise.all(sections.map((section) => {
        return this.getRecentlyAdded(section.key).then(media => {
          return Promise.all(media.map((item => {
            this.cache.recentlyAdded[item.ratingKey] = item;
            if (!this._init && !(item.ratingKey in this.cache.recentlyAdded)) { // Check if it's a new item that we haven't already seen
              this._eventEmitter.emit('newMedia', item);
            }
          })));
        })
      }));
    });
  }
}

module.exports = Plexacious;