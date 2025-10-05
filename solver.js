const axios = require('axios');
const chalk = require('chalk');
const config = require('./config.json');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// CAPTCHA ÇÖZME FONKSİYONLARI

async function solveHcaptcha() {
    if (config.captcha.hcaptcha_service.toLowerCase() !== 'capsolver') {
        console.log(chalk.red('Hata: Bu script şu anda yalnızca "capsolver" hcaptcha servisini desteklemektedir.'));
        return null;
    }
    
    console.log(chalk.blue('[Solver] Capsolver ile HCaptcha görevi oluşturuluyor...'));
    try {
        const createTaskResponse = await axios.post("https://api.capsolver.com/createTask", {
            clientKey: config.captcha.hcaptcha_key,
            task: {
                type: 'HCaptchaTaskProxyLess',
                websiteKey: "a6a1d5ce-612d-472d-8e37-7601408fbc09",
                websiteURL: "https://owobot.com"
            }
        });

        const taskId = createTaskResponse.data.taskId;
        if (!taskId) {
            console.error(chalk.red("[Solver] Capsolver görev oluşturamadı:"), createTaskResponse.data);
            return null;
        }

        console.log(chalk.yellow(`[Solver] Görev ID'si alındı: ${taskId}. Sonuç bekleniyor...`));

        while (true) {
            await sleep(3000);
            const resultResponse = await axios.post("https://api.capsolver.com/getTaskResult", {
                clientKey: config.captcha.hcaptcha_key,
                taskId: taskId
            });
            const { status, solution } = resultResponse.data;
            if (status === "ready") {
                console.log(chalk.green("[Solver] HCaptcha başarıyla çözüldü."));
                return solution.gRecaptchaResponse;
            }
            if (status === "failed" || resultResponse.data.errorId) {
                console.error(chalk.red("[Solver] Capsolver çözümü başarısız:"), resultResponse.data);
                return null;
            }
        }
    } catch (error) {
        console.error(chalk.red("[Solver] Capsolver API'sine bağlanırken hata oluştu:"), error.message);
        return null;
    }
}


async function solveImageToText(imageUrl) {
    if (config.captcha.TextToImage_service.toLowerCase() !== 'capsolver') {
         console.log(chalk.red('Hata: Bu script şu anda yalnızca "capsolver" resim çözme servisini desteklemektedir.'));
        return null;
    }

    try {
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
        
        console.log(chalk.blue('[Solver] Capsolver ile resimden metin görevi oluşturuluyor...'));

        const createTaskResponse = await axios.post("https://api.capsolver.com/createTask", {
            clientKey: config.captcha.TextToImage_key,
            task: { type: "ImageToTextTask", body: base64Image }
        });

        const taskId = createTaskResponse.data.taskId;
        if (!taskId) {
             console.error(chalk.red("[Solver] Capsolver resim görevi oluşturamadı:"), createTaskResponse.data);
            return null;
        }
        
        console.log(chalk.yellow(`[Solver] Resim görev ID'si alındı: ${taskId}. Sonuç bekleniyor...`));

        while (true) {
            await sleep(3000);
            const resultResponse = await axios.post("https://api.capsolver.com/getTaskResult", { clientKey: config.captcha.TextToImage_key, taskId: taskId });
             const { status, solution } = resultResponse.data;
            if (status === "ready") {
                console.log(chalk.green(`[Solver] Resim başarıyla çözüldü: ${solution.text}`));
                return solution.text;
            }
            if (status === "failed" || resultResponse.data.errorId) {
                console.error(chalk.red("[Solver] Capsolver resim çözümü başarısız:"), resultResponse.data);
                return null;
            }
        }

    } catch (error) {
        console.error(chalk.red("[Solver] Resimden metin çözme sırasında hata:"), error.message);
        return null;
    }
}

// BAKİYE KONTROL FONKSİYONLARI

async function fetchBalances() {
    if (config.captcha.hcaptcha_service.toLowerCase() !== 'capsolver') {
        return { hcaptcha: 'N/A (Sadece Capsolver destekleniyor)', textToImage: 'N/A (Sadece Capsolver destekleniyor)' };
    }
    try {
        const response = await axios.post("https://api.capsolver.com/getBalance", { clientKey: config.captcha.hcaptcha_key });
        const balance = response.data.balance;
        return { hcaptcha: balance, textToImage: balance };
    } catch (error) {
        console.error(chalk.red("[Solver] Bakiye alınırken hata:"), error.message);
        return { hcaptcha: 'Hata', textToImage: 'Hata' };
    }
}


module.exports = { solveHcaptcha, solveImageToText, fetchBalances };
