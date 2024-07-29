const fs = require('fs');
const path = require('path');

const configPath = path.resolve('./config.json');

function readConfig() {
  try {
    const rawdata = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(rawdata);
  } catch (error) {
    console.error(error);
    return {};
  }
}

function writeConfig(config) {
  try {
    const data = JSON.stringify(config, null, 2);
    fs.writeFileSync(configPath, data, 'utf-8');
  } catch (error) {
    console.error(error);
  }
}

async function getUserInfo(api, userId) {
  try {
    const user = await api.getUserInfo(userId);
    return user[userId]?.name || "Người Dùng";
  } catch (error) {
    console.error("Error fetching user info:", error);
    return "Người Dùng";
  }
}

module.exports = {
  name: "admin",
  author: "Nguyên Blue",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  admin: true,
  wait: 3,
  desc: "Quản lý ADMIN",
  async onCall({ client, api, message, args, event }) {
    try {
      const subCommand = args[0];

      if (subCommand === "list") {
        const config = readConfig();
        const uidAdmin = config.UID_ADMIN || [];
        const names = await Promise.all(uidAdmin.map(uid => getUserInfo(api, uid)));
        const adminList = names.map((name, index) => `${name} (${uidAdmin[index]})`).join(', ');
        api.sendMessage(`Danh sách ADMIN:\n${adminList}`, message.threadID);
      } else if (subCommand === "add") {
        if (!event.messageReply) {
          api.sendMessage('Vui lòng reply tin nhắn của người cần thêm.', message.threadID);
          return;
        }

        const userIdToAdd = event.messageReply.senderID;
        const name = await getUserInfo(api, userIdToAdd);

        let config = readConfig();
        if (!config.UID_ADMIN) {
          config.UID_ADMIN = [];
        }

        if (!config.UID_ADMIN.includes(userIdToAdd)) {
          config.UID_ADMIN.push(userIdToAdd);
          writeConfig(config);
          client.config.UID_ADMIN = config.UID_ADMIN;
          api.sendMessage(`Đã thêm ${name} (${userIdToAdd}) vào danh sách ADMIN.`, message.threadID);
        } else {
          api.sendMessage(`${name} (${userIdToAdd}) đã tồn tại trong danh sách ADMIN.`, message.threadID);
        }
      } else if (subCommand === "remove") {
        if (!event.messageReply) {
          api.sendMessage('Vui lòng reply tin nhắn của người cần xóa.', message.threadID);
          return;
        }

        const userIdToRemove = event.messageReply.senderID;
        const name = await getUserInfo(api, userIdToRemove);

        let config = readConfig();
        if (!config.UID_ADMIN) {
          config.UID_ADMIN = [];
        }

        if (config.UID_ADMIN.includes(userIdToRemove)) {
          config.UID_ADMIN = config.UID_ADMIN.filter(uid => uid !== userIdToRemove);
          writeConfig(config);
          client.config.UID_ADMIN = config.UID_ADMIN;
          api.sendMessage(`Đã xóa ${name} (${userIdToRemove}) khỏi danh sách ADMIN.`, message.threadID);
        } else {
          api.sendMessage(`${name} (${userIdToRemove}) không tồn tại trong danh sách ADMIN.`, message.threadID);
        }
      } else {
        api.sendMessage('Lệnh không hợp lệ. Các lệnh hợp lệ: list, add, remove', message.threadID);
      }
    } catch (error) {
      console.log(error);
    }
  }
};
