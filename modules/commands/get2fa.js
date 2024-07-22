const GoogleAuthenticator = require('../../app/google/Authenticator');

module.exports = {
    name: "get2fa",
    author: "Nguyên Blue",
    category: "TOOLS",
    version: "1.0",
    nopre: false,
    admin: false,
    wait: 3,
    desc: "Nhập mã và nhận về code đã giải mã từ Google Authenticator.",
    async onCall({ args, message }) {
        const key = args[0];

        if (!key) {
            return message.send("Bạn cần nhập mã để lấy code!", message.threadID);
        }

        try {
            const ga = new GoogleAuthenticator();
            const code = ga.getCode(key);

            return message.send(`Code đã giải mã từ mã '${key}': ${code}`, message.threadID);
        } catch (error) {
            console.error("Lỗi khi giải mã:", error.message);
            return message.send("Đã xảy ra lỗi khi giải mã!", message.threadID);
        }
    }
};
