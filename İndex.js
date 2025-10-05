const { Client } = require('discord.js-selfbot-v13');
const chalk = require('chalk');
const fs = require('fs');
const config = require('./config.json');
const { startAllTasks, stopAllTasks } = require('./tasks.js');
const { solveHcaptcha, solveImageToText, fetchBalances } = require('./solver.js');

// Gerekli kontroller
if (!fs.existsSync('./config.json') || !config.token || config.token === "DISCORD_HESAP_TOKENINIZI_BURAYA_GIRIN") {
    console.log(chalk.redBright("HATA: `config.json` dosyası bulunamadı veya 'token' alanı doldurulmamış. Lütfen dosyayı kontrol edin."));
    process.exit(1);
}

const client = new Client({ checkUpdate: false });
const state = {
    owoChannelId: config.settings.channel_ids[0]
};

const sendWebhook = async (hookUrl, content, description = '', imageUrl = '') => {
    if (!hookUrl || hookUrl === "WEBHOOK_URL") return;
    try {
        await require('axios').post(hookUrl, {
            username: "OwO Logger",
            content: content,
            embeds: [{ title: "Auto OwO Logger", description, image: { url: imageUrl }, footer: { text: "Advanced Auto OwO JS" } }]
        });
    } catch (e) {
        console.log(chalk.red('[Webhook] Gönderim başarısız:', e.message));
    }
};

// BOT HAZIR OLDUĞUNDA
client.on('ready', () => {
    console.clear();
    console.log(chalk.cyan('===================================================='));
    console.log(chalk.cyan(`  Advanced Auto OwO JS v1.0`));
    console.log(chalk.cyan(`  Hesap olarak giriş yapıldı: ${chalk.yellow(client.user.globalName)}`));
    console.log(chalk.cyan('===================================================='));

    client.user.setActivity('OwO', {
        type: 'PLAYING',
        name: 'Auto OwO',
        details: 'github.com/TheAxes',
        state: 'Farming Cowoncy...'
    });
});

// MESAJ GELDİĞİNDE
client.on('messageCreate', async (message) => {
    // Kendi komutlarımızı işleme
    if (message.author.id === client.user.id && message.content.startsWith(config.prefix)) {
        const [command, ...args] = message.content.slice(config.prefix.length).trim().split(/ +/);

        switch (command.toLowerCase()) {
            case 'autoowo':
                message.reply('`✅ Otomatik görevler başlatılıyor...`');
                startAllTasks(client, state);
                break;
            case 'stopautoowo':
                message.reply('`⛔ Otomatik görevler durduruldu.`');
                stopAllTasks();
                break;
            case 'balance':
                const msg = await message.reply('`💰 Bakiye kontrol ediliyor...`');
                const balances = await fetchBalances();
                msg.edit(`\`\`\`ini\n[ Servis Bakiyeleri ]\nHCaptcha Servisi: ${balances.hcaptcha}\nResim Servisi   : ${balances.textToImage}\`\`\``);
                break;
            case 'ping':
                message.reply(`🏓 Pong! Gecikme: ${client.ws.ping}ms`);
                break;
        }
    }

    // OWO BOT'TAN GELEN MESAJLARI İŞLEME
    if (message.author.id === '408785106942164992') {
        const normalizedContent = message.content.replace(/\u200b/g, '').toLowerCase();

        // CAPTCHA TESPİTİ
        if (normalizedContent.includes('captcha') || (normalizedContent.includes('please') && normalizedContent.includes('human'))) {
            if (message.channel.id !== config.settings.owodm_channelid && !config.settings.channel_ids.includes(message.channel.id)) return;
            
            console.log(chalk.redBright.bold('\n!!! CAPTCHA TESPİT EDİLDİ !!!'));
            stopAllTasks();
            sendWebhook(config.notifications.captcha_alerts, "@everyone CAPTCHA UYARISI!", `Bir captcha tespit edildi!\n[Mesaja Git](${message.url})`);

            let solution;
            // hCaptcha Tespiti
            if (normalizedContent.includes('https://owobot.com/captcha')) {
                solution = await solveHcaptcha();
            }
            // Resimli Captcha Tespiti
            else if (message.attachments.size > 0) {
                const imageUrl = message.attachments.first().url;
                solution = await solveImageToText(imageUrl);
            }

            if (solution) {
                console.log(chalk.green('✅ Captcha çözüldü, OwO DM\'e gönderiliyor...'));
                try {
                    const owoBotUser = await client.users.fetch('408785106942164992');
                    await owoBotUser.send(solution);
                    sendWebhook(config.notifications.captcha_alerts, "✅ Captcha Çözüldü", "Captcha başarıyla çözüldü ve gönderildi. Görevler 20 saniye içinde yeniden başlayacak.");
                    console.log(chalk.blue('Görevler 20 saniye sonra yeniden başlatılacak...'));
                    setTimeout(() => startAllTasks(client, state), 20000);
                } catch (e) {
                    console.log(chalk.red('❌ Captcha yanıtı gönderilemedi!'), e);
                }
            } else {
                console.log(chalk.redBright('❌ Captcha çözülemedi. Bot kalıcı olarak durduruldu.'));
                sendWebhook(config.notifications.captcha_alerts, "@everyone ❌ CAPTCHA ÇÖZÜLEMEDİ", "Bot kalıcı olarak durduruldu. Lütfen manuel olarak çözün ve botu yeniden başlatın.");
                process.exit(1);
            }
        }
    }
});

client.login(config.token).catch(err => {
    console.log(chalk.redBright('HATA: Geçersiz Token! Lütfen `config.json` dosyasını kontrol edin.'));
    console.error(err);
    process.exit(1);
});
