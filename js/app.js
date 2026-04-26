// ==========================================
// 1. CONFIGURATION & DICTIONNAIRE
// ==========================================
const APP_VERSION = "6.3"; // Version actuelle de l'application
const GITHUB_RELEASE_URL = "https://github.com/TON_USER/TON_REPO/releases"; // <-- À CHANGER
const GITHUB_VERSION_URL = "https://raw.githubusercontent.com/TON_USER/TON_REPO/main/version.json"; // <-- À CHANGER

const dict = {
    fr: {
        new_model: "+ NOUVEAU MODÈLE", logbook_btn: "📓 JOURNAL DES VOLS", back: "RETOUR", config: "CONFIG",
        settings_title: "PARAMÈTRES", language: "LANGUE", theme: "THÈME", global_calc: "Calcul Global",
        aero_title: "AÉROLOGIE (DÉCALAGES CG)", lbl_offset_lam: "Laminaire (mm)", lbl_offset_turb: "Turbulent (mm)",
        opt_title: "OPTIMISATION", opt_desc: "Réglages des limites acceptables pour l'algorithme.",
        lbl_tol_w_min: "Tol. Poids Moins (-g)", lbl_tol_w_max: "Tol. Poids Plus (+g)",
        lbl_tol_cg_plus: "Tol. CG + (mm)", lbl_tol_cg_min: "Tol. CG - (mm)",
        gl_desc: "Définissez la courbe de ballastage pour un planeur standard.",
        pt1: "POINT 1 (Léger/Vide)", pt2: "POINT 2 (Lourd/Max)", lbl_weight_kg: "Poids (kg)",
        ref_surf: "Surface Référence (dm²)", res_int: "Résultat interne:",
        stat_target: "CIBLE", stat_current: "ACTUEL", stat_cg: "CG (mm)", wind: "Vent (m/s)", factor: "Facteur %", optimize: "🪄 OPTIMISER",
        clear_all: "Tout Vider", ph_slope: "Pente", ph_time: "Chrono", save_flight: "💾 ENREGISTRER",
        mass_g: "MASSE (g)", adj_cg: "Ajust. CG",
        edit_title: "ÉDITION DU MODÈLE", lbl_name: "Nom du modèle", lbl_empty_w: "Poids à vide (g)", 
        lbl_empty_cg: "Centrage à vide (mm)", lbl_area: "Surface Ailaire (dm²)", lbl_target_cg: "Centrage Cible (mm)",
        desc_nose: "Distance mesurée entre la soute de nez et le Bord d'Attaque.",
        chambers_title: "CONFIGURATION DES BALLASTS", add_chamber: "+ Ajouter une soute", lbl_color: "Coul.",
        lbl_ch_name: "Nom Soute", lbl_grp: "Lien", lbl_dist: "Dist. Bord d'Attaque ", lbl_max: "Capacité Max (Qté)", 
        lbl_unit_mass: "Poids d'un élément (g)", lbl_stock: "Stock Disponible (Qté)", ph_stock: "Stock",
        save: "SAUVEGARDER", cancel: "ANNULER", delete_model: "SUPPRIMER", duplicate_model: "DUPLIQUER", copy_suffix: " (Copie)", export_model: "EXPORTER MODÈLE",
        logbook_title: "JOURNAL", help_title: "AIDE", mat_brass: "LAITON", mat_lead: "PLOMB", mat_tung: "TUNG.",
        alert_saved: "Vol enregistré !", alert_copied: "Copié !", msg_del_log: "Supprimer ce vol ?", msg_del_mod: "Supprimer ce modèle ?", msg_reset: "Vider les ballasts ?",
        msg_note: "Note du vol :", yes: "OUI", no: "NON", charge: "Charge", cible_short: "Cible",
        all_models: "TOUS MODÈLES", all_slopes: "TOUTES PENTES", nose_title: "SOUTE NEZ (MANUEL)",
        data_title: "DONNÉES & SAUVEGARDE", data_desc: "Sauvegardez l'intégralité de vos modèles et vols.",
        export_all: "EXPORTER TOUT (.json)", import_btn: "IMPORTER",
        msg_import_success: "Importation réussie !", msg_import_err: "Erreur lors de l'import.",
        msg_replace_all: "Attention : Ceci va REMPLACER tous vos modèles et logs actuels. Continuer ?",
        msg_add_model: "Modèle détecté : ", msg_add_model_q: "Voulez-vous l'ajouter à votre liste ?",
        help_html: `<h3>F3F Manager V${APP_VERSION}</h3><p>Optimisation intelligente, Croquis Dynamique et Ingénieur embarqué.</p>`
    },
    en: {
        // (Garde tes traductions anglaises ici)
    }
};

// ==========================================
// 2. ÉTAT GLOBAL (STATE)
// ==========================================
let gliders = [];
let flightLogs = [];
let globalCoefs = { a: 0.16, b: 1.82, refArea: 62, v1: 3, m1: 2.3, v2: 20, m2: 5.0, isDouble: false, vp: 10, mp: 3.5, a2: 0, b2: 0 };
let currentGliderId = null;
let tempGlider = null;
let optParams = { wMin: 75, wMax: 20, cgTolPlus: 0.5, cgTolMinus: 0.5, cgOffsetLam: 0.5, cgOffsetTurb: -1.0 };
let settingsChartInstance = null;

const phoneLang = (navigator.language || navigator.userLanguage).substring(0, 2);
const defaultLang = dict[phoneLang] ? phoneLang : 'en';
let currentLang = localStorage.getItem('f3f_lang') || defaultLang;
let currentTheme = localStorage.getItem('f3f_theme_style') || 'cyber';
let geminiApiKey = localStorage.getItem('f3f_gemini_key') || '';

// ==========================================
// 3. CHECK DES MISES À JOUR MANUELLES
// ==========================================
async function checkForUpdates() {
    try {
        // Ajout d'un paramètre cache-busting pour être sûr de lire la dernière version
        const response = await fetch(`${GITHUB_VERSION_URL}?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;
        
        const data = await response.json();
        
        // Comparaison simple des versions
        if (data.version && data.version !== APP_VERSION) {
            window.showModal(
                `Une nouvelle mise à jour (V${data.version}) est disponible !`,
                false,
                [{tx: "Ignorer", cl: "btn-outline", val: 0}, {tx: "Voir sur GitHub", cl: "btn-primary", val: 1}],
                (r) => { if (r) window.open(GITHUB_RELEASE_URL, '_blank'); }
            );
        }
    } catch (err) {
        console.log("Impossible de vérifier les mises à jour (mode hors-ligne probable).", err);
    }
}

// ==========================================
// 4. UTILITAIRES & MATHS
// ==========================================
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

// (Insérer ici tes fonctions : calculateAB(), getActiveCoefs(), getActiveOpts(), getCalculatedTargetWeight(), getEffectiveStock()... Identiques à l'original)

// ==========================================
// 5. NAVIGATION & UI
// ==========================================
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
        btn.onclick = () => { o.style.display='none'; cb(x.val==='inp'?i.value:x.val); }; 
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

// ==========================================
// 6. MODULES & RENDU (Calc, Croquis, etc.)
// ==========================================
// (Copier ici l'intégralité de tes fonctions : renderList(), renderCalc(), recalc(), updMix(), autoFillBallast(), etc. Elles n'ont pas besoin d'être modifiées)

// ==========================================
// 7. IMPORT / EXPORT / DATA
// ==========================================
// (exportData, triggerImport, processImport...)

// ==========================================
// 8. GEMINI AI API
// ==========================================
// (saveApiKey, generateAiReport...)

// ==========================================
// 9. INITIALISATION & SAUVEGARDE
// ==========================================
function save() { 
    localStorage.setItem('f3f_gliders', JSON.stringify(gliders)); 
    localStorage.setItem('f3f_logs', JSON.stringify(flightLogs)); 
    localStorage.setItem('f3f_global_coefs', JSON.stringify(globalCoefs)); 
    localStorage.setItem('f3f_opt_params', JSON.stringify(optParams)); 
}

window.saveGlobalCoefs = function() { 
    globalCoefs.v1 = parseFloat(document.getElementById('set-v1').value) || 0; 
    globalCoefs.m1 = parseFloat(document.getElementById('set-m1').value) || 0; 
    globalCoefs.v2 = parseFloat(document.getElementById('set-v2').value) || 20; 
    globalCoefs.m2 = parseFloat(document.getElementById('set-m2').value) || 5; 
    globalCoefs.vp = parseFloat(document.getElementById('set-v-pivot').value) || 10; 
    globalCoefs.mp = parseFloat(document.getElementById('set-m-pivot').value) || 3.5; 
    globalCoefs.isDouble = document.getElementById('check-bilinear').checked;
    globalCoefs.refArea = parseFloat(document.getElementById('set-ref-area').value); 
    calculateAB(); save(); 
};

window.saveOptParams = function() { 
    optParams.wMin = parseFloat(document.getElementById('set-tol-w-min').value) || 0; 
    optParams.wMax = parseFloat(document.getElementById('set-tol-w-max').value) || 0; 
    optParams.cgTolPlus = parseFloat(document.getElementById('set-tol-cg-plus').value) || 0.1; 
    optParams.cgTolMinus = parseFloat(document.getElementById('set-tol-cg-minus').value) || 0.1; 
    optParams.cgOffsetLam = parseFloat(document.getElementById('set-offset-lam').value) || 0;
    optParams.cgOffsetTurb = parseFloat(document.getElementById('set-offset-turb').value) || 0;
    save(); 
};

function initApp() {
    // 1. Chargement de la flotte ou Valeurs par défaut
    gliders = JSON.parse(localStorage.getItem('f3f_gliders')) || [];
    if (gliders.length === 0) {
        gliders = [
            {
                id: 1, name: "FREESTYLER (Ancien)", emptyW: 2100, emptyCG: 100, area: 60, target: 100, noseDist: 250, noseMass: 0, noseColor: "#d63384", useCustomSettings: false,
                chambers: [
                    { name: "CLÉ", dist: 0, max: 4, mass_brass: 150, mass_lead: 200, mass_tungsten: 300, stock_brass: 0, stock_lead: 0, stock_tungsten: 4, color: "#888888" },
                    { name: "AILES", dist: 40, max: 6, mass_brass: 100, mass_lead: 150, mass_tungsten: 200, stock_brass: 0, stock_lead: 0, stock_tungsten: 6, color: "#0ea5e9" }
                ],
                loadout: [{b:0,l:0,t:0}, {b:0,l:0,t:0}]
            },
            {
                id: 2, name: "JAZZ", emptyW: 2350, emptyCG: 98, area: 58, target: 98, noseDist: 280, noseMass: 0, noseColor: "#d63384", useCustomSettings: false,
                chambers: [
                    { name: "MENUISERIE", dist: 10, max: 4, mass_brass: 120, mass_lead: 180, mass_tungsten: 250, stock_brass: 0, stock_lead: 0, stock_tungsten: 4, color: "#888888" },
                    { name: "SAUMONS", dist: 60, max: 4, mass_brass: 90, mass_lead: 140, mass_tungsten: 190, stock_brass: 0, stock_lead: 0, stock_tungsten: 4, color: "#f59e0b" }
                ],
                loadout: [{b:0,l:0,t:0}, {b:0,l:0,t:0}]
            },
            {
                id: 3, name: "PIKE", emptyW: 2280, emptyCG: 99, area: 61, target: 99, noseDist: 260, noseMass: 0, noseColor: "#d63384", useCustomSettings: false,
                chambers: [
                    { name: "BALLASTS", dist: 0, max: 8, mass_brass: 140, mass_lead: 210, mass_tungsten: 290, stock_brass: 0, stock_lead: 0, stock_tungsten: 8, color: "#888888" }
                ],
                loadout: [{b:0,l:0,t:0}]
            }
        ];
        localStorage.setItem('f3f_gliders', JSON.stringify(gliders));
    }

    // 2. Chargement des logs
    flightLogs = JSON.parse(localStorage.getItem('f3f_logs')) || [];

    // 3. Chargement des coefficients globaux
    let savedCoefs = JSON.parse(localStorage.getItem('f3f_global_coefs'));
    if (!savedCoefs) { 
        globalCoefs = { a: 0.16, b: 1.82, refArea: 62, v1:3, m1:2.3, v2:20, m2:5.0, isDouble: false, vp: 10, mp: 3.5, a2: 0, b2: 0 }; 
        save(); 
    } else { 
        globalCoefs = savedCoefs; 
        if(!globalCoefs.refArea) globalCoefs.refArea = 62; 
        if(globalCoefs.isDouble === undefined) globalCoefs.isDouble = false;
    }

    // 4. Chargement des paramètres d'optimisation
    let savedOpt = JSON.parse(localStorage.getItem('f3f_opt_params'));
    if(savedOpt) optParams = savedOpt;
    if(optParams.cgOffsetLam === undefined) optParams.cgOffsetLam = 0.5;
    if(optParams.cgOffsetTurb === undefined) optParams.cgOffsetTurb = -1.0;

    // 5. Initialisation du DOM avec les valeurs (ce qui manquait et faisait planter le thème)
    document.getElementById('set-v1').value = globalCoefs.v1; 
    document.getElementById('set-m1').value = globalCoefs.m1;
    document.getElementById('set-v2').value = globalCoefs.v2; 
    document.getElementById('set-m2').value = globalCoefs.m2;
    document.getElementById('set-v-pivot').value = globalCoefs.vp || 10; 
    document.getElementById('set-m-pivot').value = globalCoefs.mp || 3.5;
    document.getElementById('check-bilinear').checked = globalCoefs.isDouble;
    
    let blockPivot = document.getElementById('block-pivot');
    if(blockPivot) blockPivot.classList.toggle('hidden', !globalCoefs.isDouble);

    calculateAB();
    document.getElementById('set-ref-area').value = globalCoefs.refArea || 62;
    document.getElementById('set-tol-w-min').value = optParams.wMin; 
    document.getElementById('set-tol-w-max').value = optParams.wMax;
    document.getElementById('set-tol-cg-plus').value = optParams.cgTolPlus; 
    document.getElementById('set-tol-cg-minus').value = optParams.cgTolMinus;
    document.getElementById('set-offset-lam').value = optParams.cgOffsetLam;
    document.getElementById('set-offset-turb').value = optParams.cgOffsetTurb;

    // 6. Application stricte du Thème et de la Langue
    window.setTheme(currentTheme);
    let langSelect = document.getElementById('lang-select');
    let themeSelect = document.getElementById('theme-select');
    if(langSelect) langSelect.value = currentLang; 
    if(themeSelect) themeSelect.value = currentTheme; 

    // 7. Migration de compatibilité des anciens loadouts
    gliders.forEach(g => { 
        if(Array.isArray(g.loadout) && typeof g.loadout[0] === 'number') {
            g.loadout = g.loadout.map(v => ({ b: v, l: 0, t: 0 })); 
        }
    });
    save();

    // 8. Rendu final
    updateUITexts(); 
    showView('home');

    // 9. Vérification des mises à jour après un délai (pour ne pas bloquer l'affichage)
    setTimeout(checkForUpdates, 1500);
}

window.addEventListener('load', initApp);
