const fs = require('fs');

const moneyFilePath = './core(s)/database/money.json';

function formatMoney(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function loadMoneyData() {
  try {
    if (fs.existsSync(moneyFilePath)) {
      const data = fs.readFileSync(moneyFilePath, 'utf8');
      return JSON.parse(data);
    } else {
      const emptyData = {};
      saveMoneyData(emptyData); 
      return emptyData;
    }
  } catch (err) {
    console.error('Error loading money data:', err);
    return {};
  }
}

function saveMoneyData(moneyData) {
  try {
    const data = JSON.stringify(moneyData, null, 2);
    fs.writeFileSync(moneyFilePath, data, 'utf8');
  } catch (err) {
    console.error('Error saving money data:', err);
  }
}

if (!fs.existsSync(moneyFilePath)) {
  saveMoneyData({});
}

module.exports = {
  loadMoneyData,
  saveMoneyData,
  formatMoney
};
