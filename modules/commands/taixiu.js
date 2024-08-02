module.exports = {
    name: "taixiu",
    alias: ['tx'],
    author: "Hungdeeptry",
    category: "GAMES",
    version: "1.3",
    nopre: false,
    admin: false,
    wait: 3,
    desc: "Chơi tài xìu.",
    async onCall({ api, message, money, args }) {
        const { threadID, senderID, messageID } = message;
        const dataMoney = await money.check(senderID);
        const currentMoney = dataMoney.money;
        const minbet = 1;

        if (args.length < 2) {
            return api.sendMessage("Vui lòng nhập đủ số lượng tham số: <t|x> <tiền cược>.", threadID);
        }

        const bet = parseInt(args[1]);
        if (isNaN(bet) || bet <= 0) {
            return api.sendMessage("Tiền cược phải là số dương lớn hơn 0.", threadID);
        }

        if (bet < minbet) {
            return api.sendMessage(`Tiền cược tối thiểu là ${minbet}$`, threadID);
        }

        if (bet > currentMoney) {
            return api.sendMessage(`Bạn không có đủ ${bet}$ để chơi, vui lòng theo thầy Huấn bươn chải!`, threadID);
        }

        function rollDice() {
            return Math.floor(Math.random() * 6) + 1;
        }

        function playGame() {
            const dice1 = rollDice();
            const dice2 = rollDice();
            const dice3 = rollDice();
            const total = dice1 + dice2 + dice3;
            const result = (total >= 4 && total <= 10) ? 'xỉu' : 'tài';
            return {
                total,
                result,
                dice1,
                dice2,
                dice3
            };
        }

        let items = {
            "t": "tài",
            "x": "xỉu"
        };

        if (!Object.keys(items).includes(args[0])) {
            return api.sendMessage("Vui lòng chọn 't' hoặc 'x'.", threadID, messageID);
        }

        let choose = items[args[0]];

        const gameResult = playGame();

        let outcome = (gameResult.result === choose) ? 'thắng' : 'thua';

        let moneyChange = outcome === 'thắng' ? bet : -bet;

        const resultMessage = `🎲 Kết quả: ${gameResult.dice1} - ${gameResult.dice2} - ${gameResult.dice3}\nTổng điểm: ${gameResult.total}\nKết quả: ${gameResult.result}\nBạn ${outcome}!\nTiền cược: ${bet}$\n` + 
                    (outcome === 'thắng' ? `Bạn đã được cộng thêm: ${moneyChange}$` : `Bạn đã bị trừ: ${-moneyChange}$`);

        async function updateBalance(moneyChange) {
            try {
                if (moneyChange > 0) {
                    await money.add(senderID, moneyChange);
                } else if (moneyChange < 0) {
                    await money.subtract(senderID, -moneyChange);
                }
                api.sendMessage(resultMessage, threadID);
            } catch (error) {
                api.sendMessage("Có lỗi xảy ra khi cập nhật số dư.", threadID);
            }
        }

        updateBalance(moneyChange);
    }
}
