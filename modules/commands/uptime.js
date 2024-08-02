const os = require("os");
const fs = require("fs-extra");

const startTime = new Date();

module.exports = {
  name: "uptime",
  alias: ['up', 'upt'],
  author: "ArYAN • Nguyên Blue [convert]",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 3,
  desc: "Xem thời gian uptime của hệ thống",
  async onCall({ api, message, client }) {
    try {
      const uptimeInSeconds = (new Date() - startTime) / 1000;

      const seconds = uptimeInSeconds;
      const days = Math.floor(seconds / (3600 * 24));
      const hours = Math.floor((seconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secondsLeft = Math.floor(seconds % 60);
      const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${secondsLeft}s`;

      const loadAverage = os.loadavg();
      const cpuUsage =
        os
          .cpus()
          .map((cpu) => cpu.times.user)
          .reduce((acc, curr) => acc + curr) / os.cpus().length;

      const totalMemoryGB = os.totalmem() / 1024 ** 3;
      const freeMemoryGB = os.freemem() / 1024 ** 3;
      const usedMemoryGB = totalMemoryGB - freeMemoryGB;

      const currentDate = new Date();
      const options = { year: "numeric", month: "numeric", day: "numeric" };
      const date = currentDate.toLocaleDateString("vi-VN", options);
      const time = currentDate.toLocaleTimeString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour12: true,
      });

      const timeStart = Date.now();
      await api.sendMessage({
        body: "🔎 | Đang kiểm tra...",
      }, message.threadID);

      const ping = Date.now() - timeStart;

      let pingStatus = "Ping không ổn định";
      if (ping < 1000) {
        pingStatus = "Ping ổn định";
      }

      const systemInfo = `
♡   ∩_∩
（„• ֊ •„)♡
╭─∪∪────────────⟡
│ 𝗨𝗣𝗧𝗜𝗠𝗘 𝗜𝗡𝗙𝗢
├───────────────⟡
│ 🤖 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢 
│ 𝙽𝙰𝙼𝙴: C2X
│ 𝙻𝙰𝙽𝙶: 𝙽𝚘𝚍𝚎𝚓𝚜
│ 𝙿𝚁𝙵𝙸𝚇: ${client.config.PREFIX}
├───────────────⟡
│ ⏰ 𝗥𝗨𝗡𝗧𝗜𝗠𝗘
│  ${uptimeFormatted}
├───────────────⟡
│ 👑 𝗦𝗬𝗦𝗧𝗘𝗠 𝗜𝗡𝗙𝗢
│ OS: ${os.type()} ${os.arch()}
│ Node.js Version: ${process.version}
│ CPU Model: ${os.cpus()[0].model}
│ Memory Usage: ${usedMemoryGB.toFixed(2)} GB / ${totalMemoryGB.toFixed(2)} GB
│ CPU Usage: ${cpuUsage.toFixed(1)}%
│ RAM Usage: ${process.memoryUsage().heapUsed / 1024 / 1024} MB
├───────────────⟡
│ ✅ 𝗢𝗧𝗛𝗘𝗥 𝗜𝗡𝗙𝗢
│ 𝙳𝙰𝚃𝙴: ${date}
│ 𝚃𝙸𝙼𝙴: ${time}
│ 𝙿𝙸𝙽𝙶: ${ping}ms
│ 𝚂𝚃𝙰𝚃𝚄𝚂: ${pingStatus}
╰───────────────⟡
`;

      api.sendMessage(
        {
          body: systemInfo,
        },
        message.threadID,
        (err, messageInfo) => {
          if (err) {
            console.error("Error sending message:", err);
          } else {
           // console.log("Message sent successfully:", messageInfo);
          }
        }
      );

    } catch (error) {
      console.error("Error retrieving system information:", error);
      api.sendMessage(
        "Không thể lấy thông tin hệ thống.",
        message.threadID,
        message.messageID
      );
    }
  }
};
