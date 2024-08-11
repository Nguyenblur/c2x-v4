const axios = require('axios');

// Danh sách các loại token hợp lệ
const validTokenTypes = [
  "EAAAAU",    // Token App Facebook Katana Android
  "EAADo1",    // Token app Messenger Android
  "EAAAAA",    // Token app Facebook Iphone
  "EAADYP",    // Token app Messenger Iphone
  "EAAD6V7",   // Token app Facebook Lite
  "EAAC2S",    // Token app Messenger Lite
  "EAAGOf",    // Token ADS Manager Android
  "EAAVBz",    // Token ADS Manager Iphone
  "EAAC4c",    // Token Iphone Dev
  "EAACW5",    // Token Page Facebook IOS
  "EAABu2",    // Token Page Facebook Android
  "EAAQr1",    // Token Page Facebook Windowns
  "EAAGNO",    // Token Business Manager
  "EAAHbH",    // Token Messenger Kis IOS
  "EAACng",    // Token Messenger House IOS
  "EAACeH"     // Token Facebook IPAD
];

module.exports = {
  name: "gettoken",
  author: "Nguyên Blue",
  category: "TOOLS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 3,
  desc: "Dùng để lấy token nhiều dạng khác nhau.",
  async onCall({ message, args }) {
    if (args.length < 2) {
      return message.send("Bạn phải cung cấp cả cookie và loại token để lấy token.\n\ncác loại token hợp lệ\nEAAAAU, EAADo1, EAAAAA, EAADYP, EAAD6V7, EAAC2S, EAAGOf, EAAVBz, EAAC4c, EAACW5, EAABu2, EAAQr1, EAAGNO, EAAHbH, EAACng, EAACeH", message.threadID);
    }

    const cookie = args[0];
    const type = args[1];

    if (!validTokenTypes.includes(type)) {
      return message.send("Loại token không hợp lệ. Vui lòng chọn từ danh sách token được hỗ trợ:\n\n" +
        "EAAAAU: Token App Facebook Katana Android\n" +
        "EAADo1: Token app Messenger Android\n" +
        "EAAAAA: Token app Facebook Iphone\n" +
        "EAADYP: Token app Messenger Iphone\n" +
        "EAAD6V7: Token app Facebook Lite\n" +
        "EAAC2S: Token app Messenger Lite\n" +
        "EAAGOf: Token ADS Manager Android\n" +
        "EAAVBz: Token ADS Manager Iphone\n" +
        "EAAC4c: Token Iphone Dev\n" +
        "EAACW5: Token Page Facebook IOS\n" +
        "EAABu2: Token Page Facebook Android\n" +
        "EAAQr1: Token Page Facebook Windowns\n" +
        "EAAGNO: Token Business Manager\n" +
        "EAAHbH: Token Messenger Kis IOS\n" +
        "EAACng: Token Messenger House IOS\n" +
        "EAACeH: Token Facebook IPAD", message.threadID);
    }

    try {
      const response = await axios.get(`https://alotoi.com/fb/?cookie=${cookie}&type=${type}`);
      const data = response.data.token;

      message.send(data, message.threadID);
    } catch (error) {
      console.error(error);
      message.send("Đã xảy ra lỗi khi lấy token.", message.threadID);
    }
  }
};