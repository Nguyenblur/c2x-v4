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
  async onCall({ api, message }) {
    message.react("✅");
    const startTime = Date.now();
    const msg = await message.send(`Pinging...`, message.threadID);
    const endTime = Date.now();
    const ping = endTime - startTime;
    setTimeout(async () => {
      await api.editMessage(`Ping: ${ping}ms`, msg.messageID);
    }, 3000); 
  }
};