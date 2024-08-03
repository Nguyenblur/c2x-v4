const axios = require('axios');
const fs = require('fs');

module.exports = {
  name: "ghep",
  author: "Nguyên Blue",
  category: "GROUPS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 3,
  desc: "Ghép đôi với một người ngẫu nhiên có giới tính ngược lại trong nhóm.",
  async onCall({ api, message }) {
    try {
      if (!message.isGroup) {
        return;
      }

      const threadInfo = await api.getThreadInfo(message.threadID);
      const senderInfo = threadInfo.userInfo.find(info => info.id === message.senderID);

      if (!senderInfo) {
        return;
      }

      const senderGender = senderInfo.gender;

      const filteredUserInfo = threadInfo.userInfo.filter(info => info.id !== message.senderID);

      const oppositeGenderUserInfo = filteredUserInfo.filter(info => info.gender !== senderGender);

      if (oppositeGenderUserInfo.length === 0) {
        return api.sendMessage("Không tìm thấy người dùng có giới tính ngược lại trong nhóm.", message.threadID);
      }

      const randomIndex = Math.floor(Math.random() * oppositeGenderUserInfo.length);
      const matchInfo = oppositeGenderUserInfo[randomIndex];

      if (matchInfo.gender === senderGender) {
        return;
      }

      const senderName = senderInfo.name;
      const matchName = matchInfo.name;
      const matchUserID = matchInfo.id;

      const tile = Math.floor(Math.random() * 101);

      const tempDir = './.temp';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      const [avatar1, avatar2] = await Promise.all([
        axios.get(`https://graph.facebook.com/${message.senderID}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
        axios.get(`https://graph.facebook.com/${matchUserID}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
      ]);

      fs.writeFileSync(`${tempDir}/avt.png`, Buffer.from(avatar1.data, "binary"));
      fs.writeFileSync(`${tempDir}/avt2.png`, Buffer.from(avatar2.data, "binary"));

      const messageContent = `⚡️ Ghép đôi thành công!\n⚡️ Tỉ lệ hợp đôi: ${tile}%\n${senderName} 💓 ${matchName}`;

      const messageData = {
        body: messageContent,
        mentions: [
          { tag: senderName, id: message.senderID },
          { tag: matchName, id: matchUserID }
        ],
        attachment: [
          fs.createReadStream(`${tempDir}/avt.png`),
          fs.createReadStream(`${tempDir}/avt2.png`)
        ]
      };

      api.sendMessage(messageData, message.threadID);

    } catch (error) {
      console.error("Error in ghep command:", error.message);
      api.sendMessage(`Đã xảy ra lỗi trong quá trình ghép đôi: ${error.message}`, message.threadID);
    }
  }
};