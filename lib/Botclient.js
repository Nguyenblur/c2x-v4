const client = {
  commands: [],
  events: [],
  commandMap: new Map(),
  eventMap: new Map(),
  cooldowns: new Map(),
  language: new Object(),
  mqttListener: null,
  config: require('../config/config.main.json'),
  nsfw: require('../databases/cache/nsfw/nsfwGroups.json')
};

module.exports = { client };