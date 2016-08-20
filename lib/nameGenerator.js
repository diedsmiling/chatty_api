const heroes = require('../data/heroes.json');
const adjectives = require('../data/adjectives.json');

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function random(items) {
  return items[Math.floor(Math.random()*items.length)];
}

module.exports = function generateName() {
  return capitalizeFirstLetter(random(adjectives)) + ' ' + random(heroes)
};