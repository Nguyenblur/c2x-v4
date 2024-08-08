const { doneAnimation } = require('./logger/index');
const fs = require('fs');
const readline = require('readline');
const { spawn } = require('child_process');

const startChatbot = () => {
    const chatbotProcess = spawn("node", ["--trace-warnings", "--async-stack-traces", "utils/listen.js"], {
        cwd: __dirname,
        stdio: "inherit", 
        shell: true
    });

    chatbotProcess.on("close", async (exitCode) => {
        if (exitCode === 1) {
            await restartChatbot();
        } else if (String(exitCode).startsWith("2")) {
            const delayInSeconds = parseInt(String(exitCode).replace('2', ''));
            console.log(`Khởi động lại sau ${delayInSeconds} giây do mã lỗi ${exitCode}...`);
            await new Promise((resolve) => setTimeout(resolve, delayInSeconds * 1000));
            await restartChatbot();
        }
    });

    chatbotProcess.on("error", (error) => {
        console.log("Đã xảy ra lỗi: " + error.message, "[ Khởi động ]");
    });
};

const restartChatbot = async () => {
    console.info("Đang khởi động lại...");
    await cleanupTempFolder();
    startChatbot();
};

const cleanupTempFolder = async () => {
    try {
        const tempFolder = './.temp';
        if (!fs.existsSync(tempFolder)) {
            console.info('Thư mục .temp không tồn tại. Đang tạo thư mục...');
            fs.mkdirSync(tempFolder);
            doneAnimation('Đã tạo thư mục .temp');
        } else {
            const tempFiles = fs.readdirSync(tempFolder);
            for (const file of tempFiles) {
                fs.unlinkSync(`${tempFolder}/${file}`);
            }
            doneAnimation('Đã dọn dẹp thư mục .temp');
        }
    } catch (error) {
        console.error('Đã xảy ra lỗi khi dọn dẹp thư mục .temp:', error.message);
    }
};

const promptUserForConfiguration = async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const nhapDuLieu = (message) => new Promise((resolve) => {
        rl.question(message, (answer) => {
            resolve(answer.trim());
        });
    });

    const prefix = await nhapDuLieu('Hãy Nhập Prefix: ');
    const uidAdmin = await nhapDuLieu('Hãy Nhập Uid Admin: ');
    const icon_unsend = await nhapDuLieu('Hãy Nhập Icon Để Auto UnSend khi thả: ');
    rl.close();

    fs.writeFileSync('./config/config.main.json', JSON.stringify({
        ICON_UNSEND: icon_unsend,
        PREFIX: prefix,
        UID_ADMIN: [uidAdmin]
    }, null, 2));  
    doneAnimation('Setup hoàn tất...');
};

const main = async () => {
    if (!fs.existsSync('./config/config.main.json')) {
        console.log(`
            ░██████╗███████╗████████╗██╗░░░██╗██████╗░░░░░░░░█████╗░██████╗░██╗░░██╗
            ██╔════╝██╔════╝╚══██╔══╝██║░░░██║██╔══██╗░░░░░░██╔══██╗╚════██╗╚██╗██╔╝
            ╚█████╗░█████╗░░░░░██║░░░██║░░░██║██████╔╝█████╗██║░░╚═╝░░███╔═╝░╚███╔╝░
            ░╚═══██╗██╔══╝░░░░░██║░░░██║░░░██║██╔═══╝░╚════╝██║░░██╗██╔══╝░░░██╔██╗░
            ██████╔╝███████╗░░░██║░░░╚██████╔╝██║░░░░░░░░░░░╚█████╔╝███████╗██╔╝╚██╗
            ╚═════╝░╚══════╝░░░╚═╝░░░░╚═════╝░╚═╝░░░░░░░░░░░░╚════╝░╚══════╝╚═╝░░╚═╝
        `);
        await promptUserForConfiguration();
    }

    await cleanupTempFolder();
    if (!fs.existsSync('./appstate.json')) {
        console.error('Không tìm thấy appstate.json, hãy tạo mới');
        process.exit(0);
    }
    startChatbot();
};

main();