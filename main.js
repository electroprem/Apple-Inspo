const clock = document.getElementById('clock');
const dateLabel = document.getElementById('date');
const root = document.documentElement;
const toastStack = document.querySelector('.toast-stack');
const searchInput = document.getElementById('search-input');
const focusPill = document.querySelector('.hero .pill');
const TOAST_FADEOUT_DELAY_MS = 2400;
const TOAST_REMOVAL_DELAY_MS = 2800;

const formatLabel = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const updateDateTime = () => {
  const now = new Date();
  if (clock) {
    clock.textContent = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  if (dateLabel) {
    dateLabel.textContent = now.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }
};

updateDateTime();
setInterval(updateDateTime, 1000);

const showToast = (message) => {
  if (!toastStack) {
    return;
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastStack.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('is-hiding');
  }, TOAST_FADEOUT_DELAY_MS);
  setTimeout(() => {
    toast.remove();
  }, TOAST_REMOVAL_DELAY_MS);
};

const integrationState = (() => {
  try {
    return JSON.parse(localStorage.getItem('integrations')) || {};
  } catch (error) {
    return {};
  }
})();

const integrationButtons = document.querySelectorAll('[data-action="integration"]');

const setIntegrationState = (button, isConnected) => {
  button.classList.toggle('is-connected', isConnected);
  button.textContent = isConnected ? 'Connected' : 'Connect';
  button.setAttribute('aria-pressed', String(isConnected));
};

integrationButtons.forEach((button) => {
  const key = button.dataset.integration || 'Integration';
  if (integrationState[key]) {
    setIntegrationState(button, true);
  }
});

const themeButtons = document.querySelectorAll('[data-theme]');
const accentButtons = document.querySelectorAll('[data-accent]');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let themePreference = localStorage.getItem('theme') || 'light';
let accentPreference = localStorage.getItem('accent') || 'blue';

const updateToggleButtons = (buttons, activeValue, dataKey) => {
  buttons.forEach((button) => {
    const isActive = button.dataset[dataKey] === activeValue;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
};

const applyTheme = (theme, announce = false) => {
  themePreference = theme;
  const resolvedTheme = theme === 'auto' ? (systemTheme.matches ? 'dark' : 'light') : theme;
  root.dataset.theme = resolvedTheme;
  updateToggleButtons(themeButtons, theme, 'theme');
  localStorage.setItem('theme', theme);
  if (announce) {
    showToast(`Theme set to ${theme === 'auto' ? 'auto' : resolvedTheme}.`);
  }
};

const applyAccent = (accent, announce = false) => {
  accentPreference = accent;
  root.dataset.accent = accent;
  updateToggleButtons(accentButtons, accent, 'accent');
  localStorage.setItem('accent', accent);
  if (announce) {
    showToast(`${formatLabel(accent)} accent enabled.`);
  }
};

applyTheme(themePreference);
applyAccent(accentPreference);

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyTheme(button.dataset.theme, true);
  });
});

accentButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyAccent(button.dataset.accent, true);
  });
});

systemTheme.addEventListener('change', () => {
  if (themePreference === 'auto') {
    applyTheme('auto');
  }
});

const navItems = document.querySelectorAll('.nav-item');
navItems.forEach((item) => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    navItems.forEach((entry) => entry.classList.remove('active'));
    item.classList.add('active');
    const label = item.dataset.nav || item.textContent.trim();
    showToast(`${label} ready.`);
  });
});

const focusTitle = document.getElementById('focus-title');
const focusMeta = document.getElementById('focus-meta');
const focusValue = document.getElementById('focus-value');
const cards = document.querySelectorAll('[data-card]');

const updateFocusLens = (card) => {
  if (!card || !focusTitle || !focusMeta || !focusValue) {
    return;
  }
  const title = card.querySelector('h4')?.textContent || 'Selected card';
  const meta = card.querySelector('.meta')?.textContent || 'Updated just now';
  const value = card.querySelector('.value')?.textContent || '—';
  focusTitle.textContent = title;
  focusMeta.textContent = meta;
  focusValue.textContent = value;
};

const selectCard = (card) => {
  cards.forEach((entry) => entry.classList.remove('is-selected'));
  card.classList.add('is-selected');
  updateFocusLens(card);
};

cards.forEach((card) => {
  card.addEventListener('click', () => selectCard(card));
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectCard(card);
    }
  });
  card.addEventListener('dragstart', (event) => event.preventDefault());
});

const chartBars = document.querySelectorAll('.chart .bar');
const chartNote = document.getElementById('chart-note');

const highlightBar = (bar) => {
  chartBars.forEach((entry) => entry.classList.remove('is-active'));
  bar.classList.add('is-active');
  const day = bar.dataset.day || 'Today';
  const value = bar.dataset.value || '0';
  if (chartNote) {
    chartNote.textContent = `${day} · ${value}% activity`;
  }
};

chartBars.forEach((bar) => {
  bar.addEventListener('click', () => highlightBar(bar));
  bar.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      highlightBar(bar);
    }
  });
});

const MUSIC_FEED_URL = 'https://itunes.apple.com/us/rss/topsongs/limit=6/xml';
const musicList = document.getElementById('music-list');
const musicStatus = document.getElementById('music-status');
const fallbackTracks = [
  { title: 'Starlight Avenue', artist: 'Luna Park' },
  { title: 'Golden Hour', artist: 'Atlas Drive' },
  { title: 'Neon Skies', artist: 'Aurora Lane' },
  { title: 'Cloudline', artist: 'Echo North' },
  { title: 'Bloom', artist: 'Riverstone' },
  { title: 'Velvet Run', artist: 'Nova & Co.' }
];

const renderMusicList = (tracks) => {
  if (!musicList) {
    return;
  }
  musicList.innerHTML = '';
  tracks.forEach((track, index) => {
    const item = document.createElement('div');
    item.className = 'music-item';
    const textWrap = document.createElement('div');
    const titleEl = track.url ? document.createElement('a') : document.createElement('span');
    titleEl.className = 'item-title music-link';
    titleEl.textContent = track.title;
    if (track.url) {
      titleEl.href = track.url;
      titleEl.target = '_blank';
      titleEl.rel = 'noopener';
    }
    const artistEl = document.createElement('p');
    artistEl.className = 'meta';
    artistEl.textContent = track.artist;
    textWrap.append(titleEl, artistEl);
    const rank = document.createElement('span');
    rank.className = 'pill';
    rank.textContent = `#${index + 1}`;
    item.append(textWrap, rank);
    musicList.append(item);
  });
};

const setMusicStatus = (message) => {
  if (musicStatus) {
    musicStatus.textContent = message;
  }
};

const ITUNES_NAMESPACE = 'http://itunes.apple.com/rss';

const readNamespaceValue = (entry, tagName) =>
  entry.getElementsByTagNameNS(ITUNES_NAMESPACE, tagName)[0]?.textContent;

const parseFeed = (xml) =>
  Array.from(xml.querySelectorAll('entry')).map((entry) => {
    const title =
      readNamespaceValue(entry, 'name') || entry.querySelector('title')?.textContent || 'Unknown track';
    const artist =
      readNamespaceValue(entry, 'artist') || entry.querySelector('artist')?.textContent || 'Unknown artist';
    const url = entry.querySelector('link[rel="alternate"]')?.getAttribute('href') || '';
    return { title, artist, url };
  });

const fetchMusicFeed = async (announce = false) => {
  if (!musicList) {
    return;
  }
  setMusicStatus('Fetching RSS feed...');
  try {
    const response = await fetch(MUSIC_FEED_URL);
    if (!response.ok) {
      throw new Error('Feed request failed');
    }
    const text = await response.text();
    const xml = new DOMParser().parseFromString(text, 'text/xml');
    const tracks = parseFeed(xml);
    if (!tracks.length) {
      throw new Error('No tracks found');
    }
    renderMusicList(tracks);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMusicStatus(`Updated ${timestamp}`);
    if (announce) {
      showToast('Trending music refreshed.');
    }
  } catch (error) {
    renderMusicList(fallbackTracks);
    setMusicStatus('Unable to load feed. Showing saved picks.');
    if (announce) {
      showToast('Music feed unavailable right now.');
    }
  }
};

fetchMusicFeed();

const toggleInputs = document.querySelectorAll('.toggle input');
toggleInputs.forEach((input) => {
  input.addEventListener('change', () => {
    const label =
      input.dataset.label ||
      input.closest('.toggle-row')?.querySelector('.item-title')?.textContent ||
      'Setting';
    showToast(`${label} ${input.checked ? 'enabled' : 'paused'}.`);
  });
});

const actionMessages = {
  'resume-sprint': 'Sprint resumed. Focus mode is on.',
  'share-update': 'Update link copied to clipboard.',
  'view-report': 'Report scheduled for delivery.',
  notifications: 'You are all caught up.',
  'focus-pin': 'Focus pinned to your dashboard.'
};

const actionButtons = document.querySelectorAll('[data-action]');
actionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'refresh-music') {
      fetchMusicFeed(true);
      return;
    }
    if (action === 'integration') {
      const integration = button.dataset.integration || 'Integration';
      const isConnected = !button.classList.contains('is-connected');
      setIntegrationState(button, isConnected);
      integrationState[integration] = isConnected;
      localStorage.setItem('integrations', JSON.stringify(integrationState));
      showToast(`${integration} ${isConnected ? 'connected' : 'disconnected'}.`);
      return;
    }
    if (action === 'notifications') {
      button.querySelector('.dot')?.remove();
    }
    if (action === 'resume-sprint' && focusPill) {
      focusPill.classList.add('is-active');
      focusPill.textContent = 'Focus mode active';
    }
    if (action === 'focus-pin' && focusTitle) {
      const current = focusTitle.textContent || '';
      if (current === 'No card selected') {
        showToast('Select a card to pin.');
        return;
      }
    }
    showToast(actionMessages[action] || 'Action confirmed.');
  });
});

const highlightMatches = (query) => {
  const matches = [];
  const normalized = query.toLowerCase();
  const targets = document.querySelectorAll('.card h4, .item-title, .music-link');
  targets.forEach((target) => {
    if (target.textContent.toLowerCase().includes(normalized)) {
      target.classList.add('text-highlight');
      matches.push(target);
    }
  });
  if (matches.length) {
    setTimeout(() => {
      matches.forEach((target) => target.classList.remove('text-highlight'));
    }, 1600);
  }
  return matches.length;
};

if (searchInput) {
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const query = searchInput.value.trim();
      if (!query) {
        showToast('Start typing to search.');
        return;
      }
      const safeQuery = query.replace(/[<>]/g, '');
      const results = highlightMatches(safeQuery);
      showToast(
        results
          ? `${results} match${results === 1 ? '' : 'es'} highlighted.`
          : `No matches for "${safeQuery}".`
      );
    }
  });
}
