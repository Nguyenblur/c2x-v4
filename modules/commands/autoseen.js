const fs = require('fs');
const filePath = './db/data/autoseen.txt';

module.exports = {
  name: "autoseen",
  author: "Nguyên Blue",
  category: "GROUPS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 3,
  desc: "bật/tắt auto seen khi có tin nhắn mới.",
  async onCall({ api, message, args }) {
    try {
      if (args[0] === "on") {
        fs.writeFileSync(filePath, 'on', 'utf8');
        await api.sendMessage("✅", message.threadID);
      } else if (args[0] === "off") {
        fs.writeFileSync(filePath, 'off', 'utf8');
        await api.sendMessage("💤", message.threadID);
      } else {
        await api.sendMessage("ON/OFF", message.threadID);
      }
    } catch (error) {
      console.error(error);
    }
  }, 
  async onMessage({ api }) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8').trim().toLowerCase();
        if (content === "on") {
          await api.markAsReadAll();
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
};
