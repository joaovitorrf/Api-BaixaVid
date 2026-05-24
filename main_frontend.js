/* =============================================
   BAIXAVID — JS Principal
   ============================================= */

// ─── URL DA SUA API ───────────────────────────
// Troque pelo endereço gerado pelo Railway após o deploy
// Exemplo: "https://baixavid-api-production.up.railway.app"
const API_URL = "https://SUA-API.up.railway.app";

// ─── DETECÇÃO DE PLATAFORMA ───────────────────
function detectarPlataforma(url) {
  if (!url) return null;
  url = url.toLowerCase().trim();
  if (url.includes('tiktok.com') || url.includes('vm.tiktok')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('kwai.com') || url.includes('kwai.app')) return 'kwai';
  if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com')) return 'facebook';
  return null;
}

function validarURL(url) {
  try {
    new URL(url.trim());
    return true;
  } catch {
    return false;
  }
}

// ─── DADOS DAS PLATAFORMAS ────────────────────
const PLATAFORMAS_CONFIG = {
  tiktok: {
    nome: 'TikTok',
    cor: '#FF0050',
    emoji: '🎵',
    opcoes: [
      { label: 'Sem marca d\'água', info: 'HD · ~5-15MB', tipo: 'video', icone: '📹' },
      { label: 'Com marca d\'água', info: 'HD · ~5-15MB', tipo: 'video', icone: '📹' },
      { label: 'Só o áudio', info: 'MP3 · ~1-3MB', tipo: 'mp3', icone: '🎵' },
    ]
  },
  instagram: {
    nome: 'Instagram',
    cor: '#E1306C',
    emoji: '📸',
    opcoes: [
      { label: 'Vídeo HD', info: '1080p · ~20MB', tipo: 'video', icone: '📹' },
      { label: 'Vídeo SD', info: '480p · ~8MB', tipo: 'video', icone: '📹' },
      { label: 'Só o áudio', info: 'MP3 · ~2-4MB', tipo: 'mp3', icone: '🎵' },
    ]
  },
  youtube: {
    nome: 'YouTube',
    cor: '#FF0000',
    emoji: '▶️',
    opcoes: [
      { label: '1080p Full HD', info: 'MP4 · ~150MB', tipo: 'video', icone: '📹' },
      { label: '720p HD', info: 'MP4 · ~80MB', tipo: 'video', icone: '📹' },
      { label: '480p SD', info: 'MP4 · ~40MB', tipo: 'video', icone: '📹' },
      { label: 'Só MP3', info: 'MP3 · ~5-8MB', tipo: 'mp3', icone: '🎵' },
    ]
  },
  kwai: {
    nome: 'Kwai',
    cor: '#FF6B00',
    emoji: '🎬',
    opcoes: [
      { label: 'Sem marca d\'água', info: 'HD · ~8MB', tipo: 'video', icone: '📹' },
      { label: 'Só o áudio', info: 'MP3 · ~2MB', tipo: 'mp3', icone: '🎵' },
    ]
  },
  facebook: {
    nome: 'Facebook',
    cor: '#1877F2',
    emoji: '👥',
    opcoes: [
      { label: 'Alta qualidade', info: 'HD · ~30MB', tipo: 'video', icone: '📹' },
      { label: 'Normal', info: 'SD · ~10MB', tipo: 'video', icone: '📹' },
      { label: 'Só MP3', info: 'MP3 · ~3MB', tipo: 'mp3', icone: '🎵' },
    ]
  }
};

// ─── SIMULAÇÃO DE PREVIEW ─────────────────────
// ATENÇÃO: Isso simula a UI. Para funcionar de verdade,
// você precisa de uma API backend (ex: yt-dlp, RapidAPI)
// O código de integração fica em js/api.js

function simularPreview(url, plataforma) {
  const config = PLATAFORMAS_CONFIG[plataforma];

  return {
    titulo: `Vídeo do ${config.nome} — ${url.substring(0, 30)}...`,
    autor: '@usuario_exemplo',
    duracao: plataforma === 'youtube' ? '3:45' : '0:28',
    thumb: null, // seria a thumbnail real
    plataforma,
    config
  };
}

// ─── FLUXO PRINCIPAL ──────────────────────────
let loadingInterval = null;

async function processarURL(url) {
  if (!url || !url.trim()) {
    mostrarToast('Cole um link para continuar!', 'erro');
    return;
  }

  if (!validarURL(url.trim())) {
    mostrarToast('Link inválido! Copie o link completo do vídeo.', 'erro');
    return;
  }

  const plataforma = detectarPlataforma(url);

  if (!plataforma) {
    mostrarToast('Plataforma não suportada ainda.', 'erro');
    return;
  }

  // Ocultar resultado anterior
  esconderResultado();

  // Mostrar loading
  mostrarLoading(plataforma);

  // Chamar a API real
  try {
    const response = await fetch(`${API_URL}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    });

    esconderLoading();

    if (!response.ok) {
      const erro = await response.json().catch(() => ({}));
      mostrarToast(erro.detail || "Não foi possível processar esse link.", "erro");
      return;
    }

    const json = await response.json();
    const config = PLATAFORMAS_CONFIG[plataforma] || PLATAFORMAS_CONFIG["youtube"];

    // Mapear formatos da API para o formato esperado por mostrarResultado()
    const opcoes = json.formatos.map(f => ({
      label: f.label,
      info: f.ext.toUpperCase(),
      tipo: f.tipo,
      icone: f.tipo === "mp3" ? "🎵" : "📹",
      url: f.url,
    }));

    const dados = {
      titulo: json.titulo,
      autor: json.autor,
      duracao: json.duracao,
      thumb: json.thumbnail,
      plataforma,
      config: { ...config, opcoes },
    };

    mostrarResultado(dados);

  } catch (err) {
    esconderLoading();
    mostrarToast("Erro de conexão com a API. Tente novamente.", "erro");
  }
}

function mostrarLoading(plataforma) {
  const el = document.getElementById('loading');
  if (!el) return;

  const msgs = [
    'Detectando o vídeo...',
    'Analisando qualidade disponível...',
    'Preparando opções de download...',
    'Quase pronto...'
  ];

  let i = 0;
  el.querySelector('.loading-texto').textContent = msgs[0];
  el.querySelector('.progress-bar').style.width = '0%';
  el.style.display = 'block';

  let progresso = 0;
  loadingInterval = setInterval(() => {
    progresso += Math.random() * 18 + 5;
    if (progresso > 90) progresso = 90;
    el.querySelector('.progress-bar').style.width = progresso + '%';

    i = Math.min(Math.floor(progresso / 25), msgs.length - 1);
    el.querySelector('.loading-texto').textContent = msgs[i];
  }, 400);
}

function esconderLoading() {
  if (loadingInterval) clearInterval(loadingInterval);
  const el = document.getElementById('loading');
  if (!el) return;
  el.querySelector('.progress-bar').style.width = '100%';
  setTimeout(() => { el.style.display = 'none'; }, 300);
}

function mostrarResultado(dados) {
  const el = document.getElementById('resultado');
  if (!el) return;

  const config = dados.config;

  // Construir HTML das opções
  const opcoesHTML = config.opcoes.map((op, idx) => `
    <a href="#" class="opcao-btn ${op.tipo === 'mp3' ? 'mp3' : ''}" 
       onclick="iniciarDownload(event, ${JSON.stringify(op).replace(/"/g, '&quot;')})"
       data-idx="${idx}">
      <span class="opcao-qualidade">${op.icone} ${op.label}</span>
      <span class="opcao-info">${op.info}</span>
    </a>
  `).join('');

  el.innerHTML = `
    <div class="preview-card">
      <div class="preview-header">
        <div style="width:120px;height:80px;border-radius:8px;background:var(--cinza-borda);display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0;">
          ${config.emoji}
        </div>
        <div class="preview-info">
          <div class="preview-plat" style="background:${config.cor}22;color:${config.cor}">
            ${config.emoji} ${config.nome}
          </div>
          <div class="preview-titulo">${dados.titulo}</div>
          <div class="preview-meta">
            <span>👤 ${dados.autor}</span>
            <span>⏱ ${dados.duracao}</span>
          </div>
        </div>
      </div>
      <div class="opcoes-download">
        <div class="opcoes-titulo">Escolha o formato:</div>
        <div class="opcoes-grid">${opcoesHTML}</div>
      </div>
    </div>
  `;

  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function esconderResultado() {
  const el = document.getElementById('resultado');
  if (el) el.style.display = 'none';
}

function iniciarDownload(e, opcao) {
  e.preventDefault();
  if (opcao.url) {
    window.open(opcao.url, "_blank");
  } else {
    mostrarToast("Link não disponível.", "erro");
  }

  // Registrar no analytics (opcional)
  if (typeof gtag !== 'undefined') {
    gtag('event', 'download_click', {
      'event_category': 'download',
      'event_label': opcao.tipo
    });
  }
}

// ─── UTILITÁRIOS ──────────────────────────────
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mostrarToast(msg, tipo = '') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast ${tipo}`;
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── BOTÃO COLAR ──────────────────────────────
async function colarDaAreaDeTransferencia() {
  try {
    const texto = await navigator.clipboard.readText();
    const input = document.getElementById('url-input');
    if (input) {
      input.value = texto;
      input.focus();
      mostrarToast('✅ Link colado!', 'sucesso');
    }
  } catch {
    mostrarToast('Cole o link manualmente (Ctrl+V)', '');
  }
}

// ─── FAQ ACCORDION ────────────────────────────
function initFAQ() {
  document.querySelectorAll('.faq-pergunta').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const estaAberto = item.classList.contains('aberto');

      document.querySelectorAll('.faq-item.aberto').forEach(i => i.classList.remove('aberto'));

      if (!estaAberto) item.classList.add('aberto');
    });
  });
}

// ─── NAV MOBILE ───────────────────────────────
function initNavMobile() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('aberto');
  });
}

// ─── DOWNLOAD EM LOTE ─────────────────────────
function processarLote() {
  const textarea = document.getElementById('urls-lote');
  if (!textarea) return;

  const urls = textarea.value.split('\n').map(u => u.trim()).filter(Boolean);

  if (urls.length === 0) {
    mostrarToast('Cole pelo menos um link!', 'erro');
    return;
  }

  if (urls.length > 10) {
    mostrarToast('Máximo de 10 links por vez.', 'erro');
    return;
  }

  const invalidas = urls.filter(u => !validarURL(u));
  if (invalidas.length > 0) {
    mostrarToast(`${invalidas.length} link(s) inválido(s) detectado(s).`, 'erro');
    return;
  }

  mostrarToast(`⬇️ Processando ${urls.length} vídeo(s)...`, 'sucesso');
  // INTEGRAÇÃO: loop nas URLs e chame a API para cada uma
}

// ─── THUMBNAIL YOUTUBE ────────────────────────
function extrairThumbnail() {
  const input = document.getElementById('thumb-url');
  if (!input) return;

  const url = input.value.trim();
  if (!url) { mostrarToast('Cole um link do YouTube!', 'erro'); return; }

  const videoId = extrairVideoId(url);
  if (!videoId) { mostrarToast('Link inválido do YouTube.', 'erro'); return; }

  const resultado = document.getElementById('thumb-resultado');
  if (!resultado) return;

  resultado.innerHTML = `
    <div style="background:var(--cinza-card);border:1px solid var(--cinza-borda);border-radius:14px;padding:20px;margin-top:16px;animation:slideUp 0.3s ease">
      <img src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" 
           style="width:100%;border-radius:8px;margin-bottom:12px" 
           onerror="this.src='https://img.youtube.com/vi/${videoId}/hqdefault.jpg'"
           alt="Thumbnail do YouTube">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a href="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" 
           download="thumbnail-hd.jpg" target="_blank"
           class="btn btn-verde" style="font-size:0.85rem;padding:10px 16px">
          ⬇️ Baixar HD (1280×720)
        </a>
        <a href="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" 
           download="thumbnail-hq.jpg" target="_blank"
           class="btn btn-outline" style="font-size:0.85rem;padding:10px 16px">
          ⬇️ Baixar HQ (480×360)
        </a>
      </div>
    </div>
  `;
}

function extrairVideoId(url) {
  const regexes = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];

  for (const regex of regexes) {
    const match = url.match(regex);
    if (match) return match[1];
  }
  return null;
}

// ─── PWA INSTALL ──────────────────────────────
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const banner = document.getElementById('pwa-banner');
  if (banner && !localStorage.getItem('pwa-dismissed')) {
    setTimeout(() => { banner.style.display = 'block'; }, 5000);
  }
});

function instalarPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
      const banner = document.getElementById('pwa-banner');
      if (banner) banner.style.display = 'none';
    });
  }
}

function fecharPWABanner() {
  const banner = document.getElementById('pwa-banner');
  if (banner) banner.style.display = 'none';
  localStorage.setItem('pwa-dismissed', '1');
}

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initFAQ();
  initNavMobile();

  // Botão principal
  const btnBaixar = document.getElementById('btn-baixar');
  const inputURL = document.getElementById('url-input');

  if (btnBaixar && inputURL) {
    btnBaixar.addEventListener('click', () => processarURL(inputURL.value));

    inputURL.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') processarURL(inputURL.value);
    });

    // Auto-detect ao colar
    inputURL.addEventListener('paste', (e) => {
      setTimeout(() => {
        const url = inputURL.value.trim();
        if (url && validarURL(url)) {
          const plat = detectarPlataforma(url);
          if (plat) mostrarToast(`✅ ${PLATAFORMAS_CONFIG[plat].nome} detectado!`, 'sucesso');
        }
      }, 100);
    });
  }

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});
