const fs = require('fs');
const axios = require('axios');

module.exports = {
  name: "change",
  author: "Nguyên Blue",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 3,
  desc: "",
  async onCall({ api, message, args }) {
    try {
      const abc = args[0]?.toLowerCase();

      if (!abc) {
        api.sendMessage("[ HƯỚNG DẪN SỬ DỤNG ]\n1. change name [Tên mới]\n2. change image (phản hồi ảnh)\n3. change icon [Icon mới]", message.threadID);
        return;
      }

      if (abc === 'name') {
        const newName = args.slice(1).join(' ');
        if (!newName) {
          api.sendMessage("⚠️ Vui lòng nhập tên mới sau 'name'. Ví dụ: 'change name Tên mới'", message.threadID);
          return;
        }
        await api.setTitle(newName, message.threadID);
        api.sendMessage(`Đã đổi tên nhóm thành "${newName}"`, message.threadID);
      } else if (abc === 'icon') {
        const newIcon = args.slice(1).join(' ');
        if (!newIcon) {
          api.sendMessage("⚠️ Vui lòng nhập icon mới sau 'icon'. Ví dụ: 'change icon icon mới'", message.threadID);
          return;
        }
        await api.changeThreadEmoji(newIcon, message.threadID);
        api.sendMessage(`Đã icon nhóm thành "${newIcon}"`, message.threadID);
      } else if (abc === 'image') {
        if (message.type !== "message_reply" || !message.messageReply || !message.messageReply.attachments) {
          return api.sendMessage("⚠️ Hình ảnh không hợp lệ, vui lòng phản hồi một ảnh nào đó", message.threadID);
        }

        const attachments = message.messageReply.attachments;

        if (attachments.length === 0) {
          return api.sendMessage("⚠️ Không có hình ảnh được phản hồi", message.threadID);
        }

        const imageAttachment = attachments[0];

        if (!imageAttachment.url) {
          return api.sendMessage("⚠️ Không tìm thấy đường dẫn hình ảnh", message.threadID);
        }

        const response = await axios.get(imageAttachment.url, { responseType: 'stream' });

        const fileName = `./.temp/${Date.now()}_${imageAttachment.name || 'image'}.jpg`;

        const writer = fs.createWriteStream(fileName);

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        await api.changeGroupImage(fs.createReadStream(fileName), message.threadID);

        api.sendMessage("Thay đổi thành công ảnh nhóm.", message.threadID);
       }

    } catch (error) {
      console.error(error);
      api.sendMessage("Đã xảy ra lỗi khi thực hiện thay đổi.", message.threadID);
    }
  }
};
