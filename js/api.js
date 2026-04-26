// ==========================================
// API.JS : SERVICES EXTERNES ET INTELLIGENCE ARTIFICIELLE
// ==========================================

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

window.saveApiKey = function() { 
    geminiApiKey = document.getElementById('cfg-api-key').value.trim(); 
    localStorage.setItem('f3f_gemini_key', geminiApiKey); 
    window.customAlert("Clé API enregistrée !"); 
};

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
