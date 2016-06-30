// Import libraries
const PlexAPI = require('plex-api');
const clone = require('clone');
const jsonfile = require('jsonfile');
const isIntegerish = require('is-integerish');
const EventEmitter = require('events');
const winston = require('winston');
const logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({
        colorize: true,
        timestamp: true,
      }),
    ],
});
logger.level = 'verbose';

// Add server defaults
const CONFIG_DEFAULT = {
  hostname: 'localhost',
  port: 32400,
  https: false,
}

const BLANK_CACHE = {
  recentlyAdded: {},
  servers: {},
  sessions: {},
};

// Define the main class
class Plexacious extends EventEmitter {
  constructor() {
    super();

    // Initialize the cache
    this.cache = clone(BLANK_CACHE);
    this._init = true;
    this.running = false;

    // Declare default listeners for logging purposes
    this
      .on('newListener', (event) => logger.debug(`Listener added to event '${event}'`))
      .on('removeListener', (event) => logger.debug(`Listener removed from event '${event}'`))
      .on('startQuery', uri => logger.debug(`Getting data from ${uri}`))
      .on('endQuery', uri => logger.debug(`Finished getting data from ${uri}`))
      .on('start', () => logger.info('Starting bot'))
      .on('stop', () => logger.info('Stopping bot'))
      .on('exit', () => logger.info('Killing bot'))
      .on('startDigest', () => logger.info('Starting digest...'))
      .on('endDigest', () => logger.info('Digest complete.'))
      .on('newSession', session => logger.info('Session', `${session.user.title} has started watching ${session.title} on ${session.player.title}`))
      .on('endSession', session => logger.info('Session', `${session.user.title} has stopped watching ${session.title}`));
  }

  /***********************
  *                      *
  * Public API functions *
  *                      *
  ***********************/

  /**
   * Set log level
   *
   * @param {string|number} level: Log Level (Values: 'error', 'warn', 'info', 'verbose', 'debug', 'silly')
   *
   * @return {Plexacious}
   */
  setLogLevel (level = 'info') {
    logger.level = level;

    return this;
  }

  /**
   * Establish a connection to a specified Plex server
   *
   * @param {Object} config - The Plex server
   * @param {?string} config.hostname - The server host name (eg localhost, plex.server.com), defaults to 'localhost'
   * @param {?number} config.port - The server port, defaults to 32400
   * @param {?boolean} config.https - Set to true if HTTPS connection is required, defaults to false
   * @param {string} config.token - The Plex Authentication token
   * @param {?number} config.refreshDuration - The refresh timer in minutes, defaults to 15
   * @param {?function} callback - The listener function to call when init is complete
   *
   * @return {Plexacious} - Returns the Plexacious object itself for method chaining
   */
  init (config, callback) {
    // Check for auth token
    if (!config.token) {
      logger.error('You must provide an authorization token to connect to the Plex server.');
      this.exit(-1);
    }

    this.config = {
      hostname: config.hostname || CONFIG_DEFAULT.hostname,
      port: config.port || CONFIG_DEFAULT.port,
      https: config.https || CONFIG_DEFAULT.https,
      token: config.token,
      refreshDuration: config.refreshDuration || CONFIG_DEFAULT.refreshDuration,
    }

    // Read the cache file into memory
    this._readCache()
      .then(fileCache => {
        this.cache = clone(fileCache);
        this._init = false;
        logger.info('Read cache successfully from file.');
      })
      .catch(err => {
        switch(err.name) {
          case 'Error':
            logger.warn('Cache file not found. Starting with empty cache.');
            break;
          case 'SyntaxError':
            logger.warn('Error parsing cache file JSON. Starting with empty cache instead.');
            break;
          default:
            logger.error(err);
        }
      });

    logger.info(`Instantiating Plex API object to ${this.config.https ? 'https' : 'http'}://${this.config.hostname}:${this.config.port}...`);
    this.plex = new PlexAPI(this.config);

    // Test the connection
    logger.info('Testing the connection to the Plex server...');
    this.plex.query('/library')
      .then(() => {
        this.setRefreshDuration(this.config.refreshDuration);

        if (callback && (typeof callback === 'function')) {
          callback.bind(this).call();
        }
      })
      .catch((err) => {
        logger.error(err);
      });

    return this;
  }

  /**
   * Modify the refresh duration (aka the digest timer), and runs the digest function immediately
   *
   * @param {integer} timer - The time between digest() calls in minutes
   *
   * @return {Plexacious} - Returns the Plexacious object itself for method chaining
   */
  setRefreshDuration (timer) {
    if (!timer) {
      timer = CONFIG_DEFAULT.refreshDuration;
    }
    else if (!isIntegerish(timer)) {
      logger.error('Please provide a numeric value for timer');
      return;
    }
    else {
      timer = parseInt(timer, 10);
    }

    if (timer <= 0) {
      logger.error('Timer should be at least 1 min or more');
      return;
    }

    if (this._timeoutObj) {
      // Clear the existing timeoutObject if present
      clearTimeout(this._timeoutObj);
    }

    this.config.refreshDuration = timer;
    this._digest();

    return this;
  }

  /**
   * Start the bot. Only works if the bot is currently stopped.
   *
   * @return {Plexacious} - returns the Plexacious object iself for method chaining
   */
  start () {
    if (!this.running) {
      this.emit('start');
      this.running = true;
      this.setRefreshDuration(this.config.refreshDuration);
    }

    return this;
  }

  /**
   * Stop the bot. Only works if the bot is currently running.
   *
   * @return {Plexacious} - returns the Plexacious object iself for method chaining
   */
  stop () {
    if (this.running) {
      this.running = false;
      clearInterval(this._intervalObj);
      this.emit('stop');
    }

    return this;
  }

  /**
   * Completely shut down the bot and exit the process
   */
  exit () {
    this.stop();
    this.removeAllListeners();
    this.emit('exit');
  }

  /**************************
  *                         *
  * EVENT EMITTER FUNCTIONS *
  *                         *
  **************************/

  /**
   * Attach a callback function to an event
   *
   * @param {string} event - The event to which to bind or unbind the callback function.
   * @param {function} callback - The callback function to be called when the event occurs.
   *
   * @return {Plexacious} - Returns the Plexacious object itself for method chaining
   */
  on (eventName, callback) {
    super.on(eventName, callback);

    return this;
  }

  /**
   * Remove a specified callback function from an event
   *
   * @param {string} event - The event from which to remove callback functions.
   * @param {function} callback - The listener to remove from the event.
   *
   * @return {Plexacious} - Returns the Plexacious object itself for method chaining
   */
  removeListener (eventName, callback) {
    super.removeListener(eventName, callback);

    return this;
  }

  /**
   * Remove all callback functions from an event
   *
   * @param {string} event - The event from which to remove callback functions.
   *
   * @return {Plexacious} - Returns the Plexacious object itself for method chaining
   */
  removeAllListeners (eventName) {
    super.removeAllListeners(eventName);

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
    if (this.running) {
      this.emit('startDigest');

      Promise.all([this._processSessions(), this._processSections()])
        .then(() => {
          // this._init is used to tell if this is the first time running the digest function. On the first time, event listeners are not called as the bot is gathering the initial data
          this._init = false;

          // Write all the data to cache
          this._writeCache()
            .then(() => logger.info('Cache written to file.'))
            .catch(err => logger.error(err));

          // Emit the final event
          this.emit('endDigest');

          // Schedule the next digest
          if (this.running) {
            this._intervalObj = setTimeout(this._digest.bind(this), this.config.refreshDuration * 60000);
          }
        })
        .catch(err => logger.error(err));
    }
  }

  /*************************
  *                        *
  * Data Getters           *
  * Convenience functions  *
  *                        *
  *************************/

  query (uri) {
    this.emit('startQuery', uri);
    return this.plex.query(uri)
      .then(response => {
        this.emit('endQuery', uri);
        return response._children;
      })
      .catch(err => {
        if (err.code === 'ECONNREFUSED') {
          throw Error('Error connecting to Plex server');
        }
        else {
          throw err;
        }
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
    return new Promise((resolve, reject) => {
      jsonfile.readFile('cache.json', (err, cacheData) => {
        if (err) {
          return reject(err);
        }
        else {
          return resolve(cacheData);
        }
      });
    });
  }

  _writeCache () {
    return new Promise((resolve, reject) => {
      jsonfile.writeFile('cache.json', this.cache, {spaces: 2}, err => {
        if (err) {
          return reject(err);
        }
        else {
          return resolve();
        }
      });
    });

  }

  _getChild (container, typeName) {
    for (let i in container._children) {
      if (container._children[i]._elementType === typeName) {
        return container._children[i];
      }
    }
  }

  _processSessions () {
    return this.getSessions().then(sessions => {
      let previousSessions = this.cache.sessions;
      this.cache.sessions = {};

      sessions.forEach(session => {
        session.user = this._getChild(session, 'User');
        session.player = this._getChild(session, 'Player');
        session.transcode = this._getChild(session, 'TranscodeSession');
        const sessionKey = `session:${session.transcode.key}`;
        if (!this._init && !(sessionKey in previousSessions)) {
          this.emit('newSession', session);
        }
        this.cache.sessions[sessionKey] = session;
      });

      if (!this._init) {
        for (let key in previousSessions) {
          if (!(key in this.cache.sessions)) {
            this.emit('endSession', previousSessions[key]);
            delete previousSessions[key];
          }
        }
      }

      return sessions;
    });
  }

  _processSections () {
    return this.getSections().then(sections => {
      return Promise.all(sections.map(section => {
        return this.getRecentlyAdded(section.key).then(media => {
          return Promise.all(media.map(item => {
            if (!this._init && !(item.ratingKey in this.cache.recentlyAdded)) { // Check if it's a new item that we haven't already seen
              this.emit('newMedia', item);
            }
            this.cache.recentlyAdded[item.ratingKey] = item;
          }));
        })
      }));
    });
  }
}

module.exports = Plexacious;