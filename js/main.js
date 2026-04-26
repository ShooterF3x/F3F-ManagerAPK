// ==========================================
// MAIN.JS : INITIALISATION DE L'APPLICATION
// ==========================================

window.saveGlobalCoefs = function() { 
    globalCoefs.v1 = getNum(document.getElementById('set-v1').value, 3); 
    globalCoefs.m1 = getNum(document.getElementById('set-m1').value, 2.3); 
    globalCoefs.v2 = getNum(document.getElementById('set-v2').value, 20); 
    globalCoefs.m2 = getNum(document.getElementById('set-m2').value, 5.0); 
    globalCoefs.vp = getNum(document.getElementById('set-v-pivot').value, 10); 
    globalCoefs.mp = getNum(document.getElementById('set-m-pivot').value, 3.5); 
    globalCoefs.isDouble = document.getElementById('check-bilinear').checked;
    globalCoefs.refArea = getNum(document.getElementById('set-ref-area').value, 62); 
    if(window.calculateAB) calculateAB(); 
    save(); 
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
    // 1. Initialisation des modèles
    gliders = safeParse('f3f_gliders', []);
    if (gliders.length === 0) {
        gliders = [
            { id: 1, name: "FREESTYLER (Ancien)", emptyW: 2100, emptyCG: 100, area: 60, target: 100, noseDist: 250, noseMass: 0, noseColor: "#d63384", useCustomSettings: false, chambers: [ { name: "CLÉ", dist: 0, max: 4, mass_brass: 150, mass_lead: 200, mass_tungsten: 300, stock_brass: 0, stock_lead: 0, stock_tungsten: 4, color: "#888888" }, { name: "AILES", dist: 40, max: 6, mass_brass: 100, mass_lead: 150, mass_tungsten: 200, stock_brass: 0, stock_lead: 0, stock_tungsten: 6, color: "#0ea5e9" } ], loadout: [{b:0,l:0,t:0}, {b:0,l:0,t:0}] },
            { id: 2, name: "JAZZ", emptyW: 2350, emptyCG: 98, area: 58, target: 98, noseDist: 280, noseMass: 0, noseColor: "#d63384", useCustomSettings: false, chambers: [ { name: "MENUISERIE", dist: 10, max: 4, mass_brass: 120, mass_lead: 180, mass_tungsten: 250, stock_brass: 0, stock_lead: 0, stock_tungsten: 4, color: "#888888" }, { name: "SAUMONS", dist: 60, max: 4, mass_brass: 90, mass_lead: 140, mass_tungsten: 190, stock_brass: 0, stock_lead: 0, stock_tungsten: 4, color: "#f59e0b" } ], loadout: [{b:0,l:0,t:0}, {b:0,l:0,t:0}] }
        ];
        localStorage.setItem('f3f_gliders', JSON.stringify(gliders));
    }
    
    // 2. Chargement Logs et Pentes
    flightLogs = safeParse('f3f_logs', []);
    savedSlopes = safeParse('f3f_slopes', []);
    
    // 3. Chargement Config globale
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

    // 4. Remplissage UI Config
    let setV1 = document.getElementById('set-v1');
    if (setV1) {
        document.getElementById('set-v1').value = globalCoefs.v1; document.getElementById('set-m1').value = globalCoefs.m1;
        document.getElementById('set-v2').value = globalCoefs.v2; document.getElementById('set-m2').value = globalCoefs.m2;
        document.getElementById('set-v-pivot').value = globalCoefs.vp; document.getElementById('set-m-pivot').value = globalCoefs.mp;
        document.getElementById('check-bilinear').checked = globalCoefs.isDouble;
        document.getElementById('block-pivot').classList.toggle('hidden', !globalCoefs.isDouble);

        if(window.calculateAB) calculateAB();
        document.getElementById('set-ref-area').value = globalCoefs.refArea;
        document.getElementById('set-tol-w-min').value = optParams.wMin; document.getElementById('set-tol-w-max').value = optParams.wMax;
        document.getElementById('set-tol-cg-plus').value = optParams.cgTolPlus; document.getElementById('set-tol-cg-minus').value = optParams.cgTolMinus;
        document.getElementById('set-offset-lam').value = optParams.cgOffsetLam; document.getElementById('set-offset-turb').value = optParams.cgOffsetTurb;
    }
    
    // 5. Finalisation affichage
    if(window.setTheme) window.setTheme(currentTheme);
    gliders.forEach(g => { if(Array.isArray(g.loadout) && typeof g.loadout[0] === 'number') g.loadout = g.loadout.map(v => ({ b: v, l: 0, t: 0 })); });
    save();
    
    let lSel = document.getElementById('lang-select'); if(lSel) lSel.value = currentLang;
    let tSel = document.getElementById('theme-select'); if(tSel) tSel.value = currentTheme; 
    
    if(window.updateUITexts) window.updateUITexts(); 
    if(window.renderSlopeDropdown) window.renderSlopeDropdown();
    if(window.showView) window.showView('home');

    // 6. Vérification de version sur le github après 1.5 secondes
    setTimeout(() => { if(window.checkForUpdates) checkForUpdates(); }, 1500);
}

// Lancement au chargement de la page
window.addEventListener('load', initApp);
