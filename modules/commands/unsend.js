module.exports = {
  name: "unsend",
  alias: ['gỡ'],
  author: "Nguyên Blue",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  admin: true,
  wait: 3,
  desc: "thu hồi tin nhắn reply",
  async onCall({ api, message }) {
    try {
      if (!message.messageReply) {
        api.sendMessage('Vui lòng reply tin nhắn cần gỡ.', message.threadID);
        return;
      }

      const messageId = message.messageReply.messageID;
      await api.unsendMessage(messageId);
    } catch (error) {
      console.log(error);
    }
  },
  async onMessage({ client, api, message }) {
    try {
     const icon = client.config.IconUnSend;
    if (message.senderID != api.getCurrentUserID()) {
        return;
      }
    if (message.type === 'message_reaction' && message.reaction === icon) {
        const messageId = message.messageID;
        await api.unsendMessage(messageId);
      }
    } catch (error) {
      console.log(error);
    }
  }
};
