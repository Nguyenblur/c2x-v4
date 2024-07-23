const axios = require ('axios');
const regex = "https?://(www\.)?facebook\.com/.*";
module.exports = {
    name: "id",
    alias: ['uid', 'tid'],
    author: "Duy anh • Nguyên Blue [convert]",
    category: "TOOLS",
    version: "1.0",
    nopre: false,
    admin: false,
    wait: 3,
    desc: "Lấy uid/id bài viết, nhóm, người dùng",
    async onCall({ message, args }) {
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
      if (message.messageReply && message.messageReply?.body != "") {
        const match = message.messageReply?.body.match(regex);
        if (match) {
          const url = match[0];
          let res = await axios.get(`https://fbuid.mktsoftware.net/api/v1/fbprofile?url=${url}`);
          let data = res.data;
          if (data.uid && data.uid != "") msg.push(`Id từ link của tin nhắn trả lời: ${data.uid}`);
        }
        msg.push("Id ngưởi gửi tin nhắn được trả lời: " + message.messageReply.senderID);
        msg.push("Id tin nhắn được trả lời: " + message.messageReply.messageID);
      }
      if (message.isGroup) {
        msg.push("Id nhóm: " + message.threadID);
      }
      msg.push("Id của bạn: " + message.senderID);
      message.send(msg.join("\n"), message.threadID);
    }
  };
  