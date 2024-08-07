const fs = require('fs');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const NodeCache = require('node-cache');
const messageCache = new NodeCache();

function calculateLevelAndExp(userExp) {
    let currentLevel = Math.floor(Math.sqrt(userExp / 300) + 1); 
    let nextLevelExp = Math.floor(currentLevel * currentLevel * 300); 
    let percentLevel = Math.floor((userExp / nextLevelExp) * 100);

    if (userExp >= nextLevelExp) {
        currentLevel++; 
        nextLevelExp = Math.floor(currentLevel * currentLevel * 300); 
        percentLevel = Math.floor((userExp / nextLevelExp) * 100);
    }

    return {
        level: currentLevel,
        currentExp: userExp,
        futureExp: nextLevelExp,
        percentLevel: percentLevel
    };
}

function getLevelText(level) {
    switch (level) {
        case 1:
            return "F";
        case 2:
            return "E";
        case 3:
            return "D";
        case 4:
            return "C";
        case 5:
            return "B";
        case 6:
            return "A";
        case 7:
            return "S";
        case 8:
            return "SS";
        case 9:
            return "SSS";
        default:
            return "Unknown";
    }
}

function drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fill();
}

async function createRankCard(canvas, top, avt, name, currentLevel, currentExp, futureExp, percentLevel) {
   const ctx = canvas.getContext("2d");
    const cardTemplatePath = './db/data/card/card.png';
    const template = await loadImage(cardTemplatePath);
    const ratio = Math.min(
        canvas.width / template.width,
        canvas.height / template.height,
    );

    const newWidth = template.width * ratio;
    const newHeight = template.height * ratio;

    const offsetX = (canvas.width - newWidth) / 2;
    const offsetY = (canvas.height - newHeight) / 2;

    ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

    const totalWidth = 702; 
    const totalHeight = 47; 

    ctx.fillStyle = "#ccc";
    drawRoundRect(ctx, 372, 260, totalWidth, totalHeight, 20);

    const currentWidth = (currentExp / futureExp) * totalWidth;

    ctx.fillStyle = "#008DDA";
    drawRoundRect(ctx, 372, 260, currentWidth, totalHeight, 20);

    ctx.fillStyle = "#ccc";
    ctx.font = "italic bold 32px Arial";
    ctx.fillText(`${percentLevel}%`, 696, 295);

    ctx.fillStyle = "#fccf03";
    ctx.font = "italic bold 56px Arial";
    ctx.fillText(`${name}`, 450, 157);

    ctx.fillStyle = "#ccc";
    ctx.font = "italic bold 36px Arial";
    ctx.fillText(`#${top}`, 650, 85);

    ctx.font = "italic bold 36px Arial";
    ctx.fillStyle = "#ccc";
    ctx.fillText(getLevelText(currentLevel), 1030, 85);
    ctx.fillText(`${currentExp} / ${futureExp}`, 750, 85);

    ctx.beginPath();
    ctx.arc(180, 187, 147, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(await loadImage(avt), 36, 40, 328, 328);
    const fimg = canvas.toBuffer("image/png");
    return { fimg, canvas };
}


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
        return {
            userName: user[userId]?.name || "Người Dùng",
            profilePicUrl: `https://graph.facebook.com/${userId}/picture?type=large&redirect=true&width=480&height=480&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        };
    } catch (error) {
        console.error("Error fetching user info:", error);
        return {
            userName: "Người Dùng",
            profilePicUrl: "",
        };
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

        return `
├─Tin Nhắn ${periodName}: ${userEntry.count}
│  └─Hạng ${periodName}: #${userPosition}
│      └─Tỷ Lệ Tương Tác ${periodName}: ${interactionPercentage}%`;
    }
    return "";
}

module.exports = {
    name: "checktt",
    alias: ['check'],
    author: "Nguyên Blue",
    category: "GROUPS",
    version: "3.0",
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
    
            const { userName, profilePicUrl } = await getUserInfo(api, userIdToCheck);
            const threadInfo = await api.getThreadInfo(threadID);
            const adminUIDs = threadInfo.adminIDs.map(admin => admin.id);
            const userRole = adminUIDs.includes(userIdToCheck) ? "Quản trị viên" : "Thành viên";

            const totalInteractions = jsonData.total.reduce((total, entry) => total + entry.count, 0);
            const userEntry = jsonData.total.find(entry => entry.id === userIdToCheck);
            const userPosition = jsonData.total.findIndex(entry => entry.id === userIdToCheck) + 1;
            const interactionPercentage = userEntry ? calculatePercentage(userEntry.count, totalInteractions) : 0;

            let userExp = userEntry ? userEntry.count : 0;
            let { level: currentLevel, currentExp, futureExp, percentLevel } = calculateLevelAndExp(userExp);
    
            const infoMessage = `
╭─Tên: ${userName}
│  ├─Chức Vụ: ${userRole}
│  └─Cấp Bậc: ${getLevelText(currentLevel)}
│     ├─Kinh Nghiệm: ${currentExp}/${futureExp}
│     └─Tiến Trình: ${percentLevel}%
├─Thời Gian
│  └─Tương Tác Gần Đây: ${interactionTimeInfo}
│     └─Tham Gia Nhóm: ${joinTimeInfo}
│${interactionInfo}
└─END

📌 Thả cảm xúc '❤️' tin nhắn này để xem tổng tin nhắn của toàn bộ thành viên trong nhóm
`;
    
            const canvas = createCanvas(1133, 370);
            const avtUrl = await axios.get(profilePicUrl, { responseType: "arraybuffer" });
    
            const { fimg } = await createRankCard(
                canvas,
                userPosition,
                avtUrl.data,
                userName,
                currentLevel,
                currentExp,
                futureExp,
                percentLevel
            );
    
            fs.writeFileSync('./.temp/rankCard.png', fimg);
    
            const info = await api.sendMessage({
                body: infoMessage,
                attachment: fs.createReadStream('./.temp/rankCard.png'),
            }, threadID);
    
            messageCache.set('checktt_Message', info.messageID);
            fs.unlinkSync('./.temp/rankCard.png');
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
                    const { userName } = await getUserInfo(api, entry.id);
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
                    const { userName } = await getUserInfo(api, entry.id);
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
