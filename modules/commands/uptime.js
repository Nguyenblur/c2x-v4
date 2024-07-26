const os = require('os');
const moment = require('moment-timezone');
const fs = require('fs').promises;
const nodeDiskInfo = require('node-disk-info');
const path = require('path');

const formatSize = (size) => {
  if (size < 1024) return `${size} B`;
  else if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  else return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const getDirectorySize = async (dirPath) => {
  let totalSize = 0;

  const calculateSize = async (filePath) => {
    try {
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        const fileNames = await fs.readdir(filePath);
        await Promise.all(fileNames.map(fileName => calculateSize(path.join(filePath, fileName))));
      }
    } catch (error) {
      console.error(`Error calculating size for ${filePath}:`, error);
    }
  };

  await calculateSize(dirPath);

  return totalSize;
};

module.exports = {
  name: "uptime",
  alias: ['up', 'upt'],
  author: "Niio-team (Vtuan) • Nguyên Blue [convert]",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 3,
  desc: "xem time uptime",
  async onCall({ args, message }) {
    const startPing = Date.now();
    const directoryPath = args[0] || './';
    try {
      const files = await fs.readdir(directoryPath);

      let totalSize = 0;

      await Promise.all(files.map(async (fileName) => {
        const filePath = path.join(directoryPath, fileName);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          totalSize += await getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }));

      const getBotStatus = (ping) => ping < 200 ? 'smooth' : ping < 800 ? 'average' : 'lag';

      const uptime = process.uptime();
      const [uptimeHours, uptimeMinutes, uptimeSeconds] = [
        Math.floor(uptime / 3600),
        Math.floor((uptime % 3600) / 60),
        Math.floor(uptime % 60)
      ];

      const cpuCount = os.cpus().length;
      const cpuModel = os.cpus()[0].model;
      const cpuSpeed = os.cpus()[0].speed;
      const osType = os.type();
      const osRelease = os.release();
      const osPlatform = os.platform();
      const osHostname = os.hostname();
      const osArch = os.arch();

      const freeMemory = os.freemem();
      const totalMemory = os.totalmem();
      const usedMemory = totalMemory - freeMemory;
      const botStatus = getBotStatus(Date.now() - startPing);

      try {
        const disks = await nodeDiskInfo.getDiskInfo();
        const firstDisk = disks[0] || {};

        const convertToGB = (bytes) => bytes ? (bytes / (1024 * 1024 * 1024)).toFixed(2) + 'GB' : 'N/A';

        const pingReal = Date.now() - startPing;

        const replyMsg = `
🕒 ${moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss')} ${moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY')}
⌛ Uptime: ${uptimeHours.toString().padStart(2, '0')}:${uptimeMinutes.toString().padStart(2, '0')}:${uptimeSeconds.toString().padStart(2, '0')}
🛜 Ping: ${pingReal}ms
🔣 Bot status: ${botStatus}
🖥️ CPU: ${cpuCount} x ${cpuModel} @ ${cpuSpeed} MHz
📊 OS: ${osType} ${osRelease} ${osPlatform} ${osArch}
📁 Hostname: ${osHostname}
🔣 RAM: ${(freeMemory / 1024 / 1024 / 1024).toFixed(2)}GB / ${(totalMemory / 1024 / 1024 / 1024).toFixed(2)}GB
💾 Storage: ${convertToGB(firstDisk.size)} (${convertToGB(firstDisk.used)} used, ${convertToGB(firstDisk.available)} available)
👥 Node.js version: ${process.version}
`.trim();

        message.send(replyMsg, message.threadID);
      } catch (error) {
        console.error('❎ Error getting disk information:', error.message);
      }
    } catch (error) {
      console.error('❎ Error reading directory:', error);
  }
}
};