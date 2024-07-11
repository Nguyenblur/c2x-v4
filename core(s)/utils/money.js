const fs = require('fs');
const Hjson = require('hjson');

const moneyFilePath = './database/moneyMap.hjson';

function formatMoney(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function loadMoneyData() {
  try {
    if (fs.existsSync(moneyFilePath)) {
      const data = fs.readFileSync(moneyFilePath, 'utf8');
      return Hjson.parse(data);
    } else {
      fs.writeFileSync(moneyFilePath, '{}', 'utf8');
      return {};
    }
  } catch (err) {
    console.error('Error loading money data:', err);
    return {};
  }
}

function saveMoneyData(moneyData) {
  try {
    const data = Hjson.stringify(moneyData, { keepWsc: true });
    fs.writeFileSync(moneyFilePath, data, 'utf8');
    } catch (err) {
    console.error('Error saving money data:', err);
  }
}

module.exports = {
  loadMoneyData,
  saveMoneyData,
  formatMoney
};
