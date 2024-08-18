module.exports = {
  name: "file",
  author: "Cre: Tao Không Biết, Nguyên Blue [convert]",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  admin: true,
  wait: 3,
  desc: "QUẢN LÝ FILE",
  async onCall({ api, args, message, client }) {
    const fs = require('fs');
    
    if (args.length === 0) {
      const huongDanSuDung = `
        Cách Sử Dụng:
        - Để chỉnh sửa một tệp: \`${client.config.PREFIX}file edit <tên_tệp> <mã_mới>\`
        - Để đọc một tệp: \`${client.config.PREFIX}file read <tên_tệp>\`
        - Để tạo một tệp: \`${client.config.PREFIX}file cre <tên_tệp>\`
        - Để xóa một tệp: \`${client.config.PREFIX}file del <tên_tệp>\`
        - Để đổi tên một tệp: \`${client.config.PREFIX}file rename <tên_cũ> <tên_mới>\`
      `;
      return api.sendMessage(huongDanSuDung, message.threadID);
    }

    if (args[0] == "edit") {
      var newCode = message.body.slice(
        8 + args[1].length + args[0].length,
        message.body.length,
      );
      fs.writeFile(
        `${__dirname}/${args[1]}.js`,
        newCode,
        "utf-8",
        function (err) {
          if (err)
            return api.sendMessage(
              `Đã xảy ra lỗi khi áp dụng mã mới cho "${args[1]}.js".`,
              message.threadID,
            );
          api.sendMessage(
            `Đã áp dụng mã mới cho "${args[1]}.js".`,
            message.threadID,
          );
        },
      );
    } else if (args[0] == "read") {
      try {
        var data = await fs.promises.readFile(
          `${__dirname}/${args[1]}.js`,
          "utf-8"
        );
        api.sendMessage(data, message.threadID);
      } catch (err) {
        api.sendMessage(
          `Đã xảy ra lỗi khi đọc tệp "${args[1]}.js".`,
          message.threadID,
        );
      }
    } else if (args[0] == "cre") {
      if (args[1].length === 0)
        return api.sendMessage("Chưa đặt tên cho tệp", message.threadID);
      if (fs.existsSync(`${__dirname}/${args[1]}.js`))
        return api.sendMessage(
          `${args[1]}.js đã tồn tại.`,
          message.threadID,
        );
      fs.copyFileSync(
        __dirname + "/ping.js",
        __dirname + "/" + args[1] + ".js",
      );
      return api.sendMessage(
        `Đã tạo thành công tệp "${args[1]}.js".`,
        message.threadID,
      );
    } else if (args[0] == "del") {
      try {
        fs.unlinkSync(`${__dirname}/${args[1]}.js`);
        api.sendMessage(
          `Đã xoá file có tên "${args[1]}.js".`,
          message.threadID,
        );
      } catch (err) {
        api.sendMessage(
          `Đã xảy ra lỗi khi xoá file "${args[1]}.js".`,
          message.threadID,
        );
      }
    } else if (args[0] == "rename") {
      fs.rename(
        `${__dirname}/${args[1]}.js`,
        `${__dirname}/${args[2]}.js`,
        function (err) {
          if (err) throw err;
          api.sendMessage(
            `Đã đổi tên thành công tệp "${args[1]}.js" thành "${args[2]}.js".`,
            message.threadID,
          );
        },
      );
    }
  }
};
