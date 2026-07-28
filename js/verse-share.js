/* ===== VERSE SHARE — Canvas card generator ===== */
(function () {
  'use strict';

  const MODAL_ID = 'verseShareModal';

  /* ── Build modal once ── */
  function buildModal() {
    if (document.getElementById(MODAL_ID)) return;

    const css = `
      #${MODAL_ID} { position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(5,5,18,0.65);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px); }
      #${MODAL_ID}.hidden{display:none;}
      .vs-inner{background:#1A1B3E;border:0.5px solid rgba(227,227,235,0.12);border-radius:20px;padding:26px;box-shadow:0 40px 100px -30px rgba(0,0,0,0.7);max-width:500px;width:100%;animation:vsIn .32s cubic-bezier(0.16,1,.3,1);}
      @keyframes vsIn{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:none}}
      .vs-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
      .vs-title{font-family:'Fraunces',Georgia,serif;font-size:19px;font-weight:500;color:#E3E3EB;}
      .vs-close{width:30px;height:30px;border:0.5px solid rgba(227,227,235,0.15);border-radius:8px;background:rgba(227,227,235,0.06);color:rgba(227,227,235,0.6);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:background .15s;}
      .vs-close:hover{background:rgba(227,227,235,0.12);}
      #verseCanvas{width:100%;aspect-ratio:1;border-radius:12px;display:block;box-shadow:0 12px 40px -10px rgba(0,0,0,0.5);}
      .vs-actions{display:flex;gap:10px;margin-top:14px;}
      .vs-btn{flex:1;padding:11px;border-radius:10px;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;border:0.5px solid rgba(227,227,235,0.15);transition:background .15s;}
      .vs-btn-dl{background:#2A2B5A;color:#E3E3EB;}
      .vs-btn-dl:hover{background:rgba(42,43,90,.9);}
      .vs-btn-wa{background:#25D366;color:#fff;border-color:#25D366;}
      .vs-btn-wa:hover{background:#20bd5a;}
      @media(max-width:480px){.vs-inner{padding:16px;}.vs-actions{flex-direction:column;}}
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const div = document.createElement('div');
    div.id = MODAL_ID;
    div.className = 'hidden';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-modal', 'true');
    div.setAttribute('aria-label', 'Partager le verset du jour');
    div.innerHTML = `
      <div class="vs-inner">
        <div class="vs-header">
          <span class="vs-title">Verset du jour</span>
          <button class="vs-close" id="vsClose" aria-label="Fermer">✕</button>
        </div>
        <canvas id="verseCanvas" width="1080" height="1080"></canvas>
        <div class="vs-actions">
          <button class="vs-btn vs-btn-dl" id="vsBtnDl">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Télécharger
          </button>
          <button class="vs-btn vs-btn-wa" id="vsBtnWa">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            WhatsApp
          </button>
        </div>
      </div>`;
    document.body.appendChild(div);

    document.getElementById('vsClose').onclick = closeModal;
    div.addEventListener('click', e => { if (e.target === div) closeModal(); });
  }

  /* ── Canvas drawing ── */
  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    const lines = [];
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
      else line = test;
    }
    lines.push(line);
    const startY = y - (lines.length - 1) * lineHeight / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
  }

  async function drawCard(verseText, verseRef) {
    const canvas = document.getElementById('verseCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 1080, H = 1080;

    await Promise.all([
      document.fonts.load('italic 500 62px Fraunces'),
      document.fonts.load('600 22px Inter'),
      document.fonts.load('700 24px Inter'),
    ]).catch(() => {});
    await document.fonts.ready;

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#1A1B3E');
    bg.addColorStop(1, '#0A0A21');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Glows
    const g1 = ctx.createRadialGradient(W*0.18, H*0.2, 0, W*0.18, H*0.2, W*0.55);
    g1.addColorStop(0, 'rgba(167,139,250,0.20)'); g1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W*0.85, H*0.85, 0, W*0.85, H*0.85, W*0.5);
    g2.addColorStop(0, 'rgba(227,227,235,0.10)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

    // Constellation
    let seed = 42;
    const rnd = () => { seed = (seed*9301+49297)%233280; return seed/233280; };
    const pts = Array.from({length:38}, () => ({x:rnd()*W, y:rnd()*H, r:1+rnd()*2.2}));
    ctx.strokeStyle = 'rgba(227,227,235,0.08)'; ctx.lineWidth = 1;
    for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++) {
      const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
      if (Math.sqrt(dx*dx+dy*dy)<150) { ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(227,227,235,0.35)';
    pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); });

    // Big quote mark
    ctx.font = 'italic 600 220px Fraunces';
    ctx.fillStyle = 'rgba(167,139,250,0.14)';
    ctx.textAlign = 'left';
    ctx.fillText('"', 64, 280);

    // Eyebrow
    ctx.font = '600 15px Inter';
    ctx.fillStyle = 'rgba(227,227,235,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('VERSET DU JOUR', W/2, H*0.32);

    // Verse
    ctx.font = 'italic 500 62px Fraunces';
    ctx.fillStyle = '#E3E3EB';
    wrapText(ctx, verseText, W/2, H*0.46, W-200, 76);

    // Reference
    ctx.font = '600 22px Inter';
    ctx.fillStyle = '#A78BFA';
    ctx.fillText(verseRef.toUpperCase(), W/2, H*0.62);

    // Divider
    ctx.strokeStyle = 'rgba(227,227,235,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2-40, H*0.86); ctx.lineTo(W/2+40, H*0.86); ctx.stroke();

    // Logo + brand
    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    const logoLoaded = new Promise(res => { logo.onload = res; logo.onerror = res; });
    logo.src = '/cefc-logo.png';
    await logoLoaded;
    if (logo.complete && logo.naturalWidth) {
      const s = 60;
      ctx.save();
      ctx.beginPath(); ctx.arc(W/2, H*0.905, s/2, 0, Math.PI*2); ctx.clip();
      ctx.drawImage(logo, W/2-s/2, H*0.905-s/2, s, s);
      ctx.restore();
    }
    ctx.font = '700 24px Inter'; ctx.fillStyle = '#E3E3EB';
    ctx.fillText('CEFC — La Famille Chrétienne', W/2, H*0.955+6);
    ctx.font = '500 16px Inter'; ctx.fillStyle = 'rgba(227,227,235,0.45)';
    ctx.fillText('Alost · cefclabornealost9300.netlify.app', W/2, H*0.955+32);
  }

  /* ── Fetch verse from contenu.json ── */
  async function getVerse() {
    // Try live typewriter text first
    const tw = document.getElementById('heroVerse');
    if (tw && tw.textContent.trim()) {
      return { text: tw.textContent.replace(/\|$/, '').trim(), ref: '' };
    }
    try {
      const d = await fetch('/contenu.json').then(r => r.json());
      const ft = d.footer || {};
      return {
        text: ft.verset_texte || '« Car nous sommes tous un seul corps en Christ. »',
        ref: ft.verset_reference || 'Romains 12 : 5',
      };
    } catch (_) {
      return { text: '« Car nous sommes tous un seul corps en Christ. »', ref: 'Romains 12 : 5' };
    }
  }

  function closeModal() {
    const m = document.getElementById(MODAL_ID);
    if (m) m.classList.add('hidden');
    document.body.style.overflow = '';
  }

  async function openModal() {
    buildModal();
    const m = document.getElementById(MODAL_ID);
    m.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const { text, ref } = await getVerse();
    await drawCard(text, ref);

    const canvas = document.getElementById('verseCanvas');
    document.getElementById('vsBtnDl').onclick = () => {
      const a = document.createElement('a');
      a.download = 'verset-cefc.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    document.getElementById('vsBtnWa').onclick = () => {
      window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + ref + '\n— CEFC Alost'), '_blank');
    };
  }

  /* ── Wire up triggers ── */
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('verseShareTrigger');
    if (btn) btn.addEventListener('click', openModal);
  });

  // Also listen to CMDK action event
  document.addEventListener('cefc:verse-share', openModal);
})();
