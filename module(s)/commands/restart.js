module.exports = {
    name: "restart",
    author: "Nguyên Blue",
    category: "SYSTEMS",
    version: "1.0",
    nopre: false,
    access: 1,
    wait: 3,
    desc: "restart chatbot",
    async execute({ api, event }) {
      return api.sendMessage(`✅`, event.threadID, () => process.exit(1));
    }
  };
  