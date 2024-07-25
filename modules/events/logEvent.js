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
      });

      if (newObj.time !== dayOfWeek || (dayOfWeek === 0 && newObj.week.length === 0)) {
        newObj.time = dayOfWeek;
        newObj.week = [];
      }

      if (newObj.monthTime !== thisMonth) {
        newObj.monthTime = thisMonth;
        newObj.month = [];
      }

      if (message.body) {
        const UserIDs = message.participantIDs || [];

        for (const user of UserIDs) {
          if (!newObj.last) {
            newObj.last = {
              time: dayOfWeek,
              day: [],
              week: [],
              month: [],
            };
          }

          if (!newObj.last.week.find(item => item.id === user)) {
            newObj.last.week.push({
              id: user,
              count: 0
            });
          }

          if (!newObj.last.day.find(item => item.id === user)) {
            newObj.last.day.push({
              id: user,
              count: 0
            });
          }

          if (!newObj.last.month.find(item => item.id === user)) {
            newObj.last.month.push({
              id: user,
              count: 0
            });
          }

          if (!newObj.total.find(item => item.id === user)) {
            newObj.total.push({
              id: user,
              count: 0
            });
          }

          if (!newObj.week.find(item => item.id === user)) {
            newObj.week.push({
              id: user,
              count: 0
            });
          }

          if (!newObj.day.find(item => item.id === user)) {
            newObj.day.push({
              id: user,
              count: 0
            });
          }

          if (!newObj.month.find(item => item.id === user)) {
            newObj.month.push({
              id: user,
              count: 0
            });
          }
        }
      }

      fs.writeFileSync(path + message.threadID + '.json', JSON.stringify(newObj, null, 4));

      const threadData = JSON.parse(fs.readFileSync(path + message.threadID + '.json'));

      const userData_week_index = threadData.week.findIndex(e => e.id === message.senderID);
      const userData_day_index = threadData.day.findIndex(e => e.id === message.senderID);
      const userData_month_index = threadData.month.findIndex(e => e.id === message.senderID);
      const userData_total_index = threadData.total.findIndex(e => e.id === message.senderID);

      if (userData_total_index === -1) {
        threadData.total.push({
          id: message.senderID,
          count: 1,
        });
      } else {
        threadData.total[userData_total_index].count++;
      }

      if (userData_week_index === -1) {
        threadData.week.push({
          id: message.senderID,
          count: 1
        });
      } else {
        threadData.week[userData_week_index].count++;
      }

      if (userData_day_index === -1) {
        threadData.day.push({
          id: message.senderID,
          count: 1
        });
      } else {
        threadData.day[userData_day_index].count++;
      }

      if (userData_month_index === -1) {
        threadData.month.push({
          id: message.senderID,
          count: 1
        });
      } else {
        threadData.month[userData_month_index].count++;
      }

      let p = message.participantIDs;

      if (!!p && p.length > 0) {
        p = p.map($ => $ + '');
        ['day', 'week', 'month', 'total'].forEach(t => threadData[t] = threadData[t].filter($ => p.includes($.id + '')));
      }

      fs.writeFileSync(path + message.threadID + '.json', JSON.stringify(threadData, null, 4));
    } catch (error) {
      console.error('Error in execute function:', error);
    }
  },

  async onLoad({ api }) {
    if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
      fs.mkdirSync(path, { recursive: true });
    }

    setInterval(() => {
      const today = moment.tz("Asia/Ho_Chi_Minh").day();
      const thisMonth = moment.tz("Asia/Ho_Chi_Minh").month();
      const checkttData = fs.readdirSync(path);

      checkttData.forEach(file => {
        try {
          var fileData = JSON.parse(fs.readFileSync(path + file));
        } catch (error) {
          console.error('Error reading or parsing file:', error);
          return fs.unlinkSync(path + file);
        }

        if (fileData.time !== today) {
          setTimeout(() => {
            try {
              fileData = JSON.parse(fs.readFileSync(path + file));
            } catch (error) {
              console.error('Error reading or parsing file again:', error);
              return;
            }

            if (fileData.time !== today) {
              fileData.time = today;
              fileData.day = [];
              fileData.week = [];

              if (fileData.monthTime !== thisMonth) {
                fileData.monthTime = thisMonth;
                fileData.month = [];
              }

              fs.writeFileSync(path + file, JSON.stringify(fileData, null, 4));
            }
          }, 60 * 1000);
        }
      });
    }, 60 * 1000);
  }
};
