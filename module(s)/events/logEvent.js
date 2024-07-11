const fs = require('fs');
const moment = require('moment-timezone');
const path = './core(s)/database/checktt/';

module.exports = {
  name: "logEvent",
  author: "Nguyên Blue",
  version: "1.0",
  desc: "Ghi log tương tác thành viên của nhóm.",
  async execute({ event, threadID, senderID, body }) {
    try {
      if (!event.isGroup) return;

      const today = moment.tz("Asia/Ho_Chi_Minh").day();
      const thisMonth = moment.tz("Asia/Ho_Chi_Minh").month();

      if (!fs.existsSync(path + threadID + '.json')) {
        const newObj = {
          total: [],
          week: [],
          day: [],
          month: [],
          time: today,
          monthTime: thisMonth,
          last: {
            time: today,
            day: [],
            week: [],
            month: [],
          },
        };
        fs.writeFileSync(path + threadID + '.json', JSON.stringify(newObj, null, 4));
      }

      let newObj = JSON.parse(fs.readFileSync(path + threadID + '.json'));

      if (newObj.time !== today) {
        newObj.time = today;
        newObj.day = [];
        newObj.week = [];

        if (newObj.monthTime !== thisMonth) {
          newObj.monthTime = thisMonth;
          newObj.month = [];
        }
      }

      if (body) { 
        const UserIDs = event.participantIDs || [];

        for (const user of UserIDs) {
          if (!newObj.last) {
            newObj.last = {
              time: today,
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

      fs.writeFileSync(path + threadID + '.json', JSON.stringify(newObj, null, 4));

      const threadData = JSON.parse(fs.readFileSync(path + threadID + '.json'));

      const userData_week_index = threadData.week.findIndex(e => e.id === senderID);
      const userData_day_index = threadData.day.findIndex(e => e.id === senderID);
      const userData_month_index = threadData.month.findIndex(e => e.id === senderID);
      const userData_total_index = threadData.total.findIndex(e => e.id === senderID);

      if (userData_total_index === -1) {
        threadData.total.push({
          id: senderID,
          count: 1,
        });
      } else {
        threadData.total[userData_total_index].count++;
      }

      if (userData_week_index === -1) {
        threadData.week.push({
          id: senderID,
          count: 1
        });
      } else {
        threadData.week[userData_week_index].count++;
      }

      if (userData_day_index === -1) {
        threadData.day.push({
          id: senderID,
          count: 1
        });
      } else {
        threadData.day[userData_day_index].count++;
      }

      if (userData_month_index === -1) {
        threadData.month.push({
          id: senderID,
          count: 1
        });
      } else {
        threadData.month[userData_month_index].count++;
      }

      let p = event.participantIDs;

      if (!!p && p.length > 0) {
        p = p.map($ => $ + '');
        ['day', 'week', 'month', 'total'].forEach(t => threadData[t] = threadData[t].filter($ => p.includes($.id + '')));
      }

      fs.writeFileSync(path + threadID + '.json', JSON.stringify(threadData, null, 4));
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
