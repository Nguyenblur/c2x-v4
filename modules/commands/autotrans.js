const fs = require('fs');
const axios = require('axios');

const filePath = './db/data/autotrans.txt';

const isEmoji = (text) => {
  const emojiPattern = /\p{Emoji}/u;
  return emojiPattern.test(text);
};

const startsWithSpecialCharacter = (text) => {
  const specialCharacters = "?!)(+-&_/*\"':;,.=^><~•";
  const firstChar = text.charAt(0);
  return specialCharacters.includes(firstChar);
};

module.exports = {
  name: "autotrans",
  author: "Nguyên Blue",
  category: "GROUPS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 3,
  desc: "bật/tắt auto dịch khi tin nhắn không phải tiếng Việt.",

  async onCall({ api, message, args }) {
    try {
      if (args[0] === "on") {
        fs.writeFileSync(filePath, 'on', 'utf8');
        await api.sendMessage("✅", message.threadID);
      } else if (args[0] === "off") {
        fs.writeFileSync(filePath, 'off', 'utf8');
        await api.sendMessage("💤", message.threadID);
      } else {
        await api.sendMessage("ON/OFF", message.threadID);
      }
    } catch (error) {
      console.error(error);
    }
  }, 

  async onMessage({ api, message }) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8').trim().toLowerCase();

      if (content === "on") {
          const { body, threadID } = message;

          if (!body) return;
          
          if (isEmoji(body)) {
              return;
          }


          if (startsWithSpecialCharacter(body)) {
              return;
          }

          const detectLangUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(body)}`;
          const detectLangResponse = await axios.get(detectLangUrl);
          const detectedLang = detectLangResponse.data[2];

          if (detectedLang !== "vi") {
              const targetLang = "vi";
              const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${detectedLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(body)}`;
              const translationResponse = await axios.get(translateUrl);
              const translation = translationResponse.data[0].map(item => item[0]).join("");

              api.sendMessage(`Đã dịch từ ${detectedLang} sang tiếng Việt:\n${translation}`, threadID);
          }
      } else {
          return; 
      }
  } catch (error) {
      console.error(error);
  }
  }  
};
