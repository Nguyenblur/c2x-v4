module.exports = {
  name: 'help',
  alias: ['menu'],
  author: "Nguyên Blue",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 5,
  desc: 'Hiển thị danh sách lệnh hoặc chi tiết một lệnh.',
  onCall: ({ message, client, args }) => {
    const categories = {};

    client.commands.forEach(cmd => {
      if (cmd.category && cmd.name !== '\n') {
        if (!categories[cmd.category]) {
          categories[cmd.category] = [];
        }
        categories[cmd.category].push({ name: cmd.name, desc: cmd.desc });
      }
    });

    if (args.length === 0) {
      let helpMessage = '';
      Object.keys(categories).forEach(category => {
        helpMessage += `[ ${category} ]\n📝 Tổng lệnh: ${categories[category].length} lệnh\n`;
        categories[category].forEach(cmd => {
          helpMessage += `${cmd.name}, `;
        });
        helpMessage = helpMessage.slice(0, -2);
        helpMessage += '\n\n';
      });
      let totalCommands = Object.values(categories).reduce((acc, curr) => acc + curr.length, 0);
      helpMessage += `🚀 hiện có ${totalCommands} lệnh.\n🔥 hiện có ${client.events.length} sự kiện.`;
      message.send(helpMessage, message.threadID);
    } else {
      const commandName = args[0].toLowerCase();
      const command = client.commands.find(cmd => cmd.name === commandName);

      if (!command) {
        message.send(`Không tìm thấy lệnh có tên "${commandName}".`, message.threadID);
      } else {
        let accessLevel = command.admin ? "Quản trị viên" : "Thành viên";
        let commandMessage = `🌟 Tên lệnh: ${command.name.toUpperCase()}\n📝 Phiên bản: ${command.version}\n👤 Quyền Hạn: ${accessLevel}\n🧪 Credit: ${command.author}\n✏ Mô Tả: ${command.desc}\n📎 Thể loại: ${command.category}\n⏳ Thời gian chờ: ${command.wait}s`;
        message.send(commandMessage, message.threadID);
      }
    }
  }
};
