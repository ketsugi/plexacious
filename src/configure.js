'use strict';

// Import libraries
const https = require('https');
const inquirer = require('inquirer');
const jsonfile = require('jsonfile');
const isIntegerish = require('is-integerish');

// Import the configuration files
const configFileName = './config.json';
const npmConfig = require('./package');

let currentConfig = {};
try {
  currentConfig = jsonfile.readFileSync(configFileName);
}
catch (e) {
  currentConfig = {};
}

// Start the installation process
console.log('Setting up your Plex server connection...');

const questions = [
  {
    type: 'input',
    name: 'hostname',
    message: 'Please enter the Plex server host name:',
    default: currentConfig.hostname || 'localhost',
  },
  {
    type: 'input',
    name: 'port',
    message: 'Please enter the Plex server port number:',
    default: currentConfig.port || 32400,
    validate: input => {
      if (isIntegerish(input)) {
        input = parseInt(input, 10);
        if (input >= 0 && input <= 65535) {
          return true;
        }
        else {
          return 'Port number should be between 0 and 65535 inclusive.'
        }
      }
      else {
        return 'Please provide a valid number.';
      }
    },
    filter: answer => filterInteger(answer),
  },
  {
    type: 'list',
    name: 'https',
    message: 'Please select the protocol to use to connect to this server:',
    default: currentConfig.https ? 'https' : 'http',
    choices: ['http', 'https'],
    filter: input => input.toLowerCase() === 'https',
  },
  {
    type: 'list',
    name: 'authenticationMethod',
    message: 'Please select your preferred authentication method:',
    default: currentConfig.https ? 'Plex.TV Login' : 'Plex Auth Token',
    choices: ['Plex.TV Login', 'Plex Auth Token'],
  },
  {
    type: 'input',
    name: 'token',
    message: `Please enter your Plex authentication token:`,
    default: currentConfig.token || null,
    when: answers => answers.authenticationMethod == 'Plex Auth Token',
  },
  {
    type: 'input',
    name: 'username',
    message: 'Please enter your Plex.tv username:',
    validate: answer => answer.length > 0,
    when: answers => answers.authenticationMethod == 'Plex.TV Login',
  },
  {
    type: 'password',
    name: 'password',
    message: 'Please enter your Plex.tv password:',
    validate: answer => answer.length > 0,
    when: answers => answers.authenticationMethod == 'Plex.TV Login',
  },
  {
    type: 'input',
    name: 'refreshDuration',
    message: 'Please enter the desired refresh duration in minutes:',
    default: currentConfig.refreshDuration || 5,
    validate: input => {
      if (isIntegerish(input)) {
        input = parseInt(input, 10);
        if (input >= 5) {
          return true;
        }
        else {
          return 'Refresh duration should be at least 5 minutes.'
        }
      }
      else {
        return 'Please provide a valid number.';
      }
    },
    filter: answer => filterInteger(answer),
  },
];

inquirer.prompt(questions).then(answers => {
  console.dir(answers);

  if (answers.authenticationMethod === 'Plex.TV Login') {
    // Get the authentication token
    const options = {
      protocol: 'https',
      hostname: 'plex.tv',
      path: `/users/sign_in.json?user[login]=${answers.username}&user[password]=${answers.password}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accepts': 'application/json',
        'X-Plex-Client-Identifier': 'Plexacious Bot',
        'X-Plex-Product': 'Plexacious',
        'X-Plex-Version': npmConfig.version
      },
    };


  }
});

/**
 * Internal use functions
 */
function filterInteger (input) {
  if (isIntegerish(input)) {
    return parseInt(input, 10);
  }
  else {
    return input;
  }
}