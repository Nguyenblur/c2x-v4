const axios = require("axios");
const fs = require("fs-extra");
const characterData = require('../../db/data/tad/data.json');
const { loadImage, createCanvas, registerFont } = require("canvas");
module.exports = {
  name: "uptime",
  alias: ['up', 'upt'],
  author: "Nguyên Blue, data từ mirai-team",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 3,
  desc: "Xem thời gian uptime của hệ thống",
  async onCall({ api, message, args }) {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const formattedHours = hours < 10 ? '0' + hours : hours;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;

    const fontDirectory = './db/data/tad/';

    const characterId = args[0] ? args[0] : Math.floor(Math.random() * 848) + 1;

    const backgroundPath = fontDirectory + 'back_uptime.png';
    const avatarPath = fontDirectory + `${message.senderID}.png`;

    const backgroundUrl = 'https://i.imgur.com/bUhWCoU.png';
    if (!fs.existsSync(backgroundPath)) {
      const backgroundImage = (await axios.get(encodeURI(backgroundUrl), { responseType: "arraybuffer" })).data;
      fs.writeFileSync(backgroundPath, Buffer.from(backgroundImage));
    }

    const avatarUrl = encodeURI(characterData[characterId].imgAnime);
    if (!fs.existsSync(avatarPath)) {
      const avatarImage = (await axios.get(avatarUrl, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(avatarPath, Buffer.from(avatarImage));
    }

    const avatarImage = await loadImage(avatarPath);
    const backgroundImage = await loadImage(backgroundPath);
    const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = characterData[characterId].colorBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(avatarImage, -200, -200, 1200, 1200);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    registerFont(fontDirectory + 'UTM-Avo.ttf', { family: "UTM" });
    ctx.font = "40px UTM";
    ctx.fillStyle = "#000000";
    ctx.fillText(`${formattedHours} : ${formattedMinutes} : ${formattedSeconds}`, 815, 295);

    registerFont(fontDirectory + 'CaviarDreams.ttf', { family: "time" });
    ctx.font = "40px time";1
    // ctx.fillText(`#${characterId}`, 8, 70);
    const finalImageBuffer = canvas.toBuffer();
    fs.writeFileSync(backgroundPath, finalImageBuffer);

    return api.sendMessage({
      body: `${hours} hours ${minutes} minutes ${seconds} seconds`,
      attachment: fs.createReadStream(backgroundPath)
    }, message.threadID, () => {
      fs.unlinkSync(backgroundPath);
      fs.unlinkSync(avatarPath);
    }, message.messageID);
  }
};