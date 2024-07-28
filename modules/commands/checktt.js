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
        
        return `🗓️ Tin Nhắn ${periodName}: ${userEntry.count}\n` +
               `📊 Tỷ lệ tương tác ${periodName}: ${interactionPercentage}%\n` +
               `🏆 Hạng ${periodName}: #${userPosition}\n`;
    }
    return "";
}

module.exports = {
    name: "checktt",
    alias: ['check'],
    author: "Nguyên Blue",
    category: "GROUPS",
    version: "2.1", 
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
            let recentInteractionTime = jsonData.recentInteractions[userIdToCheck] || null;
            let interactionTimeInfo = formatInteractionTime(recentInteractionTime);
            
            let joinTime = jsonData.timeToJoinTheGroup[userIdToCheck] || null;
            let joinTimeInfo = formatInteractionTime(joinTime);

            const userName = await getUserInfo(api, userIdToCheck);
            const threadInfo = await api.getThreadInfo(threadID);
            const adminUIDs = threadInfo.adminIDs.map(admin => admin.id); 
            const userRole = adminUIDs.includes(userIdToCheck) ? "Quản trị viên" : "Thành viên";
            const infoMessage = `[ TỔNG TƯƠNG TÁC CỦA BẠN ]\n\n` +
                                `👤 Tên: ${userName}\n` +
                                `🪪 Chức Vụ: ${userRole}\n` +
                                `🔗 Liên Kết: https://www.facebook.com/profile.php?id=${userIdToCheck}\n\n` +
                                `${interactionInfo}\n` +
                                `⏱️ Thời gian tương tác gần đây: ${interactionTimeInfo}\n` +
                                `📆 Thời gian tham gia nhóm: ${joinTimeInfo}\n\n` +
                                `📌 Thả cảm xúc '❤️' tin nhắn này để xem tổng tin nhắn của toàn bộ thành viên trong nhóm`;

            const info = await api.sendMessage(infoMessage, threadID);
            messageCache.set('checktt_Message', info.messageID);
        } catch (error) {
            console.error("Error fetching user info:", error);
            return api.sendMessage("Đã xảy ra lỗi khi lấy thông tin người dùng", threadID);
        }
    },

    async onMessage({ message, api }) {
        const messageID = messageCache.get('checktt_Message');
        
        if (messageID && message.messageID === messageID && message.type === 'message_reaction' && message.reaction === '❤') {
            const path = './db/data/checktt/';
            const { threadID } = message;
            const filePath = `${path}${threadID}.json`;
            const jsonData = readJsonFile(filePath);
    
            if (!jsonData || !jsonData.total) {
                return api.sendMessage("Chưa có dữ liệu hoặc dữ liệu không hợp lệ", threadID);
            }
    
            jsonData.total.sort((a, b) => b.count - a.count);
            let totalInteractions = jsonData.total.reduce((total, entry) => total + entry.count, 0);
            let response = `[ TỔNG TƯƠNG TÁC NHÓM ]\n\n`;
    
            const rankingEmojis = ['🥇', '🥈', '🥉'];
    
            for (let i = 0; i < jsonData.total.length; i++) {
                const entry = jsonData.total[i];
                try {
                    const userName = await getUserInfo(api, entry.id);
                    const interactionPercentage = calculatePercentage(entry.count, totalInteractions);
                    
                    const rankEmoji = i < 3 ? rankingEmojis[i] : `${i + 1}.`;
                    
                    response += `${rankEmoji} ${userName}: ${entry.count} (${interactionPercentage}%) \n`;
                    
                    if (i === 2) break;
                } catch (error) {
                    response += `${rankingEmojis[i]} Người Dùng Facebook: ${entry.count}\n`;
                }
            }
            
            for (let i = 3; i < jsonData.total.length; i++) {
                const entry = jsonData.total[i];
                try {
                    const userName = await getUserInfo(api, entry.id);
                    const interactionPercentage = calculatePercentage(entry.count, totalInteractions);
                    
                    response += ` ${i + 1}. ${userName}: ${entry.count} (${interactionPercentage}%) \n`;
                } catch (error) {
                    response += ` ${i + 1}. Người Dùng Facebook: ${entry.count}\n`;
                }
            }
    
            api.sendMessage(response.trim(), threadID);
            messageCache.del('checktt_Message');
        }
    }    
};

function formatInteractionTime(time) {
    if (!time) return 'Không Xác Định';

    const formattedTime = new Date(time);
    const day = formattedTime.getDate().toString().padStart(2, '0');
    const month = (formattedTime.getMonth() + 1).toString().padStart(2, '0');
    const year = formattedTime.getFullYear();
    const hour = formattedTime.getHours().toString().padStart(2, '0');
    const minute = formattedTime.getMinutes().toString().padStart(2, '0');
    const second = formattedTime.getSeconds().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
}
