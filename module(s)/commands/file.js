const fs = require('fs');
module.exports = {
    name: "file",
    author: "Nguyên Blue",
    category: "SYSTEMS",
    version: "1.0",
    nopre: false,
    access: 1,
    wait: 3,
    desc: "read/write/cre/edit/del/rename",
    async execute({ api, args, threadID, body }) {
      if (args.length === 0) {
        const huongDanSuDung = `
          Cách Sử Dụng:
          - Để chỉnh sửa một tệp: \`!file edit <tên_tệp> <mã_mới>\`
          - Để đọc một tệp: \`!file read <tên_tệp>\`
          - Để tạo một tệp: \`!file cre <tên_tệp>\`
          - Để xóa một tệp: \`!file del <tên_tệp>\`
          - Để đổi tên một tệp: \`!file rename <tên_cũ> <tên_mới>\`
        `;
        return api.sendMessage(huongDanSuDung, threadID);
      }
      var path = __dirname + "/";
      if (args[0] == "edit") {
        var newCode = body.slice(
          8 + args[1].length + args[0].length,
          body.length,
        );
        fs.writeFile(
          `${__dirname}/${args[1]}.js`,
          newCode,
          "utf-8",
          function (err) {
            if (err)
              return api.sendMessage(
                `Đã Đã xảy ra lỗi khi áp dụng code mới cho "${args[1]}.js".`,
              );
            api.sendMessage(
              `Đã áp dụng code mới cho "${args[1]}.js".`,
              threadID,
            );
          },
        );
      } else if (args[0] == "read") {
        var data = await fs.readFile(
          `${__dirname}/${args[1]}.js`,
          "utf-8",
          (err, data) => {
            if (err)
              return api.sendMessage(
                `Đã xảy ra lỗi khi đọc lệnh "${args[1]}.js".`,
                threadID
              );
            api.sendMessage(data, threadID);
          },
        );
      } else if (args[0] == "-r") {
        var data = await fs.readFile(
          `${__dirname}/${args[1]}.js`,
          "utf-8",
          (err, data) => {
            if (err)
              return api.sendMessage(
                `Đã xảy ra lỗi khi đọc lệnh "${args[1]}.js".`,
                threadID
              );
            api.sendMessage(data, threadID);
          },
        );
      } else if (args[0] == "cre") {
        if (args[1].length == 0)
          return api.sendMessage("Chưa đặt tên cho modules", threadID);
        if (fs.existsSync(`${__dirname}/${args[1]}.js`))
          return api.sendMessage(
            `${args[1]}.js đã tồn tại.`,
            threadID
          );
        fs.copyFileSync(
          __dirname + "/ping.js",
          __dirname + "/" + args[1] + ".js",
        );
        return api.sendMessage(
          `Đã tạo thành công tệp "${args[1]}.js".`,
          threadID
        );
      } else if (args[0] == "del") {
        fs.unlinkSync(`${__dirname}/${args[1]}.js`);
        return api.sendMessage(
          `Đã xoá file có tên "${args[1]}.js".`,
          threadID
        );
      } else if (args[0] == "rename") {
        fs.rename(
          `${__dirname}/${args[1]}.js`,
          `${__dirname}/${args[2]}.js`,
          function (err) {
            if (err) throw err;
            return api.sendMessage(
              `Đã đổi tên thành công tệp "${args[1]}.js" thành "${args[2]}.js".`,
              threadID
            );
          },
        );
      }
    }
  };
  