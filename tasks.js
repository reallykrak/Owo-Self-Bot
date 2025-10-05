const chalk = require('chalk');
const Wonderwords = require('wonderwords');
const config = require('./config.json');

const s = new Wonderwords.RandomSentence();
let intervals = {};
let state = {}; // index.js'ten gelen dinamik veriler için (örn: owoChannelId)

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// HER BİR GÖREVİN MANTIĞI
const tasks = {
    autohunt: async (client) => {
        const channel = await client.channels.fetch(state.owoChannelId);
        await channel.sendTyping();
        await sleep(2000);
        await channel.send("owo hunt");
        await sleep(15000);
        await channel.send("owo battle");
    },
    autolevelup: async (client) => {
        const channel = await client.channels.fetch(state.owoChannelId);
        const xpMessage = randomChoice([`owo`, `UwUUwU`, `uwu`, s.sentence()]);
        await channel.sendTyping();
        await sleep(1500);
        await channel.send(xpMessage);
    },
    autopray: async (client) => {
        const channel = await client.channels.fetch(state.owoChannelId);
        await channel.sendTyping();
        await sleep(1500);
        await channel.send(`owo pray`);
    },
    autosell: async (client) => {
        const channel = await client.channels.fetch(state.owoChannelId);
        await channel.send("owo sell " + config.settings.animal_types);
    },
    autoslot: async (client) => {
        const channel = await client.channels.fetch(state.owoChannelId);
        await channel.send(`owo s ${randomChoice(config.settings.slotamount)}`);
    },
    autocoinflip: async (client) => {
        const channel = await client.channels.fetch(state.owoChannelId);
        await channel.send(`owo cf ${randomChoice(config.settings.autocoinflip_amount)}`);
    },
    use_random_commands: async (client) => {
        const channel = await client.channels.fetch(state.owoChannelId);
        await channel.send(`owo ${randomChoice(config.settings.random_commands)}`);
    },
    channel_change: (client) => {
        state.owoChannelId = randomChoice(config.settings.channel_ids);
        const channel = client.channels.cache.get(state.owoChannelId);
        console.log(chalk.yellow(`[Görev] OwO Kanalı değiştirildi: #${channel ? channel.name : 'Bilinmeyen Kanal'}`));
    }
};

const taskConfig = {
    autohunt: { min: 16, max: 45, unit: 'seconds' },
    autolevelup: { min: 15, max: 60, unit: 'seconds' },
    autopray: { min: 5, max: 7, unit: 'minutes' },
    autosell: { min: 10, max: 12, unit: 'minutes' },
    autoslot: { min: 8, max: 10, unit: 'minutes' },
    autocoinflip: { min: 5, max: 7, unit: 'minutes' },
    use_random_commands: { min: 35, max: 120, unit: 'seconds' },
    channel_change: { min: config.settings.channel_change_interval[0], max: config.settings.channel_change_interval[1], unit: 'minutes' }
};

// GÖREV YÖNETİCİSİ
function startAllTasks(client, initialState) {
    state = initialState;
    console.log(chalk.greenBright('[Yönetici] Tüm aktif görevler başlatılıyor...'));

    for (const [taskName, settings] of Object.entries(taskConfig)) {
        if (config.plugins[taskName] === "true" || taskName === 'channel_change') {
            const minMs = settings.unit === 'seconds' ? settings.min * 1000 : settings.min * 60000;
            const maxMs = settings.unit === 'seconds' ? settings.max * 1000 : settings.max * 60000;

            const runTask = () => tasks[taskName](client);
            runTask(); // İlk başta bir kez çalıştır

            intervals[taskName] = setInterval(runTask, randomRange(minMs, maxMs));
            console.log(chalk.green(`- ${taskName} görevi aktif.`));
        }
    }
}

function stopAllTasks() {
    console.log(chalk.yellowBright('[Yönetici] Tüm görevler durduruluyor...'));
    for (const intervalId of Object.values(intervals)) {
        clearInterval(intervalId);
    }
    intervals = {};
}

module.exports = { startAllTasks, stopAllTasks };
