// ==========================================
// DATA.JS : GESTION DE LA MÉMOIRE ET DES VARIABLES GLOBALES
// ==========================================

/* --- DICTIONNAIRE DE TRADUCTION --- */
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
        help_html: `<h3>F3F Manager V6.3</h3><p>Optimisation intelligente, Croquis Dynamique et Ingénieur embarqué.</p>`
    },
    en: {
        new_model: "+ NEW MODEL", logbook_btn: "📓 LOGBOOK", back: "BACK", config: "CONFIG",
        settings_title: "SETTINGS", language: "LANGUAGE", theme: "THEME", global_calc: "Global Calc",
        aero_title: "AEROLOGY (CG OFFSETS)", lbl_offset_lam: "Laminar (mm)", lbl_offset_turb: "Turbulent (mm)",
        opt_title: "OPTIMIZATION", opt_desc: "Algorithm tolerance limits.",
        lbl_tol_w_min: "Tol. Weight Minus (-g)", lbl_tol_w_max: "Tol. Weight Plus (+g)",
        lbl_tol_cg_plus: "Tol. CG + (mm)", lbl_tol_cg_min: "Tol. CG - (mm)",
        gl_desc: "Define the standard glider ballast curve.",
        pt1: "POINT 1 (Light/Empty)", pt2: "POINT 2 (Heavy/Max)", lbl_weight_kg: "Weight (kg)",
        ref_surf: "Reference Area (dm²)", res_int: "Internal result:",
        stat_target: "TARGET", stat_current: "CURRENT", stat_cg: "CG (mm)", wind: "Wind (m/s)", factor: "Factor %", optimize: "🪄 OPTIMIZE",
        clear_all: "Clear All", ph_slope: "Slope", ph_time: "Time", save_flight: "💾 SAVE FLIGHT",
        mass_g: "MASS (g)", adj_cg: "Adjust CG",
        edit_title: "EDIT MODEL", lbl_name: "Model Name", lbl_empty_w: "Empty Weight (g)", 
        lbl_empty_cg: "Empty CG (mm)", lbl_area: "Wing Area (dm²)", lbl_target_cg: "Target CG (mm)",
        desc_nose: "Distance measured from Nose Ballast to Leading Edge.",
        chambers_title: "BALLAST CONFIGURATION", add_chamber: "+ Add Chamber", lbl_color: "Col.",
        lbl_ch_name: "Chamber Name", lbl_grp: "Link", lbl_dist: "Dist. Leading Edge", lbl_max: "Max Capacity (Qty)", 
        lbl_unit_mass: "Unit Weight (g)", lbl_stock: "Available Stock (Qty)", ph_stock: "Stock",
        save: "SAVE", cancel: "CANCEL", delete_model: "DELETE", duplicate_model: "DUPLICATE", copy_suffix: " (Copy)", export_model: "EXPORT MODEL",
        logbook_title: "LOGBOOK", help_title: "HELP", mat_brass: "BRASS", mat_lead: "LEAD", mat_tung: "TUNG.",
        alert_saved: "Flight saved!", alert_copied: "Copied!", msg_del_log: "Delete this flight?", msg_del_mod: "Delete this model?", msg_reset: "Clear all ballast?",
        msg_note: "Flight note:", yes: "YES", no: "NO", charge: "Load", cible_short: "Target",
        all_models: "ALL MODELS", all_slopes: "ALL SLOPES", nose_title: "NOSE BALLAST (MANUAL)",
        data_title: "DATA & BACKUP", data_desc: "Backup all your models and flights.",
        export_all: "EXPORT ALL (.json)", import_btn: "IMPORT",
        msg_import_success: "Import successful!", msg_import_err: "Error during import.",
        msg_replace_all: "Warning: This will REPLACE all your current models and logs. Continue?",
        msg_add_model: "Model detected: ", msg_add_model_q: "Add it to your list?",
        help_html: `<h3>F3F Manager V6.3</h3><p>Smart optimization, Dynamic Sketch and Embedded Track Engineer.</p>`
    }
};

/* --- VARIABLES D'ÉTAT GLOBALES --- */
let gliders = [], flightLogs = [], globalCoefs = {}, optParams = {};
let currentGliderId = null, tempGlider = null;
let settingsChartInstance = null;

const phoneLang = (navigator.language || navigator.userLanguage).substring(0, 2);
const defaultLang = dict[phoneLang] ? phoneLang : 'en';
let currentLang = localStorage.getItem('f3f_lang') || defaultLang;

let currentTheme = localStorage.getItem('f3f_theme_style') || 'cyber';
let geminiApiKey = localStorage.getItem('f3f_gemini_key') || '';

/* --- FONCTIONS BOUCLIERS --- */
const getNum = (val, fallback) => { const v = parseFloat(val); return isNaN(v) ? fallback : v; };

function safeParse(key, defaultObj) {
    try {
        let val = localStorage.getItem(key);
        if (!val || val === "undefined" || val === "null") return defaultObj;
        return JSON.parse(val);
    } catch(e) {
        console.warn("Nettoyage de la mémoire corrompue pour : " + key);
        return defaultObj;
    }
}

/* --- SAUVEGARDE LOCALE --- */
function save() { 
    localStorage.setItem('f3f_gliders', JSON.stringify(gliders)); 
    localStorage.setItem('f3f_logs', JSON.stringify(flightLogs)); 
    localStorage.setItem('f3f_global_coefs', JSON.stringify(globalCoefs)); 
    localStorage.setItem('f3f_opt_params', JSON.stringify(optParams)); 
}

/* --- IMPORT / EXPORT JSON --- */
window.exportData = function(type) {
    let exportObj = {}, fileName = "f3f_backup.json";
    if(type === 'all') {
        exportObj = { type: 'backup_full', version: '6.3', date: new Date().toISOString(), gliders: gliders, logs: flightLogs, coefs: globalCoefs, opts: optParams };
        fileName = `f3f_full_backup_${new Date().toISOString().slice(0,10)}.json`;
    } else if (type === 'model') {
        if(!tempGlider) return;
        exportObj = { type: 'backup_model', version: '6.3', data: tempGlider };
        fileName = `${tempGlider.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    }
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url; 
    a.download = fileName;
    
    document.body.appendChild(a); 
    a.click(); 
    
    setTimeout(() => {
        document.body.removeChild(a); 
        URL.revokeObjectURL(url);
    }, 200);
};

window.triggerImport = function() { 
    document.getElementById('import-file').click(); 
};

window.handleFile = function(input) {
    const file = input.files[0]; 
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            processImport(json);
        } catch(err) { 
            window.customAlert(t('msg_import_err')); 
            console.error(err); 
        }
        input.value = ''; 
    };
    reader.readAsText(file);
};

function processImport(data) {
    if(!data.type) { window.customAlert(t('msg_import_err')); return; }
    if(data.type === 'backup_full') {
        window.showModal(t('msg_replace_all'), false, [{tx:t('cancel'), cl:'btn-outline', val:0}, {tx:t('yes'), cl:'btn-danger', val:1}], (r) => {
            if(r) { gliders = data.gliders || []; flightLogs = data.logs || []; globalCoefs = data.coefs || globalCoefs; optParams = data.opts || optParams; save(); window.location.reload(); }
        });
    } else if (data.type === 'backup_model') {
        let m = data.data;
        window.showModal(t('msg_add_model') + m.name + ". " + t('msg_add_model_q'), false, [{tx:t('cancel'), cl:'btn-outline', val:0}, {tx:t('yes'), cl:'btn-success', val:1}], (r) => {
            if(r) { m.id = Date.now(); m.loadout = m.chambers.map(() => ({b:0, l:0, t:0})); gliders.push(m); save(); window.customAlert(t('msg_import_success')); window.navigateTo('home'); }
        });
    } else { window.customAlert(t('msg_import_err')); }
}
