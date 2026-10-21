// Slings, bows, nets, the Bronze Crossbow, the Copper-Silver Pile, silver ritual weapons, the war drum,
// Patience's new gear, late arms and bucklers, Centipede Venom, and their recipes.

module.exports = {
    'ranged, pile, silver, drum, venom': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n), W = n => $dataWeapons.find(w => w && w.name === n),
                  IT = n => $dataItems.find(i => i && i.name === n), ST = n => SmokingIsle.Ailments.stateByName(n), out = {};
            const yoon = A(2), sib = A(3), pada = A(5);
            const ranged = (a, n) => { const it = AR(n), s = a.slotOfType(6); a.forceChangeEquip(s, it); a._siRangedSlot = s; a._siRangedMove = ''; return s; };
            // slings
            const s = ranged(yoon, 'Braided Sinew Sling'); yoon._siAmmoUsed = {}; out.braided = yoon.ammoLeft(s) + '/' + yoon.rangedPower();
            ranged(yoon, 'Lead-Weighted Sling'); const plain = yoon.rangedPower();
            yoon.addState(ST('Lead Shot')); out.lead = plain + '/' + yoon.rangedPower(); yoon.removeState(ST('Lead Shot'));
            ranged(sib, 'Priest\'s Sling'); out.priest = sib.mat - (sib.paramBase(4) + sib._paramPlus[4]);
            // bows and the crossbow
            ranged(pada, 'Ash Flatbow'); out.ash = pada.rangedPower();
            out.crossbow = [2, 3, 4, 5, 8, 9, 10].every(id => A(id).canEquip(AR('Bronze Crossbow'))) && ![6, 7, 11].some(id => A(id).canEquip(AR('Bronze Crossbow')));
            ranged(yoon, 'Bronze Crossbow'); out.crossPower = yoon.rangedPower();
            // the Copper-Silver Pile holds 5
            yoon.forceChangeEquip(yoon.slotOfType(20), AR('Copper-Silver Pile')); out.pile = yoon.maxCharge();
            // silver: 30% more against spirits
            const owl = new Game_Enemy(12, 0, 0), knife = W('Silver Ritual Knife');
            yoon.forceChangeEquip(yoon.slotOfType(1), knife);
            const rnd = Math.random; Math.random = () => 0.5;
            const hit = new Game_Action(yoon); hit.setAttack();
            const withSilver = hit.makeDamageValue(owl, false);
            const note = knife.note; knife.note = note.replace(/<Damage Vs:[^>]*>/, ''); const without = hit.makeDamageValue(owl, false); knife.note = note;
            Math.random = rnd;
            out.silver = +(withSilver / without).toFixed(1);
            out.ritual = knife.wtypeId + '/' + W('Silver Ritual Spear').wtypeId;
            // the war drum makes the whole party Brave
            yoon.forceChangeEquip(yoon.slotOfType(5), AR('Palm-Log Drum'));
            sib.removeState(ST('Brave')); sib.onBattleStart(); out.drum = sib.isStateAffected(ST('Brave'));
            // Centipede Venom: 60%
            const v = new Game_Action(pada); v.setItem(IT('Centipede Venom').id); pada.clearResult(); v.apply(pada);
            out.venom = pada.isStateAffected(ST('Venom-Coated')) && $dataStates[ST('Venom-Coated')].traits[0].value;
            out.hag = !IT('Hag-Crane Feather') && !!AR('Hag-Crane Feather');
            return out;
        });
        t.eq(r.braided, '7/8', 'Braided Sinew Sling: 7 shots, power 8');
        t.eq(r.lead, '12/20', 'Lead-Weighted Sling: power 12; with Lead Shot +6 and +2 more');
        t.eq(r.priest, 3, 'Priest\'s Sling: Spirit +3');
        t.eq(r.ash, 14, 'Ash Flatbow: power 14');
        t.ok(r.crossbow, 'the Bronze Crossbow: bow users and children');
        t.eq(r.crossPower, 24, 'and power 24');
        t.eq(r.pile, 5, 'the Copper-Silver Pile holds 5 charge');
        t.eq(r.silver, 1.3, 'silver: 30% more damage to a spirit');
        t.eq(r.ritual, '14/15', 'a ritual knife and a ritual spear');
        t.ok(r.drum, 'the Palm-Log Drum: the whole party starts Brave');
        t.eq(r.venom, 0.6, 'Centipede Venom: attacks may envenom (60%)');
        t.ok(r.hag, 'the Hag-Crane Feather is only the charm now');
    },

    'Patience\'s gear, arms, bucklers and recipes': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n), IT = n => $dataItems.find(i => i && i.name === n);
            const T = SmokingIsle.Time, G = SmokingIsle.Gather, C = SmokingIsle.Crafting, P = $gameParty, out = {};
            const pat = A(12);
            // the Lamp Pack: a light in the dark
            const note = $dataMap.note; $dataMap.note = '<Dark>'; T.state().light = 0;
            out.dark = T.canSee();
            pat.forceChangeEquip(pat.slotOfType(17), AR('Lamp Pack')); out.lamp = T.canSee();
            $dataMap.note = note;
            // the Forager's Pack doubles rare extras
            const pada = A(5), axe = $dataWeapons.find(w => w && w.name === 'Basalt Axe');
            P.gainItem(axe, 1); pada.forceChangeEquip(pada.slotOfType(1), axe);
            const spot = $gameMap.events().find(e => e.event().name === 'Gather: Laurel').eventId(), map = $gameMap.mapId();
            const rnd = Math.random; Math.random = () => 0.2;
            out.noForager = G.gather(map, spot, 'Laurel', pada).got.length;
            pat.forceChangeEquip(pat.slotOfType(17), AR('Forager\'s Pack')); T.sleep();
            out.forager = G.gather(map, spot, 'Laurel', pada).got.length;
            Math.random = rnd;
            out.dogGear = ['Stone Pack', 'Sharkskin Booties', 'Deerskin Booties', 'Felt Booties', 'Clay Bell', 'Ringing-Stone Bell', 'Silver-Studded Collar']
                .every(n => pat.canEquip(AR(n)));
            // children's small shields and the late arms
            out.bucklers = ['Sharkskin Buckler', 'Ebony Buckler', 'Bronze Buckler', 'Grown-Coral Buckler', 'Hound-Skull Buckler'].every(n => A(2).canEquip(AR(n)));
            out.arms = ['Linen Armguards', 'Gilt Armlets', 'Grown-Coral Vambraces', 'Hound-Fang Bracers', 'Painted Dragon-Tree Bracers'].every(n => A(3).canEquip(AR(n)))
                && !A(3).canEquip(AR('Star-Chart Armbands')) && A(5).canEquip(AR('Star-Chart Armbands'));
            // recipes
            const known = n => C.recipes.find(x => x.name === n);
            out.recipes = ['Goat-Hair Sling', 'Braided Sinew Sling', 'Priest\'s Sling', 'Lead-Weighted Sling', 'Copper-Silver Pile', 'Chalcedony Adze',
                'Centipede Venom', 'Horn Bow (ox horn)', 'Living Bough Staff', 'Ash Flatbow', 'Living Bow', 'Silver Ritual Knife', 'Silver Ritual Spear',
                'Palm-Log Drum', 'Break Down a Sandalwood Casket', 'Lamp Pack', 'Forager\'s Pack', 'Stone Pack', 'Sharkskin Booties', 'Deerskin Booties',
                'Felt Booties', 'Clay Bell', 'Silver-Studded Collar', 'Linen Armguards', 'Painted Dragon-Tree Bracers', 'Sharkskin Buckler', 'Ebony Buckler',
                'Lead-Weighted Net', 'Sinew Net'].filter(n => !known(n)).join(', ');
            P.gainItem(IT('Sandalwood Casket'), 1); P.loseItem(IT('Sandalwood Branch'), 99); P.gainItem(IT('Fire-Starting Kit'), 1); C.light();
            C.craft(known('Break Down a Sandalwood Casket'), 'campfire'); out.casket = P.numItems(IT('Sandalwood Branch'));
            return out;
        });
        t.eq(r.dark, false, 'in the dark without a light...');
        t.ok(r.lamp, '...Patience\'s Lamp Pack lights the way');
        t.eq(r.noForager, 1, 'without the Forager\'s Pack: just the branch');
        t.eq(r.forager, 2, 'with it, the rare log too');
        t.ok(r.dogGear, 'Patience can wear her new packs, booties, bells and collar');
        t.ok(r.bucklers, 'children can carry the new bucklers');
        t.ok(r.arms, 'the late arms fit children, except the Navigator\'s (adults only)');
        t.eq(r.recipes, '', 'every new recipe exists');
        t.eq(r.casket, 2, 'a Sandalwood Casket breaks down into two Sandalwood Branches');
    }
};
