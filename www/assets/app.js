// Voice assistant logic for the Capacitor Android app.
// Wake phrase: G.P.T. Example utterance: "G.P.T what time is it".

const statusEl = document.getElementById('status');
const lastEl = document.getElementById('last');
const assistantEl = document.getElementById('assistant');
const toggleBtn = document.getElementById('toggle');

const WAKE_WORDS = ['g.p.t', 'g p t', 'gpt'];
let listening = false;
let recognition = null;

function setStatus(text, cls = 'idle') {
  statusEl.textContent = 'Status: ' + text;
  statusEl.className = 'status ' + cls;
}

function speak(text) {
  assistantEl.textContent = text;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function tryHandleLocalCommand(query) {
  const q = query.toLowerCase().trim();
  if (q.includes('time')) {
    const now = new Date();
    const timestr = now.toLocaleTimeString();
    speak(`The time is ${timestr}`);
    return true;
  }
  return false;
}

async function sendToServer(query) {
  setStatus('Sending to AI...', 'idle');
  try {
    const API_URL = 'https://your-server.example.com/api/chat';
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status} ${text}`);
    }

    const { reply } = await res.json();
    speak(reply);
  } catch (err) {
    console.error(err);
    speak("Sorry, I couldn't reach the AI server.");
    setStatus('Error calling server', 'idle');
  }
}

function extractUserQuery(fullTranscript) {
  const t = fullTranscript.toLowerCase();
  for (const w of WAKE_WORDS) {
    const idx = t.indexOf(w);
    if (idx !== -1) {
      const after = fullTranscript.slice(idx + w.length).trim();
      return after;
    }
  }
  return null;
}

function handleTranscript(transcript, isFinal) {
  lastEl.textContent = transcript;
  const userQuery = extractUserQuery(transcript);
  if (userQuery && userQuery.length > 0 && isFinal) {
    setStatus(`Heard wake word + query: "${userQuery}"`, 'listening');
    if (!tryHandleLocalCommand(userQuery)) {
      sendToServer(userQuery);
    }
  }
}

function startRecognition() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    alert('SpeechRecognition is not available in this browser. Use Android WebView with supported speech support, or add native Android speech APIs.');
    return;
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  let cumulative = '';

  recognition.onstart = () => {
    listening = true;
    setStatus('Listening (say "G.P.T")', 'listening');
    toggleBtn.textContent = 'Stop Listening';
  };

  recognition.onerror = (e) => {
    console.error('recognition error', e);
    setStatus('Recognition error', 'idle');
  };

  recognition.onend = () => {
    listening = false;
    setStatus('Idle', 'idle');
    toggleBtn.textContent = 'Start Listening';
  };

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const res = event.results[i];
      if (res.isFinal) final += res[0].transcript + ' ';
      else interim += res[0].transcript + ' ';
    }

    const transcript = (cumulative + final + interim).trim();
    handleTranscript(transcript, final.trim().length > 0);

    if (final) {
      cumulative += final;
    }
  };

  recognition.start();
}

function stopRecognition() {
  if (recognition) {
    recognition.onend = null;
    recognition.stop();
    recognition = null;
  }
  listening = false;
  setStatus('Idle', 'idle');
  toggleBtn.textContent = 'Start Listening';
}

toggleBtn.addEventListener('click', () => {
  if (!listening) startRecognition();
  else stopRecognition();
});

setStatus('Idle', 'idle');
