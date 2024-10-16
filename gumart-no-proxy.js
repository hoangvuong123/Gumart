const axios = require('axios');
const fs = require('fs');
const path = require('path');
const async = require('async');
const readline = require('readline');

const queryPath = path.join(__dirname, 'query.txt');
const queryData = fs.readFileSync(queryPath, 'utf8').trim().split('\n');

// 45 phut
const timeCountDown = 45

const processQuery = async (query_id, isTodoTask) => {
    query_id = query_id.replace(/[\r\n]+/g, '');
    const user_id_match = query_id.match(/user=%7B%22id%22%3A(\d+)/);
    if (!user_id_match) {
        console.error('Không thể tìm thấy user_id trong query_id');
        return;
    }

    const payload = {
        mode: null,
        ref_id: '5514282941',
        telegram_data: query_id
    };

    const config = {
        method: 'post',
        url: 'https://api.gumart.click/api/login',
        headers: {
            "accept": "application/json, text/plain, */*",
            "accept-language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
            "access-control-allow-origin": "*",
            "content-type": "application/json",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "Origin": "https://d2kpeuq6fthlg5.cloudfront.net",
            "Referer": "https://d2kpeuq6fthlg5.cloudfront.net/",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        },
        data: payload,
    };

    const home = async (authorization) => {

        const homeConfig = {
            method: 'get',
            url: 'https://api.gumart.click/api/home',
            headers: {
                ...config.headers,
                authorization: authorization
            },
        };

        try {
            return await axios(homeConfig);
        } catch (error) {
            console.error('Lỗi claim ads');
        }

        return null;
    };

    const claimMint = async (authorization) => {
        const claimConfig = {
            method: 'post',
            url: 'https://api.gumart.click/api/claim',
            headers: { ...config.headers, authorization },
        };

        try {
            const resClaim = await axios(claimConfig);
            console.log('Claim Thành Công!');
            console.log("[ Claim Value ]", resClaim.data.data.claim_value);
            console.log("[ Balance Value ]", resClaim.data.data.balance);
        } catch (error) {
            console.error('Không thể claim');
        }
    };

    const useBoost = async (authorization) => {
        const claimConfig = {
            method: 'post',
            url: 'https://api.gumart.click/api/boost',
            headers: { ...config.headers, authorization },
        };

        try {
            const resClaim = await axios(claimConfig);
            console.log('Sử dụng boost thành công!');
        } catch (error) {
            console.error('Không thể sử dụng boost hoặc chưa đến giờ');
        }
    };


    const getTask = async (authorization) => {
        const getTaskConfig = {
            method: 'get',
            url: 'https://api.gumart.click/api/missions',
            headers: { ...config.headers, authorization },
        };

        const startTask = (id) => {
            return {
                method: 'post',
                url: `https://api.gumart.click/api/missions/${id}/start`,
                headers: { ...config.headers, authorization },
            }
        }

        const claimTask = (id) => {
            return {
                method: 'post',
                url: `https://api.gumart.click/api/missions/${id}/claim`,
                headers: { ...config.headers, authorization },
            }
        }
        try {
            const allTask = await axios(getTaskConfig);
            const { missions, tasks } = allTask.data.data

            const todoTask = async (type) => {
                const keyType = Object.keys(type);
                for (let i = 0; i < keyType.length; i++) {
                    const item = keyType[i];
                    for (let j = 0; j < type[item].length; j++) {
                        const itemTask = type[item][j]
                        if(itemTask.status !== "finished"){
                            if (itemTask.status === 'startable') {
                                try{
                                    const resStartTask = await axios(startTask(itemTask.id));
                                    const { title } = resStartTask.data.data;
                                    console.log("Đã start task: ", title);
                                }catch{
                                    console.log("Không thể start task",itemTask.title);
                                }
                            } else if (itemTask.status === "claimable") {
                                try{
                                    const resClaimTask = await axios(claimTask(itemTask.id));
                                    const { title } = resClaimTask.data.data;
                                    console.log(`Task: ${title} đã hoàn thành!`);
                                }catch{
                                    console.log("Lỗi claim task: ",itemTask.title);
                                }
                            }
                        }
                    }
                }
            }
            
            console.log("====> Bắt đầu làm task tab Mission <====");
            await todoTask(missions)
            console.log("====> Bắt đầu làm task tab Task <====");
            await todoTask(tasks)
            console.log("=====> Đã hoàn thành task :D");

        } catch (error) {
            console.error('Làm task lỗi rôì.');
        }
    };
    

    try {
        const response = await axios(config);
        const data = response.data.data;
        const { access_token, type_token, user } = data;
        const authorization = type_token + " " + access_token;
        const homeData = await home(authorization);
        const { balance_text, friend_boost, earned_amount, mint_speed, vip_boost, premium_boost,boost_next_timestamp } = homeData.data.data

        console.log(`====================Username: ${user.username}====================`);
        console.log('[ Total gum ]:', balance_text);
        console.log('[ Vip Boost ]:', vip_boost);
        console.log('[ Friend Boost ]:', friend_boost);
        console.log('[ Premium Boost ]:', premium_boost);
        console.log('[ Earned Amount ]:', earned_amount);
        console.log('[ Mint Speed ]:', mint_speed);

        if (earned_amount > 1000) {
            await claimMint(authorization)
        }else{
            console.log("Earned amount <= 1000. Chỉ claim khi amount > 1000");
        }

        const currentTime = Math.floor(Date.now() / 1000);
        if(currentTime > boost_next_timestamp){
            await useBoost(authorization);
        }else{
            console.log("Boost đang được sử dụng!");
        }

        if(isTodoTask){
            await getTask(authorization)
        }

    } catch (error) {
        console.error('Lỗi khi gửi yêu cầu:', error);
    }
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const askTodoTask = async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question('Có Làm task không? (y/n): ', (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 'y');
        });
    });
};

const run = async () => {
    const isTodoTask = await askTodoTask()
    while (true) {
        await new Promise((resolve, reject) => {
            async.eachOfLimit(queryData, queryData.length, async (query, index) => {
                await processQuery(query,isTodoTask);
            }, (err) => {
                if (err) {
                    console.error('Lỗi xử lý các queries:', err);
                    reject(err);
                } else {
                    console.log('Hoàn thành xử lý các queries');
                    resolve();
                }
            });
        });
        console.log("==============Tất cả tài khoản đã được xử lý=================");
        for (let i = timeCountDown * 60; i > 0; i--) {
            process.stdout.write(`\rBắt đầu vòng lặp sau ${i} giây...`);
            await sleep(1000);
        }
    }
}

run();
