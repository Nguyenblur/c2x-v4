module.exports = {
  name: "reload",
  alias: ['rl'],
  author: "Nguyên Blue",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  admin: true,
  wait: 3,
  desc: "reload commands và events",
async onCall({ client, api, reload, message }) {
    try {
        await reload(api);
        message.react("✅");
        message.send(`🔥 Đã reload thành công\n🚀 ${client.commands.length} lệnh\n👾 ${client.events.length} sự kiện`, message.threadID);
    } catch (err) {
        console.error(err);
        message.send('❎', message.threadID);
    }
  }
};