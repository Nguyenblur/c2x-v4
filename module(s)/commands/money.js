const { loadMoneyData, saveMoneyData, formatMoney } = require('../../core(s)/utils/money');

module.exports = {
  name: "money",
  author: "Nguyên Blue",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  access: 0,
  wait: 3,
  desc: "Dùng để check money user",
  async execute({api, senderName, senderID, threadID}) {
    const moneyData = loadMoneyData();

    if (moneyData[senderID]) {
      api.sendMessage({
        body: `👉 Số tiền hiện tại của ${senderName} là: ${formatMoney(moneyData[senderID])}`,
        mentions: [{
          tag: senderName,
          id: senderID
        }]
      }, threadID);
     } else {

   api.sendMessage({
        body: `${senderName} còn đúng cái nịt!`,
        mentions: [{
          tag: senderName,
          id: senderID
        }]
      }, threadID);    }
  }
};
