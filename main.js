const fs=require('fs'),login=require('./core(s)/login'),{doneAnimation,errAnimation}=require('./core(s)/logger/console');require('dotenv').config();
let commands=[],events=[],cooldowns=new Map(),commandMap=new Map(),eventMap=new Map();
async function startBot(){
    try{
        if(!fs.existsSync('./appstate.json')){
            console.error('Không tìm thấy appstate.json, hãy tạo mới');
            process.exit(0);
        }
        login(
            {appState:JSON.parse(fs.readFileSync('./appstate.json','utf8'))},
            {
                listenEvents:true,
                autoMarkDelivery:false,
                updatePresence:true,
                logLevel:'silent'
            },
            async(err,api)=>{
                if(err){
                    errAnimation('Đang kết nối...');
                    if(err.code==='ETIMEDOUT'){
                        console.warn('Lỗi timeout, đang thử lại');
                        startBot();
                    }else{
                        console.error(err);
                        process.exit(0);
                    }
                    return;
                }
                doneAnimation('Đã kết nối thành công.');
                const userId=api.getCurrentUserID(),user=await api.getUserInfo([userId]);
                api.getCurrentUserName=()=>user[userId]?.name;
                console.info(`Đã kết nối với ${user[userId]?.name||null} (${userId})`);
                loadCommands(api);
                loadEvents(api);
                handleMQTTEvents(api);
            }
        );
    }catch(err){
        console.error(err);
    }
}
function loadCommands(api){
    const commandFiles=fs.readdirSync('./module(s)/commands').filter(file=>file.endsWith('.js'));
    commands=commandFiles.map(file=>{
        const commandModule=require(`./module(s)/commands/${file}`);
        commandMap.set(commandModule.name.toLowerCase(),commandModule);
        if(commandModule.onLoad){
            commandModule.onLoad({api});
        }
        return commandModule;
    });
    console.info(`Load thành công ${commands.length} commands`);
}
function loadEvents(api){
    const eventFiles=fs.readdirSync('./module(s)/events').filter(file=>file.endsWith('.js'));
    events=eventFiles.map(file=>require(`./module(s)/events/${file}`));
    events.forEach(eventModule=>{
        if(eventModule.onLoad){
            eventModule.onLoad({api});
        }
    });
    console.info(`Load thành công ${events.length} events`);
}
function handleMQTTEvents(api){
    api.listenMqtt(async(err,event)=>{
        if(err){
            console.error(err);
            return;
        }
        try{
            const{body,threadID,senderID,messageID}=event,userInfo=await api.getUserInfo(senderID),senderName=userInfo[senderID]?.name||'Người Dùng',{PREFIX='!',ADMIN_UID}=process.env;
            if(!body){
                return;
            }
            let command='',args=[],hasPrefix=!1;
            if(body.startsWith(PREFIX)){
                hasPrefix=!0;
                args=body.slice(PREFIX.length).trim().split(' ');
                command=args.shift().toLowerCase();
            }else{
                command=body.trim().split(' ')[0].toLowerCase();
                args=body.trim().split(' ').slice(1);
            }
            const commandModule=commandMap.get(command);
            if(commandModule){
                if(!commandModule.nopre&&!hasPrefix){
                    return;
                }
                if(commandModule.wait){
                    if(!cooldowns.has(senderID)){
                        cooldowns.set(senderID,new Map());
                    }
                    const userCooldowns=cooldowns.get(senderID);
                    if(userCooldowns.has(commandModule.name)){
                        const expirationTime=userCooldowns.get(commandModule.name),currentTime=Date.now();
                        if(currentTime<expirationTime){
                            const timeLeft=(expirationTime-currentTime)/1e3;
                            api.sendMessage(`❌ Bạn đã sử dụng lệnh quá nhanh. Vui lòng thử lại sau ${timeLeft.toFixed(1)} giây.`,threadID);
                            return;
                        }
                    }
                    const waitTime=commandModule.wait*1e3;
                    userCooldowns.set(commandModule.name,Date.now()+waitTime);
                }
                if(commandModule.access===1&&senderID!==ADMIN_UID){
                    api.sendMessage('❌ Chỉ admin mới có thể sử dụng lệnh này.',threadID);
                    return;
                }
                await commandModule.execute({api,event,args,commands,events,senderName,body,senderID,threadID,messageID});
            }else{
                if(hasPrefix){
                    const fallbackCommand=commandMap.get('\n');
                    if(fallbackCommand){
                        await fallbackCommand.execute({api,event,args,commands,events,senderName,body,senderID,threadID,messageID});
                    }
                }
            }
            for(const eventModule of events){
                try{
                    await eventModule.execute({api,event,args,commands,events,senderName,body,senderID,threadID,messageID});
                }catch(err){
                    console.error(`Lỗi khi xử lý sự kiện (${eventModule.name}):`,err);
                }
            }
        }catch(err){
            console.error(err);
        }
    });
}
startBot();