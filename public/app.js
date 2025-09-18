const form = document.getElementById('analyze-form');
const input = document.getElementById('video-url');
const resultsSection = document.getElementById('results');
const statusSection = document.getElementById('status');
const durationField = document.getElementById('duration');
const audioList = document.getElementById('audio-tracks');
const textList = document.getElementById('text-tracks');
const screenshotsContainer = document.getElementById('screenshots');

function setStatus(message, isError = false) {
  if (!message) {
    statusSection.hidden = true;
    statusSection.textContent = '';
    statusSection.classList.remove('error');
    return;
  }

  statusSection.hidden = false;
  statusSection.textContent = message;
  statusSection.classList.toggle('error', isError);
}

function renderTracks(listElement, tracks, emptyMessage) {
  listElement.innerHTML = '';

  if (!tracks || tracks.length === 0) {
    const li = document.createElement('li');
    li.textContent = emptyMessage;
    listElement.appendChild(li);
    return;
  }

  for (const track of tracks) {
    const li = document.createElement('li');
    const parts = [];
    if (track.label) parts.push(track.label);
    if (track.language) parts.push(`(${track.language})`);
    if (typeof track.enabled === 'boolean') {
      parts.push(track.enabled ? 'activ\u00e9e' : 'inactive');
    }
    if (track.kind) {
      parts.push(`type: ${track.kind}`);
    }
    li.textContent = parts.join(' \u2013 ');
    listElement.appendChild(li);
  }
}

function renderScreenshots(screenshots) {
  screenshotsContainer.innerHTML = '';

  if (!screenshots || screenshots.length === 0) {
    const info = document.createElement('p');
    info.textContent = 'Aucune capture disponible.';
    screenshotsContainer.appendChild(info);
    return;
  }

  for (const shot of screenshots) {
    const card = document.createElement('article');
    card.className = 'screenshot-card';

    const title = document.createElement('h4');
    title.textContent = shot.label;

    const time = document.createElement('time');
    time.dateTime = shot.timecode;
    time.textContent = `Position : ${shot.timecode}`;

    const img = document.createElement('img');
    img.src = `data:image/png;base64,${shot.image}`;
    img.alt = `Capture ${shot.label}`;

    card.append(title, time, img);
    screenshotsContainer.appendChild(card);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const url = input.value.trim();
  if (!url) {
    setStatus('Veuillez entrer une URL.', true);
    return;
  }

  form.querySelector('button').disabled = true;
  setStatus('Analyse en cours\u2026');
  resultsSection.hidden = true;

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Erreur inconnue.');
    }

    durationField.textContent = `${payload.duration} (${payload.durationSeconds.toFixed(2)}s)`;
    renderTracks(audioList, payload.audioTracks, 'Aucune piste audio d\u00e9tect\u00e9e.');
    renderTracks(textList, payload.textTracks, 'Aucun sous-titre disponible.');
    renderScreenshots(payload.screenshots);

    resultsSection.hidden = false;
    setStatus('Analyse termin\u00e9e avec succ\u00e8s.');
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Echec de l'analyse.", true);
  } finally {
    form.querySelector('button').disabled = false;
  }
});
