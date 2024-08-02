const axios = require("axios");
module.exports = {
  name: "ip",
  author: "NTKhang, Nguyên Blue [convert]",
  category: "TOOLS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 3,
  desc: "Check info ip",
  async onCall({ api, message, args }) {
    if (!args[0]) {api.sendMessage("❎ Vui lòng nhập ip bạn muốn kiểm tra",message.threadID, message.messageID);}
    else {
  var infoip = (await axios.get(`http://ip-api.com/json/${args.join(' ')}?fields=66846719`)).data;
         if (infoip.status == 'fail')
           {api.sendMessage(`⚠️ Đã xảy ra lỗi: ${infoip.message}`, message.threadID, message.messageID)}
            else {
   api.sendMessage({body:`🗺️ Châu lục: ${infoip.continent}\n🏳️ Quốc gia: ${infoip.country}\n🎊 Mã QG: ${infoip.countryCode}\n🕋 Khu vực: ${infoip.region}\n⛱️ Vùng/Tiểu bang: ${infoip.regionName}\n🏙️ Thành phố : ${infoip.city}\n🛣️ Quận/Huyện: ${infoip.district}\n📮 Mã bưu chính: ${infoip.zip}\n🧭 Latitude: ${infoip.lat}\n🧭 Longitude: ${infoip.lon}\n⏱️ Timezone: ${infoip.timezone}\n👨‍✈️ Tên tổ chức: ${infoip.org}\n💵 Đơn vị tiền tệ: ${infoip.currency}`,location: {
          latitude: infoip.lat,
          longitude: infoip.lon,
          current: true
        }}
  , message.threadID, message.masageID);}
      }
  }
};