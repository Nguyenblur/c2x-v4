const fs = require('fs');
const path = require('path');
const login = require('./core(s)/login');
const { doneAnimation, errAnimation } = require('./core(s)/logger/console');
require('dotenv').config();

const commandsDir = path.join(__dirname, './module(s)/commands'), eventsDir = path.join(__dirname, './module(s)/events');
let commands = [], events = [];
const cooldowns = new Map(), commandMap = new Map(), eventMap = new Map();

async function startBot() {
    try {
        if (!fs.existsSync('./appstate.json')) {
            console.error('Không tìm thấy appstate.json, hãy tạo mới');
            process.exit(0);
        }
        login(
            { appState: JSON.parse(fs.readFileSync('./appstate.json', 'utf8')) },
            {
                listenEvents: true,
                autoMarkDelivery: false,
                updatePresence: true,
                logLevel: 'silent'
            },
            async (err, api) => {
                if (err) {
                    errAnimation('Đang kết nối...');
                    if (err.code === 'ETIMEDOUT') {
                        console.warn('Lỗi timeout, đang thử lại');
                        startBot();
                    } else {
                        console.error(err);
                        process.exit(0);
                    }
                    return;
                }
                doneAnimation('Đã kết nối thành công.');
                const userId = api.getCurrentUserID();
                const user = await api.getUserInfo([userId]);
                api.getCurrentUserName = () => user[userId]?.name;
                console.info(`Đã kết nối với ${user[userId]?.name || null} (${userId})`);
                commands = loadCommands(api);
                events = loadEvents(api);
                handleMQTTEvents(api);
            }
        );
    } catch (err) { console.error(err); }
}

function reloadCommandsAndEvents(api) {
    clearCommandsAndEvents();
    commands = loadCommands(api);
    events = loadEvents(api);
}

function loadCommands(api) {
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
    const commands = commandFiles.map(file => {
        const commandModule = require(path.join(commandsDir, file));
        if (commandModule && commandModule.name) {
            commandMap.set(commandModule.name.toLowerCase(), commandModule);
            if (commandModule.onLoad) {
                commandModule.onLoad({ api });
            }
            return commandModule;
        } else {
            console.error(`Invalid command module in file ${file}`);
            return null;
        }
    }).filter(command => command !== null);
    console.info(`Successfully loaded ${commands.length} command(s)`);
    return commands;
}

function loadEvents(api) {
    const eventFiles = fs.readdirSync(eventsDir).filter(file => file.endsWith('.js'));
    const events = eventFiles.map(file => {
        const eventModule = require(path.join(eventsDir, file));
        if (eventModule && eventModule.name) {
            eventMap.set(eventModule.name.toLowerCase(), eventModule);
            if (eventModule.onLoad) {
                eventModule.onLoad({ api });
            }
            return eventModule;
        } else {
            console.error(`Invalid event module in file ${file}`);
            return null;
        }
    }).filter(event => event !== null);
    console.info(`Successfully loaded ${events.length} event(s)`);
    return events;
}

function handleMQTTEvents(api) {
    api.listenMqtt(async (err, event) => {
        if (err) {
            console.error(err);
            return;
        }
        try {
            const { body, threadID, senderID, messageID } = event;
            const userInfo = await api.getUserInfo(senderID);
            const senderName = userInfo[senderID]?.name || 'Người Dùng';
            const { PREFIX = '!', ADMIN_UID } = process.env;

            if (!body) {
                return;
            }

            let command = '';
            let args = [];
            let hasPrefix = false;

            if(body.startsWith(PREFIX)){
                hasPrefix=!0;
                args=body.slice(PREFIX.length).trim().split(' ');
                command=args.shift().toLowerCase();
            }else{
                command=body.trim().split(' ')[0].toLowerCase();
                args=body.trim().split(' ').slice(1);
            }

            const commandModule = commandMap.get(command);
            if (commandModule) {
                if (!commandModule.nopre && !hasPrefix) {
                    return;
                }
                if (commandModule.wait) {
                    if (!cooldowns.has(senderID)) {
                        cooldowns.set(senderID, new Map());
                    }
                    const userCooldowns = cooldowns.get(senderID);
                    if (userCooldowns.has(commandModule.name)) {
                        const expirationTime = userCooldowns.get(commandModule.name);
                        const currentTime = Date.now();
                        if (currentTime < expirationTime) {
                            const timeLeft = (expirationTime - currentTime) / 1000;
                            api.sendMessage(`❌ Bạn đã sử dụng lệnh quá nhanh. Vui lòng thử lại sau ${timeLeft.toFixed(1)} giây.`, threadID);
                            return;
                        }
                    }
                    const waitTime = commandModule.wait * 1000;
                    userCooldowns.set(commandModule.name, Date.now() + waitTime);
                }
                if (commandModule.access === 1 && senderID !== ADMIN_UID) {
                    api.sendMessage('❌ Chỉ admin mới có thể sử dụng lệnh này.', threadID);
                    return;
                }
                await commandModule.execute({ api, event, args, commands, events, senderName, body, senderID, threadID, messageID, reload: reloadCommandsAndEvents });
            } else {
                if (hasPrefix) {
                    const fallbackCommand = commandMap.get('\n');
                    if (fallbackCommand) {
                        await fallbackCommand.execute({ api, threadID, messageID });
                    }
                }
            }

            for (const eventModule of events) {
                try {
                    await eventModule.execute({ api, event, args, commands, events, senderName, body, senderID, threadID, messageID, reload: reloadCommandsAndEvents });
                } catch (err) {
                    console.error(`Lỗi khi xử lý sự kiện (${eventModule.name}):`, err);
                }
            }
        } catch (err) { console.error(err); }
    });
}

function clearCommandsAndEvents() {
    fs.readdirSync(commandsDir).forEach(file => {
        if (file.endsWith('.js')) {
            const commandPath = path.join(commandsDir, file);
            delete require.cache[require.resolve(commandPath)];
        }
    });

    fs.readdirSync(eventsDir).forEach(file => {
        if (file.endsWith('.js')) {
            const eventPath = path.join(eventsDir, file);
            delete require.cache[require.resolve(eventPath)];
        }
    });

    commandMap.clear();
    eventMap.clear();
    cooldowns.clear();
}

startBot();