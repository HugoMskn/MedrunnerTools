const { EMOJIS } = require('./config');

const sessions = new Map();

function findMember(data, userId) {
    if (data.pilot && data.pilot.id === userId) return { type: 'pilot', obj: data.pilot };
    
    const crewIdx = data.crew.findIndex(m => m.id === userId);
    if (crewIdx !== -1) return { type: 'crew', index: crewIdx, obj: data.crew[crewIdx] };

    for (let i = 0; i < data.ships.length; i++) {
        const mIdx = data.ships[i].members.findIndex(m => m.id === userId);
        if (mIdx !== -1) return { type: 'ship', shipIndex: i, index: mIdx, obj: data.ships[i].members[mIdx] };
    }
    return null;
}

function removeMemberFromTarget(data, userId, target) {
    if (target === 'gunship') {
        if (data.pilot && data.pilot.id === userId) {
            const temp = data.pilot; data.pilot = null; return temp;
        }
        const idx = data.crew.findIndex(m => m.id === userId);
        if (idx !== -1) return data.crew.splice(idx, 1)[0];
    }
    else if (target.startsWith('ship_')) {
        const idx = parseInt(target.split('_')[1]);
        if (data.ships[idx]) {
            const memIdx = data.ships[idx].members.findIndex(m => m.id === userId);
            if (memIdx !== -1) return data.ships[idx].members.splice(memIdx, 1)[0];
        }
    }
    return null;
}

function addMemberToTarget(data, target, userObj, roleKey) {
    if (target === 'gunship') {
        if (roleKey === 'PIL') {
            if (data.pilot) data.crew.push({ ...data.pilot, emoji: EMOJIS.DEFAULT }); 
            data.pilot = userObj;
        } else {
            if (!data.crew.some(m => m.id === userObj.id)) data.crew.push(userObj);
        }
    }
    else if (target.startsWith('ship_')) {
        const idx = parseInt(target.split('_')[1]);
        if (data.ships[idx]) {
            if (!data.ships[idx].members.some(m => m.id === userObj.id)) {
                data.ships[idx].members.push(userObj);
            }
        }
    }
}

function isUserInTarget(data, userId, target) {
    if (target === 'gunship') {
        return (data.pilot && data.pilot.id === userId) || data.crew.some(m => m.id === userId);
    } 
    if (target.startsWith('ship_')) {
        const idx = parseInt(target.split('_')[1]);
        if (!data.ships[idx]) return false;
        return data.ships[idx].members.some(m => m.id === userId);
    }
    return false;
}

module.exports = {
    sessions,
    findMember,
    removeMemberFromTarget,
    addMemberToTarget,
    isUserInTarget
};