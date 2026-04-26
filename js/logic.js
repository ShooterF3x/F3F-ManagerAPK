// ==========================================
// LOGIC.JS : MOTEUR MATHÉMATIQUE ET OPTIMISATION
// ==========================================

function calculateAB() {
    let x1 = getNum(globalCoefs.v1, 3), y1 = getNum(globalCoefs.m1, 2.3); 
    let x2 = getNum(globalCoefs.v2, 20), y2 = getNum(globalCoefs.m2, 5.0);
    let xp = getNum(globalCoefs.vp, 10), yp = getNum(globalCoefs.mp, 3.5);
    
    if (x2 === x1) x2 += 0.1; 
    
    if (globalCoefs.isDouble) {
        if (xp === x1) xp += 0.1;
        if (x2 === xp) x2 += 0.1;
        globalCoefs.a = (yp - y1) / (xp - x1);
        globalCoefs.b = y1 - (globalCoefs.a * x1);
        globalCoefs.a2 = (y2 - yp) / (x2 - xp);
        globalCoefs.b2 = yp - (globalCoefs.a2 * xp);
    } else {
        globalCoefs.a = (y2 - y1) / (x2 - x1);
        globalCoefs.b = y1 - (globalCoefs.a * x1);
    }

    const elA = document.getElementById('disp-coef-a');
    const elB = document.getElementById('disp-coef-b');
    if(elA) elA.innerText = globalCoefs.a.toFixed(3) + (globalCoefs.isDouble ? " / " + globalCoefs.a2.toFixed(3) : "");
    if(elB) elB.innerText = globalCoefs.b.toFixed(3) + (globalCoefs.isDouble ? " / " + globalCoefs.b2.toFixed(3) : "");
}

function getActiveCoefs(g) {
    if(g && g.useCustomSettings) {
        return { 
            a: g.cA !== undefined ? g.cA : globalCoefs.a, 
            b: g.cB !== undefined ? g.cB : globalCoefs.b, 
            a2: g.cA2 !== undefined ? g.cA2 : globalCoefs.a2, 
            b2: g.cB2 !== undefined ? g.cB2 : globalCoefs.b2, 
            vp: g.cVp !== undefined ? g.cVp : globalCoefs.vp,
            isDouble: g.cIsDouble || false,
            refArea: globalCoefs.refArea 
        };
    }
    return globalCoefs; 
}

function getActiveOpts(g) {
    if(g && g.useCustomSettings) {
        return { 
            wMin: getNum(g.customTolWMin, optParams.wMin), 
            wMax: getNum(g.customTolWMax, optParams.wMax), 
            cgTolPlus: getNum(g.customTolCgPlus, optParams.cgTolPlus), 
            cgTolMinus: getNum(g.customTolCgMinus, optParams.cgTolMinus) 
        };
    }
    return optParams;
}

function getCalculatedTargetWeight(w, f, g) {
    if (isNaN(w) || isNaN(f) || !g) return 0;
    const active = getActiveCoefs(g);
    let baseTarget = 0;

    if (active.isDouble && w > (active.vp || 10)) {
        baseTarget = (active.a2 * w + active.b2) * 1000;
    } else {
        baseTarget = (active.a * w + active.b) * 1000;
    }

    let ratio = (g.area && g.area > 0 && active.refArea > 0) ? g.area / active.refArea : 1;
    return baseTarget * ratio * (f/100);
}

function getEffectiveStock(g, idx, typeFull) {
    const c = g.chambers[idx];
    const stockKey = 'stock_' + typeFull;
    if(c.group && c.group > 0) {
        let totalGroupStock = 0;
        g.chambers.forEach(ch => { if(ch.group == c.group) { totalGroupStock += (parseFloat(ch[stockKey]) || 0); } });
        return { val: totalGroupStock, isGroup: true };
    }
    return { val: (parseFloat(c[stockKey]) || 0), isGroup: false };
}

window.autoFillBallast = function() {
    document.getElementById('ai-suggestion-box').classList.add('hidden'); 
    const g = gliders.find(x => x.id == currentGliderId); if(!g) return;
    const activeOpts = getActiveOpts(g); 

    const wVal = parseFloat(document.getElementById('inp-wind').value) || 0;
    const fVal = parseFloat(document.getElementById('inp-factor').value) || 100;
    let targetW = getCalculatedTargetWeight(wVal, fVal, g);
    if(targetW <= 0) return;

    const matMap = { 'brass': 'b', 'lead': 'l', 'tungsten': 't' };
    let baseM = g.emptyW + (g.noseMass || 0);
    let baseMom = (g.emptyW * g.emptyCG) + ((g.noseMass || 0) * -(g.noseDist || 0));
    let indices = g.chambers.map((_, idx) => idx);

    function getStats(load) {
        let m = baseM, mom = baseMom;
        g.chambers.forEach((c,i) => {
            let w = load[i].b*(c.mass_brass||0) + load[i].l*(c.mass_lead||0) + load[i].t*(c.mass_tungsten||0);
            m += w; mom += w * c.dist;
        });
        return { m, cg: (m > 0 ? mom/m : 0) };
    }

    function getCost(stats) {
        let diffW = stats.m - targetW;
        let diffCG = stats.cg - g.sessionTargetCG;
        
        let wCost = 0;
        if (diffW > activeOpts.wMax) wCost = (diffW - activeOpts.wMax) * 50.0;
        else if (diffW < -activeOpts.wMin) wCost = Math.abs(diffW + activeOpts.wMin) * 50.0;
        else wCost = Math.abs(diffW) * 0.1;
        
        let cgCost = 0;
        if (diffCG > 0) { 
            if(diffCG > activeOpts.cgTolPlus) cgCost = (diffCG - activeOpts.cgTolPlus) * 10000.0; 
            else cgCost = diffCG * 15.0; 
        } else { 
            if(Math.abs(diffCG) > activeOpts.cgTolMinus) cgCost = (Math.abs(diffCG) - activeOpts.cgTolMinus) * 10000.0; 
            else cgCost = Math.abs(diffCG) * 15.0; 
        }
        return wCost + cgCost;
    }

    const getGroupUsage = (grpId, matCode, load) => { let u = 0; g.chambers.forEach((ch, idx) => { if(ch.group == grpId) u += load[idx][matCode]; }); return u; };

    let bestGlobalLoadout = g.loadout.map(() => ({b:0, l:0, t:0}));
    let bestGlobalScore = Infinity;

    for (let attempt = 0; attempt < 15; attempt++) {
        let currentLoadout = g.chambers.map(() => ({b:0, l:0, t:0}));

        if (attempt > 0) {
            g.chambers.forEach((c, i) => {
                let numToAdd = Math.floor(Math.random() * (c.max + 1));
                for(let k=0; k<numToAdd; k++) {
                    let availableMats = [];
                    ['brass', 'lead', 'tungsten'].forEach(mat => {
                        let mCode = matMap[mat];
                        let eff = getEffectiveStock(g, i, mat);
                        let currentUsage = eff.isGroup ? getGroupUsage(c.group, mCode, currentLoadout) : currentLoadout[i][mCode];
                        if (currentUsage < eff.val) availableMats.push(mCode);
                    });
                    if (availableMats.length > 0) {
                        let m = availableMats[Math.floor(Math.random() * availableMats.length)];
                        currentLoadout[i][m]++;
                    }
                }
            });
        }

        let currentScore = getCost(getStats(currentLoadout));
        let improved = true;
        let steps = 0;

        while (improved && steps < 500) {
            improved = false;
            let bestMove = null;
            let bestMoveScore = currentScore;

            indices.forEach((i) => { 
                let c = g.chambers[i];
                let L = currentLoadout[i];
                
                if((L.b + L.l + L.t) < c.max) {
                    ['brass', 'lead', 'tungsten'].forEach(mat => {
                        let mCode = matMap[mat];
                        let eff = getEffectiveStock(g, i, mat); 
                        let canAdd = false;
                        
                        if(eff.val > 0) {
                            if(eff.isGroup) { if(getGroupUsage(c.group, mCode, currentLoadout) < eff.val) canAdd = true; } 
                            else { if(L[mCode] < eff.val) canAdd = true; }
                        }

                        if(canAdd) {
                            let testLoad = JSON.parse(JSON.stringify(currentLoadout)); testLoad[i][mCode]++;
                            let h = getCost(getStats(testLoad));
                            if(mat==='lead') h -= 0.001; if(mat==='tungsten') h -= 0.002;
                            if(h < bestMoveScore) { bestMoveScore = h; bestMove = {action:'add', i, mat: mCode}; }
                        }
                    });
                }

                ['brass', 'lead', 'tungsten'].forEach(mat => {
                    let mCode = matMap[mat];
                    if(L[mCode] > 0) {
                        let testLoad = JSON.parse(JSON.stringify(currentLoadout)); testLoad[i][mCode]--;
                        let h = getCost(getStats(testLoad));
                        if(h < bestMoveScore) { bestMoveScore = h; bestMove = {action:'sub', i, mat: mCode}; }
                    }
                });
            });
            
            if (bestMove) {
                if (bestMove.action === 'add') currentLoadout[bestMove.i][bestMove.mat]++;
                if (bestMove.action === 'sub') currentLoadout[bestMove.i][bestMove.mat]--;
                currentScore = bestMoveScore;
                improved = true;
            }
            steps++;
        }

        if (currentScore < bestGlobalScore) {
            bestGlobalScore = currentScore;
            bestGlobalLoadout = JSON.parse(JSON.stringify(currentLoadout));
        }
    }
    g.loadout = bestGlobalLoadout; 
    save(); 
    renderCalc();
};
