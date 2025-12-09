const { ActionRowBuilder, ButtonBuilder, ButtonStyle, UserSelectMenuBuilder, StringSelectMenuBuilder } = require('discord.js');
const { EMOJIS, ROLES_OPTIONS } = require('./config');

const renderBoard = (data) => {
    let text = `${EMOJIS.LOGO} **__SHIP ASSIGNMENTS__** ${EMOJIS.LOGO}\n\n`;
    
    const gsOwner = data.gunship.owner ? `<@${data.gunship.owner}>` : "?";
    text += `# **__[${data.gunship.ship} | ${gsOwner}]__**\n\n`;
    
    text += data.pilot ? `- ${data.pilot.emoji} | <@${data.pilot.id}>\n` : `- ${EMOJIS.PIL} | *Pending Pilot*\n`;
    data.crew.forEach(m => text += `- ${m.emoji} | <@${m.id}>\n`);

    data.ships.forEach(s => {
        const owner = s.owner ? `<@${s.owner}>` : "?";
        text += `\n# **__${s.ship} [${owner}]__**\n\n`;
        text += s.members.length ? s.members.map(m => `- ${m.emoji} | <@${m.id}>\n`).join('') : `- *Empty*\n`;
    });

    return text + `\n-# Updated <t:${Math.floor(Date.now()/1000)}:R>`;
};

const renderControls = (data) => {
    const backBtn = new ButtonBuilder().setCustomId('back').setLabel('Cancel').setStyle(ButtonStyle.Secondary);

    switch (data.view) {
        case 'home':
            return [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('to_assign').setLabel('➕ Assign').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('to_manage_ships').setLabel('🚀 Manage Ships').setStyle(ButtonStyle.Primary), 
                new ButtonBuilder().setCustomId('btn_reset').setLabel('❌ Reset').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('btn_close').setLabel('❌ Close').setStyle(ButtonStyle.Danger)
            )];

        case 'init_owner':
            return [new ActionRowBuilder().addComponents(new UserSelectMenuBuilder().setCustomId('set_init_owner').setPlaceholder('Select Owner for Gunship').setMaxValues(1))];

        case 'manage_ships_menu':
            return [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('btn_new_ship').setLabel('🚀 New Ship').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('to_manage_members').setLabel('👥 Manage Team').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('to_rename').setLabel('✏️ Rename').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('to_del').setLabel('🗑️ Delete').setStyle(ButtonStyle.Danger)
                ),
                new ActionRowBuilder().addComponents(backBtn)
            ];

        case 'new_ship_owner':
            return [
                new ActionRowBuilder().addComponents(new UserSelectMenuBuilder().setCustomId('set_ship_owner').setPlaceholder(`Select Owner for ${data.tempShipName}`).setMaxValues(1)),
                new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('skip_owner').setLabel('No Owner').setStyle(ButtonStyle.Secondary))
            ];

        case 'assign_target':
            const opts = [{ label: 'Gunship', value: 'gunship' }];
            data.ships.forEach((s, i) => opts.push({ label: s.ship, value: `ship_${i}` }));
            return [
                new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('sel_target').setPlaceholder('Select Ship').addOptions(opts)),
                new ActionRowBuilder().addComponents(backBtn)
            ];
        case 'assign_user':
            return [
                new ActionRowBuilder().addComponents(new UserSelectMenuBuilder().setCustomId('set_user').setPlaceholder(`Add to: ${data.targetName}`).setMaxValues(1)),
                new ActionRowBuilder().addComponents(backBtn)
            ];
        case 'assign_role':
            return [
                new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('sel_role').setPlaceholder('Select Role').addOptions(ROLES_OPTIONS)),
                new ActionRowBuilder().addComponents(backBtn)
            ];

        case 'manage_mem_ship_select':
            const mOpts = [{ label: 'Gunship', value: 'gunship' }];
            data.ships.forEach((s, i) => mOpts.push({ label: s.ship, value: `ship_${i}` }));
            return [
                new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('sel_man_ship').setPlaceholder('Select Ship to Manage').addOptions(mOpts)),
                new ActionRowBuilder().addComponents(backBtn)
            ];
        case 'manage_mem_user_select':
            return [
                new ActionRowBuilder().addComponents(new UserSelectMenuBuilder().setCustomId('sel_man_user').setPlaceholder(`Select Member from ${data.targetName}`).setMaxValues(1)),
                new ActionRowBuilder().addComponents(backBtn)
            ];
        case 'manage_mem_action':
            return [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('btn_change_role').setLabel('🎭 Change Role').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('btn_kick').setLabel('🗑️ Remove').setStyle(ButtonStyle.Danger)
                ),
                new ActionRowBuilder().addComponents(backBtn)
            ];
        case 'manage_change_role':
            return [
                new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('sel_update_role').setPlaceholder('Select New Role').addOptions(ROLES_OPTIONS)),
                new ActionRowBuilder().addComponents(backBtn)
            ];

        case 'delete':
            const dOpts = data.ships.map((s, i) => ({ label: `Delete ${s.ship}`, value: `del_${i}` }));
            return [
                new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('sel_del').setPlaceholder('Select Ship to Delete').addOptions(dOpts)),
                new ActionRowBuilder().addComponents(backBtn)
            ];
        case 'rename_select':
            const rOpts = data.ships.map((s, i) => ({ label: `Rename ${s.ship}`, value: `ren_${i}` }));
            return [
                new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('sel_rename').setPlaceholder('Select Ship to Rename').addOptions(rOpts)),
                new ActionRowBuilder().addComponents(backBtn)
            ];
    }
    return [];
};

module.exports = { renderBoard, renderControls };