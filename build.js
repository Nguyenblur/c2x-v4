const { doneAnimation, errAnimation } = require('./logger/index');
const fs = require('fs');
const readline = require('readline');
const { spawn } = require('child_process');
const { client } = require('./lib/Botclient');
const LanguageManager = require('./lib/LanguageManager');
const lang = new LanguageManager(client);

const CONFIG_FILE = './config/config.main.json';
const TEMP_FOLDER = './.temp';
const APPSTATE_FILE = './appstate.json';

const _1_MINUTE = 60000;
let restartCount = 0;

const startChatbot = () => {
  const chatbotProcess = spawn("node", ["--trace-warnings", "--async-stack-traces", "handlers/listen.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true
  });

  chatbotProcess.on("close", async (code) => {
    handleRestartCount();
    if (code !== 0 && restartCount < 5) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await restartChatbot();
    }
  });

  chatbotProcess.on("error", (error) => {
    console.log(lang.translate('errorOccurred', error.message));
  });
};

const restartChatbot = async () => {
  console.info(lang.translate('restartingBot'));
  await cleanupTempFolder();
  startChatbot();
};

function handleRestartCount() {
  restartCount++;
  setTimeout(() => {
      restartCount--;
  }, _1_MINUTE);
}

const cleanupTempFolder = async () => {
  try {
    if (!fs.existsSync(TEMP_FOLDER)) {
      console.info(lang.translate('tempFolderDoesNotExist'));
      fs.mkdirSync(TEMP_FOLDER);
      doneAnimation(lang.translate('tempFolderCreated'));
    } else {
      const tempFiles = fs.readdirSync(TEMP_FOLDER);
      for (const file of tempFiles) {
        fs.unlinkSync(`${TEMP_FOLDER}/${file}`);
      }
      doneAnimation(lang.translate('tempFolderCleaned'));
    }
  } catch (error) {
    errAnimation(lang.translate('errorCleaningTempFolder', error.message));
  }
};

const promptUserForConfiguration = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (message) => new Promise((resolve) => {
    rl.question(message, (answer) => {
      resolve(answer.trim());
    });
  });

  const prefix = await askQuestion(lang.translate('enterPrefix'));
  const uidAdmin = await askQuestion(lang.translate('enterUidAdmin'));
  const icon_unsend = await askQuestion(lang.translate('enterIconUnsend'));
  rl.close();

  fs.writeFileSync(CONFIG_FILE, JSON.stringify({
    FCA_OPTION: {
      listenEvents: true,
      autoMarkDelivery: false,
      updatePresence: true,
      logLevel: "silent"
    },
    PORT: 8080,
    RUN_SERVER_UPTIME: true,
    LANGUAGE: "en",
    ICON_UNSEND: icon_unsend,
    PREFIX: prefix,
    UID_ADMIN: [uidAdmin]
  }, null, 2));
  doneAnimation(lang.translate('setupComplete'));
};

const main = async () => {
  if (!fs.existsSync(CONFIG_FILE)) {
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
  if (!fs.existsSync(APPSTATE_FILE)) {
    errAnimation(lang.translate('appStateFileNotFound'));
    process.exit(0);
  }
  startChatbot();
};

main();