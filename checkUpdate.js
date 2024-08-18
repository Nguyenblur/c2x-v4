const { doneAnimation } = require('./logger/index');
const fs = require('fs');
const axios = require('axios'); 

const checkForUpdates = async (lang) => {
    try {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      const currentVersion = packageJson.version;
      const check = String.fromCharCode(104,116,116,112,115,58,47,47,114,97,119,46,103,105,116,104,117,98,46,99,111,109,47,78,103,117,121,101,110,98,108,117,114,47,99,50,120,47,109,97,105,110,47,112,97,99,107,97,103,101,46,106,115,111,110);
      try {
        const response = await axios.get(check);
        const remotePackageJson = response.data;
        const latestVersion = remotePackageJson.version;
  
        if (latestVersion !== currentVersion) {
          console.info(lang.translate('newVersionAvailable'));
        } else {
          doneAnimation(lang.translate('upToDate'));
        }
      } catch (error) {
        console.error(lang.translate('errorCheckingVersion', error.message));
      }
    } catch (error) {
      console.error(lang.translate('errorReadingPackageJson', error.message));
    }
};

module.exports = { checkForUpdates };