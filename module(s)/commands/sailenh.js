const axios = require("axios");
const fs = require("fs");

let globalVar = [];

module.exports = {
    name: "\n",
    author: "Nguyên Blue", // tham khảo từ dc-nam
    category: "SYSTEMS",
    version: "1.0",
    nopre: false,
    access: 1,
    wait: 3,
    desc: "thông báo khi người dùng gõ sai lệnh or không hợp lệ",
    async onLoad({ api }) {
        let someData = require('../../core(s)/database/girl.json');
        let globalStatus = false;

        global.globalVar = setInterval(async () => {
            if (globalStatus || globalVar.length > 50) return;
            globalStatus = true;

            try {
                let promises = Array.from({ length: 5 }, () => doSomething(someData[Math.floor(Math.random() * someData.length)]));
                let results = await Promise.all(promises);
                globalVar.push(...results);
            } catch (error) {
               // console.error("Error uploading video:", error);
            } finally {
                globalStatus = false;
            }
        }, 10 * 1000);

        async function streamUrl(url, type) {
            try {
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                const path = `./.temp/${Date.now()}.${type}`;
                fs.writeFileSync(path, response.data);
                setTimeout(() => fs.unlinkSync(path), 1000 * 60);
                return fs.createReadStream(path);
            } catch (error) {
                console.error("Error streaming URL:", error);
                throw error;
            }
        }

        async function doSomething(url) {
            try {
                const stream = await streamUrl(url, 'mp4');
                const uploadResponse = await api.postFormData('https://upload.facebook.com/ajax/mercury/upload.php', { upload_1024: stream });
                const metadata = JSON.parse(uploadResponse.body.replace('for (;;);', '')).payload?.metadata?.[0] || {};
                return Object.entries(metadata)[0];
            } catch (error) {
                // console.error("Error uploading video:", error);
                throw error;
            }
        }
    },

    async execute({ api, threadID }) {
        const sendMessage = async (message) => {
            try {
                const response = await api.sendMessage(message, threadID);
                return response;
            } catch (error) {
                console.error("Error sending message:", error);
                throw error;
            }
        };

        try {
            await sendMessage({ body: `🚫 Lệnh không hợp lệ.\n\n`, attachment: globalVar.splice(0, 1) });
        } catch (error) {
            console.error("Error executing command:", error);
            throw error;
        }
    }
};
