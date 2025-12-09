module.exports = {
    TOKEN: '',
    CLIENT_ID: '',
    
    EMOJIS: {
        PIL: "<:MRS_Pilot:1447500079564066939>",
        CAP: "<:CAP:123456789>",       
        MED: "<:MRS_Medical:1447500043773808651>",
        SEC: "<:MRS_Security:1447500111637909644>",
        LEAD: "<:MRS_Teamlead:1447500130667200542>",
        DIS: "<:MRS_Dispatch:1447500022806741073>",
        LOGO: "<:Medrunner:1447499987008229520>", 
        DEFAULT: "🛡️"
    },

    ROLES_OPTIONS: [
        { label: 'Pilot', value: 'PIL', description: 'Assign as Pilot', emoji: '✈️' },
        { label: 'Combat Air Patrol', value: 'CAP', description: 'Assign as Combat Air Patrol', emoji: '🧢' },
        { label: 'Medic', value: 'MED', description: 'Assign as Medic', emoji: '⚕️' },
        { label: 'Security', value: 'SEC', description: 'Assign as Security', emoji: '🛡️' },
        { label: 'Team Lead', value: 'LEAD', description: 'Assign as Team Lead', emoji: '🚩' },
        { label: 'Dispatch', value: 'DIS', description: 'Assign as Dispatch', emoji: '📻' }
    ]
};