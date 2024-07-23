module.exports = {
    name: "money",
    author: "Nguyên Blue",
    category: "SYSTEMS",
    version: "1.0",
    nopre: false,
    admin: false,
    wait: 3,
    desc: "Module để quản lý tiền của người dùng.",
    async onCall({ message, args, money, user }) {
        try {

            const senderID = message.senderID;
            const userName = (await user(senderID)).name;
            let action = '';
            if (args.length >= 1) {
                action = args[0].toLowerCase();
            }

            switch (action) {
                case 'add':
                    if (!args[1] || isNaN(parseFloat(args[1]))) {
                        message.send('Số tiền cần thêm không hợp lệ.', message.threadID);
                    }
                    const addAmount = parseFloat(args[1]);
                    await money.add(senderID, addAmount);
                    message.send({
                        body: `✅ Đã thêm ${addAmount} USD cho ${userName}.`,
                        mentions: [{ tag: userName, id: senderID }]
                    }, message.threadID);
                    break;
                case 'subtract':
                    if (!args[1] || isNaN(parseFloat(args[1]))) {
                        message.send('Số tiền cần trừ không hợp lệ.', message.threadID);
                    }
                    const subtractAmount = parseFloat(args[1]);
                    await money.subtract(senderID, subtractAmount);
                    message.send({
                        body: `✅ Đã trừ ${subtractAmount} USD của ${userName}.`,
                        mentions: [{ tag: userName, id: senderID }]
                    }, message.threadID);
                    break;
                case 'check':
                    message.send({
                        body: `💰 Số tiền hiện tại của ${userName}: ${await money.check(senderID)} USD`,
                        mentions: [{ tag: userName, id: senderID }]
                    }, message.threadID);
                    break;
                default:
                    message.send(`add, subtract, check`, message.threadID);
            }

        } catch (error) {
            message.send(`❌ Lỗi: ${error.message}`, message.threadID);
        }
    }
};
