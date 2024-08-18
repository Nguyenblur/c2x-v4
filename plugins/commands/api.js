const fs = require('fs');
const path = require('path');
const axios = require('axios');
const jsonFilePath = path.join('./databases/cache/tiktok_girl.json');

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
        const url = args[0];
        const response = await axios.get(url);
        const newUrl = decodeURIComponent(response.request.res.responseUrl);
        const videoIdRegex = /video\/(\d+)/;
        const match = newUrl.match(videoIdRegex);
        let cleanUrl;
        if (match) {
            const videoId = match[1];
            cleanUrl = newUrl.substr(0, newUrl.indexOf(videoId) + videoId.length);
        } else {
            console.log('Video ID not found');
            return message.reply('URL không hợp lệ', message.threadID);
        }
        let currentData = readJsonFile();
        currentData.push(cleanUrl);
        writeJsonFile(currentData);
        message.reply(`Đã thêm URL ${cleanUrl} vào danh sách.`, message.threadID);
    },
};