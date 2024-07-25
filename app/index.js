const { sequelize } = require("../db/database");
const threadModel = require("../db/models/threadModel");
const userModel = require("../db/models/userModel");

const Thread = threadModel(sequelize);
const User = userModel(sequelize);

const money = (() => {
  async function getMoney(uid) {
      const user = await User.findOne({ where: { uid } });
      if (!user || user.money === null) {
          return 0; 
      }
      return user.money;
  }

  async function updateMoney(uid, amount, operation) {
      const user = await User.findOne({ where: { uid } });
      if (!user) {
          return false;
      }

      switch (operation) {
          case 'add':
              user.money = (user.money || 0) + amount;
              break;
          case 'subtract':
              if (user.money === undefined || user.money < amount) {
                  return false;
              }
              user.money -= amount;
              break;
          default:
              throw new Error(`Invalid operation: ${operation}`);
      }

      await user.save();
      return true;
  }

  return {
      add: async (uid, amount) => updateMoney(uid, amount, 'add'),
      subtract: async (uid, amount) => updateMoney(uid, amount, 'subtract'),
      check: async (uid) => getMoney(uid)
  };
})();

async function UserInThreadData(message) {
  try {
    const senderID = message.senderID;
    const threadID = message.threadID;

    if (!senderID || !threadID) {
      return;
    }

    let user = await User.findOne({ where: { uid: senderID } });
    const userData = {
      name: message.user && message.user.name ? message.user.name : "Người Dùng Facebook",
      uid: senderID,
    };

    if (!user) {
      userData.money = 0;
      user = await User.create(userData);
      console.log(`Created new user: ${userData.name} (${userData.uid})`);
    } else if (JSON.stringify(user.toJSON()) !== JSON.stringify(userData)) {
      await user.update(userData);
    } else {
      console.log(`User already exists: ${userData.name} (${userData.uid})`);
    }

    let thread = await Thread.findOne({ where: { tid: threadID } });
    const threadData = {
      name: message.thread && message.thread.name ? message.thread.name : "Nhóm",
      tid: threadID
    };

    if (!thread) {
      thread = await Thread.create(threadData);
      console.log(`Created new thread: ${threadData.name} (${threadData.tid})`);
    } else if (JSON.stringify(thread.toJSON()) !== JSON.stringify(threadData)) {
      await thread.update(threadData);
    } else {
      console.log(`Thread already exists: ${threadData.name} (${threadData.tid})`);
    }
  } catch (error) {
    console.error(error);
  }
};

async function getUser(uid) {
  const user = await User.findOne({ where: { uid } });
  if (!user) {
    return null;
  }
  return user.toJSON();
}

async function getThread(tid) {
  const thread = await Thread.findOne({ where: { tid } });
  if (!thread) {
    return null;
  }
  return thread.toJSON();
}

module.exports = { UserInThreadData, getUser, getThread, money };