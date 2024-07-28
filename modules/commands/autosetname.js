const fs = require('fs');

const pathData = './db/data/autosetname.json';

module.exports = {
  name: "autosetname",
  author: "Nguyên Blue",
  category: "GROUPS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 3,
  desc: "Auto set biệt danh khi có thành viên mới vào nhóm.",

  onLoad() {
    try {
      if (!fs.existsSync(pathData)) {
        fs.writeFileSync(pathData, "[]", "utf-8");
      }
    } catch (error) {
      console.error("Error during onLoad:", error);
    }
  },

  async onCall({ api, message, args }) {
    const { threadID, messageID } = message;
    const content = args.slice(1).join(" ");

    try {

      let dataJson = JSON.parse(fs.readFileSync(pathData, "utf-8"));
      let thisThread = dataJson.find(item => item.threadID == threadID) || { threadID, nameUser: [] };

      switch (args[0]) {
        case "add": {
          if (content.length === 0) {
            return api.sendMessage("Phần cấu hình tên thành viên mới không được bỏ trống!", threadID, messageID);
          }
          if (thisThread.nameUser.length > 0) {
            return api.sendMessage("Vui lòng xóa cấu hình tên cũ trước khi đặt tên mới!!!", threadID, messageID);
          }
          thisThread.nameUser.push(content);
          api.sendMessage(`Đặt cấu hình tên thành viên mới thành công\n Preview: ${content}`, threadID, messageID);
          break;
        }
        case "rm":
        case "remove":
        case "delete": {
          if (thisThread.nameUser.length === 0) {
            return api.sendMessage("Nhóm bạn chưa đặt cấu hình tên thành viên mới!!", threadID, messageID);
          }
          thisThread.nameUser = [];
          api.sendMessage(`Xóa thành công phần cấu hình tên thành viên mới`, threadID, messageID);
          break;
        }
        default: {
          api.sendMessage(`Dùng: autosetname add <name> để cấu hình biệt danh cho thành viên mới\nDùng: autosetname remove để xóa cấu hình đặt biệt danh cho thành viên mới`, threadID, messageID);
        }
      }

      const index = dataJson.findIndex(item => item.threadID === threadID);
      if (index === -1) {
        dataJson.push(thisThread);
      } else {
        dataJson[index] = thisThread;
      }
      fs.writeFileSync(pathData, JSON.stringify(dataJson, null, 4), "utf-8");
    } catch (error) {
      console.error("Error during onCall:", error);
      api.sendMessage(`Đã xảy ra lỗi: ${error.message}`, threadID, messageID);
    }
  },

  async onMessage({ api, message }) {
    const { threadID } = message;
    if (message.logMessageData && message.logMessageData.addedParticipants) {
        if (!fs.existsSync(pathData)) {
          fs.writeFileSync(pathData, "[]", "utf-8");
        }

        let dataJson = JSON.parse(fs.readFileSync(pathData, "utf-8"));
        let thisThread = dataJson.find(item => item.threadID == threadID) || { threadID, nameUser: [] };

        if (thisThread.nameUser.length !== 0) {
          const setName = thisThread.nameUser[0];
          const threadInfo = await api.getThreadInfo(threadID);

          const memJoin = message.logMessageData.addedParticipants.map(info => info.userFbId);

          for (const idUser of memJoin) {
            const senderInfo = threadInfo.userInfo.find(info => info.id === idUser)?.name;
            if (senderInfo) {
              await api.changeNickname(`${senderInfo} ${setName}`, threadID, idUser).catch(err => {
                console.error(err);
              });
              api.sendMessage({
                body: `Đã đặt biệt danh cho thành viên mới: ${senderInfo} ${setName}`,
              }, threadID);
            }
          }
        }
    }
  }
};
