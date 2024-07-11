const { spawn } = require("child_process");
const fs = require('fs');
const { loadingAnimation, doneAnimation } = require('./core(s)/logger/console');

const startChatbot = () => {
    const chatbotProcess = spawn("node", ["--trace-warnings", "--async-stack-traces", "main.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    chatbotProcess.on("close", async (exitCode) => {
        if (exitCode === 1) {
            await khoiDongLaiChatbot();
        } else if (String(exitCode).startsWith("2")) {
            const delayInSeconds = parseInt(String(exitCode).replace('2', ''));
            console.log(`Đang khởi động lại chatbot sau ${delayInSeconds} giây do mã lỗi ${exitCode}...`);
            await new Promise((resolve) => setTimeout(resolve, delayInSeconds * 1000));
            await khoiDongLaiChatbot();
        }
    });

    chatbotProcess.on("error", (error) => {
        console.log("Đã xảy ra lỗi: " + JSON.stringify(error), "[ Khởi động ]");
    });
};

const khoiDongLaiChatbot = async () => {
    console.log("Đang khởi động lại chatbot...");
    await donDepThuMucTemp();
    startChatbot();
};

const donDepThuMucTemp = async () => {
    try {
        if (!fs.existsSync('./.temp')) {
            console.info('Thư mục .temp không tồn tại. Đang tạo thư mục...');
            let loading = loadingAnimation('Đang tạo thư mục .temp');
            fs.mkdirSync('./.temp');
            doneAnimation('Đã tạo thư mục .temp', loading);
        } else {
            let loading = loadingAnimation('Đang dọn dẹp thư mục .temp');
            const tempFiles = fs.readdirSync('./.temp');
            for (const file of tempFiles) {
                fs.unlinkSync(`./.temp/${file}`);
            }
            doneAnimation('Đã dọn dẹp thư mục .temp', loading);
        }
    } catch (error) {
        console.error('Đã xảy ra lỗi khi dọn dẹp thư mục .temp:', error);
    }
};

const main = async () => {
    await donDepThuMucTemp();
    startChatbot();
};

main();
