module.exports = {
    name: "reload",
    author: "Nguyên Blue",
    category: "SYSTEMS",
    version: "1.0",
    nopre: false,
    access: 1,
    wait: 3,
    desc: "reload commands and events",
    async execute({ api, events, commands, event, reload }) {
        try {
            await reload(api);

             api.sendMessage(`Đã reload ${commands.length} commands và ${events.length} events thành công!`, event.threadID);
        } catch (err) {
             console.error('Lỗi khi reload commands và events:', err);
            api.sendMessage('Đã có lỗi xảy ra khi reload commands và events!', event.threadID);
        }
    }
};
