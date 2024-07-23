const axios = require('axios');
const fs = require('fs');

let globalVar = [];

async function fetchTikTokVideo(url) {
    try {
        const host = 'https://www.tikwm.com';
        const res = await axios.get(`${host}/api`, {
            params: {
                url: url,
                count: 12,
                cursor: 0,
                hd: 1
            }
        });

        if (!res.data || !res.data.data || (!res.data.data.hdplay && !res.data.data.play)) {
            return null;
        }

        return res.data.data.hdplay || res.data.data.play;
    } catch (error) {
        // console.error(error);
        throw error;
    }
}

async function downloadAndStream(url, type) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const path = `./.temp/${Date.now()}.${type}`;
        fs.writeFileSync(path, response.data);
        setTimeout(() => fs.unlinkSync(path), 1000 * 60); 
        return fs.createReadStream(path);
    } catch (error) {
        console.error("Error downloading/streaming URL:", error);
        throw error;
    }
}

async function processVideo(url, api) {
    try {
        const videoUrl = await fetchTikTokVideo(url);

        if (!videoUrl) {
            return null;
        }

        const stream = await downloadAndStream(videoUrl, 'mp4');
        const uploadResponse = await api.postFormData('https://upload.facebook.com/ajax/mercury/upload.php', { upload_1024: stream });
        const metadata = JSON.parse(uploadResponse.body.replace('for (;;);', '')).payload?.metadata?.[0] || {};
        return Object.entries(metadata)[0];
    } catch (error) {
        // console.error("Error processing video:", error);
        throw error;
    }
}

async function fetchAndProcessData(api) {
    try {
        let someData = require('../../db/data/tiktok_girl.json');
        let randomIndex = Math.floor(Math.random() * someData.length);
        let randomUrl = someData[randomIndex];

        const videoMetadata = await processVideo(randomUrl, api);
        if (videoMetadata) {
            globalVar.push(videoMetadata);
        }
    } catch (error) {
       // console.error("Error processing TikTok data:", error);
    }
}

module.exports = {
    name: "\n",
    author: "Nguyên Blue",
    category: "SYSTEMS",
    version: "1.0",
    desc: "Thông báo khi người dùng gõ sai lệnh hoặc không hợp lệ kèm send video nhanh",

    onLoad({ api }) {
        fetchAndProcessData(api); 
        setInterval(() => fetchAndProcessData(api), 30000); 
    },

    async onCall({ message }) {
        try {
            await message.reply({ body: "🚫 Lệnh không hợp lệ.", attachment: globalVar.splice(0, 1) }, message.threadID);
        } catch (error) {
            console.error("Error executing command:", error);
            throw error;
        }
    }
};
