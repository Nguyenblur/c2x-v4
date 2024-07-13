const { loadMoneyData, saveMoneyData, formatMoney } = require('../../core(s)/utils/index');

module.exports = {
  name: "money",
  author: "Nguyên Blue",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  access: 0,
  wait: 3,
  desc: "Dùng để check money user",
  async execute({api, event }) {
    const moneyData = loadMoneyData();
    const userInfo = await api.getUserInfo(event.senderID),name = userInfo[event.senderID]?.name || 'Người Dùng';

    if (moneyData[event.senderID]) {
      api.sendMessage({
        body: `👉 Số tiền hiện tại của ${name} là: ${formatMoney(moneyData[event.senderID])}`,
        mentions: [{
          tag: name,
          id: event.senderID
        }]
      }, event.threadID);
     } else {

   api.sendMessage({
        body: `${name} còn đúng cái nịt!`,
        mentions: [{
          tag: name,
          id: event.senderID
        }]
      }, event.threadID);    }
  }
};
