const fs = require('fs');
const path = require('path');

const jsonFilePath = path.join('./db/data/tiktok_girl.json');

function readJsonFile() {
    try {
        const jsonData = fs.readFileSync(jsonFilePath);
        return JSON.parse(jsonData);
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return [];
    }
}

function writeJsonFile(data) {
    try {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(jsonFilePath, jsonData);
    } catch (error) {
        console.error('Error writing JSON file:', error);
    }
}

module.exports = {
    name: "api",
    alias: ['json'],
    author: "Nguyên Blue",
    category: "SYSTEMS",
    version: "1.0",
    nopre: false,
    admin: true,
    wait: 3,
    desc: 'Thêm URL video TikTok vào danh sách json',
    async onCall({ message, args }) {
        if (args.length !== 1) {
            return message.reply('Hãy nhập đúng định dạng: api [url]', message.threadID);
        }

        const newUrl = args[0];

        let currentData = readJsonFile();

        currentData.push(newUrl);

        writeJsonFile(currentData);

        message.reply(`Đã thêm URL ${newUrl} vào danh sách.`, message.threadID);
    },
};