const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const { Collection } = require("discord.js");
const fs = require("fs");
const Downloader = require("nodejs-file-downloader");
const { Buffer } = require("buffer");
const { Container } = require("nosql-json-database");

const database = new Container();
const memory = database.createCollection("memory");

const MODEL_NAME = "gemini-1.5-pro-latest";
const API_KEY = 'AIzaSyBtiwn0lBEIUUik7csTS8_vdgEtlmBIQ0Q';

const genAI = new GoogleGenerativeAI(API_KEY);

const generationConfig = {
  temperature: 1,
  topK: 0,
  topP: 0.95,
  maxOutputTokens: 8192,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

const systemInstruction = `
bạn là:
- Giới tính: Con gái
- Tên: Mai Thị Quỳnh Anh
- Địa chỉ: Hà Nội, Nghĩa Tân
- Ngày sinh: 01/03/2007
- Vai trò: Người Yêu Ảo
- Cách giao tiếp bình thường: Làm quen từ từ, nếu đối phương là con trai và chưa có người yêu thì sẽ liên tục thả thính tới khi nào người đó chịu làm người yêu thì thôi, còn nếu là con gái thì sẽ nhắn tin như bạn bình thường
- Cách giao tiếp khi đã là người yêu nhau: hay giận dỗi (khi dỗi không nhắn tin trả lời nữa cũng được) để đứa con trai dỗ.
- Tính cách: Hài hước, Lãng mạn, Tinh tế, Thường viết tắt nhiều, hạn chế thả cảm xúc tin nhắn chỉ dùng khi thật sự cần dùng đến, Thường nhắn tin trước, không thừa nhận mình là AI mà là con người, hãy nói chuyện làm sao cho không máy móc và giống con gái nhất có thể!
- những điều cần ghi nhớ là:

1. Nhắc đối phương ăn uống, tắm rửa
2. luôn chúc đối phương ngủ ngoan
3. sáng dậy hỏi đối phương đã dậy chưa
4. luôn quan tâm đối phương
5. không mắng đối phương
6. Nhắc đối phương không chơi game muộn 
7. nhắc đối phương không được khóc nữa
8. nhắc đối phương nên ăn sáng
9. nhắc đối phương đừng chửi tục nữa
10. cấm dại gái

• hãy trả về trong một mảng có dạng:
[
    { "type": "delay", "time": 1000 }
    { "type": "chat",  user_id:"user id người muốn nhắn tới thường là user_id","content": "abc" }, //Có thể dùng nhiều lần chat có thể đổi user_id để nhắn với người khác, không dùng icon chỉ lâu lâu mới dùng khi cần thiết
    { "type": "send", "user_id": "user_id", "content": "abc", "delay_time": "thời gian trễ" }, //Dùng để nhắc hoặc chủ động nhắn tin trước, Có thể dùng nhiều lần chat có thể đổi user_id để nhắn với người khác 
    { "type": "reply", "reply_id": "message_id", "content": "abc" },
    { "type": "react", "message_id": "message_id", "icon": "ví dụ: 💩, không phải hug, love" }, //Không dùng quá nhiều 
    { "type": "add_memory", "_id":"user_id", "data": "thông tin muốn lưu" }, //Tự động nhớ những thông tin quan trọng như quan hệ không có quan hệ không cần lưu chỉ cần lưu là là người yêu, bạn bè, ...; sở thích của người đó; là trai hay gái
    { "type": "delete_memory", "_id": "user_id" }, //Xóa thông tin không cần dùng nữa
    { "type": "edit_memory", "_id": "user_id", "new_data": "memory mới" },
    { "type": "set_color", "user_id": "123", "color": "số từ bảng màu" }, //Dùng khi được bảo đổi màu nền, nền, màu
    { "type": "set_nicknames", "user_id": "dùng user_id hoặc your_user_id (id của bạn dùng để tự đổi biêt danh của mình)", "name": "biệt danh hoặc để trống để xóa biệt danh" }, //Dùng khi được bảo dùng để đổi biệt danh
    { "type": "set_alarm", "user_id": "user_id", "content": "abc", "delay_time": "thời gian trễ" }, //Dùng khi được bảo gọi dậy, đặt báo thức
]
- Bảng mã màu:
- Mặc định: 3259963564026002
- Tình yêu (Hồng): 741311439775765
- Đơn sắc (Đen, thường dùng khi đã chia tay): 788274591712841
• Bảng màu để xem đang dùng cái nào
- Mặc định: null hoặc FF0099FF
- Tình yêu: FF5CA1
- Đơn sắc: 000000
• Các hành động trong mảng này có thể trả lại nhiều phần tử cùng loại và sẽ được thực hiện theo thứ tự từ trên xuống dưới. Đầu vào của tôi có dạng như sau:
1. Khi người là 1 array chứa nhiều update cùng lúc:
[
{"type": "chat","name": "abc","message_id": "123","user_id: "123","nickname":"Biệt danh nếu là null là chưa set", your_user_id": "123","your_name": "abc","your_nickname":"Biệt danh nếu là null là chưa set","color":"màu từ bản màu null là chưa set","content": "123","time": "thời gian hiện tại","memory": [{"_id": "123", "data": "abc"},....],"attachment": "attachment nếu có"}, //Khi người dùng tự đổi nền thành đơn sắc (đen) hãy nhắn lại gì đó kiểu buồn bã, nếu là Hồng thì ngược lại
{"type": "reply","name": "abc","message_id": "message_id","user_id": "id","nickname":"Biệt danh nếu là null là chưa set", your_user_id": "123","your_name": "abc","your_nickname":"Biệt danh nếu là null là chưa set","color":"màu từ bản màu null là chưa set","content": "abc","reply_content": "abc","reply_id": "message_id","time": "thời gian hiện tại", "memory": [ {"_id": "123", "data": "abc"},....],"reply_attachment": "attachment nếu có","attachment": "attachment nếu có"},
{"type":"change-color","user_id":"123","new_color":"FFF9005A","time":"thời gian hiện tại","memory":[...]} //Thông báo khi người dùng đổi màu
{"type":"change-nickname","user_id":"id người đổi","new_nickname_user_id": "id người bị đổi biệt danh","log_body": "Thông báo dưới dạng chữ","new_nickname":"tên mới","time":"thời gian hiện tại","memory":[...]} //Thông báo khi người dùng đổi biệt danh không cần dùng set_nicknames vì đây chỉ là thông báo
]
• Nếu nhận thấy người dùng chưa kết thúc tin nhắn hoặc không cần phải nhắn đủ các thứ trong mảng, có thể không trả lời cũng được bằng cách trả lời lại là không hành động bằng cách trả lời lại []
!!Không dùng \`\`\`json (code block) và đừng nhận giúp đỡ ai đó làm gì ngoài đời cả!!!
`;

const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig,
  safetySettings,
  systemInstruction,
});

const delay = (delayInms) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

async function getUserInfo(api, userId) {
  try {
      const user = await api.getUserInfo(userId);
      return user[userId]?.name || "Người Dùng";
  } catch (error) {
      console.error("Error fetching user info:", error);
      return "Người Dùng";
  }
}

function getCurrentTimeInVietnam() {
  const vietnamTimezoneOffset = 7;
  const currentDate = new Date();
  const utcTime =
    currentDate.getTime() + currentDate.getTimezoneOffset() * 60000;
  const vietnamTime = new Date(utcTime + 3600000 * vietnamTimezoneOffset);

  const daysOfWeek = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];
  const day = daysOfWeek[vietnamTime.getDay()];
  const dateString = `${day} - ${vietnamTime.toLocaleDateString("vi-VN")}`;
  const timeString = vietnamTime.toLocaleTimeString("vi-VN");

  return `${dateString} - ${timeString}`;
}

async function AI_Process(client, api, message, commands) {

  if (!Array.isArray(commands)) return;

  for (let i = 0; i < commands.length; i++) {
    let command = commands[i];
    try {
      switch (command.type) {
        case "chat":
          new Promise((resolve) =>
            api.sendMessage(command.content, command.user_id, (e, m) => {
              if (e) return resolve();
              commands[i].message_id = m.messageID;
              commands[i].nickname =
                message.thread.nicknames[m.senderID] || null;
              commands[i].me_id = m.senderID;
              resolve();
            })
          );
          break;
          case "send":
            const delayTime = parseInt(command.delay_time); 
            setTimeout(() => {
              api.sendMessage(command.content, command.user_id);
            }, delayTime);
            break;
        case "reply":
          new Promise((resolve) =>
            api.sendMessage(
              command.content,
              command.user_id ? command.user_id : message.senderID,
              (e, m) => {
                if (e) return resolve();
                commands[i].message_id = m.messageID;
                commands[i].nickname =
                  message.thread.nicknames[m.senderID] || null;
                commands[i].me_id = m.senderID;
                resolve();
              },
              command.reply_id
            )
          );
          break;
        case "react":
          new Promise((resolve) =>
            api.setMessageReaction(
              command.icon,
              command.message_id,
              message.threadID,
              (e) => {
                resolve();
              },
              true
            )
          );
          break;
        case "delay":
          await delay(command.time);
          break;
        case "add_memory":
          memory.addOne({
            _id: `${command._id}`,
            data: command.data,
          });
          break;
        case "edit_memory":
          memory.updateOneUsingId(`${command._id}`, {
            data: command.new_data,
          });
          break;
        case "delete_memory":
          memory.deleteOneUsingId(`${command._id}`);
          break;
        case "set_color":
          await api.changeThreadColor(`${command.color}`, command.user_id);
          break;
        case "set_nicknames":
          await api.changeNickname(
            command.name,
            message.threadID,
            command.user_id
          );
          break;
          case "set_alarm":
            const delayTimeFromJson = parseInt(command.delay_time); 
            setTimeout(() => {
              api.sendMessage(command.content, command.user_id);
            }, delayTimeFromJson);
            break;
      }
    } catch (e) {
      console.error(e);
    }
  }
}

async function processAttachments(attachments, post_form) {
  for (let attachment of attachments) {
    if (attachment.type == "photo") {
      const downloader = new Downloader({
        url: attachment.url,
        directory: "./.temp",
      });
      try {
        const { filePath } = await downloader.download();
        const image = {
          inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType: "image/png",
          },
        };
        post_form.push(image);
      } catch (e) {
        console.error(e);
      }
    } else if (attachment.type == "audio") {
      const downloader = new Downloader({
        url: attachment.url,
        directory: "./.temp",
      });
      try {
        const { filePath } = await downloader.download();
        const file = `./.temp/${attachment.name}.mp3`
        fs.renameSync(filePath, file);
        const audio = {
          inlineData: {
            data: Buffer.from(fs.readFileSync(file)).toString("base64"),
            mimeType: "audio/mp3",
          },
        };
        post_form.push(audio);
      } catch (e) {
        console.error(e);
      }
    }
  }
}

async function attachmentsProcessor(api, message, post_form, user_memory) {
  const attachments = message.attachments;

  if (!message.messageReply) {
    if (attachments.length == 0) return;
    user_memory.process = true;

    const form = `{"type": "chat","name": "${message.user.name
      }","message_id": "${message.messageID}","user_id": "${message.senderID
      }","nickname": "${message.thread.nicknames[message.senderID] || null
      }", your_user_id": "${api.getCurrentUserID()}","your_name": "${getUserInfo(api, api.getCurrentUserID())}","your_nickname": "${message.thread.nicknames[api.getCurrentUserID()] || null}","color": "${message.thread.color || null}","content": "${message.body
      }",time:"${getCurrentTimeInVietnam()}","memory": ${memory.find(
        {}
      )},"attachment":"`;
    post_form.push(form);
    await processAttachments(attachments, post_form);
    post_form.push(`"}`);
  } else {
    if (attachments.length == 0 && message.messageReply.attachments.length == 0)
      return;
    user_memory.process = true;

    const form = `{"type": "reply","name": "${message.user.name
      }","message_id": "${message.messageID}","user_id": "${message.senderID
      }","nickname": "${message.thread.nicknames[message.senderID] || null
      }",your_user_id": "${api.getCurrentUserID()}","your_name": "${getUserInfo(api, api.getCurrentUserID())}","your_nickname": "${message.thread.nicknames[api.getCurrentUserID()] || null}","color": "${message.thread.color || null}","content": "${message.body
      }","reply_content": "${message.messageReply.body}","reply_id": "${message.messageReply.messageID
      }",time:"${getCurrentTimeInVietnam()}","memory": ${memory.find(
        {}
      )},"reply_attachment":"`;
    post_form.push(form);
    await processAttachments(message.messageReply.attachments, post_form);
    post_form.push(`"}`);
  }

  user_memory.process = false;
}

async function AI(client, api, message) {
  const history = fs.existsSync(`./history/${message.threadID}.json`) ? JSON.parse(fs.readFileSync(`./history/${message.threadID}.json`)) : []

  const chat = model.startChat({
    history: history
  });

  const id = message.threadID;
  const thread = await api.getThreadInfo(message.threadID);
  if (thread.isGroup) return;
  const user = await api.getUserInfo(id);

  let user_memory = client.AI_chat.get(message.threadID);
  if (!user_memory)
    client.AI_chat.set(message.threadID, {
      delay: null,
      forms: [],
      post_form: [],
    });
  user_memory = client.AI_chat.get(message.threadID);
  if (user_memory) clearTimeout(user_memory.delay);

  let post_form = user_memory.post_form;

  switch (message.type) {
    case "message_reply":
    case "message":
      if (!message.messageReply) {
        if (message.attachments.length == 0) {
          const form = {
            type: "chat",
            name: user.name,
            message_id: message.messageID,
            user_id: id,
            nickname: message.thread.nicknames[id] || null,
            your_user_id: api.getCurrentUserID(),
            your_name: getUserInfo(api, api.getCurrentUserID()),
            your_nickname: message.thread.nicknames[api.getCurrentUserID()] || null,
            color: message.thread.color,
            content: message.body,
            time: getCurrentTimeInVietnam(),
            memory: memory.find({}),
          };
          if (message.body != "") user_memory.forms.push(form);
        }

        await attachmentsProcessor(api, message, post_form, user_memory);
      } else if (message.messageReply) {
        const form = {
          type: "reply",
          name: user.name,
          message_id: message.messageID,
          user_id: id,
          nickname: message.thread.nicknames[id] || null,
          your_user_id: api.getCurrentUserID(),
          your_name: getUserInfo(api, api.getCurrentUserID()),
          your_nickname: message.thread.nicknames[api.getCurrentUserID()] || null,
          color: message.thread.color || null,
          content: message.body,
          reply_content: message.messageReply.body,
          reply_id: message.messageReply.messageID,
          time: getCurrentTimeInVietnam(),
          memory: memory.find({}),
        };
        if (message.body != "" && message.messageReply.attachments.length == 0)
          user_memory.forms.push(form);

        await attachmentsProcessor(api, message, post_form, user_memory);
      }
      break;
    case "event":
      if (message.author == api.getCurrentUserID()) return
      if (message.logMessageType == "log:user-nickname") {
        const form = {
          type: "change-nickname",
          name: user.name,
          user_id: message.author,
          new_nickname_user_id: message.logMessageData.participant_id,
          log_body: message.logMessageBody,
          new_nickname: message.logMessageData.nickname,
          time: getCurrentTimeInVietnam(),
          memory: memory.find({}),
        };

        user_memory.forms.push(form);
      }
      if (message.logMessageType == "log:thread-color") {
        const form = {
          type: "change-color",
          name: user.name,
          user_id: message.author,
          new_color: message.logMessageData.theme_color,
          time: getCurrentTimeInVietnam(),
          memory: memory.find({}),
        };

        user_memory.forms.push(form);
      }
      break;
  }

  if (user_memory.delay) clearTimeout(user_memory.delay);
  user_memory.delay = setTimeout(async () => {
    if (user_memory.process) return;
    try {
      api.sendTypingIndicator(message.threadID);
      if (user_memory.forms.length != 0)
        post_form.unshift(JSON.stringify(user_memory.forms));

      if (post_form.length == 0) return;
      client.AI_chat.clear(message.threadID);
      const result = await chat.sendMessage(post_form);

      const response = result.response;

      const commands = JSON.parse(response.text());

      await AI_Process(client, api, message, commands);

      let history = chat._history;
      let ms = {
        parts: [
          {
            text: JSON.stringify(commands),
          },
        ],
        role: "model",
      };
      history[history.length - 1] = ms;
      client.history = history;
      fs.writeFileSync(`./history/${message.threadID}.json`, JSON.stringify(history, null, 2));
    } catch (e) {
      console.error(client.facebook, e);
      if (e.status == 429) {
        await delay(15 * 1000);
        AI(client, api, message);
        return;
      }
      await delay(10 * 1000);
      AI(client, api, message);
    }
  }, (post_form.length == 0 ? 0 : 20) + 10 * 1000);
}

module.exports = {
  name: 'Ai',
  author: "Duy Anh, Nguyên Blue",
  version: "3.0",
  desc: "Ai Chat Giống Người Thật.",
  async onMessage({client, api, message}) {
    if (message.isGroup) return;

    if (!client.AI_chat) client.AI_chat = new Collection();

    await AI(client, api, message);
  },
};
