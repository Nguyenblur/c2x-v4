const fs = require('fs');
const path = require('path');
const login = require('fca-c2x');
const { doneAnimation, errAnimation } = require('./logger/index');
const { UserInThreadData, getUser, getThread, money } = require('./app/index');

const commandsDir = path.join(__dirname, './modules/commands'), eventsDir = path.join(__dirname, './modules/events');

const client = {
   commands: [],
   events: [],
   commandMap: new Map(),
   eventMap: new Map(),
   cooldowns: new Map(),
   mqttListener: null,
   config: process.env
};

async function startBot() {
    try {
        if (!fs.existsSync('./appstate.json')) {
            console.error('Không tìm thấy appstate.json, hãy tạo mới');
            process.exit(0);
        }
        login(
            { appState: JSON.parse(fs.readFileSync("appstate.json", "utf8")) },
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
                doneAnimation('successfully initialize and connect to the database');
                const userId = api.getCurrentUserID();
                const user = await api.getUserInfo([userId]);
                console.info(`Đã kết nối với ${user[userId]?.name || null} (${userId})`);
                client.commands = loadCommands(api);
                client.events = loadEvents(api);
                startmqttListener(api);
            }
        );
    } catch (err) {
        console.error(err);
        setTimeout(startBot, 5000); 
    }
}

function reloadCommandsAndEvents(api) {
    clearCommandsAndEvents();
    client.commands = loadCommands(api);
    client.events = loadEvents(api);
}

function loadCommands(api) {
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
    const commands = commandFiles.map(file => {
        const commandModule = require(path.join(commandsDir, file));
        if (commandModule && commandModule.name) {
            client.commandMap.set(commandModule.name.toLowerCase(), commandModule);
            if (commandModule.onLoad) {
                commandModule.onLoad({ client, api });
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
            client.eventMap.set(eventModule.name.toLowerCase(), eventModule);
            if (eventModule.onLoad) {
                eventModule.onLoad({ client, api });
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
    client.mqttListener = api.listenMqtt(async (err, message) => {
        if (err) {
            console.error(err);
            return;
        }

        if (message.type == "message" || message.type == "message_reply") {
            message.user = (await api.getUserInfo(message.senderID))[message.senderID];
            message.thread = await api.getThreadInfo(message.threadID);
            message.react = (content) => {
                return new Promise((resolve, reject) => {
                    api.setMessageReaction(content, message.messageID, (err, message) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(message);
                        }
                    }, () => {}, true);
                });
            };
            message.reply = (content, targetID) => {
                return new Promise((resolve, reject) => {
                    api.sendMessage(content, targetID, (err, message) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(message);
                        }
                    }, message.messageID);
                });
            };
            message.send = (content, targetID) => {
                return new Promise((resolve, reject) => {
                    api.sendMessage(content, targetID, (err, message) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(message);
                        }
                    });
                });
            };
        }

        UserInThreadData(message);
   
        try {

            for (const module of [...client.commands,...client.events]) {
                try {
                  if (module.onMessage) {
                    await module.onMessage({ client, api, message, user: getUser, thread: getThread, money });
                  }
                } catch (err) {
                  console.error(`Error handling message (${module.name}):`, err);
                }
              }

            if (!message.body) {
                return;
            }

            let command = '';
            let args = [];
            let hasPrefix = false;

            if (message.body.startsWith(client.config.PREFIX)) {
                hasPrefix = true;
                args = message.body.slice(client.config.PREFIX.length).trim().split(' ');
                command = args.shift().toLowerCase();
            } else {
                command = message.body.trim().split(' ')[0].toLowerCase();
                args = message.body.trim().split(' ').slice(1);
            }

            const commandModule = client.commandMap.get(command);
              if (commandModule) {
                if (!commandModule.nopre && !hasPrefix) {
                    return;
                }
                if (commandModule.wait) {
                    if (!client.cooldowns.has(message.senderID)) {
                        client.cooldowns.set(message.senderID, new Map());
                    }
                    const userCooldowns = client.cooldowns.get(message.senderID);
                    if (userCooldowns.has(commandModule.name)) {
                        const expirationTime = userCooldowns.get(commandModule.name);
                        const currentTime = Date.now();
                        if (currentTime < expirationTime) {
                            const timeLeft = (expirationTime - currentTime) / 1000;
                            api.sendMessage(`❌ Bạn đã sử dụng lệnh quá nhanh. Vui lòng thử lại sau ${timeLeft.toFixed(1)} giây.`, message.threadID);
                            return;
                        }
                    }
                    const waitTime = commandModule.wait * 1000;
                    userCooldowns.set(commandModule.name, Date.now() + waitTime);
                }
                if (commandModule.admin && message.senderID !== client.config.ADMIN_UID) {
                    api.sendMessage('❌ Chỉ admin mới có thể sử dụng lệnh này.', message.threadID);
                    return;
                }
                await commandModule.onCall({ client, api, message, args, user: getUser, thread: getThread, money, reload: reloadCommandsAndEvents });
            } else {
                if (hasPrefix) {
                    const fallbackCommand = client.commandMap.get('\n');
                    if (fallbackCommand) {
                        await fallbackCommand.onCall({ api, message });
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    });
}

function startmqttListener(api) {
    if (client.mqttListener) {
        client.mqttListener.stopListening();
    }
    handleMQTTEvents(api);
    setInterval(() => {
        console.log('Reloading MQTT listener...');
        if (client.mqttListener) {
            client.mqttListener.stopListening();
        }
        handleMQTTEvents(api);
    }, 2 * 60 * 60 * 1000); 
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

    client.commandMap.clear();
    client.eventMap.clear();
    client.cooldowns.clear();
}

startBot();