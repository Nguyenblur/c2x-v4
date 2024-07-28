module.exports = {
    name: "kick",
    author: "Nguyên Blue",
    category: "GROUPS",
    version: "1.0",
    nopre: false,
    admin: true,
    wait: 3,
    desc: "Đá thành viên khỏi nhóm",
    async onCall({ api, message }) {
        try {
            var mention = Object.keys(message.mentions);
            let dataThread = await api.getThreadInfo(message.threadID);
            let isAdmin = dataThread.adminIDs.some(item => item.id === api.getCurrentUserID());
            if (!isAdmin) {
                return api.sendMessage("Bot cần là quản trị viên để thực hiện lệnh này.", message.threadID);
            }

            let isSenderAdmin = dataThread.adminIDs.some(item => item.id === message.senderID);
            if (!isSenderAdmin) {
                return api.sendMessage("Bạn cần là quản trị viên để sử dụng lệnh này.", message.threadID);
            }

            if (mention.length === 0) {
                return api.sendMessage("Bạn phải tag người muốn đá khỏi nhóm.", message.threadID);
            }

            for (const abc in mention) {
                setTimeout(() => {
                    api.removeUserFromGroup(mention[abc], message.threadID) 
                }, 3000)
            }

        } catch (error) {
            console.error(error);
        }
    }
};
