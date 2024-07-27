const fs = require('fs');
const moment = require('moment-timezone');
const path = './db/data/checktt/';

module.exports = {
  name: "logEvent",
  author: "Nguyên Blue",
  version: "1.0",
  desc: "Ghi log tương tác thành viên của nhóm.",
  async onMessage({ message }) {
    try {
      if (!message.isGroup && message.logMessageType !== 'log:subscribe') return;
      const today = moment.tz("Asia/Ho_Chi_Minh");
      const dayOfWeek = today.day();
      const thisMonth = today.month();

      if (!fs.existsSync(path + message.threadID + '.json')) {
        const newObj = {
          total: [],
          week: [],
          day: [],
          month: [],
          time: dayOfWeek, 
          monthTime: thisMonth,
          last: {
            time: dayOfWeek,
            day: [],
            week: [],
            month: [],
          },
          recentInteractions: {},
          timeToJoinTheGroup: {},
        };
        fs.writeFileSync(path + message.threadID + '.json', JSON.stringify(newObj, null, 4));
      }

      let newObj = JSON.parse(fs.readFileSync(path + message.threadID + '.json'));

      newObj.timeToJoinTheGroup = newObj.timeToJoinTheGroup || {}; 
      if (message.logMessageData && message.logMessageData.addedParticipants) {
        const addedParticipants = message.logMessageData.addedParticipants;
        if (Array.isArray(addedParticipants)) {
          addedParticipants.forEach(participant => {
            const uid = participant.userFbId;
            if (!uid) return;
            newObj.timeToJoinTheGroup[uid] = Date.now();
          });
        }
      }
      
      const UserIDs = Array.isArray(message.senderID) ? message.senderID : [message.senderID];
      newObj.recentInteractions = newObj.recentInteractions || {};
      UserIDs.forEach(uid => {
        if (!uid) return;
        newObj.recentInteractions[uid] = Date.now();

        newObj.total = updateInteractionCount(newObj.total, uid);
        newObj.week = updateInteractionCount(newObj.week, uid);
        newObj.day = updateInteractionCount(newObj.day, uid);
        newObj.month = updateInteractionCount(newObj.month, uid);
      });

      fs.writeFileSync(path + message.threadID + '.json', JSON.stringify(newObj, null, 4));

    } catch (error) {
      console.error('Error in execute function:', error);
    }
  },

  async onLoad({ api }) {
    if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
      fs.mkdirSync(path, { recursive: true });
    }

    setInterval(() => {
      const today = moment.tz("Asia/Ho_Chi_Minh");
      const dayOfWeek = today.day();
      const thisMonth = today.month();
      const checkttData = fs.readdirSync(path);

      checkttData.forEach(file => {
        try {
          var fileData = JSON.parse(fs.readFileSync(path + file));
        } catch (error) {
          console.error('Error reading or parsing file:', error);
          return fs.unlinkSync(path + file);
        }

        if (fileData.time !== dayOfWeek) {
          fileData.time = dayOfWeek;
          fileData.day = [];
          if (dayOfWeek === 0) {
            fileData.week = [];
          }

          if (fileData.monthTime !== thisMonth) {
            fileData.monthTime = thisMonth;
            fileData.month = [];
          }

          fs.writeFileSync(path + file, JSON.stringify(fileData, null, 4));
        }
      });
    }, 60 * 1000);
  }
};

function updateInteractionCount(array, userId) {
  const existingUser = array.find(item => item.id === userId);
  if (existingUser) {
    existingUser.count++;
  } else {
    array.push({ id: userId, count: 1 });
  }
  return array;
}
