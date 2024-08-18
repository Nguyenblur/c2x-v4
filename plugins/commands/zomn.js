module.exports = {
  name: "zomn",
  author: "Nguyên Blue",
  category: "TOOLS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 3,
  desc: "Làm Nét Ảnh Người Thật",
  async onCall({ api, message }) {
    const FormData = require('form-data');
    const axios = require('axios');
    const fs = require('fs');

    if (!message.messageReply || !message.messageReply.attachments) {
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

    try {
      const response = await axios.get(imageAttachment.url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      const filename = './.temp/abc.jpg';
      fs.writeFileSync(filename, buffer);

      const form = new FormData();
      form.append('file', fs.createReadStream(filename));

      const headers = {
        'Content-Type': `multipart/form-data; boundary=${form.getBoundary()}`,
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
        'Origin': 'https://taoanhdep.com',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
      };

      const response2 = await axios.post('https://taoanhdep.com/public/net-anh-nguoi-2.php', form, {
        headers: headers
      });

      console.log(`API Response: ${response2.status} ${response2.statusText}`);
      console.log(`API Response Data: ${response2.data}`);

      const imageUrl = response2.data;
      if (!imageUrl) {
        return api.sendMessage("⚠️ Không thể làm nét ảnh", message.threadID);
      }

      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const outputFilename = './.temp/xyz.jpg';
      fs.writeFileSync(outputFilename, imageResponse.data);

      api.sendMessage({
        body: 'Làm Nét Thành Công!',
        attachment: fs.createReadStream(outputFilename)
      }, message.threadID);
    } catch (error) {
      console.error(error);
      return api.sendMessage("⚠️ Có lỗi xảy ra", message.threadID);
    }
  }
};