module.exports = {
  name: "ping",
  alias: ['pong'],
  author: "Nguyên Blue",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 3,
  desc: "Check ping",
  lang: {
   vi: {
    a: 'Đang tải...',
    b: 'Ping: $1 ms'
   },
   en: {
    a: 'Loading...',
    b: 'Ping: $1 ms'
   }
  },
  async onCall({ api, message, getText }) {
    message.react("✅");
    const startTime = Date.now();
    const msg = await message.send(getText('a'), message.threadID);
    const endTime = Date.now();
    const ping = endTime - startTime;
    setTimeout(async () => {
      await api.editMessage(getText('b', ping), msg.messageID);
    }, 3000); 
  }
};