const { loadMoneyData, saveMoneyData, formatMoney } = require('../../core(s)/utils/index');

const guessGames = {};
const HINT_COST = 25000;
const GAME_DURATION = 120000;

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startGuessGame(api, event) {
  const numberToGuess = getRandomNumber(1, 300);
  const game = {
    numberToGuess,
    attempts: 0,
    startTime: Date.now(),
    hintUsed: false,
    players: {},
    rewardMultiplier: [399, 299, 199, 99, 9],
    normalReward: 50000,
    timer: null
  };
  guessGames[event.threadID] = game;
  game.timer = setTimeout(() => endGame(api, event), GAME_DURATION);
}

function handleGuessInput(api, event, name) {
  const message = event.body.trim();

  if (!guessGames[event.threadID]) return;

  const game = guessGames[event.threadID];

  if (!/^\d+$/.test(message)) return;

  const guess = parseInt(message);

  if (isNaN(guess) || guess < 1 || guess > 300) {
    api.sendMessage("❌ Con số bạn đoán nằm ngoài phạm vi từ 1 đến 300.", event.threadID);
    return;
  }

  game.attempts++;

  if (guess === game.numberToGuess) {
    const rewardMultiplierIndex = Math.min(game.attempts - 1, game.rewardMultiplier.length - 1);
    const rewardMultiplier = game.rewardMultiplier[rewardMultiplierIndex];
    const rewardMoney = rewardMultiplier * game.normalReward;

    let moneyData = loadMoneyData();
    moneyData[event.senderID] = (moneyData[event.senderID] || 0) + rewardMoney;
    saveMoneyData(moneyData);

    api.sendMessage({
      body: `🎉 Chính xác! ${name} đã đoán đúng số ${game.numberToGuess} sau ${game.attempts} lần đoán.\n💰 Bạn nhận được ${formatMoney(rewardMoney)}.\n💵 Số tiền hiện tại của bạn là: ${formatMoney(moneyData[event.senderID])}`,
      mentions: [{
        tag: name,
        id: event.senderID
      }]
    }, event.threadID);

    clearTimeout(game.timer);
    delete guessGames[event.threadID];

  } else {
    const message = guess < game.numberToGuess ?
      `🔍 Số ${guess} bạn đoán nhỏ hơn số bí mật. Hãy đoán lại!` :
      `🔍 Số ${guess} bạn đoán lớn hơn số bí mật. Hãy đoán lại!`;

    api.sendMessage(message, event.threadID);
  }
}

function endGame(api, event) {
  const game = guessGames[event.threadID];
  if (!game) return;

  const { numberToGuess, attempts, startTime } = game;
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime;

  if (elapsedTime >= GAME_DURATION) {
    delete guessGames[event.threadID];

    const durationSeconds = Math.floor(elapsedTime / 1000);
    const message = `⏱️ Bạn đã hết thời gian đoán.\nSố bí mật là ${numberToGuess}. Bạn đã có ${attempts} lần đoán.\nTrò chơi đã kết thúc sau ${durationSeconds} giây.`;

    api.sendMessage(message, event.threadID);
  } else {
    const timeLeft = GAME_DURATION - elapsedTime;
    game.timer = setTimeout(() => endGame(api, event), timeLeft);
  }
}

function provideHint(api, event) {
  const game = guessGames[event.threadID];
  if (!game || game.hintUsed) return;

  const numberToGuess = game.numberToGuess;
  let hintMessage = `🔍 Gợi ý: Số cần đoán là số ${numberToGuess % 2 === 0 ? 'chẵn và ' : 'lẻ và '}${numberToGuess < 150 ? 'nhỏ hơn 150.' : 'lớn hơn 150.'}`;

  api.sendMessage(hintMessage, event.threadID);

  let moneyData = loadMoneyData();
  moneyData[event.senderID] = (moneyData[event.senderID] || 0) - HINT_COST;
  saveMoneyData(moneyData);

  api.sendMessage(`💸 Bạn đã sử dụng gợi ý và bị trừ ${formatMoney(HINT_COST)} tiền.\n💵 Số tiền hiện tại của bạn là: ${formatMoney(moneyData[event.senderID])}`, event.threadID);

  game.hintUsed = true;
}

module.exports = {
  name: "guess",
  author: "Nguyên Blue",
  category: "GAMES",
  version: "1.1",
  nopre: true,
  access: 0,
  wait: 0,
  desc: "Game đoán số",
  async execute({ api, event }) {
    if (guessGames[event.threadID]) {
      api.sendMessage("❌ Trò chơi 'Đoán số' đang diễn ra trong nhóm này. Hãy hoàn thành hoặc chờ kết thúc trước khi bắt đầu trò chơi mới.", event.threadID);
      return;
    }
    const userInfo = await api.getUserInfo(event.senderID),name = userInfo[event.senderID]?.name || 'Người Dùng';

    startGuessGame(api, event);

    api.sendMessage({
      body: `🎮 Bắt đầu trò chơi 'Đoán số'!\nHãy gửi một số từ 1 đến 300 để đoán.`,
    }, event.threadID);

    api.listenMqtt(async (err, event) => {
      if (err) {
        console.error(err);
        return;
      }

      if (event.type === "message" && event.isGroup) {
        if (event.body.toLowerCase().includes("hint")) {
          provideHint(api, event);
        } else {
          handleGuessInput(api, event, name);
        }
      }
    });
  }
};
