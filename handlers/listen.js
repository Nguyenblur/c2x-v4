const fs = require('fs'), login = require('fca-c2x'), { loadCommands, loadEvents, reloadCommandsAndEvents } = require('../lib/CommandsAndEvents'), { client } = require('../lib/Botclient'), LanguageManager = require('../lib/LanguageManager'), { checkForUpdates } = require('../checkUpdate'), { doneAnimation, errAnimation } = require('../logger/index'), { UserInThreadData, getUser, getThread, money, getAllGroupCount, getAllUserCount } = require('./data'), startServer = require('../dashboard/server/app'), lang = new LanguageManager(client);

async function startBot() {
    try {
        login(
            { appState: JSON.parse(fs.readFileSync("appstate.json", "utf8")) },
            client.config.FCA_OPTION,
            async (err, api) => {
                doneAnimation(lang.translate('currentlyLogged'));
                if (err) {
                    errAnimation(lang.translate('loginError'));
                    return errAnimation(JSON.stringify(err.error));
                }
                await checkForUpdates(lang);
                const userId = api.getCurrentUserID();
                const user = await api.getUserInfo([userId]);
                const userName = user[userId]?.name || null;
                doneAnimation(lang.translate('loginSuccess', userName, userId));
                if (client.config.RUN_SERVER_UPTIME) {
                    startServer(lang);
                }
                doneAnimation(lang.translate('pluginLoading'));
                doneAnimation(lang.translate('loadThreadDataSuccess', await getAllGroupCount()));
                doneAnimation(lang.translate('loadUserDataSuccess', await getAllUserCount()));    
                client.commands = loadCommands(api);
                client.events = loadEvents(api); 
                startmqttListener(api);
            }
        );
    } catch (err) {
        errAnimation(err);
        setTimeout(startBot, 5000); 
    }
}

function handleMQTTEvents(api) {
    client.mqttListener = api.listenMqtt(async (err, message) => {
        if (err) {
            if (err.error === 'Not logged in.') {
                return errAnimation(lang.translate('logoutAccount'));
              }
              if (err.error === 'Not logged in') {
               return errAnimation(lang.translate('checkpointAccount'));
              }
             return errAnimation(err);
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
                  errAnimation(err);
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
                    const userId = message.senderID;
                    const commandName = commandModule.name;
                
                    if (!client.cooldowns.has(userId)) {
                        client.cooldowns.set(userId, new Map());
                    }
                    
                    const userCooldowns = client.cooldowns.get(userId);
                
                    if (userCooldowns.has(commandName)) {
                        const expirationTime = userCooldowns.get(commandName);
                        const currentTime = Date.now();
                        
                        if (currentTime < expirationTime) {
                            if (!userCooldowns.get(`${commandName}_notified`)) {
                                const timeLeft = (expirationTime - currentTime) / 1000;
                                api.sendMessage(lang.translate('commandWait', commandName, timeLeft.toFixed(1)), message.threadID);
                                userCooldowns.set(`${commandName}_notified`, true); 
                            }
                            return;
                        }
                    }
                
                    const waitTime = commandModule.wait * 1000;
                    const expirationTime = Date.now() + waitTime;
                    userCooldowns.set(commandName, expirationTime);
                    userCooldowns.delete(`${commandName}_notified`); 
                }            
                if (commandModule.category === "nsfw") {
                    if (!client.nsfw.includes(message.threadID)) {
                      api.sendMessage(lang.translate('commandNsfw'), message.threadID);
                      return;
                    }
                  }
                if (commandModule.admin && !client.config.UID_ADMIN.includes(message.senderID)) {
                    api.sendMessage(lang.translate('commandAdmin'), message.threadID);
                    return;
                  }
                  let getText;

                  if (commandModule.lang && typeof commandModule.lang === 'object' && commandModule.lang.hasOwnProperty(client.config.LANGUAGE)) {
                   getText = (...values) => {
                  const language = commandModule.lang[client.config.LANGUAGE];
                  const key = values[0];
                  let text = language[key] || '';

                  for (let i = 1; i < values.length; i++) {
                  const regEx = new RegExp(`\\$${i}`, 'g');
                  text = text.replace(regEx, values[i]);
                  }

                  return text;
                  };
             } else {
                 getText = () => {};
            }
                await commandModule.onCall({ client, api, message, args, user: getUser, thread: getThread, getAllUserCount, getAllGroupCount, money, reload: reloadCommandsAndEvents, getText });
            } else {
                if (hasPrefix) {
                    const fallbackCommand = client.commandMap.get('\n');
                    if (fallbackCommand) {
                        await fallbackCommand.onCall({ api, message });
                    }
                }
            }
        } catch (err) {
            errAnimation(err);
        }
    });
}

function startmqttListener(api) {
    if (client.mqttListener) {
        client.mqttListener.stopListening();
    }
    handleMQTTEvents(api);
    setInterval(() => {
        doneAnimation(lang.translate('refreshMqtt'));
        if (client.mqttListener) {
            client.mqttListener.stopListening();
        }
        handleMQTTEvents(api);
    }, 2 * 60 * 60 * 1000); 
}

startBot();
