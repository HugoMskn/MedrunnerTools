const { Client, REST, Routes, SlashCommandBuilder, ActionRowBuilder, TextInputBuilder, ModalBuilder, TextInputStyle } = require('discord.js');
const { TOKEN, CLIENT_ID, EMOJIS } = require('./config');
const { sessions, removeMemberFromTarget, addMemberToTarget, isUserInTarget } = require('./logic');
const { renderBoard, renderControls } = require('./ui');

const client = new Client({ intents: [] });
const rest = new REST({ version: '10' }).setToken(TOKEN);

const commands = [
    new SlashCommandBuilder().setName('dispatch').setDescription('Start Mission Dashboard'),
    new SlashCommandBuilder().setName('status').setDescription('Status Bar').addIntegerOption(o => o.setName('pos').setDescription('Pos').setRequired(true)).addStringOption(o => o.setName('type').setDescription('Type').setRequired(true).addChoices({name:'SB',value:'sb'},{name:'Alert',value:'alert'},{name:'RTB',value:'rtb'}))
];

async function register() {
    try { await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands }); console.log('Ready.'); } 
    catch (e) { console.error(e); }
}

client.once('clientReady', register);

client.on('interactionCreate', async i => {
    try {
        if (i.isChatInputCommand()) {
            if (i.commandName === 'status') {
                const type = i.options.getString('type');
                const bar = type === 'sb' ? ":SB1::SB2::SB3::SB4::SB5::SB6::SB7:" : type === 'alert' ? ":AlertRed: :AA1::AA2::AA3::AA4::AA5::AA6::AA7::AA8: :AlertRed:" : ":RTB1::RTB2::RTB3::RTB4::RTB5::RTB6::RTB7::RTB8:";
                return await i.reply({ content: `\`\`\`:P${i.options.getInteger('pos')}: ${bar} <t:${Math.floor(Date.now()/1000)}:R>\`\`\``, ephemeral: true });
            }
            if (i.commandName === 'dispatch') {
                const modal = new ModalBuilder().setCustomId('init_modal_gs').setTitle("Initialize Mission");
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ship').setLabel('Gunship Name (e.g. Redeemer)').setStyle(TextInputStyle.Short).setRequired(true)));
                await i.showModal(modal);
                return;
            }
        }

        if (i.isModalSubmit()) {
            if (i.customId === 'init_modal_gs') {
                const gsName = i.fields.getTextInputValue('ship');
                const s = { view: 'init_owner', tempShipName: gsName };
                await i.reply({ content: `**Initializing...**\nSelect Owner for Gunship: **${gsName}**`, components: renderControls(s) });
                const msg = await i.fetchReply();
                sessions.set(msg.id, { view: 'init_owner', gunship: { ship: gsName, owner: null }, pilot: null, crew: [], ships: [] });
                return;
            }
            
            const id = i.customId.split('_').pop(); 
            let s = sessions.get(id);
            if (!s) return;

            if (i.customId.startsWith('modal_new_ship_')) {
                s.tempShipName = i.fields.getTextInputValue('ship');
                s.view = 'new_ship_owner';
            } else if (i.customId.startsWith('modal_rename_')) {
                const parts = i.customId.split('_'); 
                const idx = parseInt(parts[2]);
                if (s.ships[idx]) s.ships[idx].ship = i.fields.getTextInputValue('new_name');
                s.view = 'manage_ships_menu';
            }
            
            sessions.set(id, s);
            await i.update({ content: renderBoard(s), components: renderControls(s) });
            return;
        }

        const id = i.message?.id;
        if (!id || !sessions.has(id)) return i.reply({ content: "Session expired or invalid.", ephemeral: true }).catch(()=>{});
        let s = sessions.get(id);

        if (i.isButton()) {
            switch (i.customId) {
                case 'back': s.view = 'home'; s.tempUser = null; s.tempManageUser = null; break;
                case 'to_assign': s.view = 'assign_target'; break;
                case 'to_manage_ships': s.view = 'manage_ships_menu'; break;
                case 'to_manage_members': s.view = 'manage_mem_ship_select'; break;
                case 'to_del': s.ships.length ? s.view = 'delete' : await i.reply({ content: 'No ships.', ephemeral: true }); break;
                case 'to_rename': s.ships.length ? s.view = 'rename_select' : await i.reply({ content: 'No ships.', ephemeral: true }); break;
                
                case 'btn_new_ship':
                    const modal = new ModalBuilder().setCustomId(`modal_new_ship_${id}`).setTitle("Add Ship");
                    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ship').setLabel('Ship Name').setStyle(TextInputStyle.Short).setRequired(true)));
                    await i.showModal(modal);
                    return;

                case 'btn_close': sessions.delete(id); await i.deleteReply(); return;
                case 'btn_reset': s.pilot = null; s.crew = []; s.ships.forEach(sh => sh.members = []); s.view = 'home'; break;
                
                case 'skip_owner':
                    if (s.view === 'new_ship_owner') s.ships.push({ ship: s.tempShipName, owner: null, members: [] });
                    s.view = 'home'; s.tempShipName = null;
                    break;

                case 'btn_kick':
                    if (s.tempManageUser) {
                        removeMemberFromTarget(s, s.tempManageUser, s.target);
                        s.tempManageUser = null; s.view = 'manage_ships_menu';
                    }
                    break;
                case 'btn_change_role': s.view = 'manage_change_role'; break;
            }
        }

        else if (i.isUserSelectMenu()) {
            const uid = i.values[0];
            switch (i.customId) {
                case 'set_init_owner': s.gunship.owner = uid; s.view = 'home'; break;
                case 'set_ship_owner': s.ships.push({ ship: s.tempShipName, owner: uid, members: [] }); s.view = 'home'; s.tempShipName = null; break;
                case 'set_user': s.tempUser = uid; s.view = 'assign_role'; break;
                
                case 'sel_man_user':
                    if (isUserInTarget(s, uid, s.target)) {
                        s.tempManageUser = uid; s.view = 'manage_mem_action';
                    } else {
                        await i.reply({ content: `User not found in ${s.targetName}`, ephemeral: true });
                        return;
                    }
                    break;
            }
        }

        else if (i.isStringSelectMenu()) {
            switch (i.customId) {
                case 'sel_target':
                    s.target = i.values[0];
                    s.targetName = (s.target === 'gunship') ? "Gunship" : s.ships[parseInt(s.target.split('_')[1])].ship;
                    s.view = 'assign_user';
                    break;

                case 'sel_role':
                    const rKey = i.values[0];
                    const rEmoji = EMOJIS[rKey] || EMOJIS.DEFAULT;
                    removeMemberFromTarget(s, s.tempUser, s.target);
                    addMemberToTarget(s, s.target, { id: s.tempUser, emoji: rEmoji }, rKey);
                    s.tempUser = null; s.view = 'home';
                    break;

                case 'sel_man_ship':
                    s.target = i.values[0];
                    s.targetName = (s.target === 'gunship') ? "Gunship" : s.ships[parseInt(s.target.split('_')[1])].ship;
                    s.view = 'manage_mem_user_select';
                    break;

                case 'sel_update_role':
                    const uKey = i.values[0];
                    const uEmoji = EMOJIS[uKey] || EMOJIS.DEFAULT;
                    removeMemberFromTarget(s, s.tempManageUser, s.target);
                    addMemberToTarget(s, s.target, { id: s.tempManageUser, emoji: uEmoji }, uKey);
                    s.tempManageUser = null; s.view = 'manage_ships_menu';
                    break;

                case 'sel_del':
                    s.ships.splice(parseInt(i.values[0].split('_')[1]), 1);
                    s.view = 'manage_ships_menu';
                    break;

                case 'sel_rename':
                    const sIdx = parseInt(i.values[0].split('_')[1]);
                    const modal = new ModalBuilder().setCustomId(`modal_rename_${sIdx}_${id}`).setTitle("Rename Ship");
                    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('new_name').setLabel('New Name').setValue(s.ships[sIdx].ship).setStyle(TextInputStyle.Short).setRequired(true)));
                    await i.showModal(modal);
                    return;
            }
        }

        sessions.set(id, s);
        if (!i.replied && !i.deferred && !i.isModalSubmit()) await i.update({ content: renderBoard(s), components: renderControls(s) });
        else if (i.isModalSubmit() && !i.replied) await i.update({ content: renderBoard(s), components: renderControls(s) });

    } catch (e) { console.error(e); }
});

client.login(TOKEN);