// Set parts, substitutes and pieces in two sets; the new sets; Spirit and Wits.

module.exports = {
    'set parts, substitutes, shared pieces and the new sets': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n), S = n => $dataSkills.find(s => s && s.name === n), out = {};
            const put = (a, n, k = 0) => { const x = AR(n); const slots = a.equipSlots().map((e, i) => e === x.etypeId ? i : -1).filter(i => i >= 0); a.forceChangeEquip(slots[k], x); };
            const sets = a => { a.refresh(); return a.setBonusStates().map(s => s.name).sort().join(','); };
            // Copper-Silver Circlet stands in for the Feather Crown
            const juda = A(6); juda.clearEquipments(); put(juda, 'Copper-Silver Circlet'); put(juda, 'Feather Cape'); out.feather = sets(juda);
            // Goat-Skin Moccasins finish Mouflon Wool and count for Goat-Skin too
            const pada = A(5); pada.clearEquipments(); ['Wool Cap', 'Wool Mantle', 'Wool Leggings', 'Goat-Skin Moccasins', 'Goat-Skin Tunic'].forEach(n => put(pada, n));
            out.wool = sets(pada);
            // Telegrapher's Kit: three charms are one part; gloves + charm + pile is the full kit
            const sib = A(3); sib.clearEquipments(); put(sib, 'Lodestone', 0); put(sib, 'Hot-Spring Sinter', 1); put(sib, 'Copper Bracelet', 2);
            out.charmsOnly = sets(sib);
            put(sib, 'Rubber-Coated Gloves'); put(sib, 'Voltaic Pile'); out.kit = sets(sib); sib._siCharge = undefined; out.charge = sib.maxCharge();
            // electric techniques +15% with the full kit
            const e = $gameTroop.members()[0], rnd = Math.random; Math.random = () => 0.5;
            const dmg = () => { const x = new Game_Action(sib); x.setSkill(S('Live Wire').id); return x.makeDamageValue(e, false); };
            const full = dmg(); sib.forceChangeEquip(sib.slotOfType(13), null); sib.refresh(); const part = dmg(); Math.random = rnd;
            out.electric = full / part;
            // First Sailor Regalia needs both the eye and the pupil
            const tou = A(9); tou.clearEquipments(); put(tou, 'Crescent Pectoral'); put(tou, 'Coral Eye Fragment', 0); out.regalia2 = sets(tou);
            put(tou, 'Scoria Pupil', 1); out.regalia = sets(tou);
            // Officer's Kit: the whole party moves faster
            const th = A(11); $gameParty.removeActor(4); $gameParty.addActor(11); th.clearEquipments(); const agi0 = A(2).agi;
            put(th, 'Bronze Signet'); put(th, "Sailor's Compass"); put(th, 'Codex of Mending'); th.refresh(); out.officer = sets(th); out.partyAgi = A(2).agi / agi0;
            // Guardian Lizard
            const dama = A(7); dama.clearEquipments(); put(dama, 'Guardian Lizard Scale'); put(dama, 'Lizard-Scale Charm'); out.lizard = sets(dama);
            // Spirit and Wits
            out.terms = TextManager.param(5) + '/' + TextManager.param(7);
            return out;
        });
        t.eq(r.feather, 'Feather (1),Feather (all)', 'the Circlet stands in for the Feather Crown');
        t.ok(r.wool.includes('Mouflon Wool (all)') && r.wool.includes('Goat-Skin (2)'), 'Goat-Skin Moccasins count for both sets: ' + r.wool);
        t.eq(r.charmsOnly, '', "three Telegrapher's charms are one part, not the full kit");
        t.eq(r.kit, "Telegrapher's Kit (2),Telegrapher's Kit (all)", "gloves, a charm and the pile: the full Telegrapher's Kit");
        t.eq(r.charge, 5, 'pile 3 + Lodestone 1 + kit 1 = 5 charge');
        t.between(r.electric, 1.13, 1.17, 'the full kit: electric techniques +15%');
        t.eq(r.regalia2, 'First Sailor Regalia (2)', 'pectoral and eye: the small Regalia bonus');
        t.ok(r.regalia.includes('First Sailor Regalia (all)'), 'with the pupil too: the full Regalia');
        t.ok(r.officer.includes("Officer's Kit (all)"), "signet, compass and a codex: the full Officer's Kit");
        t.between(r.partyAgi, 1.03, 1.07, "the Officer's Kit raises everyone's AGI");
        t.eq(r.lizard, 'Guardian Lizard (1),Guardian Lizard (all)', 'the Guardian Lizard set');
        t.eq(r.terms, 'Spirit/Wits', 'MDF and LUK are shown as Spirit and Wits');
    }
};
