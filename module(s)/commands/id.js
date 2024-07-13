const axios = require ('axios');
const regex = "https?://(www\.)?facebook\.com/.*";
module.exports = {
    name: "id",
    author: "Nguyên Blue", // convert từ dino bot: duy anh
    category: "SYSTEMS",
    version: "1.0",
    nopre: false,
    access: 1,
    wait: 3,
    desc: "Lấy uid/id bài viết, nhóm, người dùng",
    async execute({ api, event, args }) {
      let msg = []
      if (args.length > 0) {
        const match = args[0].match(regex);
        if (match) {
          const url = match[0];
          let res = await axios.get(`https://fbuid.mktsoftware.net/api/v1/fbprofile?url=${url}`);
          let data = res.data;
          if (data.uid && data.uid != "") msg.push(`🔗 Id từ link: ${data.uid}`);
        }
      }
      if (event.messageReply && event.messageReply?.body != "") {
        const match = event.messageReply?.body.match(regex);
        if (match) {
          const url = match[0];
          let res = await axios.get(`https://fbuid.mktsoftware.net/api/v1/fbprofile?url=${url}`);
          let data = res.data;
          if (data.uid && data.uid != "") msg.push(`Id từ link của tin nhắn trả lời: ${data.uid}`);
        }
        msg.push("Id ngưởi gửi tin nhắn được trả lời: " + event.messageReply.event.senderID);
        msg.push("Id tin nhắn được trả lời: " + event.messageReply.messageID);
      }
      if (event.isGroup) {
        msg.push("Id nhóm: " + event.threadID);
      }
      msg.push("Id của bạn: " + event.senderID);
      api.sendMessage(msg.join("\n"), event.threadID);
    }
  };
  