// Import libraries
const PlexAPI = require("plex-api");

// Define the main class
class Plexacious {
  constructor(opts = 'localhost') {
    this.client = new PlexAPI(opts);
  }

  get sessions () {
    return this.client.query('/status/sessions').then(response => response._children);
  }

  get servers () {
    return this.client.query('/servers').then(response => response._children);
  }

  get onDeck() {
    return this.client.query('/library/onDeck').then(response => response._children);
  }
}

module.exports = Plexacious;