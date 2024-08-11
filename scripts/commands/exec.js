const { exec } = require("child_process");
module.exports = {
  name: "exec",
  author: "Nguyên Blue",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  admin: true,
  wait: 3,
  desc: "",
  async onCall({ api, message, args }) {
    let text = args.join(" ")
    exec(`${text}`, (error, stdout, stderr) => {
        if (error) {
            api.sendMessage(`error: \n${error.message}`, message.threadID, message.messageID);
            return;
        }
        if (stderr) {
            api.sendMessage(`stderr:\n ${stderr}`, message.threadID, message.messageID);
            return;
        }
        api.sendMessage(`stdout:\n ${stdout}`, message.threadID, message.messageID);
    });
  }
};