const mineflayer = require('mineflayer');
const { pathfinder, goals } = require('mineflayer-pathfinder');
const readline = require('readline');

let bot = mineflayer.createBot({
    host: '0.0.0.0', // IP
    port: 25565, // Порт
    username: 'ShuveeBot', // Bot Name
    version: '1.20' // Minecraft
});

bot.loadPlugin(pathfinder);

let following = false;
let attacking = false;
let attackingPlayer = false; 
let targetPlayer = null; 

console.log('Bot writed by Shuvee Dev')
console.log('Source code availible on GitHub: https://github.com/ShuveeDev/MC-Client-JS')

bot.on('login', () => {
    console.log(`✅ Підключено до сервера як ${bot.username}`);
    autoEquipArmor(); 
});

bot.on('message', (jsonMsg) => {
    const msg = jsonMsg.toString();
    if (!msg.startsWith('<ShuveeBot> .')) {
        console.log(`[Сервер]: ${msg}`);
    }
});

// avto voskreshanie
bot.on('death', () => {
    console.log('❌ Бот помер. Відроджуюсь...');
    bot.chat('❌ Я був убитий, відроджуюсь!');
    setTimeout(() => {
        bot.chat(`📍 Мої координати: ${bot.entity.position}`);
    }, 2000); 
});

bot.on('entityHurt', (entity) => {
    if (entity === bot.entity) {
        bot.chat('⚠ Мене атакують!');
    }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    if (input.startsWith('.')) {
        handleCommand(input); 
    } else {
        bot.chat(input);
    }
});

async function handleCommand(command) {
    const args = command.slice(1).split(' '); 

    try {
        switch (args[0].toLowerCase()) {
            case 'inv':
                showInventory(); 
                break;
            case 'invsel':
                if (args[1]) {
                    const count = args[2] ? parseInt(args[2]) : 1;
                    selectItem(args[1], count); 
                } else {
                    bot.chat('❌ Введіть назву предмета.');
                }
                break;
            case 'attach':
                if (args[1]) {
                    attachArmor(args[1]); 
                } else {
                    bot.chat('❌ Введіть слот для одягання броні (head, torso, legs, feet).');
                }
                break;
            case 'stats':
                showStats(); // statistika
                break;
            case 'attackmob':
                startAttacking(); 
                break;
            case 'attackstop':
                stopAttacking(); 
                break;
            case 'delitem':
                if (args[1]) {
                    const count = args[2] ? parseInt(args[2]) : 1;
                    dropItem(args[1], count); // item del
                } else {
                    bot.chat('❌ Введіть назву предмета.');
                }
                break;
            case 'delall':
                dropAllItems(); // vibros vsego inventara
                break;
            case 'follow':
                if (args[1]) {
                    targetPlayer = args[1]; // dox
                    startFollowing(); // svat
                } else {
                    bot.chat('❌ Введіть ім\'я гравця, за яким слідувати.');
                }
                break;
            case 'followstop':
                stopFollowing(); 
                break;
            case 'attack':
                if (args[1]) {
                    targetPlayer = args[1]; 
                    startAttackingPlayer(); 
                } else {
                    bot.chat('❌ Введіть ім\'я гравця для атаки.');
                }
                break;
            case 'stop':
                stopAttackingPlayer();
                break;
            case 'mine':
                startMining();
                break;
            case 'minestop':
                stopMining();
                break;
            default:
                bot.chat('❌ Невідома команда. Спробуйте .inv, .attach <slot>, .stats, .attackmob, .delitem <item>, .delall, .follow <player>, .followstop, .attack <player>, .stop, .mine, .minestop');
                break;
        }
    } catch (error) {
        console.error('❌ Помилка при виконанні команди:', error);
        bot.chat('❌ Сталася помилка під час виконання команди.');
    }
}

//inv
function showInventory() {
    try {
        const items = bot.inventory.items();
        if (items.length === 0) {
            bot.chat('📦 Інвентар порожній.');
        } else {
            bot.chat(`📦 Інвентар: ${items.map((item, i) => `${i}: ${item.name} x${item.count}`).join(', ')}`);
        }
    } catch (error) {
        console.error('❌ Помилка при отриманні інвентарю:', error);
        bot.chat('❌ Сталася помилка при отриманні інвентарю.');
    }
}

// selitem
function selectItem(itemName, count = 1) {
    const item = bot.inventory.items().find(i => i.name === itemName && i.count >= count);
    if (item) {
        bot.equip(item, 'hand');
        bot.chat(`🔑 Вибрано предмет: ${item.name} x${count}`);
    } else {
        bot.chat(`❌ Предмет "${itemName} x${count}" не знайдений в інвентарі.`);
    }
}

function autoEquipArmor() {
    const armorSlots = ['head', 'torso', 'legs', 'feet'];
    armorSlots.forEach(slot => {
        const bestArmor = bot.inventory.items().find(item => item.name.includes(slot)) || null;
        if (bestArmor) {
            bot.equip(bestArmor, slot);
            bot.chat(`🛡 Одягнуто броню: ${bestArmor.name} (${slot})`);
        }
    });
}

// attach
function attachArmor(slot) {
    const armor = bot.inventory.items().find(item => item.name.includes(slot)) || null;
    if (armor) {
        bot.equip(armor, slot);
        bot.chat(`🛡 Одягнуто броню: ${armor.name} (${slot})`);
    } else {
        bot.chat(`❌ Броня для слота "${slot}" не знайдена.`);
    }
}

// stats
function showStats() {
    const health = bot.health;
    const food = bot.food;
    const level = bot.experience.level;
    const protection = bot.armor ? bot.armor.reduce((sum, item) => sum + (item?.enchantments?.protection || 0), 0) : 0;

    bot.chat(`❤ Здоров'я: ${health} | 🍖 Голод: ${food} | ⭐ Рівень: ${level} | 🛡 Захист: ${protection}`);
}

// attackmob
async function startAttacking() {
    attacking = true; // status
    bot.chat('⚔ Починаю атакувати мобів.');

    while (attacking) {
        const hostileMobs = Object.values(bot.entities).filter(entity => 
            entity.type === 'mob' && 
            entity.hostile && 
            entity.position.distanceTo(bot.entity.position) < 16 
        );

        if (hostileMobs.length > 0) {
            const nearestMob = hostileMobs.sort((a, b) => 
                a.position.distanceTo(bot.entity.position) - b.position.distanceTo(bot.entity.position)
            )[0];

            bot.pathfinder.setGoal(new goals.GoalNear(nearestMob.position.x, nearestMob.position.y, nearestMob.position.z, 1));

            await bot.waitForTicks(10); 
            bot.attack(nearestMob);
            bot.chat(`⚔ Атакую моба: ${nearestMob.name}`);
        } else {
            bot.chat('❌ Мобів для атаки не знайдено.');
            await bot.waitForTicks(20); 
        }

        await bot.waitForTicks(20); 
    }
}

function stopAttacking() {
    attacking = false;
    bot.chat('🔴 Зупиняю атаку.');
}

async function startAttackingPlayer() {
    attackingPlayer = true; 
    bot.chat(`⚔ Починаю атакувати гравця: ${targetPlayer}`);

    while (attackingPlayer) {
        const player = bot.players[targetPlayer]; // status

        if (player && player.entity) {
            bot.pathfinder.setGoal(new goals.GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 1));

            await bot.waitForTicks(10);
            bot.attack(player.entity);
            bot.chat(`⚔ Атакую гравця: ${targetPlayer}`);
        } else {
            bot.chat(`❌ Гравець "${targetPlayer}" не знайдений.`);
            attackingPlayer = false; // Stopaem
        }

        await bot.waitForTicks(20); // Zatrimka ot killaura 228
    }
}

function stopAttackingPlayer() {
    attackingPlayer = false;
    targetPlayer = null; 
    bot.chat('🔴 Зупиняю атаку на гравця.');
}

async function startFollowing() {
    following = true; // Встановлюємо статус слідування
    bot.chat(`👣 Починаю слідувати за гравцем: ${targetPlayer}`);

    while (following) {
        const player = bot.players[targetPlayer];

        if (player && player.entity) {
            bot.pathfinder.setGoal(new goals.GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 2));
        } else {
            bot.chat(`❌ Гравець "${targetPlayer}" не знайдений.`);
            following = false; 
        }

        await bot.waitForTicks(20); 
    }
}

function stopFollowing() {
    following = false;
    targetPlayer = null; 
    bot.chat('🔴 Зупиняю слідування.');
}

function dropItem(itemName, count = 1) {
    const item = bot.inventory.items().find(i => i.name === itemName && i.count >= count);
    if (item) {
        bot.toss(item.type, null, count);
        bot.chat(`🗑 Викинуто предмет: ${item.name} x${count}`);
    } else {
        bot.chat(`❌ Предмет "${itemName} x${count}" не знайдений в інвентарі.`);
    }
}

function dropAllItems() {
    const items = bot.inventory.items();
    if (items.length === 0) {
        bot.chat('❌ Інвентар порожній.');
    } else {
        items.forEach(item => {
            bot.toss(item.type, null, item.count);
            bot.chat(`🗑 Викинуто предмет: ${item.name} x${item.count}`);
        });
    }
}

let isDiggingDown = false; 

async function startMining() {
    mining = true;
    bot.chat('⛏ Починаю шахтування.'); 

    while (mining) {
        const targetBlock = bot.findBlock({
            point: bot.entity.position,
            maxDistance: 16,
            matching: block => miningTargets.includes(block.name)
        });

        if (targetBlock) {
            isDiggingDown = false;
            try {
                await bot.pathfinder.goto(new goals.GoalNear(targetBlock.position.x, targetBlock.position.y, targetBlock.position.z, 1));
                await bot.dig(targetBlock);
            } catch (err) {
                console.error('Помилка при копанні:', err);
            }
        } else {
            if (!isDiggingDown) {
                bot.chat('⛏ Копаю вниз...'); // 1 раз
                isDiggingDown = true;
            }
            
            const targetY = Math.floor(bot.entity.position.y) - 1;
            await bot.pathfinder.goto(new goals.GoalNear(bot.entity.position.x, targetY, bot.entity.position.z, 1));
            
            const blockUnder = bot.blockAt(bot.entity.position.offset(0, -1, 0));
            if (blockUnder && blockUnder.name !== 'air') {
                await bot.dig(blockUnder);
            }
        }

        const hostileMobs = Object.values(bot.entities).filter(entity => 
            entity.type === 'mob' && 
            entity.hostile && 
            entity.position.distanceTo(bot.entity.position) < 3
        );
        
        if (hostileMobs.length > 0) {
            await bot.attack(hostileMobs[0]);
        }

        await bot.waitForTicks(20); 
    }
}

function stopMining() {
    mining = false;
    bot.chat('🔴 Зупиняю шахтування.');

    if (targetPlayer) {
        startFollowing();
    } else {
        bot.chat('❌ Немає гравця, за яким слідувати.');
    }
}

bot.on('end', () => {
    console.log('❌ Бот відключився від сервера.');
});

bot.on('error', (err) => {
    console.error('❌ Помилка:', err);
});