module.exports = {
    name: "rs",
    author: "Nguyên Blue",
    category: "SYSTEMS",
    version: "1.0",
    nopre: false,
    access: 1,
    wait: 3,
    desc: "restart chatbot",
    async execute({ api, threadID }) {
      return api.sendMessage(`✅`, threadID, () => process.exit(1));
    }
  };
  