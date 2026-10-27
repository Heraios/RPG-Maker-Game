// Armor wear (SI_Gear): only real armor wears (wicker, wood, shell, bone, stone), one piece per hit;
// worn armor is mended with Sinew Binding or Glue (or Aday's Mend Gear); the Clay-Daubed Coat sheds
// its clay into a Felt Coat.

module.exports = {
    'armor wear': async (h, t) => {
        await h.battle();
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            const out = {}, AR = n => $dataArmors.find(a => a && a.name === n), IT = n => $dataItems.find(i => i && i.name === n);
            const G = SmokingIsle.Gear, pada = $gameActors.actor(5), boar = $gameTroop.members()[0];
            const wear = (...names) => names.forEach(n => { const x = AR(n); $gameParty.gainItem(x, 1); pada.forceChangeEquip(pada.equipSlots().indexOf(x.etypeId), x); });
            const name = etype => { const a = pada.equips()[pada.equipSlots().indexOf(etype)]; return a ? a.name : ''; };
            out.clothes = ['Tapa Wrap', 'Reed Hat', 'Bronze Helm', 'Boar-Hide Vest', 'Silver Ring'].every(n => !G.canWear(AR(n)));
            pada.clearEquipments();
            wear('Wicker Buckler', 'Tortoise-Shell Cuirass', 'Tapa Wrap');
            // A hit always wears (roll forced): exactly one piece wears.
            const rnd = Math.random; Math.random = () => 0;
            const hit = () => { pada.setHp(pada.mhp); const a = new Game_Action(boar); a.setAttack(); a.itemHit = () => 1; a.itemEva = () => 0; a.apply(pada); pada._siWearMessages = []; };
            hit();
            out.oneWorn = [name(2), name(11)].filter(n => /^(Frayed|Cracked)/.test(n)).length;
            out.wrap = name(4);
            Math.random = rnd;
            // Repairs
            pada.clearEquipments();
            wear('Wicker Buckler'); pada.rollWear(pada.equipSlots().indexOf(2), true);
            out.frayed = name(2);
            const use = n => { const a = new Game_Action(pada); a.setItemObject(IT(n)); return a.testApply(pada) && (a.apply(pada), true); };
            out.glueNo = use('Glue');
            out.sinew = use('Sinew Binding') && name(2) === 'Wicker Buckler';
            wear('Pine Shield'); pada.rollWear(pada.equipSlots().indexOf(2), true);
            const aday = $gameActors.actor(13), mend = new Game_Action(aday);
            mend.setSkill($dataSkills.find(s => s && s.name === 'Mend Gear').id); mend.apply(pada);
            out.mend = name(2);
            // Breaking leaves the materials
            $gameParty.loseItem(IT('Marsh Reed'), 99); const reed = $gameParty.numItems(IT('Marsh Reed'));
            wear('Wicker Buckler'); pada.rollWear(pada.equipSlots().indexOf(2), true); pada.rollWear(pada.equipSlots().indexOf(2), true);
            out.broke = name(2) === '' && $gameParty.numItems(IT('Marsh Reed')) === reed + 1;
            // The clay coat
            $gameParty.loseItem(IT('Potsherds'), 99); const sherds = $gameParty.numItems(IT('Potsherds'));
            wear('Clay-Daubed Coat'); pada.rollWear(pada.equipSlots().indexOf(11), true);
            out.felt = name(11) === 'Felt Coat' && $gameParty.numItems(IT('Potsherds')) === sherds + 1;
            out.redaub = $dataItems.some(i => i && i.name === 'Recipe: Re-daub a Felt Coat');
            return out;
        });
        t.eq(r.clothes, true, 'clothes, bronze, hide and rings never wear');
        t.eq(r.oneWorn, 1, 'a hit wears one piece, not every piece');
        t.eq(r.wrap, 'Tapa Wrap', 'clothing untouched');
        t.eq(r.frayed, 'Frayed Wicker Buckler', 'wicker frays');
        t.eq(r.glueNo, false, 'glue doesn\'t fix wicker');
        t.eq(r.sinew, true, 'Sinew Binding re-lashes it');
        t.eq(r.mend, 'Pine Shield', 'Aday\'s Mend Gear fixes armor too');
        t.eq(r.broke, true, 'a broken wicker buckler leaves Marsh Reed');
        t.eq(r.felt, true, 'the clay cracks off: a Felt Coat and Potsherds');
        t.eq(r.redaub, true, 'a recipe to daub it again');
    }
};
