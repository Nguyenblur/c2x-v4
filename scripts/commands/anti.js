const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const AntiPath = "./db/data/anti";
fs.ensureDirSync(AntiPath);

const validActions = ["spam", "namebox", "imagebox", "nickname", "emoji", "out", "join"];

const getAntiFilePath = (action) => {
    if (!validActions.includes(action)) {
        throw new Error("Hành động không hợp lệ.");
    }
    return path.join(AntiPath, `anti_${action}.json`);
};

const readAntiData = async (action) => {
    try {
        const filePath = getAntiFilePath(action);
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeAntiData(action, {});
        } else {
            console.error(error);
        }
        return {};
    }
};

const writeAntiData = async (action, data) => {
    try {
        const filePath = getAntiFilePath(action);
        await fs.writeFile(filePath, JSON.stringify(data, null, 4), 'utf-8');
    } catch (error) {
        console.error(error);
    }
};

module.exports = {
    name: "anti",
    author: "Nguyên Blue",
    category: "ANTIS",
    version: "1.0",
    nopre: false,
    admin: true,
    wait: 10,
    desc: "Module quản lý anti.",
    async onLoad({ api }) {
        validActions.forEach(async action => {
            await readAntiData(action);
        });
    },
    async onCall({ api, message, args }) {
        const { threadID } = message;
        const action = args[0];

        if (!validActions.includes(action) && action !== 'check') {
            api.sendMessage(`Hành động không hợp lệ. Các hành động hợp lệ là: ${validActions.join(', ')}`, threadID);
            return;
        }

        if (action === 'check') {
            const antiModes = {
                namebox: "ANTI NAME",
                imagebox: "ANTI IMAGE",
                nickname: "ANTI NICKNAME",
                emoji: "ANTI EMOJI",
                out: "ANTI OUT",
                join: "ANTI JOIN",
                spam: "ANTI SPAM"
            };

            let status = "";

            for (const key in antiModes) {
                const modeData = await readAntiData(key);

                if (modeData[threadID] && modeData[threadID].enabled) {
                    status += `${antiModes[key]}: 💀\n`;
                } else {
                    status += `${antiModes[key]}: ❎\n`;
                }
            }

            api.sendMessage(`[ MANAGE CONFIG ANTI ]\n\n${status}`, threadID);
            return;
        }

        const statusAction = args[1];
        if (statusAction !== 'on' && statusAction !== 'off') {
            api.sendMessage(`ON/OFF hoặc CHECK?`, threadID);
            return;
        }

        let entryKey, actionMessage;

        switch (action) {
            case "namebox":
                entryKey = "namebox";
                actionMessage = "chống đổi tên nhóm";
                break;
            case "imagebox":
                entryKey = "imagebox";
                actionMessage = "chống đổi ảnh nhóm";
                break;
            case "nickname":
                entryKey = "nickname";
                actionMessage = "chống đổi biệt danh";
                break;
            case "emoji":
                entryKey = "emoji";
                actionMessage = "chống đổi emoji";
                break;
            case "spam":
                entryKey = "spam";
                actionMessage = "chống spam";
                break;
            case "out":
                entryKey = "out";
                actionMessage = "chống out";
                break;
            case "join":
                entryKey = "join";
                actionMessage = "chống join";
                break;
            default:
                break;
        }        

        const antiData = await readAntiData(entryKey);

        if (statusAction === 'on') {
            if (!antiData[threadID]) {
                antiData[threadID] = {};
            }
            if (action === 'namebox') {
                antiData[`${threadID}_name`] = (await api.getThreadInfo(threadID)).name;
            } else if (action === 'imagebox') {
                antiData[`${threadID}_image`] = (await api.getThreadInfo(threadID)).imageSrc;
            } else if (action === 'nickname') {
                try {
                    const threadInfo = await api.getThreadInfo(threadID);
                    if (threadInfo.nicknames) {
                        const nicknames = threadInfo.nicknames;
                        for (let uid in nicknames) {
                            antiData[`${threadID}_nickname_${uid}`] = nicknames[uid];
                        }
                    }
                } catch (error) {
                    console.error(error);
                }
            } else if (action === 'emoji') {
                antiData[`${threadID}_emoji`] = (await api.getThreadInfo(threadID)).emoji;
            }            
            antiData[threadID].enabled = true;
            await writeAntiData(entryKey, antiData);
            api.sendMessage(`Đã bật ${actionMessage} cho nhóm này.`, threadID);
        } else if (statusAction === 'off') {
            if (antiData[threadID] && antiData[threadID].enabled) {
                delete antiData[threadID];
                await writeAntiData(entryKey, antiData);
                api.sendMessage(`Đã tắt ${actionMessage} cho nhóm này.`, threadID);
            } else {
                api.sendMessage(`${actionMessage} đã tắt cho nhóm này từ trước.`, threadID);
            }
        }
    },

    async onMessage({ api, message }) {
        const { threadID, senderID, author } = message;
        const participants = message.logMessageData?.addedParticipants;

        if (validActions.includes("spam")) {
            const antiData = await readAntiData("spam");

            if (antiData[threadID] && antiData[threadID].enabled) {
                const usersSpam = antiData.spamData || {};
                usersSpam[senderID] = usersSpam[senderID] || { count: 0, start: Date.now() };
                usersSpam[senderID].count++;

                if (Date.now() - usersSpam[senderID].start > 25000) {
                    usersSpam[senderID].count = 0;
                    usersSpam[senderID].start = Date.now();
                } else if (usersSpam[senderID].count >= 10) {
                    api.removeUserFromGroup(senderID, threadID);
                    const userInfo = await api.getUserInfo(senderID);
                    const userName = userInfo[senderID] ? userInfo[senderID].name : "Người dùng";
                    api.sendMessage(`[ CHỐNG SPAM ] Người dùng ${userName} đã bị đá khỏi nhóm do spam tin nhắn!`, threadID);
                    usersSpam[senderID].count = 0;
                    usersSpam[senderID].start = Date.now();
                }

                antiData.spamData = usersSpam;
                await writeAntiData("spam", antiData);
            }
        }

        if (validActions.includes("namebox")) {
            const antiNameData = await readAntiData("namebox");
            if (antiNameData[threadID] && antiNameData[threadID].enabled) {
                const storedThreadName = antiNameData[`${threadID}_name`];
                const currentThreadInfo = await api.getThreadInfo(threadID);
                const currentThreadName = currentThreadInfo.name;

                if (storedThreadName && currentThreadName !== storedThreadName) {
                        await api.setTitle(storedThreadName, threadID);
                        api.sendMessage(`[ CHỐNG ĐỔI TÊN NHÓM ] Không thể thay đổi tên nhóm vào lúc này.`, threadID);
                    } else {
                        antiNameData[`${threadID}_name`] = currentThreadName;
                        await writeAntiData("namebox", antiNameData);
                    }
              }
        }

        if (validActions.includes("imagebox")) {
            const antiImageData = await readAntiData("imagebox");
            if (antiImageData[threadID] && antiImageData[threadID].enabled) {
                const storedThreadImage = antiImageData[`${threadID}_image`];
                const currentThreadInfo = await api.getThreadInfo(threadID);
                const currentThreadImage = currentThreadInfo.imageSrc;
                let fileName;
        
                try {
                    const response = await axios.get(storedThreadImage, { responseType: 'stream' });
                    fileName = `./.temp/${Date.now()}_image.jpg`;
        
                    const writer = fs.createWriteStream(fileName);
                    response.data.pipe(writer);
        
                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });
        
                    if (storedThreadImage && currentThreadImage !== storedThreadImage) {
                        const imageReadStream = fs.createReadStream(fileName);
                        await api.changeGroupImage(imageReadStream, threadID);
        
                        const updatedThreadInfo = await api.getThreadInfo(threadID);
                        const updatedThreadImage = updatedThreadInfo.imageSrc;
                        antiImageData[`${threadID}_image`] = updatedThreadImage;
                        await writeAntiData("imagebox", antiImageData);
        
                        await api.sendMessage(`[ CHỐNG ĐỔI ẢNH NHÓM ] không thể đổi ảnh nhóm vào lúc này.`, threadID);
                    } else {
                        antiImageData[`${threadID}_image`] = currentThreadImage;
                        await writeAntiData("imagebox", antiImageData);
                    }
                } catch (error) {
                    console.error('Error fetching or processing image:', error);
                } finally {
                    if (fileName && fs.existsSync(fileName)) {
                        fs.unlinkSync(fileName);
                    }
                }
            }
        }          

        if (validActions.includes("emoji")) {
            const antiEmojiData = await readAntiData("emoji");
            if (antiEmojiData[threadID] && antiEmojiData[threadID].enabled) {
                const storedThreadEmoji = antiEmojiData[`${threadID}_emoji`];
                const currentThreadInfo = await api.getThreadInfo(threadID);
                const currentThreadEmoji = currentThreadInfo.emoji;

                if (storedThreadEmoji && currentThreadEmoji !== storedThreadEmoji) {
                        await api.changeThreadEmoji(storedThreadEmoji, threadID);
                        api.sendMessage(`[ CHỐNG EMOJI ] Không thể thay đổi biểu tượng cảm xúc nhóm vào lúc này.`, threadID);
                    } else {
                        antiEmojiData[`${threadID}_emoji`] = currentThreadEmoji;
                        await writeAntiData("emoji", antiEmojiData);
                    }
              }
        }

        if (validActions.includes("nickname")) {
            const antiNicknameData = await readAntiData("nickname");
            
            if (antiNicknameData[threadID] && antiNicknameData[threadID].enabled) {
                try {
                    const threadInfo = await api.getThreadInfo(threadID);
                    if (threadInfo.nicknames) {
                    const nicknames = threadInfo.nicknames;
                    for (let uid in nicknames) {
                        const storedNickname = antiNicknameData[`${threadID}_nickname_${uid}`];
                        const currentNickname = nicknames[uid];
            
                        if (storedNickname && currentNickname !== storedNickname) {
                            await api.changeNickname(storedNickname, threadID, uid);
                            api.sendMessage(`[ CHỐNG NICKNAME ] Không thể thay đổi biệt danh vào lúc này.`, threadID);
                        } else {
                            antiNicknameData[`${threadID}_nickname_${uid}`] = currentNickname;
                            await writeAntiData("nickname", antiNicknameData);
                        }
                    }
                 }
                } catch (error) {
                    console.error(error);
                }
            }
        }
        
        if (validActions.includes("out")) {
            try {
                const antiOutData = await readAntiData("out");
                const id = message?.logMessageData?.leftParticipantFbId;
        
                if (antiOutData && antiOutData[threadID] && antiOutData[threadID].enabled) {
                    const currentUserID = api.getCurrentUserID();
                    if (author && id && author === id && id !== currentUserID) {
                        await api.addUserToGroup(id, threadID);
                        api.sendMessage(`[ CHỐNG OUT ] Không thể rời nhóm vào lúc này.`, threadID);
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }


        if (validActions.includes("join") && Array.isArray(participants) && !participants.some(i => i.userFbId === api.getCurrentUserID())) {
            const memJoin = participants.map(info => info.userFbId);
        
            try {
                const antiJoinData = await readAntiData("join");
        
                if (antiJoinData?.[threadID]?.enabled) {
                    const currentUserID = api.getCurrentUserID();
                    
                    for (let idUser of memJoin) {
                        if (idUser !== currentUserID) {
                            await api.removeUserFromGroup(idUser, threadID);
                            api.sendMessage(`[ CHỐNG JOIN ] Thành viên mới đã bị kick ra khỏi nhóm.`, threadID);
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }        
    }
};