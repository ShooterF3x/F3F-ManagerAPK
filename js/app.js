// ==========================================
// APP.JS : INTERFACE (UI), API ET INITIALISATION
// ==========================================

/* --- VERIFICATION MISES A JOUR --- */
async function checkForUpdates() {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/TON_USER/TON_REPO/main/version.json?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (data.version && data.version !== "6.3") {
            window.showModal(
                `Une mise à jour (V${data.version}) est disponible !`, false,
                [{tx: "Ignorer", cl: "btn-outline", val: 0}, {tx: "Voir GitHub", cl: "btn-primary", val: 1}],
                (r) => { if (r) window.open("https://github.com/TON_USER/TON_REPO/releases", '_blank'); }
            );
        }
    } catch (err) { console.log(err); }
}

/* --- FONCTIONS UTILITAIRES --- */
function t(key) { return (dict[currentLang] && dict[currentLang][key]) ? dict[currentLang][key] : key; }

function hexToRgba(hex, alpha) {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){ c= [c[0], c[0], c[1], c[1], c[2], c[2]]; }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return 'rgba(255,255,255,0.05)';
}

/* --- AFFICHAGE & NAVIGATION --- */
window.navigateTo = function(v, id=null) { 
    if(id) currentGliderId=id; 
    history.pushState({v,id}, ""); 
    showView(v); 
};
window.onpopstate = e => showView(e.state ? e.state.v : 'home');

function showView(n) {
    document.querySelectorAll('body > div:not(#custom-modal-overlay)').forEach(v => v.classList.add('hidden'));
    const view = document.getElementById('view-'+n);
    if(view) view.classList.remove('hidden');
    if(n==='home') renderList(); 
    if(n==='calc') renderCalc(); 
    if(n==='logbook') showLogbook();
    if(n==='settings') {
        document.getElementById('cfg-api-key').value = geminiApiKey;
        setTimeout(window.drawSettingsChart, 100); 
    }
}

window.showModal = function(msg, withInp, btns, cb, def="") {
    const o = document.getElementById('custom-modal-overlay'), m = document.getElementById('modal-msg'), i = document.getElementById('modal-input-field'), b = document.getElementById('modal-buttons');
    m.innerText = msg; b.innerHTML = '';
    if(withInp) { i.classList.remove('hidden'); i.value = def; } else i.classList.add('hidden');
    btns.forEach(x => { 
        const btn = document.createElement('button'); btn.className = 'btn '+x.cl; btn.innerText = x.tx; 
        btn.onclick = (e) => { e.preventDefault(); o.style.display='none'; cb(x.val==='inp'?i.value:x.val); }; 
        b.appendChild(btn); 
    });
    o.style.display='flex';
};
window.customAlert = function(msg) { window.showModal(msg, false, [{tx:"OK", cl:"btn-primary", val:true}], () => {}); };

window.changeLang = function(l) { currentLang = l; localStorage.setItem('f3f_lang', l); updateUITexts(); };
window.setTheme = function(name) {
    currentTheme = name;
    document.body.setAttribute('data-theme', name);
    localStorage.setItem('f3f_theme_style', name);
};

function updateUITexts() {
    document.querySelectorAll('[data-i18n]').forEach(el => el.innerText = t(el.dataset.i18n));
    document.querySelectorAll('[data-i18n-ph]').forEach(el => el.placeholder = t(el.dataset.i18nPh));
    document.getElementById('help-content').innerHTML = t('help_html');
    if(!document.getElementById('view-calc').classList.contains('hidden')) renderCalc();
}

/* --- GRAPHIQUE SETTINGS V6.0 --- */
window.toggleBilinearMode = function() {
    const isDouble = document.getElementById('check-bilinear').checked;
    document.getElementById('block-pivot').classList.toggle('hidden', !isDouble);
    window.triggerCurveCalc();
};

window.triggerCurveCalc = function() { window.saveGlobalCoefs(); window.drawSettingsChart(); };

window.drawSettingsChart = function() {
    const ctx = document.getElementById('settings-chart');
    if(!ctx) return;
    
    let labels = []; let data = [];
    for(let w=0; w<=25; w+=1) {
        labels.push(w);
        if (globalCoefs.isDouble && w > (globalCoefs.vp || 10)) {
            data.push((globalCoefs.a2 * w + globalCoefs.b2));
        } else {
            data.push((globalCoefs.a * w + globalCoefs.b));
        }
    }

    if(settingsChartInstance) settingsChartInstance.destroy();
    
    settingsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Poids Théorique (kg)',
                data: data,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { title: {display:true, text:'Vent (m/s)'}}, y: { title: {display:true, text:'Kg'}} }
        }
    });
};

/* --- RENDER FUNCTIONS --- */
function renderList() {
    const l = document.getElementById('glider-list'); l.innerHTML = '';
    gliders.forEach(g => {
        const d = document.createElement('div'); d.className = 'glider-item';
        d.innerHTML = `<div><div style="font-family:var(--font-head); font-weight:bold;">${g.name}</div><div style="font-size:0.75rem; opacity:0.6; font-family:var(--font-num);">${g.emptyW}g</div></div><div>›</div>`;
        d.onclick = () => window.navigateTo('calc', g.id); l.appendChild(d);
    });
}

function renderCalc() {
    const g = gliders.find(x => x.id == currentGliderId); 
    if(!g) return;

    document.getElementById('calc-title').innerText = g.name;
    document.getElementById('inp-wind').value = g.lastWind || 3.5;
    document.getElementById('rng-wind').value = g.lastWind || 3.5;
    document.getElementById('inp-factor').value = g.lastFactor || 100;
    document.getElementById('rng-factor').value = g.lastFactor || 100;
    
    document.getElementById('ai-suggestion-box').classList.add('hidden'); 

    if(g.sessionTargetCG === undefined) g.sessionTargetCG = g.target;
    document.getElementById('inp-cg-target').value = g.sessionTargetCG;
    document.getElementById('rng-cg-target').value = g.sessionTargetCG;
    document.getElementById('rng-cg-target').min = g.target - 5;
    document.getElementById('rng-cg-target').max = g.target + 5;
    document.getElementById('cg-target-hint').innerText = "Base: " + g.target + "mm";
    
    if(g.sessionTargetCG < g.target) {
        document.getElementById('cond-turb').checked = true;
    } else if (g.sessionTargetCG > g.target) {
        document.getElementById('cond-lam').checked = true;
    } else {
        document.getElementById('cond-norm').checked = true;
    }

    if(!g.loadout) g.loadout = Array.from({length: g.chambers.length}, () => ({b:0, l:0, t:0}));

    if(!document.getElementById('vis-css')) {
        const style = document.createElement('style');
        style.id = 'vis-css';
        style.innerHTML = `
            .vis-container { margin: 5px 0 10px 0; padding: 10px 5px; background: rgba(0,0,0,0.02); border-radius: 8px; border: 1px solid var(--border); box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); width: 100%; box-sizing: border-box;}
            [data-theme="cyber"] .vis-container { background: rgba(255,255,255,0.02); }
            .vis-fuselage { display:flex; flex-direction:column; align-items:center; position:relative; width: 100%; }
            .vis-nose { width: 24px; height: 24px; background: var(--border); border-radius: 12px 12px 3px 3px; display:flex; align-items:center; justify-content:center; font-size:0.55rem; font-weight:bold; color:var(--bg-body); margin-bottom:5px; transition:all 0.3s;}
            .vis-nose:empty { display: none !important; }
            .vis-chamber-row { display:flex; align-items:center; justify-content:center; gap: 4px; margin-bottom: 4px; width:100%; }
            .vis-wing { display:flex; gap:1px; background: var(--bg-body); padding:2px; border-radius:3px; border: 1px solid var(--border); flex:1; justify-content:flex-end; min-width: 0;}
            .vis-wing.right { justify-content:flex-start; }
            .vis-slot { flex: 1; max-width: 22px; height: 14px; border-radius: 1px; background: rgba(128,128,128,0.1); border: 1px solid rgba(128,128,128,0.3); transition:all 0.2s;}
            .vis-slot.b { background: #d97706; border-color: #b45309; } 
            .vis-slot.l { background: #64748b; border-color: #334155; } 
           .vis-slot.t { background: repeating-linear-gradient(45deg, #475569, #475569 3px, #94a3b8 3px, #94a3b8 6px); border-color: #334155; }
            .vis-fuse-center { width:14px; height:18px; background: var(--border); border-radius:2px; flex-shrink: 0;}
            .vis-title { text-align:center; font-family:var(--font-head); font-size:0.7rem; color:var(--text-muted); margin-bottom:6px; text-transform:uppercase; letter-spacing:1px;}
        `;
        document.head.appendChild(style);
    }

    let visWrapper = document.getElementById('visual-glider-wrapper');
    if(!visWrapper) {
        visWrapper = document.createElement('div');
        visWrapper.id = 'visual-glider-wrapper';
        const noseUI = document.getElementById('nose-ballast-container');
        noseUI.parentNode.insertBefore(visWrapper, noseUI);
    }

    let visHTML = `<div class="vis-container"><div class="vis-title">🔍 DIAGRAMME DE CHARGEMENT</div><div class="vis-fuselage">`;
    let noseColor = g.noseMass > 0 ? (g.noseColor||'var(--primary)') : 'var(--border)';
    let noseText = g.noseMass > 0 ? `${g.noseMass}g` : '';
    visHTML += `<div class="vis-nose" style="background:${noseColor}">${noseText}</div>`;

    let isLeftTurn = true; 
    g.chambers.forEach((c, i) => {
        const L = g.loadout[i];
        let items = [];
        for(let k=0; k<L.t; k++) items.push('t');
        for(let k=0; k<L.l; k++) items.push('l');
        for(let k=0; k<L.b; k++) items.push('b');
        
        let leftSlots = Math.ceil(c.max / 2);
        let rightSlots = Math.floor(c.max / 2);
        let leftFilled = [];
        let rightFilled = [];
        
        items.forEach((item) => {
            if (isLeftTurn) {
                if (leftFilled.length < leftSlots) {
                    leftFilled.push(item);
                    isLeftTurn = false; 
                } else if (rightFilled.length < rightSlots) {
                    rightFilled.push(item); 
                }
            } else {
                if (rightFilled.length < rightSlots) {
                    rightFilled.push(item);
                    isLeftTurn = true; 
                } else if (leftFilled.length < leftSlots) {
                    leftFilled.push(item); 
                }
            }
        });

        let leftItems = [];
        let emptyLeft = leftSlots - leftFilled.length;
        for(let k=0; k<emptyLeft; k++) leftItems.push('');
        leftItems.push(...leftFilled.reverse());

        let rightItems = [...rightFilled];
        let emptyRight = rightSlots - rightFilled.length;
        for(let k=0; k<emptyRight; k++) rightItems.push('');

        let lHTML = leftItems.map(item => `<div class="vis-slot ${item}"></div>`).join('');
        let rHTML = rightItems.map(item => `<div class="vis-slot ${item}"></div>`).join('');
        let baseColor = c.color || '#888888';

        visHTML += `
            <div style="width:100%; display:flex; flex-direction:column; align-items:center; margin-bottom:5px;">
                <span style="font-size:0.6rem; color:${baseColor}; font-weight:bold;">${c.name}</span>
                <div class="vis-chamber-row">
                    <div class="vis-wing left" style="border-color:${baseColor}">${lHTML}</div>
                    <div class="vis-fuse-center" style="background:${baseColor}40"></div>
                    <div class="vis-wing right" style="border-color:${baseColor}">${rHTML}</div>
                </div>
            </div>
        `;
    });
    visHTML += `</div></div>`;
    visWrapper.innerHTML = visHTML;

    const noseContainer = document.getElementById('nose-ballast-container');
    const existingNose = document.getElementById('nose-ballast-ui');
    const isNoseCollapsed = existingNose ? existingNose.classList.contains('collapsed') : (g.noseMass <= 0);

    noseContainer.innerHTML = `
        <div class="ballast-line ${isNoseCollapsed ? 'collapsed' : ''} nose-card" id="nose-ballast-ui" onclick="if(event.target.tagName!=='BUTTON' && event.target.tagName!=='INPUT') this.classList.toggle('collapsed')">
            <div class="ballast-title-row">
                <div style="display:flex; align-items:center;"><span style="font-weight:bold; font-family:var(--font-head); color:${g.noseColor || '#d63384'};">${t('nose_title')}</span></div>
                <div style="display:flex; align-items:center;"><span style="font-family:var(--font-num); font-size:0.9rem;">${g.noseMass || 0}g</span><span class="toggle-icon">▶</span></div>
            </div>
            <div class="mix-controls" style="border-top:none;">
                <div class="mix-col nose" style="width:100%">
                    <div class="mix-info"><span class="mix-label" style="color:${g.noseColor || '#d63384'}">${t('mass_g')}</span></div>
                    <div class="ctrl-row">
                        <button class="mix-btn" onclick="window.updNose(event, -5)">-</button>
                        <input type="number" class="nose-val mix-val" value="${g.noseMass || 0}" onchange="window.updNose(event, 0, this.value)" style="border:none; background:transparent; color:${g.noseColor || '#d63384'}">
                        <button class="mix-btn" onclick="window.updNose(event, 5)">+</button>
                    </div>
                </div>
            </div>
        </div>`;
    const noseEl = document.getElementById('nose-ballast-ui');
    noseEl.style.borderColor = g.noseColor || '#d63384'; noseEl.style.background = hexToRgba(g.noseColor || '#d63384', 0.1);

    const l = document.getElementById('calc-list'); l.innerHTML = '';
    
    g.chambers.forEach((c,i) => {
        const L = g.loadout[i];
        const d = document.createElement('div');
        let mB = c.mass_brass || 0, mL = c.mass_lead || 0, mT = c.mass_tungsten || 0;
        let currentChamberMass = (L.b * mB) + (L.l * mL) + (L.t * mT);
        let totalCount = L.b + L.l + L.t;
        
        const effB = getEffectiveStock(g, i, 'brass');
        const effL = getEffectiveStock(g, i, 'lead');
        const effT = getEffectiveStock(g, i, 'tungsten');
        const showB = (effB.val > 0 || L.b > 0) && mB > 0;
        const showL = (effL.val > 0 || L.l > 0) && mL > 0;
        const showT = (effT.val > 0 || L.t > 0) && mT > 0;
        
        const existingChamber = document.getElementById('chamber-ui-' + i);
        const isChamberCollapsed = existingChamber ? existingChamber.classList.contains('collapsed') : (currentChamberMass <= 0);

        d.id = 'chamber-ui-' + i;
        d.className = `ballast-line ${isChamberCollapsed ? 'collapsed' : ''}`;
        d.onclick = (e) => { if(e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return; d.classList.toggle('collapsed'); };
        
        const txtStkB = effB.isGroup ? `Link` : (effB.val - L.b);
        const txtStkL = effL.isGroup ? `Link` : (effL.val - L.l);
        const txtStkT = effT.isGroup ? `Link` : (effT.val - L.t);
        
        let groupIndicator = (c.group && c.group > 0) ? `<span style="font-size:0.6rem; background:var(--primary); color:white; padding:2px 5px; border-radius:4px; margin-left:5px;">ID ${c.group}</span>` : "";
        const baseColor = c.color || '#888888';
        d.style.borderColor = baseColor; d.style.background = hexToRgba(baseColor, 0.1); 

        d.innerHTML = `
            <div class="ballast-title-row">
                <div style="display:flex; align-items:center;"><span style="font-weight:bold; font-family:var(--font-head); color:${baseColor};">${c.name}</span>${groupIndicator}</div>
                <div style="display:flex; align-items:center;"><span style="font-family:var(--font-num); font-size:0.9rem;">${currentChamberMass}g <span style="font-size:0.7rem; color:var(--text-muted);">(${totalCount}/${c.max})</span></span><span class="toggle-icon">▶</span></div>
            </div>
            <div class="mix-controls">
                <div class="mix-col brass" style="${showB?'':'display:none'}"><div class="mix-info"><span class="mix-label" style="color:var(--c-brass)">${t('mat_brass')}</span><span class="stock-tag">${txtStkB}</span></div><div class="ctrl-row"><button class="mix-btn" onclick="window.updMix(event, ${i},'b',-1)">-</button><span class="mix-val" style="color:var(--c-brass)">${L.b}</span><button class="mix-btn" onclick="window.updMix(event, ${i},'b',1)">+</button></div></div>
                <div class="mix-col lead" style="${showL?'':'display:none'}"><div class="mix-info"><span class="mix-label" style="color:var(--c-lead)">${t('mat_lead')}</span><span class="stock-tag">${txtStkL}</span></div><div class="ctrl-row"><button class="mix-btn" onclick="window.updMix(event, ${i},'l',-1)">-</button><span class="mix-val" style="color:var(--c-lead)">${L.l}</span><button class="mix-btn" onclick="window.updMix(event, ${i},'l',1)">+</button></div></div>
                <div class="mix-col tung" style="${showT?'':'display:none'}"><div class="mix-info"><span class="mix-label" style="color:var(--c-tung)">${t('mat_tung')}</span><span class="stock-tag">${txtStkT}</span></div><div class="ctrl-row"><button class="mix-btn" onclick="window.updMix(event, ${i},'t',-1)">-</button><span class="mix-val" style="color:var(--c-tung)">${L.t}</span><button class="mix-btn" onclick="window.updMix(event, ${i},'t',1)">+</button></div></div>
            </div>`;
        l.appendChild(d);
    });
    recalc(g);
}

window.updMix = function(e, idx, type, delta) {
    if(e) e.stopPropagation(); 
    const g = gliders.find(x=>x.id==currentGliderId); 
    const L = g.loadout[idx]; 
    const c = g.chambers[idx];
    
    let newVal = L[type] + delta;
    if(newVal < 0) return; 
    
    if (delta > 0) {
        const currentTotal = L.b + L.l + L.t;
        if (currentTotal + delta > c.max) {
            window.customAlert("Soute pleine ! Capacité max (" + c.max + ") atteinte.");
            return;
        }
        
        const matMap = { 'b': 'brass', 'l': 'lead', 't': 'tungsten' };
        const eff = getEffectiveStock(g, idx, matMap[type]);
        
        if (eff.val > 0) {
            let currentUsage = 0;
            if (eff.isGroup) {
                g.chambers.forEach((ch, i) => { if(ch.group == c.group) currentUsage += g.loadout[i][type]; });
            } else {
                currentUsage = L[type];
            }
            if (currentUsage + delta > eff.val) {
                window.customAlert("Stock épuisé pour ce matériau !");
                return;
            }
        }
    }
    L[type] = newVal; 
    save(); 
    renderCalc();
};

window.updNose = function(e, delta, specificVal=null) {
    if(e) e.stopPropagation();
    const g = gliders.find(x=>x.id==currentGliderId);
    if(!g) return;
    if(specificVal !== null) { g.noseMass = parseFloat(specificVal); } else { g.noseMass = (g.noseMass || 0) + delta; }
    if(isNaN(g.noseMass)) g.noseMass = 0;
    save(); renderCalc();
};

function recalc(g) {
    if(!g) return;
    const activeOpts = getActiveOpts(g);

    let nMass = g.noseMass || 0;
    let nDist = g.noseDist || 0;
    let m = g.emptyW + nMass;
    let mom = (g.emptyW * g.emptyCG) + (nMass * (-nDist));
    let addedMass = nMass; 
    
    g.chambers.forEach((c,i) => {
        const L = g.loadout[i];
        let mass = L.b*(c.mass_brass||0) + L.l*(c.mass_lead||0) + L.t*(c.mass_tungsten||0);
        m += mass; mom += mass * c.dist;
        addedMass += mass;
    });
    let cg = mom/m;
    
    const wEl = document.getElementById('res-weight');
    wEl.innerText = (m/1000).toFixed(3);
    
    const wVal = parseFloat(document.getElementById('inp-wind').value) || 0;
    const fVal = parseFloat(document.getElementById('inp-factor').value) || 100;
    let target = getCalculatedTargetWeight(wVal, fVal, g); 
    let weightDiff = m - target;
    wEl.style.color = (weightDiff >= -activeOpts.wMin && weightDiff <= activeOpts.wMax) ? 'var(--success)' : 'var(--warning)';

    document.getElementById('res-cg').innerText = cg.toFixed(1);
    
    const diff = cg - g.sessionTargetCG;
    const dEl = document.getElementById('cg-diff-display'); 
    dEl.innerText = (diff*-1 > 0 ? '+' : '') + (diff*-1).toFixed(1) + 'mm';
    let isCgGood = (diff >= 0) ? (diff <= activeOpts.cgTolPlus) : (Math.abs(diff) <= activeOpts.cgTolMinus);
    dEl.style.color = isCgGood ? 'var(--success)' : 'var(--danger)';
    document.getElementById('res-cg').style.color = isCgGood ? 'var(--success)' : 'var(--danger)';
    
    const barEl = document.getElementById('bar-weight');
    if (barEl && barEl.parentNode) { barEl.parentNode.style.display = 'none'; }
    const loadEl = document.getElementById('res-loading');
    if(g.area > 0) {
        let load = m/g.area;
        loadEl.innerText = `${load.toFixed(1)} g/dm² (+${addedMass}g)`;
        if(load > 75) { loadEl.style.color = 'var(--danger)'; loadEl.style.fontWeight = '900'; loadEl.style.fontSize = '0.9rem'; } else { loadEl.style.color = 'var(--text-muted)'; loadEl.style.fontWeight = 'normal'; loadEl.style.fontSize = '0.75rem'; }
    }
    
    document.getElementById('res-target-cg-disp').innerText = t('cible_short') + " " + g.sessionTargetCG + "mm";
    if (document.getElementById('card-target-cg-disp')) document.getElementById('card-target-cg-disp').innerText = g.sessionTargetCG + "mm";
    document.getElementById('res-sim-target').innerText = (target/1000).toFixed(3);
}

window.syncInputs = function(type, val) {
    document.getElementById('inp-'+type).value = val;
    document.getElementById('rng-'+type).value = val;
    const g=gliders.find(x=>x.id==currentGliderId); if(!g) return;
    if(type==='wind') g.lastWind=parseFloat(val);
    if(type==='factor') g.lastFactor=parseFloat(val);
    if(type==='cg-target') {
        g.sessionTargetCG = parseFloat(val);
        document.getElementById('res-target-cg-disp').innerText = t('cible_short') + " " + g.sessionTargetCG + "mm";
        if (document.getElementById('card-target-cg-disp')) document.getElementById('card-target-cg-disp').innerText = g.sessionTargetCG + "mm";
        
        if(g.sessionTargetCG < g.target) {
            document.getElementById('cond-turb').checked = true;
        } else if (g.sessionTargetCG > g.target) {
            document.getElementById('cond-lam').checked = true;
        } else {
            document.getElementById('cond-norm').checked = true;
        }
    }
    save(); recalc(g);
};

window.setAerology = function(val) {
    const g = gliders.find(x => x.id == currentGliderId);
    if (!g) return;

    if (val === 'TURBULENT') { g.sessionTargetCG = g.target + (optParams.cgOffsetTurb || -1.0); } 
    else if (val === 'LAMINAIRE') { g.sessionTargetCG = g.target + (optParams.cgOffsetLam || 0.5); } 
    else { g.sessionTargetCG = g.target; }

    document.getElementById('inp-cg-target').value = g.sessionTargetCG.toFixed(1);
    document.getElementById('rng-cg-target').value = g.sessionTargetCG.toFixed(1);
    document.getElementById('res-target-cg-disp').innerText = t('cible_short') + " " + g.sessionTargetCG.toFixed(1) + "mm";
    if (document.getElementById('card-target-cg-disp')) document.getElementById('card-target-cg-disp').innerText = g.sessionTargetCG.toFixed(1) + "mm";

    save(); recalc(g);
};

window.suggestFromHistory = function() {
    const g = gliders.find(x => x.id == currentGliderId);
    if (!g || flightLogs.length === 0) return;
    const currentWind = parseFloat(document.getElementById('inp-wind').value) || 0;
    const currentSlope = document.getElementById('inp-slope').value.toUpperCase().trim();

    let similarLogs = flightLogs.filter(l => l.m === g.name && l.t);
    if (currentSlope) {
        const slopeLogs = similarLogs.filter(l => l.s === currentSlope);
        if(slopeLogs.length > 0) similarLogs = slopeLogs;
    }

    similarLogs = similarLogs.filter(l => Math.abs(parseFloat(l.wind || 0) - currentWind) <= 2);
    
    if (similarLogs.length === 0) { window.customAlert("Pas de chronos dans le journal pour ces conditions."); return; }
    
    const best = similarLogs.sort((a, b) => parseFloat(a.t) - parseFloat(b.t))[0];
    
    const box = document.getElementById('ai-suggestion-box');
    box.classList.remove('hidden');
    document.getElementById('ai-suggestion-text').innerHTML = `
        <strong>💡 Meilleur chrono : ${best.t}s</strong> ${currentSlope ? `à ${currentSlope}` : ''}<br>
        Par ${best.wind}m/s, tu avais un CG réglé à <b style="color:var(--primary); cursor:pointer; font-size:1.1rem; text-decoration:underline;" onclick="window.syncInputs('cg-target', ${best.cg})">${best.cg}mm</b> (Poids: ${best.w}).<br>
        <span style="font-size:0.75rem; color:var(--text-muted);">(Clique sur le chiffre du CG pour l'appliquer au curseur)</span>
    `;
};

/* --- LOGS --- */
function updateLogFilters() {
    const mSel = document.getElementById('filter-model'), sSel = document.getElementById('filter-slope');
    const currM = mSel.value; const currS = sSel.value;
    const models = [...new Set(flightLogs.map(l => l.m))].sort(); const slopes = [...new Set(flightLogs.map(l => l.s))].sort();
    mSel.innerHTML = `<option value="">${t('all_models')}</option>` + models.map(m => `<option value="${m}">${m}</option>`).join('');
    sSel.innerHTML = `<option value="">${t('all_slopes')}</option>` + slopes.map(s => `<option value="${s}">${s}</option>`).join('');
    if(models.includes(currM)) mSel.value = currM; if(slopes.includes(currS)) sSel.value = currS;
}

window.renderLogs = function() {
    const c = document.getElementById('logs-container'), fM = document.getElementById('filter-model').value, fS = document.getElementById('filter-slope').value;
    c.innerHTML = '';
    const chkAll = document.getElementById('chk-all-logs');
    const isCheckedDefault = chkAll ? chkAll.checked : true;

    flightLogs.filter(l => (!fM || l.m===fM) && (!fS || l.s===fS)).forEach(l => {
        const d = document.createElement('div'); d.className = 'log-card'; const dt = new Date(l.d);
        d.innerHTML = `
            <button class="log-del" onclick="window.confirmDeleteLog(${l.id})">×</button>
            <div class="log-header" style="padding-right: 35px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="checkbox" class="log-chk" value="${l.id}" ${isCheckedDefault ? 'checked' : ''} style="width:20px; height:20px; margin:0;">
                    <div class="log-date-slope">${dt.toLocaleDateString()} | ${l.s || 'PENTE'}</div>
                </div>
                <div style="font-size:0.6rem; background:var(--primary); color:#ffffff; padding:2px 6px; border-radius:4px; font-weight:bold; text-shadow:0 1px 2px rgba(0,0,0,0.5);">${l.cond || 'NORMAL'}</div>
            </div>
            <div class="log-model">${l.m} <span style="font-size:0.7rem; color:var(--text-muted);"> (F:${l.f || 100}%)</span></div>
            <div class="log-stats"><span class="log-stat-item">⚖️ ${l.w}</span><span class="log-stat-item">🎯 ${l.cg}</span>${l.t ? `<span class="log-stat-item">⏱️ ${l.t}s</span>` : ''}</div>${l.n ? `<div class="log-note">${l.n}</div>` : ''}
        `;
        c.appendChild(d);
    });
};

window.toggleAllLogs = function(isChecked) {
    document.querySelectorAll('.log-chk').forEach(chk => chk.checked = isChecked);
};

window.showLogbook = function() { updateLogFilters(); window.renderLogs(); };

window.openSaveLogModal = function() { 
    const finalTime = document.getElementById('log-time').value;
    const airCondObj = document.querySelector('input[name="air-cond"]:checked');
    const airCond = airCondObj ? airCondObj.value : 'NORMAL';
    const factorVal = document.getElementById('inp-factor').value;

    window.showModal(t('msg_note'), true, [{tx:t('cancel'), cl:"btn-outline", val:null}, {tx:t('save_flight'), cl:"btn-primary", val:"inp"}], (n) => { 
        if(n!==null) { 
            const g=gliders.find(x=>x.id==currentGliderId); 
            flightLogs.unshift({
                id:Date.now(), d:new Date().toISOString(), m:g.name, w:document.getElementById('res-weight').innerText, 
                cg:document.getElementById('res-cg').innerText, s:document.getElementById('inp-slope').value.toUpperCase(), 
                t:finalTime || null, f:factorVal, cond:airCond, n:n, wind:document.getElementById('inp-wind').value
            }); 
            save(); window.customAlert(t('alert_saved')); 
        } 
    }); 
};

window.confirmDeleteLog = function(id) { window.showModal(t('msg_del_log'), false, [{tx:t('no'), cl:"btn-outline", val:0}, {tx:t('yes'), cl:"btn-danger", val:1}], (r) => { if(r) { flightLogs = flightLogs.filter(x=>x.id!==id); save(); window.renderLogs(); updateLogFilters(); } }); };

window.exportLogsCSV = async function() { 
    if(flightLogs.length === 0) return; 
    let csv = "Date,Heure,Modele,Poids,CG,Vent,Facteur,Aérologie,Pente,Chrono,Note\n"; 
    flightLogs.forEach(l => { 
        const dt = new Date(l.d); 
        csv += `${dt.toLocaleDateString()},${dt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})},${l.m},${l.w},${l.cg},${l.wind},${l.f||100},${l.cond||'NORMAL'},${l.s},${l.t||''},"${l.n}"\n`; 
    }); 
    try { await navigator.clipboard.writeText(csv); window.customAlert(t('alert_copied')); } catch (e) { const b = new Blob([csv], {type:'text/csv'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href=u; a.download='logs_F3F.csv'; a.click(); } 
};

/* --- V6.0 GEMINI API LOGBOOK --- */
window.saveApiKey = function() { geminiApiKey = document.getElementById('cfg-api-key').value.trim(); localStorage.setItem('f3f_gemini_key', geminiApiKey); window.customAlert("Clé API enregistrée !"); };

window.generateAiReport = async function() {
    if (!geminiApiKey) { window.customAlert("Veuillez d'abord configurer votre clé API dans les Paramètres (⚙️)."); return; }
    
    const checkedBoxes = Array.from(document.querySelectorAll('.log-chk:checked'));
    if (checkedBoxes.length === 0) { window.customAlert("Veuillez cocher au moins un vol à analyser."); return; }
    
    const selectedIds = checkedBoxes.map(cb => parseInt(cb.value));
    const selectedLogs = flightLogs.filter(l => selectedIds.includes(l.id));

    const box = document.getElementById('ai-report-box'); const loading = document.getElementById('ai-loading'); const content = document.getElementById('ai-report-content');
    box.classList.remove('hidden'); loading.classList.remove('hidden'); content.innerHTML = '';

    const recentLogs = selectedLogs.map(l => `Modèle:${l.m}, Pente:${l.s}, Vent:${l.wind}m/s, Facteur:${l.f||100}%, Air:${l.cond||'NORMAL'}, Poids:${l.w}, CG:${l.cg}, Chrono:${l.t || 'N/A'}s, Note:${l.n || '-'}`).join('\n');

    const prompt = `Tu es un ingénieur de piste expert en compétition de planeur RC F3F. Analyse la sélection de vols : \n${recentLogs}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (!response.ok) { const errData = await response.json(); throw new Error(`Code ${response.status} : ${errData.error?.message || "Accès refusé par Google"}`); }
        
        const data = await response.json();
        loading.classList.add('hidden');
        let responseText = data.candidates[0].content.parts[0].text;
        responseText = responseText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); 
        content.innerHTML = responseText;
    } catch (e) {
        loading.classList.add('hidden'); 
        content.innerHTML = `<span style="color:var(--danger); font-weight:bold;">Erreur de connexion à l'IA</span><br><span style="font-size:0.8rem; color:var(--text-muted);">${e.message}</span>`;
    }
};

/* --- CRUD MODEL --- */
window.toggleLocalSettings = function() { const isCustom = document.getElementById('edit-use-custom').checked; document.getElementById('local-settings-panel').classList.toggle('hidden', !isCustom); };
window.toggleEditBilinear = function() { const isDouble = document.getElementById('edit-check-bilinear').checked; document.getElementById('edit-block-pivot').classList.toggle('hidden', !isDouble); };

window.createNewGlider = function() { 
    tempGlider = { 
        id: Date.now(), 
        name: "MODÈLE", 
        emptyW: 2200, 
        emptyCG: 100, 
        area: 58, 
        target: 102, 
        chambers: [{ name: "AILES", dist: 100, mass_brass: 150, mass_lead: 200, mass_tungsten: 300, max: 10, color: "#888888" }], 
        loadout: [{b:0,l:0,t:0}], 
        noseDist: 0, 
        noseMass: 0, 
        noseColor: "#d63384", 
        useCustomSettings: false 
    }; 
    renderEdit(); 
    window.navigateTo('edit'); 
};
window.editCurrentGlider = function() { const g = gliders.find(x => x.id == currentGliderId); if(!g) return; tempGlider = JSON.parse(JSON.stringify(g)); renderEdit(); window.navigateTo('edit'); };

function renderEdit() { 
    document.getElementById('edit-name').value = tempGlider.name; 
    document.getElementById('edit-empty-w').value = tempGlider.emptyW; 
    document.getElementById('edit-empty-cg').value = tempGlider.emptyCG; 
    document.getElementById('edit-area').value = tempGlider.area; 
    document.getElementById('edit-target').value = tempGlider.target; 
    document.getElementById('edit-nose-dist').value = tempGlider.noseDist || 0; 
    document.getElementById('edit-nose-color').value = tempGlider.noseColor || "#d63384";

    document.getElementById('edit-use-custom').checked = tempGlider.useCustomSettings || false;
    document.getElementById('edit-check-bilinear').checked = tempGlider.cIsDouble || false;
    document.getElementById('edit-v1').value = tempGlider.cV1 !== undefined ? tempGlider.cV1 : getNum(globalCoefs.v1, 3);
    document.getElementById('edit-m1').value = tempGlider.cM1 !== undefined ? tempGlider.cM1 : getNum(globalCoefs.m1, 2.3);
    document.getElementById('edit-vp').value = tempGlider.cVp !== undefined ? tempGlider.cVp : getNum(globalCoefs.vp, 10);
    document.getElementById('edit-mp').value = tempGlider.cMp !== undefined ? tempGlider.cMp : getNum(globalCoefs.mp, 3.5);
    document.getElementById('edit-v2').value = tempGlider.cV2 !== undefined ? tempGlider.cV2 : getNum(globalCoefs.v2, 20);
    document.getElementById('edit-m2').value = tempGlider.cM2 !== undefined ? tempGlider.cM2 : getNum(globalCoefs.m2, 5.0);

    document.getElementById('edit-tol-w-min').value = tempGlider.customTolWMin !== undefined ? tempGlider.customTolWMin : getNum(optParams.wMin, 75);
    document.getElementById('edit-tol-w-max').value = tempGlider.customTolWMax !== undefined ? tempGlider.customTolWMax : getNum(optParams.wMax, 20);
    document.getElementById('edit-tol-cg-minus').value = tempGlider.customTolCgMinus !== undefined ? tempGlider.customTolCgMinus : getNum(optParams.cgTolMinus, 0.5);
    document.getElementById('edit-tol-cg-plus').value = tempGlider.customTolCgPlus !== undefined ? tempGlider.customTolCgPlus : getNum(optParams.cgTolPlus, 0.5);
    
    window.toggleEditBilinear();
    window.toggleLocalSettings();
    
    const l = document.getElementById('edit-chambers-list'); 
    l.innerHTML = ''; 
    
    tempGlider.chambers.forEach((c,i) => { 
        const d = document.createElement('div'); d.className = 'card'; d.style.position = 'relative'; 
        const mb = c.mass_brass || '', ml = c.mass_lead || '', mt = c.mass_tungsten || '';
        const sb = c.stock_brass || '', sl = c.stock_lead || '', st = c.stock_tungsten || '';
        const gr = c.group || ''; const clr = c.color || '#888888'; 

        d.innerHTML = `
        <button style="position:absolute; top:10px; right:10px; color:var(--danger); border:none; background:none; font-size:1.5rem;" onclick="window.rmCh(${i})">×</button>
        <div class="row">
            <div style="flex:0 0 50px; display:flex; flex-direction:column; align-items:center;">
                <label class="lbl-small">${t('lbl_color')}</label>
                <input type="color" value="${clr}" onchange="window.upc(${i},'color',this.value)" style="width:100%; height:35px; border:none; padding:0; background:none; cursor:pointer; margin-top:2px;">
                <div onclick="window.resetColor(${i})" style="font-size:0.8rem; cursor:pointer; color:var(--text-muted); margin-top:4px;">↺</div>
            </div>
            <div style="flex:3"><label class="lbl-small">${t('lbl_ch_name')}</label><input value="${c.name}" onchange="window.upc(${i},'name',this.value)"></div>
            <div style="flex:1"><label class="lbl-small">${t('lbl_grp')}</label><input type="number" placeholder="ID" value="${gr}" onchange="window.upc(${i},'group',this.value)" style="border-color:var(--primary)"></div>
        </div>
        <div class="row" style="margin-top:10px;">
            <div style="flex:1"><label class="lbl-small">${t('lbl_dist')}</label><input type="number" value="${c.dist}" onchange="window.upc(${i},'dist',this.value)"></div>
            <div style="flex:1"><label class="lbl-small">${t('lbl_max')}</label><input type="number" value="${c.max}" onchange="window.upc(${i},'max',this.value)"></div>
        </div>
        <div style="margin-top:10px;">
            <label class="lbl-small">${t('lbl_unit_mass')}</label>
            <div class="row">
                <input type="number" placeholder="${t('mat_brass')}" value="${mb}" onchange="window.upc(${i},'mass_brass',this.value)" style="border-bottom:2px solid var(--c-brass)">
                <input type="number" placeholder="${t('mat_lead')}" value="${ml}" onchange="window.upc(${i},'mass_lead',this.value)" style="border-bottom:2px solid var(--c-lead)">
                <input type="number" placeholder="${t('mat_tung')}" value="${mt}" onchange="window.upc(${i},'mass_tungsten',this.value)" style="border-bottom:2px solid var(--c-tung)">
            </div>
        </div>
        <div style="margin-top:5px;">
            <label class="lbl-small">${t('lbl_stock')}</label>
            <div class="row">
                <input type="number" placeholder="${t('ph_stock')}" value="${sb}" onchange="window.upc(${i},'stock_brass',this.value)">
                <input type="number" placeholder="${t('ph_stock')}" value="${sl}" onchange="window.upc(${i},'stock_lead',this.value)">
                <input type="number" placeholder="${t('ph_stock')}" value="${st}" onchange="window.upc(${i},'stock_tungsten',this.value)">
            </div>
        </div>`; 
        l.appendChild(d); 
    }); 
    updateUITexts(); 
}

window.upc = function(i, k, v) { 
    if (k === 'name' || k === 'color') { tempGlider.chambers[i][k] = v; } 
    else { let parsed = parseFloat(v); tempGlider.chambers[i][k] = isNaN(parsed) ? 0 : parsed; }
};

window.rmCh = function(i) { tempGlider.chambers.splice(i,1); renderEdit(); };
window.resetColor = function(t) { if(t==='nose') { document.getElementById('edit-nose-color').value = '#d63384'; tempGlider.noseColor = '#d63384'; } else { tempGlider.chambers[t].color = '#888888'; renderEdit(); } };
window.addChamberLine = function() { tempGlider.chambers.push({name:"BALLAST", dist:0, max:5, mass_brass:0, mass_lead:0, mass_tungsten:0, color:"#888888"}); renderEdit(); };

window.duplicateGlider = function() { 
    prepTempGlider();
    let newG = JSON.parse(JSON.stringify(tempGlider)); 
    newG.id = Date.now(); newG.name += t('copy_suffix'); 
    newG.loadout = Array.from({length: newG.chambers.length}, () => ({b:0,l:0,t:0})); 
    newG.noseMass = 0; gliders.push(newG); save(); window.navigateTo('home'); window.customAlert(t('alert_copied')); 
};

function prepTempGlider() {
    tempGlider.name = document.getElementById('edit-name').value; 
    tempGlider.emptyW = getNum(document.getElementById('edit-empty-w').value, 2000); 
    tempGlider.emptyCG = getNum(document.getElementById('edit-empty-cg').value, 100); 
    tempGlider.area = getNum(document.getElementById('edit-area').value, 60); 
    tempGlider.target = getNum(document.getElementById('edit-target').value, 100); 
    tempGlider.noseDist = getNum(document.getElementById('edit-nose-dist').value, 0); 
    tempGlider.noseColor = document.getElementById('edit-nose-color').value;
    
    tempGlider.useCustomSettings = document.getElementById('edit-use-custom').checked;
    if(tempGlider.useCustomSettings) {
        tempGlider.cIsDouble = document.getElementById('edit-check-bilinear').checked;
        tempGlider.cV1 = getNum(document.getElementById('edit-v1').value, 3);
        tempGlider.cM1 = getNum(document.getElementById('edit-m1').value, 2.3);
        tempGlider.cVp = getNum(document.getElementById('edit-vp').value, 10);
        tempGlider.cMp = getNum(document.getElementById('edit-mp').value, 3.5);
        tempGlider.cV2 = getNum(document.getElementById('edit-v2').value, 20);
        tempGlider.cM2 = getNum(document.getElementById('edit-m2').value, 5.0);

        let x1 = tempGlider.cV1, y1 = tempGlider.cM1;
        let x2 = tempGlider.cV2, y2 = tempGlider.cM2;
        let xp = tempGlider.cVp, yp = tempGlider.cMp;
        
        if (x2 === x1) x2 += 0.1;
        if (tempGlider.cIsDouble) {
            if (xp === x1) xp += 0.1;
            if (x2 === xp) x2 += 0.1;
            tempGlider.cA = (yp - y1) / (xp - x1);
            tempGlider.cB = y1 - (tempGlider.cA * x1);
            tempGlider.cA2 = (y2 - yp) / (x2 - xp);
            tempGlider.cB2 = yp - (tempGlider.cA2 * xp);
        } else {
            tempGlider.cA = (y2 - y1) / (x2 - x1);
            tempGlider.cB = y1 - (tempGlider.cA * x1);
        }

        tempGlider.customTolWMin = getNum(document.getElementById('edit-tol-w-min').value, 75);
        tempGlider.customTolWMax = getNum(document.getElementById('edit-tol-w-max').value, 20);
        tempGlider.customTolCgMinus = getNum(document.getElementById('edit-tol-cg-minus').value, 0.5);
        tempGlider.customTolCgPlus = getNum(document.getElementById('edit-tol-cg-plus').value, 0.5);
    }
}

window.saveGlider = function() { 
    prepTempGlider();
    const idx = gliders.findIndex(x=>x.id==tempGlider.id); 
    if(idx===-1) { 
        tempGlider.loadout = Array.from({length: tempGlider.chambers.length}, () => ({b:0,l:0,t:0})); 
        gliders.push(tempGlider); 
    } else { 
        if(gliders[idx].chambers.length !== tempGlider.chambers.length) { 
            tempGlider.loadout = Array.from({length: tempGlider.chambers.length}, () => ({b:0,l:0,t:0})); 
        } else { 
            tempGlider.loadout = gliders[idx].loadout; 
        } 
        gliders[idx]=tempGlider; 
    } 
    save(); window.navigateTo('home'); 
};

window.confirmDeleteGlider = function() { window.showModal(t('msg_del_mod'), false, [{tx:t('cancel'), cl:"btn-outline", val:0}, {tx:t('delete_model'), cl:"btn-danger", val:1}], (r) => { if(r) { gliders = gliders.filter(x=>x.id!==tempGlider.id); save(); window.navigateTo('home'); } }); };
window.confirmResetLoadout = function() { window.showModal(t('msg_reset'), false, [{tx:t('no'), cl:"btn-outline", val:0}, {tx:t('yes'), cl:"btn-danger", val:1}], (r) => { if(r) { const g = gliders.find(x=>x.id==currentGliderId); g.loadout = g.loadout.map(() => ({b:0, l:0, t:0})); g.noseMass = 0; save(); renderCalc(); } }); };

/* --- SAVE SETTINGS GLOBALS & INIT --- */
window.saveGlobalCoefs = function() { 
    globalCoefs.v1 = getNum(document.getElementById('set-v1').value, 3); 
    globalCoefs.m1 = getNum(document.getElementById('set-m1').value, 2.3); 
    globalCoefs.v2 = getNum(document.getElementById('set-v2').value, 20); 
    globalCoefs.m2 = getNum(document.getElementById('set-m2').value, 5.0); 
    globalCoefs.vp = getNum(document.getElementById('set-v-pivot').value, 10); 
    globalCoefs.mp = getNum(document.getElementById('set-m-pivot').value, 3.5); 
    globalCoefs.isDouble = document.getElementById('check-bilinear').checked;
    globalCoefs.refArea = getNum(document.getElementById('set-ref-area').value, 62); 
    calculateAB(); save(); 
};

window.saveOptParams = function() { 
    optParams.wMin = getNum(document.getElementById('set-tol-w-min').value, 75); 
    optParams.wMax = getNum(document.getElementById('set-tol-w-max').value, 20); 
    optParams.cgTolPlus = getNum(document.getElementById('set-tol-cg-plus').value, 0.5); 
    optParams.cgTolMinus = getNum(document.getElementById('set-tol-cg-minus').value, 0.5); 
    optParams.cgOffsetLam = getNum(document.getElementById('set-offset-lam').value, 0.5);
    optParams.cgOffsetTurb = getNum(document.getElementById('set-offset-turb').value, -1.0);
    save(); 
};

function initApp() {
    gliders = safeParse('f3f_gliders', []);
    if (gliders.length === 0) {
        gliders = [
            { id: 1, name: "FREESTYLER (Ancien)", emptyW: 2100, emptyCG: 100, area: 60, target: 100, noseDist: 250, noseMass: 0, noseColor: "#d63384", useCustomSettings: false, chambers: [ { name: "CLÉ", dist: 0, max: 4, mass_brass: 150, mass_lead: 200, mass_tungsten: 300, stock_brass: 0, stock_lead: 0, stock_tungsten: 4, color: "#888888" }, { name: "AILES", dist: 40, max: 6, mass_brass: 100, mass_lead: 150, mass_tungsten: 200, stock_brass: 0, stock_lead: 0, stock_tungsten: 6, color: "#0ea5e9" } ], loadout: [{b:0,l:0,t:0}, {b:0,l:0,t:0}] },
            { id: 2, name: "JAZZ", emptyW: 2350, emptyCG: 98, area: 58, target: 98, noseDist: 280, noseMass: 0, noseColor: "#d63384", useCustomSettings: false, chambers: [ { name: "MENUISERIE", dist: 10, max: 4, mass_brass: 120, mass_lead: 180, mass_tungsten: 250, stock_brass: 0, stock_lead: 0, stock_tungsten: 4, color: "#888888" }, { name: "SAUMONS", dist: 60, max: 4, mass_brass: 90, mass_lead: 140, mass_tungsten: 190, stock_brass: 0, stock_lead: 0, stock_tungsten: 4, color: "#f59e0b" } ], loadout: [{b:0,l:0,t:0}, {b:0,l:0,t:0}] },
            { id: 3, name: "PIKE", emptyW: 2280, emptyCG: 99, area: 61, target: 99, noseDist: 260, noseMass: 0, noseColor: "#d63384", useCustomSettings: false, chambers: [ { name: "BALLASTS", dist: 0, max: 8, mass_brass: 140, mass_lead: 210, mass_tungsten: 290, stock_brass: 0, stock_lead: 0, stock_tungsten: 8, color: "#888888" } ], loadout: [{b:0,l:0,t:0}] }
        ];
        localStorage.setItem('f3f_gliders', JSON.stringify(gliders));
    }
    
    flightLogs = safeParse('f3f_logs', []);
    
    let savedCoefs = safeParse('f3f_global_coefs', {});
    globalCoefs = {
        a: getNum(savedCoefs.a, 0.16), b: getNum(savedCoefs.b, 1.82), a2: getNum(savedCoefs.a2, 0), b2: getNum(savedCoefs.b2, 0),
        refArea: getNum(savedCoefs.refArea, 62),
        v1: getNum(savedCoefs.v1, 3), m1: getNum(savedCoefs.m1, 2.3),
        v2: getNum(savedCoefs.v2, 20), m2: getNum(savedCoefs.m2, 5.0),
        vp: getNum(savedCoefs.vp, 10), mp: getNum(savedCoefs.mp, 3.5),
        isDouble: savedCoefs.isDouble === true
    };
    
    let savedOpt = safeParse('f3f_opt_params', {});
    optParams = {
        wMin: getNum(savedOpt.wMin, 75), wMax: getNum(savedOpt.wMax, 20),
        cgTolPlus: getNum(savedOpt.cgTolPlus, 0.5), cgTolMinus: getNum(savedOpt.cgTolMinus, 0.5),
        cgOffsetLam: getNum(savedOpt.cgOffsetLam, 0.5), cgOffsetTurb: getNum(savedOpt.cgOffsetTurb, -1.0)
    };
    
    save(); 

    let setV1 = document.getElementById('set-v1');
    if (setV1) {
        document.getElementById('set-v1').value = globalCoefs.v1; document.getElementById('set-m1').value = globalCoefs.m1;
        document.getElementById('set-v2').value = globalCoefs.v2; document.getElementById('set-m2').value = globalCoefs.m2;
        document.getElementById('set-v-pivot').value = globalCoefs.vp; document.getElementById('set-m-pivot').value = globalCoefs.mp;
        document.getElementById('check-bilinear').checked = globalCoefs.isDouble;
        document.getElementById('block-pivot').classList.toggle('hidden', !globalCoefs.isDouble);

        calculateAB();
        document.getElementById('set-ref-area').value = globalCoefs.refArea;
        document.getElementById('set-tol-w-min').value = optParams.wMin; document.getElementById('set-tol-w-max').value = optParams.wMax;
        document.getElementById('set-tol-cg-plus').value = optParams.cgTolPlus; document.getElementById('set-tol-cg-minus').value = optParams.cgTolMinus;
        document.getElementById('set-offset-lam').value = optParams.cgOffsetLam; document.getElementById('set-offset-turb').value = optParams.cgOffsetTurb;
    }
    
    window.setTheme(currentTheme);
    gliders.forEach(g => { if(Array.isArray(g.loadout) && typeof g.loadout[0] === 'number') g.loadout = g.loadout.map(v => ({ b: v, l: 0, t: 0 })); });
    save();
    
    let lSel = document.getElementById('lang-select'); if(lSel) lSel.value = currentLang;
    let tSel = document.getElementById('theme-select'); if(tSel) tSel.value = currentTheme; 
    
    updateUITexts(); 
    showView('home');

    setTimeout(checkForUpdates, 1500);
}

window.addEventListener('load', initApp);
