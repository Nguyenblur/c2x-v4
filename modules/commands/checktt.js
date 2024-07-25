const fs = require('fs');
const NodeCache = require('node-cache');
const messageCache = new NodeCache();

function readJsonFile(filePath) {
    try {
        const jsonString = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(jsonString);
    } catch (error) {
        console.error(`Error reading or parsing ${filePath}:`, error);
        return null;
    }
}

async function getUserInfo(api, userId) {
    try {
        const user = await api.getUserInfo(userId);
        return user[userId]?.name || "Người Dùng";
    } catch (error) {
        console.error("Error fetching user info:", error);
        return "Người Dùng";
    }
}

function calculatePercentage(count, total) {
    return total > 0 ? ((count / total) * 100).toFixed(2) : 0;
}

function getInteractionInfo(entries, userIdToCheck, periodName) {
    const userEntry = entries.find(entry => entry.id === userIdToCheck);
    if (userEntry) {
        entries.sort((a, b) => b.count - a.count);
        let userPosition = entries.findIndex(entry => entry.id === userIdToCheck) + 1;
        let totalInteractions = entries.reduce((total, entry) => total + entry.count, 0);
        const interactionPercentage = calculatePercentage(userEntry.count, totalInteractions);
        return `🗓️ Tin Nhắn ${periodName}: ${userEntry.count}\n📊 Tỷ lệ tương tác ${periodName}: ${interactionPercentage}%\n🏆 Hạng ${periodName}: #${userPosition}\n\n`;
    }
    return "";
}

module.exports = {
    name: "checktt",
    alias: ['check'],
    author: "Nguyên Blue",
    category: "SYSTEMS",
    version: "1.0",
    nopre: false,
    admin: false,
    wait: 3,
    desc: "Kiểm tra tương tác",

    async onCall({ message, api, args }) {
        message.react("✅");
        await new Promise(resolve => setTimeout(resolve, 500));

        const path = './db/data/checktt/';
        const { threadID, senderID } = message;

        const filePath = `${path}${threadID}.json`;
        const jsonData = readJsonFile(filePath);

        if (!jsonData || !jsonData.total) {
            return api.sendMessage("Chưa có dữ liệu hoặc dữ liệu không hợp lệ", threadID);
        }

        if (args.length === 0) {
            args.push(senderID);
        }

        let interactionInfo = "";

        if (args[0] === "all") {
            jsonData.total.sort((a, b) => b.count - a.count);

            let totalInteractions = jsonData.total.reduce((total, entry) => total + entry.count, 0);

            let response = `[ Tổng Tương Tác Của Nhóm ]\n`;

            for (const entry of jsonData.total) {
                try {
                    const userName = await getUserInfo(api, entry.id);
                    const interactionPercentage = calculatePercentage(entry.count, totalInteractions);
                    response += `${userName}: ${entry.count} (${interactionPercentage}%) \n`;
                } catch (error) {
                    response += `Người Dùng Facebook: ${entry.count}\n`;
                }
            }

            return api.sendMessage(response.trim(), threadID);
        } else {
            const userIdToCheck = args[0];

            if (jsonData.total) {
                interactionInfo += getInteractionInfo(jsonData.total, userIdToCheck, "Tổng");
            }

            if (jsonData.day) {
                interactionInfo += getInteractionInfo(jsonData.day, userIdToCheck, "Trong Ngày");
            }

            if (jsonData.week) {
                interactionInfo += getInteractionInfo(jsonData.week, userIdToCheck, "Trong Tuần");
            }

            if (jsonData.month) {
                interactionInfo += getInteractionInfo(jsonData.month, userIdToCheck, "Trong Tháng");
            }

            try {
                let recentInteractionTime = jsonData.recentInteractions[userIdToCheck];
                let interactionDay, interactionMonth, interactionYear, interactionHour, interactionMinute, interactionSecond;
                if (recentInteractionTime) {
                    recentInteractionTime = new Date(recentInteractionTime);
                    interactionDay = recentInteractionTime.getDate().toString().padStart(2, '0');
                    interactionMonth = (recentInteractionTime.getMonth() + 1).toString().padStart(2, '0');
                    interactionYear = recentInteractionTime.getFullYear();
                    interactionHour = recentInteractionTime.getHours().toString().padStart(2, '0');
                    interactionMinute = recentInteractionTime.getMinutes().toString().padStart(2, '0');
                    interactionSecond = recentInteractionTime.getSeconds().toString().padStart(2, '0');
                } else {
                    interactionDay = interactionMonth = interactionYear = interactionHour = interactionMinute = interactionSecond = '??';
                }
            
                let joinTime = jsonData.timeToJoinTheGroup[userIdToCheck];
                let joinDay, joinMonth, joinYear, joinHour, joinMinute, joinSecond;
                if (joinTime) {
                    joinTime = new Date(joinTime);
                    joinDay = joinTime.getDate().toString().padStart(2, '0');
                    joinMonth = (joinTime.getMonth() + 1).toString().padStart(2, '0');
                    joinYear = joinTime.getFullYear();
                    joinHour = joinTime.getHours().toString().padStart(2, '0');
                    joinMinute = joinTime.getMinutes().toString().padStart(2, '0');
                    joinSecond = joinTime.getSeconds().toString().padStart(2, '0');
                } else {
                    joinDay = joinMonth = joinYear = joinHour = joinMinute = joinSecond = '??';
                }
            
                const userName = await getUserInfo(api, userIdToCheck);
                let threadInfo = await api.getThreadInfo(threadID);
                let adminUIDs = threadInfo.adminIDs;
                let userRole = adminUIDs.includes(userIdToCheck) ? "Quản trị viên" : "Thành viên";
                const info = await api.sendMessage(`[ Tổng Tương Tác Của ${userName} ]\n\n🪪 Chức Vụ: ${userRole}\n🎖 Profile: https://www.facebook.com/profile.php?id=${userIdToCheck}\n\n${interactionInfo}\n⏱️ Thời gian tương tác gần đây: ${interactionDay}/${interactionMonth}/${interactionYear} ${interactionHour}:${interactionMinute}:${interactionSecond}\n\n📆 Thời gian tham gia nhóm: ${joinDay}/${joinMonth}/${joinYear} ${joinHour}:${joinMinute}:${joinSecond}\n\n📌 Thả cảm xúc '❤️' tin nhắn này để xem tổng tin nhắn của toàn bộ thành viên trong nhóm`, threadID);
                messageCache.set('checktt_Message', info.messageID);
            } catch (error) {
                console.error("Error fetching user info:", error);
                return api.sendMessage("Đã xảy ra lỗi khi lấy thông tin người dùng", threadID);
            }
        }
    },

    async onMessage({ message, api }) {
        const MessageID = messageCache.get('checktt_Message');
        if (MessageID && message.messageID === MessageID && message.type === 'message_reaction' && message.reaction === '❤') {
            const path = './db/data/checktt/';
            const { threadID } = message;

            const filePath = `${path}${threadID}.json`;
            const jsonData = readJsonFile(filePath);

            if (!jsonData || !jsonData.total) {
                return api.sendMessage("Chưa có dữ liệu hoặc dữ liệu không hợp lệ", threadID);
            }

            jsonData.total.sort((a, b) => b.count - a.count);

            let totalInteractions = jsonData.total.reduce((total, entry) => total + entry.count, 0);

            let response = `[ Tổng Tương Tác Của Nhóm ]\n`;

            for (const entry of jsonData.total) {
                try {
                    const userName = await getUserInfo(api, entry.id);
                    const interactionPercentage = calculatePercentage(entry.count, totalInteractions);
                    response += `${userName}: ${entry.count} (${interactionPercentage}%) \n`;
                } catch (error) {
                    response += `Người Dùng Facebook: ${entry.count}\n`;
                }
            }

            api.sendMessage(response.trim(), message.threadID);
            messageCache.del('checktt_Message');
        }
    }
};
