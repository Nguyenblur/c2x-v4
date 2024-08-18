const fs = require('fs'), path = require('path'), { client } = require('../lib/Botclient'), LanguageManager = require('../lib/LanguageManager'), { doneAnimation, errAnimation } = require('../logger/index'), commandsDir = path.join(__dirname, '../plugins/commands'), eventsDir = path.join(__dirname, '../plugins/events'), lang = new LanguageManager(client);

function loadCommands(api) {
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
    const commands = commandFiles.map(file => {
        const commandModule = require(path.join(commandsDir, file));
        if (commandModule && commandModule.name) {
             client.commandMap.set(commandModule.name.toLowerCase(), commandModule);
            
            if (commandModule.alias && Array.isArray(commandModule.alias)) {
                commandModule.alias.forEach(aliases => {
                    client.commandMap.set(aliases.toLowerCase(), commandModule);
                });
            }
            
            if (commandModule.onLoad) {
                commandModule.onLoad({ client, api });
            }
            return commandModule;
        } else {
            errAnimation(lang.translate('reloadCammandError', file));
            return null;
        }
    }).filter(command => command !== null);
    doneAnimation(lang.translate('reloadCommand', commands.length));
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
            errAnimation(lang.translate('reloadEventError', file));
            return null;
        }
    }).filter(event => event !== null);
    doneAnimation(lang.translate('reloadEvent', events.length));
    return events;
}

function reloadCommandsAndEvents(api) {
    clearCommandsAndEvents();
    client.commands = loadCommands(api);
    client.events = loadEvents(api);
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
    
    console.log(lang.translate('reloadSuccess'))
}

module.exports = { loadCommands, loadEvents, reloadCommandsAndEvents };