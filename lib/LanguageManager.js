const fs = require('fs');

class LanguageManager {
  constructor(client, language = 'vi') {
    this.client = client;
    this.language = language;
    this.translations = {};
    this.loadTranslations();
  }

  loadTranslations() {
    const langFile = fs.readFileSync(`./languages/${this.language}.lang`, { encoding: 'utf-8' })
      .split(/\r?\n|\r/);
    const translations = langFile.filter(item => item.indexOf('#') !== 0 && item.trim() !== '');

    for (const item of translations) {
      const [key, value] = item.split('=').map(part => part.trim());
      this.translations[key] = value?.replace(/\\n/gi, '\n');
    }
  }

  translate(key, ...args) {
    if (!this.translations.hasOwnProperty(key)) {
      return;
    }

    let text = this.translations[key];

    for (let i = 0; i < args.length; i++) {
      const regEx = new RegExp(`\\$${i + 1}`, 'g');
      text = text.replace(regEx, args[i]);
    }

    return text;
  }
}

module.exports = LanguageManager;