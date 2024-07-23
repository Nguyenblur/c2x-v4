module.exports = {
  name: "restart",
  alias: ['rs'],
  author: "Nguyên Blue",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  admin: true,
  wait: 3,
  desc: "restart chatbot",
  async onCall({ message }) {
    message.react("✅");
    await message.send(`🚀 Tiến hành khởi động lại...`, message.threadID);
    process.exit(1);
  }
};