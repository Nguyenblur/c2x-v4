module.exports = {
  name: "filter",
  author: "ProCoderMew, Nguyên Blue [convert]",
  category: "SYSTEMS",
  version: "1.0",
  nopre: false,
  admin: false,
  wait: 3,
  desc: "Check ping",
  async onCall({ api, message }) {
    var { userInfo, adminIDs } = await api.getThreadInfo(message.threadID);    
    var success = 0, fail = 0;
    var arr = [];
    for (const e of userInfo) {
        if (e.gender == undefined) {
            arr.push(e.id);
        }
    };

    adminIDs = adminIDs.map(e => e.id).some(e => e == api.getCurrentUserID());
    if (arr.length == 0) {
        return api.sendMessage("❎ Trong nhóm không tồn tại tài khoản bị khóa", message.threadID);
    }
    else {
        api.sendMessage("🔎 Nhóm bạn hiện có " + arr.length + " tài khoản bị khoá", message.threadID, function () {
            if (!adminIDs) {
                api.sendMessage("❎ Nhưng bot không phải là quản trị viên nên không thể lọc", message.threadID);
            } else {
                api.sendMessage("🔄 Bắt đầu lọc...", message.threadID, async function() {
                    for (const e of arr) {
                        try {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            await api.removeUserFromGroup(parseInt(e), message.threadID);   
                            success++;
                        }
                        catch {
                            fail++;
                        }
                    }
                  
                    api.sendMessage("✅ Đã lọc thành công " + success + " tài khoản", message.threadID, function() {
                        if (fail != 0) return api.sendMessage("❎ Lọc thất bại " + fail + " tài khoản", message.threadID);
                    });
                })
            }
        })
     }
  }
};