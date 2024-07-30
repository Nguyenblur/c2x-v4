const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

module.exports = {
  name: 'anime',
  author: 'Nguyên Blue',
  category: 'FUNS',
  version: '1.0',
  nopre: false,
  admin: true,
  wait: 3,
  desc: 'kho ảnh anime khổng lồ từ waifu',
  async onCall({ api, message }) {
    const url = 'https://waifu.im';
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const imageUrl = $('div.zoom img').last().attr('src');

      if (!imageUrl) {
        return;
      }

      const imagePath = './.temp/anime.jpg';

      const imageWriter = fs.createWriteStream(imagePath);
      const response = await axios.get(imageUrl, { responseType: 'stream' });
      response.data.pipe(imageWriter);

      imageWriter.on('finish', () => {
        api.sendMessage({
          attachment: fs.createReadStream(imagePath),
        }, message.threadID, () => {
          fs.unlinkSync(imagePath);
        });
      });
    } catch (error) {
      console.error(error);
    }
  },
};
