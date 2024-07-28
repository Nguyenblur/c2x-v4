const fs = require('fs');
const filePath = './db/data/antiout.txt';

module.exports = {
  name: "antiout",
  author: "Nguyên Blue",
  category: "GROUPS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 3,
  desc: "Bật/tắt auto mời lại thành viên đã tự rời nhóm.",
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
  async onMessage({ api, message }) {
    try {
      const { threadID } = message;
  
      if (!message.logMessageData || !message.logMessageData.leftParticipantFbId || !message.logMessageData.logMessageType === 'log:unsubscribe') {
        return;
      }
      const leftUserId = message.logMessageData.leftParticipantFbId;

      if (leftUserId) {
        const content = fs.readFileSync(filePath, 'utf8').trim().toLowerCase();
  
        if (content === "off") {
          return;
        }
  
        await api.addUserToGroup(leftUserId, threadID);
        const userInfo = await api.getUserInfo([leftUserId]);
        const userName = userInfo[leftUserId].name;
  
        await api.sendMessage({
          body: `✅ Đã mời thành viên ${userName} quay lại nhóm.`,
        }, threadID);
      }
    } catch (error) {
      console.error('Error in onMessage handler:', error);
      await api.sendMessage({
        body: `❎ Không thể mời lại thành viên vừa out quay lại nhóm.`,
      }, message.threadID);
    }
  }  
};