const { loadMoneyData, saveMoneyData, formatMoney } = require('../../core(s)/utils/index');

const vietnameseWords = [
  "điện thoại", "máy tính", "bàn phím", "chuột", "tivi", "máy giặt", "bếp ga", "quạt điện", "đèn", "ghế sofa",
  "lái xe", "thông minh", "điện tử", "thành phố", "trường học", "không gian", "tương lai", "sáng tạo", "khoảng cách", "quản lý",
  "công ty", "xã hội", "công nghiệp", "dịch vụ", "sản xuất", "kỹ thuật", "tiếp thị", "chuyển giao", "đổi mới", "nâng cao",
  "kết nối", "hợp tác", "liên kết", "cộng tác", "giải pháp", "triển khai", "thử nghiệm", "tổ chức", "khởi nghiệp", "quản lý",
  "đầu tư", "tài sản", "nhân sự", "hạ tầng", "kế hoạch", "dự án", "kinh doanh", "hoạt động", "sự kiện", "cơ hội",
  "thách thức", "sáng tạo", "truyền thông", "xã giao", "tương tác", "hành chính", "thực hiện", "trình độ", "phương án", "sản phẩm",
  "chất lượng", "cải tiến", "hiệu quả", "gia tăng", "ứng dụng", "hệ thống", "phân phối", "tiêu chuẩn", "tối ưu", "công cụ",
  "thương mại", "năng lượng", "vật liệu", "môi trường", "khí hậu", "chính sách", "hợp đồng", "cấp bách", "đầu ra", "đầu vào",
  "chế độ", "phát triển", "diễn đàn", "thanh toán", "sản lượng", "dữ liệu", "bảo vệ", "an toàn", "bảo mật", "khảo sát",
  "thủ tục", "tài liệu", "trang bị", "bộ phận", "công nghệ", "hành trình", "sự kiện", "tình huống", "kỹ năng", "kĩ thuật",
  "bắt đầu", "kết thúc", "phát hành", "bảo dưỡng", "vận hành", "sử dụng", "tham gia", "hỗ trợ", "đào tạo", "nghiên cứu",
  "lập kế hoạch", "thực hiện", "cải thiện", "tối ưu hóa", "đổi mới", "tiếp thị", "tăng cường", "đánh giá", "đối tác", "tổ chức",
  "sản xuất", "kinh doanh", "thiết kế", "chế tạo", "phân phối", "quản lý", "dịch vụ", "bảo trì", "kiểm tra", "quản lý",
  "chất lượng", "tài chính", "kế toán", "tư vấn", "xây dựng", "vận hành", "trung tâm", "phát triển", "nghiên cứu", "hợp tác",
  "hội thảo", "hội nghị", "sự kiện", "thực tế", "tương lai", "thành phố", "vùng lãnh thổ", "quốc gia", "quốc tế", "địa phương",
  "hàng hóa", "dịch vụ", "thương mại", "thương hiệu", "nhãn hiệu", "quảng cáo", "tiếp thị", "môi trường", "khí hậu", "chính phủ",
  "doanh nghiệp", "công ty", "tổ chức", "tập đoàn", "cá nhân", "phát triển", "thiết kế", "sản xuất", "dịch vụ", "kỹ thuật",
  "thương mại", "nông nghiệp", "công nghiệp", "đầu tư", "tài chính", "kế toán", "tư vấn", "chính sách", "quản lý", "hành chính",
  "hành động", "trách nhiệm", "vai trò", "nguyên tắc", "lợi ích", "tín dụng", "thanh khoản", "tài liệu", "thiết bị", "bảo dưỡng",
  "vận hành", "sử dụng", "tương tác", "giao tiếp", "tiếp nhận", "phân phối", "cung cấp", "tái chế", "phát triển", "tạo ra",
  "nâng cao", "đổi mới", "tăng cường", "thực hiện", "quản lý", "xây dựng", "phát triển", "sử dụng", "lưu trữ", "bảo mật",
  "quản lý", "dữ liệu", "phát hành", "chính sách", "quy định", "kỹ năng", "chuyên môn", "sáng tạo", "cải tiến", "tối ưu hóa",
  "thí nghiệm", "thống kê", "kế hoạch", "chiến lược", "hợp đồng", "công nghệ", "công cụ", "phương pháp", "phương tiện", "quy trình",
  "phương án", "kết quả", "đánh giá", "thiết lập", "thực hiện", "bảo trì", "kiểm tra", "đánh giá", "xử lý", "phân tích",
  "tăng cường", "phát triển", "quản lý", "nghiên cứu", "thực thi", "hỗ trợ", "đào tạo", "vận hành", "tái chế", "tái tạo",
  "tích hợp", "tối ưu", "đổi mới", "khảo sát", "thử nghiệm", "tham vấn", "cố vấn", "chuyên gia", "báo cáo", "thông báo",
  "truyền thông", "quảng bá", "thương mại", "dịch vụ", "hội nghị", "hội thảo", "sự kiện", "chính sách", "định hướng", "điều chỉnh",
  "năng suất", "hiệu quả", "tối đa", "tối thiểu", "nâng cao", "giảm thiểu", "tăng trưởng", "phát triển", "vận hành", "quản lý",
  "thiết lập", "điều chỉnh", "điều hành", "dẫn dắt", "lãnh đạo", "phát huy", "thúc đẩy", "khuyến khích", "phát triển", "thúc đẩy",
  "tạo điều kiện", "cơ sở hạ tầng", "kỹ thuật", "phương pháp", "phương án", "quy trình", "phương tiện", "quy tắc", "quy định", "tiêu chuẩn",
  "công cụ", "phần mềm", "hệ thống", "thiết bị", "trang bị", "công nghệ", "ứng dụng", "cơ sở", "dự án", "sản phẩm",
  "dịch vụ", "quản lý", "tài chính", "kế toán", "tư vấn", "chuyên gia", "thiết kế", "sản xuất", "dịch vụ", "bảo trì",
  "kiểm tra", "đánh giá", "đánh giá", "thí nghiệm", "phân tích", "phân tích", "dự báo", "thống kê", "thống kê", "phân phối",
  "tổ chức", "sự kiện", "hội nghị", "hội thảo", "giao tiếp", "truyền thông", "quảng bá", "tiếp thị", "thương mại", "quản lý",
  "tăng cường", "phát triển", "sử dụng", "nâng cao", "cải thiện", "chính sách", "điều chỉnh", "đào tạo", "vận hành", "thực thi",
  "đổi mới", "thiết lập", "tối ưu", "tái chế", "tái tạo", "khảo sát", "thử nghiệm", "tham vấn", "cố vấn", "chuyên gia",
  "báo cáo", "thông báo", "thông tin", "hướng dẫn", "chính sách", "kế hoạch", "chiến lược", "phương án", "công cụ", "phương pháp",
  "quy trình", "phương tiện", "quy tắc", "quy định", "tiêu chuẩn", "hành vi", "văn hóa", "hệ thống", "hệ thống", "tổ chức",
  "thực hiện", "phát hành", "cập nhật", "nâng cấp", "bảo mật", "tối ưu", "tái chế", "tái tạo", "khảo sát", "thử nghiệm",
  "tham vấn", "cố vấn", "chuyên gia", "báo cáo", "thông báo", "thông tin", "hướng dẫn", "chính sách", "kế hoạch", "chiến lược",
  "phương án", "công cụ", "phương pháp", "quy trình", "phương tiện", "quy tắc", "quy định", "tiêu chuẩn", "hành vi", "văn hóa",
  "hệ thống", "tổ chức", "thực hiện", "phát hành", "cập nhật", "nâng cấp", "bảo mật", "tối ưu", "tái chế", "tái tạo"
];

const wordScrambleGames = {};
const GAME_DURATION = 120000;

function getRandomWord() {
  const randomIndex = Math.floor(Math.random() * vietnameseWords.length);
  return vietnameseWords[randomIndex];
}

function scrambleWord(word) {
  const shuffledWord = word.split('').sort(() => Math.random() - 0.5).join('');
  return shuffledWord;
}

function calculateReward(attempts) {
  const rewards = [150000, 100000, 80000, 60000, 50000];
  const index = Math.min(Math.floor(attempts / 2), rewards.length - 1);
  return rewards[index];
}

function startWordScrambleGame(api, threadID) {
  const originalWord = getRandomWord();
  const scrambledWord = scrambleWord(originalWord);
  
  const game = {
    originalWord,
    scrambledWord,
    attempts: 0,
    startTime: Date.now(),
    timer: null,
    winnerID: null,
    winnerName: null,
    attemptedPlayers: {} // Track attempts per player
  };
  
  wordScrambleGames[threadID] = game;
  game.timer = setTimeout(() => endWordScrambleGame(api, threadID), GAME_DURATION);
  
  api.sendMessage({
    body: `🔠 Bắt đầu trò chơi 'Giải mã từ vựng tiếng Việt'!\nHãy giải mã từ: ${scrambledWord}`,
  }, threadID);
}

function handleWordScrambleInput(api, event, senderName) {
  const threadID = event.threadID;
  const senderID = event.senderID;
  const message = event.body.trim().toLowerCase();

  if (!wordScrambleGames[threadID]) return;

  const game = wordScrambleGames[threadID];
  const originalWord = game.originalWord;

  // Check if player has already used all 3 attempts
  if (game.attemptedPlayers[senderID] >= 3) {
    setTimeout(() => {
      api.sendMessage(`❌ Bạn đã dùng hết số lần đoán cho trò chơi này!`, threadID);
    }, 2000); // Delay of 2 seconds before sending the message
    return;
  }

  // Increase the attempts count for the player
  game.attemptedPlayers[senderID] = (game.attemptedPlayers[senderID] || 0) + 1;

  // Compare normalized versions of message and originalWord
  if (normalizeVietnamese(message) !== normalizeVietnamese(originalWord)) {
    api.sendMessage(`❌ Đáp án không chính xác. Hãy thử lại!`, threadID);
    return;
  }

  if (game.timer) {
    game.attempts++;
    game.winnerID = senderID;
    game.winnerName = senderName; // Set the winner's name
    
    const rewardMoney = calculateReward(game.attempts);
    let moneyData = loadMoneyData(); // Placeholder function
    moneyData[game.winnerID] = (moneyData[game.winnerID] || 0) + rewardMoney;
    saveMoneyData(moneyData); // Placeholder function
    
    api.sendMessage({
      body: `🎉 Chính xác! ${game.winnerName} đã giải mã từ "${originalWord}" sau ${game.attempts} lần đoán.\n💰 Bạn nhận được ${formatMoney(rewardMoney)}.\n💵 Số tiền hiện tại của bạn là: ${formatMoney(moneyData[game.winnerID])}`,
      mentions: [{
        tag: game.winnerName,
        id: game.winnerID
      }]
    }, threadID);
    
    clearTimeout(game.timer);
    delete wordScrambleGames[threadID];
  }
}

function endWordScrambleGame(api, threadID) {
  const game = wordScrambleGames[threadID];
  
  if (!game || !game.timer) return;

  const { originalWord, attempts, winnerID, winnerName, startTime } = game;
  const elapsedTime = Date.now() - startTime;

  if (elapsedTime >= GAME_DURATION) {
    clearTimeout(game.timer);
    delete wordScrambleGames[threadID];
    
    const durationSeconds = Math.floor(GAME_DURATION / 1000);
    const message = `⏱️ Bạn đã hết thời gian giải mã.\nĐáp án đúng là "${originalWord}". Người chơi ${winnerName ? `${winnerName} (${winnerID})` : 'không ai'} đã giành chiến thắng sau ${attempts} lần đoán.\nTrò chơi đã kết thúc sau ${durationSeconds} giây.`;
    
    api.sendMessage(message, threadID);
  }
}

// Function to normalize Vietnamese characters
function normalizeVietnamese(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

module.exports = {
  name: "wordscramble",
  author: "Nguyên Blue",
  category: "GAMES",
  version: "1.0",
  nopre: true,
  access: 0,
  wait: 0,
  desc: "Game giải mã từ vựng tiếng Việt",
  async execute({ api, senderName, senderID, threadID }) {
    if (wordScrambleGames[threadID]) {
      api.sendMessage("❌ Trò chơi 'Giải mã từ vựng tiếng Việt' đang diễn ra trong nhóm này. Hãy hoàn thành hoặc chờ kết thúc trước khi bắt đầu trò chơi mới.", threadID);
      return;
    }

    startWordScrambleGame(api, threadID);

    api.listenMqtt(async (err, event) => {
      if (err) {
        console.error(err);
        return;
      }

      if (event.type === "message" && event.isGroup) {
        handleWordScrambleInput(api, event, senderName);
      }
    });
  }
};