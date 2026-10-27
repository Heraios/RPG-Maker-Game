// Rubber: the Slingshot (a weak sling with lots of shots, volleys capped at 6), latex and rubber as
// materials and their recipes, and the Battery Tender's Gear set (insulated, half damage from
// electricity and chemicals, weak to fire).

module.exports = {
    'slingshot and rubber gear': async (h, t) => {
        await h.battle();
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            const out = {}, A = n => $dataArmors.find(a => a && a.name === n), I = n => $dataItems.find(i => i && i.name === n);
            const SK = n => $dataSkills.find(s => s && s.name === n);
            const sib = $gameActors.actor(3), yoon = $gameActors.actor(2);
            const slot = (a, etype) => a.equipSlots().indexOf(etype);
            // Slingshot
            const shot = A('Slingshot');
            sib.forceChangeEquip(slot(sib, 6), shot);
            const sl = slot(sib, 6), stone = SK('Sling Stone'), rain = SK('Stone Rain');
            out.ammo = sib.ammoLeft(sl, stone);
            out.volley = sib.volleyShots(sl, rain);
            out.canUse = sib.canEquip(shot);
            // Recipes
            const rec = n => I('Recipe: ' + n);
            out.recipes = ['Rubber', 'Slingshot', 'Rubber Hood', 'Rubber Apron', 'Rubber-Coated Gloves', 'Rubber-Soled Sandals']
                .every(n => rec(n) && /<Recipe Known>/.test(rec(n).note));
            out.latex = !!I('Latex') && !!I('Rubber') && !!SmokingIsle.Gather.TABLE['Rubber Tree'];
            // The set
            Game_Action.prototype.applyVariance = function(d) { return d; };
            const enemy = $gameTroop.members()[0];
            const hit = (name, isItem) => {
                const a = new Game_Action(enemy);
                if (isItem) a.setItem(I(name).id); else a.setSkill(SK(name).id);
                return a.makeDamageValue(sib, false);
            };
            const fire = () => sib.elementRate(10);
            const before = { chlorine: hit('Chlorine Jar', true), live: hit('Live Wire'), fire: fire(), tcr: sib.tcr };
            ['Rubber Hood', 'Rubber Apron', 'Rubber-Coated Gloves', 'Rubber-Soled Sandals'].forEach(n => {
                const a = A(n);
                sib.forceChangeEquip(slot(sib, a.etypeId), a);
            });
            const set = sib.states().map(s => s.name).filter(n => /Battery Tender/.test(n));
            out.set = set.join(', ');
            out.chlorine = [before.chlorine, hit('Chlorine Jar', true)];
            out.live = [before.live, hit('Live Wire')];
            out.fire = [before.fire, fire()];
            out.tcr = [before.tcr, sib.tcr];
            out.insulated = SmokingIsle.Voltaic.isInsulated(sib) && !SmokingIsle.Voltaic.isInsulated(yoon);
            out.shockGuard = SmokingIsle.Voltaic.guard(sib, 'Shock Guard');
            out.wet = sib.stateRate(SmokingIsle.Ailments.stateByName('Wet'));
            return out;
        });
        t.eq(r.ammo, 15, 'slingshot: 15 shots');
        t.eq(r.volley, 6, 'slingshot volley capped at 6');
        t.eq(r.canUse, true, 'Sib can use the slingshot');
        t.eq(r.recipes, true, 'rubber recipes');
        t.eq(r.latex, true, 'latex, rubber and the Rubber Tree gathering spot');
        t.eq(r.set, "Battery Tender's Gear (2), Battery Tender's Gear (all)", 'set bonuses');
        t.between(r.chlorine[1] / r.chlorine[0], 0.45, 0.55, 'chlorine halved');
        t.eq(r.shockGuard, 0.5, 'electric guard 50%');
        t.between(r.live[1] / r.live[0], 0.4, 0.6, 'electricity about halved (the armor\'s defense counts too)');
        t.between(r.fire[1] / r.fire[0], 1.14, 1.16, '+15% fire');
        t.between(r.tcr[1] / r.tcr[0], 1.09, 1.11, 'Fatigue builds 10% faster');
        t.eq(r.insulated, true, 'the full set insulates');
        t.between(r.wet, 0.2, 0.3, 'resists Wet (both bonuses)');
    }
};
