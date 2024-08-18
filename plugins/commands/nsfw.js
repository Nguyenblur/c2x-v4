const fs = require('fs');
const path = './databases/cache/nsfw/nsfwGroups.json';

let nsfwGroups = [];

try {
  nsfwGroups = require(`../.${path}`);
  if (!Array.isArray(nsfwGroups)) {
    throw new Error('nsfwGroups must be an array');
  }
} catch (error) {
  console.error(`Error loading nsfwGroups: ${error.message}`);
  fs.writeFileSync(path, JSON.stringify(nsfwGroups, null, 2));
}

module.exports = {
  name: 'nsfw',
  author: 'Nguyên Blue',
  category: 'SYSTEMS',
  version: '1.0',
  nopre: false,
  admin: true,
  wait: 3,
  desc: 'Toggle NSFW mode for the group',
  lang: {
    vi: {
      a: 'NSFW Mode đã được bật cho nhóm này!',
      b: 'NSFW Mode đã được tắt cho nhóm này!'
    },
    en: {
      a: 'NSFW Mode has been enabled for this group!',
      b: 'NSFW Mode has been disabled for this group!'
    }
  },
  async onCall({ api, message, args, getText }) {
    const groupID = message.threadID;
    const command = args[0].toLowerCase();

    if (command === 'on') {
      if (nsfwGroups.includes(groupID)) {
        nsfwGroups.push(groupID);
        fs.writeFileSync(path, JSON.stringify(nsfwGroups, null, 2));
        api.sendMessage(getText('a'), message.threadID);
      }
    } else if (command === 'off') {
      if (!nsfwGroups.includes(groupID)) {
        const index = nsfwGroups.indexOf(groupID);
        nsfwGroups.splice(index, 1);
        fs.writeFileSync(path, JSON.stringify(nsfwGroups, null, 2));
        api.sendMessage(getText('b'), message.threadID);
      }
    } else {
      api.sendMessage('Usage: !nsfw on/off', message.threadID);
    }
  }
};