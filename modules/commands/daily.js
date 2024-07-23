const fs = require('fs');
const path = require('path');

const dataFilePath = path.resolve('./db/data/daily.json');

function loadData() {
    try {
        const fileData = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(fileData);
    } catch (error) {
        if (error.code === 'ENOENT') {
             saveData({});
            return {}; 
        } else {
            console.error(`Error loading data: ${error.message}`);
            return {}; 
        }
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error saving data: ${error.message}`);
    }
}


function getLastReceivedTime(userId) {
    const data = loadData();
    return data[userId]?.lastReceivedTime || null;
}

function setLastReceivedTime(userId, time) {
    let data = loadData();
    data[userId] = { ...data[userId], lastReceivedTime: time };
    saveData(data);
}

module.exports = {
    name: "daily",
    alias: ['work'],
    author: "Nguyên Blue",
    category: "SYSTEMS",
    version: "1.0",
    nopre: false,
    admin: false,
    wait: 3,
    desc: "Lệnh hàng ngày để nhận tiền mỗi 30 phút.",
    async onCall({ message, user, money }) {
        try {
            const senderID = message.senderID;
            const userName = (await user(senderID))?.name;

            const lastReceivedTime = getLastReceivedTime(senderID);
            const now = new Date();
            
            if (!lastReceivedTime || (now - new Date(lastReceivedTime)) >= 30 * 60000) {
                await money.add(senderID, 200);
                setLastReceivedTime(senderID, now);

                message.send({
                    body: `✅ ${userName} đã nhận 200 USD. Hãy quay lại sau 30 phút để nhận tiếp.`,
                }, message.threadID);
            } else {
                const minutesUntilNextClaim = Math.ceil((30 * 60000 - (now - new Date(lastReceivedTime))) / 60000);
                message.send({
                    body: `⏳ ${userName} cần đợi khoảng ${minutesUntilNextClaim} phút để tiếp tục nhận tiền.`,
                }, message.threadID);
            }
        } catch (error) {
            message.send(`❌ Lỗi: ${error.message}`, message.threadID);
        }
    },
};