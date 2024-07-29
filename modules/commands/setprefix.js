const fs = require('fs');
const path = require('path');

const configPath = path.resolve('./config.json');

function readConfig() {
  try {
    const rawdata = fs.readFileSync(configPath);
    return JSON.parse(rawdata);
  } catch (error) {
    console.error(error);
    return {};
  }
}

function writeConfig(config) {
  try {
    const data = JSON.stringify(config, null, 2);
    fs.writeFileSync(configPath, data);
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  name: "setprefix",
  author: "Nguyên Blue",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  admin: true,
  wait: 3,
  desc: "thay đổi prefix bot",
  async onCall({ client, api, message, args }) {
    try {
      const NewPrefix = args[0];
      if (!NewPrefix) {
        api.sendMessage('Vui lòng cung cấp prefix mới.', message.threadID);
        return;
      }

      let json = readConfig();

      json.PREFIX = NewPrefix;
      client.config.PREFIX = NewPrefix;

      writeConfig(json);

      api.sendMessage(`Prefix đã được thay đổi thành: ${NewPrefix}`, message.threadID);
    } catch (error) {
      console.log(error);
    }
  }
};
