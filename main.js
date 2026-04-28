import html2canvas from 'html2canvas';

// =========================================
// DATA
// =========================================
const ZODIAC_DATA = [
  { id: 'aries', name: 'Aries', symbol: '♈', date: 'Mar 21 - Apr 19', element: 'fire',
    stars: [[30,20],[40,50],[60,60],[70,40]] },
  { id: 'taurus', name: 'Taurus', symbol: '♉', date: 'Apr 20 - May 20', element: 'earth',
    stars: [[20,40],[40,60],[60,40],[70,20],[80,50]] },
  { id: 'gemini', name: 'Gemini', symbol: '♊', date: 'May 21 - Jun 20', element: 'air',
    stars: [[30,30],[30,70],[70,30],[70,70],[50,50]] },
  { id: 'cancer', name: 'Cancer', symbol: '♋', date: 'Jun 21 - Jul 22', element: 'water',
    stars: [[40,30],[60,30],[50,50],[40,70],[60,70]] },
  { id: 'leo', name: 'Leo', symbol: '♌', date: 'Jul 23 - Aug 22', element: 'fire',
    stars: [[30,60],[40,40],[60,30],[80,50],[70,70],[50,60]] },
  { id: 'virgo', name: 'Virgo', symbol: '♍', date: 'Aug 23 - Sep 22', element: 'earth',
    stars: [[20,30],[40,50],[60,40],[80,30],[70,60],[50,80]] },
  { id: 'libra', name: 'Libra', symbol: '♎', date: 'Sep 23 - Oct 22', element: 'air',
    stars: [[30,50],[50,30],[70,50],[50,70]] },
  { id: 'scorpio', name: 'Scorpio', symbol: '♏', date: 'Oct 23 - Nov 21', element: 'water',
    stars: [[20,50],[40,40],[60,40],[80,60],[90,40],[70,80]] },
  { id: 'sagittarius', name: 'Sagittarius', symbol: '♐', date: 'Nov 22 - Dec 21', element: 'fire',
    stars: [[20,80],[40,60],[60,40],[80,20],[70,50],[50,70]] },
  { id: 'capricorn', name: 'Capricorn', symbol: '♑', date: 'Dec 22 - Jan 19', element: 'earth',
    stars: [[30,40],[50,20],[70,40],[60,60],[40,70]] },
  { id: 'aquarius', name: 'Aquarius', symbol: '♒', date: 'Jan 20 - Feb 18', element: 'air',
    stars: [[20,40],[40,30],[60,40],[80,30],[30,70],[50,60],[70,70]] },
  { id: 'pisces', name: 'Pisces', symbol: '♓', date: 'Feb 19 - Mar 20', element: 'water',
    stars: [[30,30],[50,50],[30,70],[70,30],[60,50],[70,70]] }
];

let selectedSign = null;
let lastClickedSignId = null;
let scamHistory = JSON.parse(localStorage.getItem('zodiac_scam_history')) || [];
let countdownTimer = null;
let countdownSeconds = 0;

// =========================================
// AUDIO SYSTEM (Web Audio API)
// =========================================
let audioCtx = null;
let isMuted = true;
let droneOsc1, droneOsc2, masterGain;

function initAudio() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  
  masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
  masterGain.gain.value = 0.5;

  // Ominous Drone
  droneOsc1 = audioCtx.createOscillator();
  droneOsc1.type = 'sine';
  droneOsc1.frequency.value = 60;
  
  droneOsc2 = audioCtx.createOscillator();
  droneOsc2.type = 'sine';
  droneOsc2.frequency.value = 90;

  const droneGain = audioCtx.createGain();
  droneGain.gain.value = 0.3;
  
  droneOsc1.connect(droneGain);
  droneOsc2.connect(droneGain);
  droneGain.connect(masterGain);
  
  droneOsc1.start();
  droneOsc2.start();
}

function playSiren() {
  if (isMuted || !audioCtx) return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(masterGain);
  
  const now = audioCtx.currentTime;
  osc.frequency.setValueAtTime(440, now);
  
  // 2 cycles of siren sweep
  osc.frequency.linearRampToValueAtTime(880, now + 0.5);
  osc.frequency.linearRampToValueAtTime(440, now + 1.0);
  osc.frequency.linearRampToValueAtTime(880, now + 1.5);
  osc.frequency.linearRampToValueAtTime(440, now + 2.0);
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
  gain.gain.setValueAtTime(0.5, now + 1.9);
  gain.gain.linearRampToValueAtTime(0, now + 2.0);
  
  osc.start(now);
  osc.stop(now + 2.0);
}

function playTick() {
  if (isMuted || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(masterGain);
  
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
  
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.05);
}

document.getElementById('btn-audio').addEventListener('click', (e) => {
  if (!audioCtx) initAudio();
  isMuted = !isMuted;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  e.target.textContent = isMuted ? '⭐ Mute' : '🔊 Playing';
});


// =========================================
// CANVAS CONSTELLATIONS
// =========================================
const canvas = document.getElementById('constellation-canvas');
const ctx = canvas.getContext('2d');
let cw, ch;

function resizeCanvas() {
  cw = canvas.width = window.innerWidth;
  ch = canvas.height = window.innerHeight;
  drawBackgroundStars();
}
window.addEventListener('resize', resizeCanvas);

function drawBackgroundStars() {
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = '#ffffff';
  for(let i = 0; i < 200; i++) {
    const x = Math.random() * cw;
    const y = Math.random() * ch;
    const r = Math.random() * 1.5;
    ctx.globalAlpha = Math.random() * 0.5 + 0.1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

let drawingProgress = 0;
let animFrame;
function drawConstellation(signObj) {
  cancelAnimationFrame(animFrame);
  drawingProgress = 0;
  
  function animateLines() {
    drawBackgroundStars();
    
    const pts = signObj.stars.map(p => ({
      x: (p[0] / 100) * cw,
      y: (p[1] / 100) * ch
    }));

    ctx.strokeStyle = 'rgba(255,215,0,0.5)';
    ctx.lineWidth = 1.5;
    
    // Draw lines up to progress
    const totalLines = pts.length - 1;
    const currentLineIdx = Math.floor(drawingProgress * totalLines);
    
    ctx.beginPath();
    if(pts.length > 0) ctx.moveTo(pts[0].x, pts[0].y);
    
    for(let i=0; i < currentLineIdx; i++) {
      ctx.lineTo(pts[i+1].x, pts[i+1].y);
    }
    
    // Partial next line
    if(currentLineIdx < totalLines) {
      const p1 = pts[currentLineIdx];
      const p2 = pts[currentLineIdx+1];
      const fraction = (drawingProgress * totalLines) - currentLineIdx;
      const curX = p1.x + (p2.x - p1.x) * fraction;
      const curY = p1.y + (p2.y - p1.y) * fraction;
      ctx.lineTo(curX, curY);
    }
    
    ctx.stroke();
    
    // Draw stars
    ctx.fillStyle = '#fff';
    pts.forEach((p, i) => {
      if(i <= currentLineIdx + 1) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffd700';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });

    drawingProgress += 0.02;
    if(drawingProgress <= 1) {
      animFrame = requestAnimationFrame(animateLines);
    }
  }
  animateLines();
}

// =========================================
// UI INITIALIZATION & LOGIC
// =========================================
function renderGrid() {
  const grid = document.getElementById('zodiac-grid');
  grid.innerHTML = ZODIAC_DATA.map(sign => `
    <div class="zodiac-card ${sign.element}" data-id="${sign.id}">
      <span class="zodiac-symbol">${sign.symbol}</span>
      <div class="zodiac-name">${sign.name}</div>
      <div class="zodiac-date">${sign.date}</div>
      <span class="element-badge">${sign.element}</span>
    </div>
  `).join('');

  document.querySelectorAll('.zodiac-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      
      // Easter egg double click
      if (lastClickedSignId === id && selectedSign && selectedSign.id === id) {
        alert("You already know. The scam is already in progress. 👁️");
        return;
      }
      
      document.querySelectorAll('.zodiac-card').forEach(c => c.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
      
      selectedSign = ZODIAC_DATA.find(s => s.id === id);
      lastClickedSignId = id;
      
      document.getElementById('btn-reveal').disabled = false;
      drawConstellation(selectedSign);
      
      if (!audioCtx) initAudio();
    });
  });
}

function updateHistoryUI() {
  document.getElementById('scam-count').textContent = scamHistory.length;
  const histContainer = document.getElementById('history-container');
  if (scamHistory.length === 0) {
    histContainer.innerHTML = '<p style="text-align:center;color:#888;">No cosmic scams uncovered yet.</p>';
    return;
  }
  
  histContainer.innerHTML = scamHistory.slice().reverse().map(scam => `
    <div class="history-item">
      <div class="history-item-header">
        <span>${scam.signSymbol} ${scam.signName}</span>
        <span style="color:#f97316;">${scam.alertTitle}</span>
      </div>
      <div class="history-item-desc">${scam.scamDescription}</div>
    </div>
  `).join('');
}

// =========================================
// MOCK CLAUDE API
// =========================================
async function generateScam(signObj) {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 3000));
  
  // Easter egg: Scorpio is always extinction
  if (signObj.id === 'scorpio') {
    return {
      alertTitle: 'COSMIC LEVEL: EXTINCTION',
      scamDescription: 'The universe has collectively decided it is done with your intense, brooding energy. A black hole disguised as a misunderstood indie poet is heading straight for your location.',
      vulnerability: 'your inability to let go of grudges makes you susceptible to literal gravitational collapse.',
      worstDay: 'Tuesday at 3:33 AM',
      safetyTip: 'Apologize to someone you wronged in 2012. Do it now.',
      reportTo: 'Intergalactic Emotional Baggage Claim',
      scammerAlias: 'The Void LLC',
      countdownHours: 12
    };
  }

  // Generic Mock logic based on traits
  const traits = {
    aries: { trait: "impulsive aggression", thing: "fake martial arts tournaments" },
    taurus: { trait: "stubborn materialism", thing: "counterfeit luxury bedsheets" },
    gemini: { trait: "two-faced gossiping", thing: "a pyramid scheme run by your evil twin" },
    cancer: { trait: "extreme emotional attachment", thing: "paying ransom for a stuffed animal" },
    leo: { trait: "need for constant validation", thing: "buying fake Instagram followers who steal your identity" },
    virgo: { trait: "neurotic perfectionism", thing: "a subscription service for organizing paperclips" },
    libra: { trait: "crippling indecisiveness", thing: "being trapped in a loop choosing a Netflix show until you perish" },
    sagittarius: { trait: "reckless wanderlust", thing: "a one-way ticket to a fake dimension" },
    capricorn: { trait: "ruthless ambition", thing: "a promotion to CEO of a company that doesn't exist" },
    aquarius: { trait: "alienating contrarianism", thing: "being abducted by aliens who find you annoying" },
    pisces: { trait: "delusional daydreaming", thing: "buying real estate in a dream you had last night" }
  };

  const t = traits[signObj.id] || traits['aries'];
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const day = days[Math.floor(Math.random()*days.length)];
  const hours = Math.floor(Math.random() * (168 - 12 + 1)) + 12;

  return {
    alertTitle: `COSMIC SCAM ALERT: ${signObj.name.toUpperCase()}`,
    scamDescription: `The universe is organizing a highly targeted operation against you. Beware of a suspiciously charismatic stranger offering you exactly what you want.`,
    vulnerability: `your ${t.trait} makes you susceptible to ${t.thing}.`,
    worstDay: `${day} afternoon`,
    safetyTip: `Do not make eye contact with pigeons. Walk backwards through doorways.`,
    reportTo: `Bureau of Existential Dread`,
    scammerAlias: `The Cosmos Operating As: Not A Scam LLC`,
    countdownHours: hours
  };
}

// =========================================
// ACTION LOGIC
// =========================================
document.getElementById('btn-reveal').addEventListener('click', async () => {
  if (!selectedSign) return;
  
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  // Loading Overlay
  const loading = document.getElementById('loading-overlay');
  const starsContainer = document.getElementById('loading-stars');
  loading.classList.remove('hidden');
  starsContainer.innerHTML = '';
  
  // Rapid stars animation
  const starInterval = setInterval(() => {
    const star = document.createElement('div');
    star.style.position = 'absolute';
    star.style.left = Math.random() * 100 + 'vw';
    star.style.top = Math.random() * 100 + 'vh';
    star.style.width = Math.random() * 3 + 'px';
    star.style.height = star.style.width;
    star.style.background = '#fff';
    star.style.borderRadius = '50%';
    star.style.boxShadow = '0 0 10px #fff';
    starsContainer.appendChild(star);
  }, 50);

  // Fetch from Mock API
  const scamData = await generateScam(selectedSign);
  
  clearInterval(starInterval);
  loading.classList.add('hidden');
  
  // Populate Alert Modal
  document.getElementById('alert-title').textContent = scamData.alertTitle;
  document.getElementById('alert-desc').textContent = scamData.scamDescription;
  document.getElementById('alert-vuln').textContent = scamData.vulnerability;
  document.getElementById('alert-day').textContent = scamData.worstDay;
  document.getElementById('alert-alias').textContent = scamData.scammerAlias;
  document.getElementById('alert-safety').textContent = scamData.safetyTip;
  document.getElementById('alert-report').textContent = scamData.reportTo;
  
  // Setup Countdown
  countdownSeconds = scamData.countdownHours * 3600;
  updateCountdownDisplay();
  
  if(countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdownSeconds--;
    updateCountdownDisplay();
    playTick();
    if(countdownSeconds <= 0) clearInterval(countdownTimer);
  }, 1000);

  // Play Siren
  playSiren();
  
  // Show Modal
  document.getElementById('alert-modal').classList.remove('hidden');
  
  // Save History
  const histItem = {
    ...scamData,
    signName: selectedSign.name,
    signSymbol: selectedSign.symbol,
    dateStamp: new Date().toISOString()
  };
  scamHistory.push(histItem);
  localStorage.setItem('zodiac_scam_history', JSON.stringify(scamHistory));
  updateHistoryUI();
});

function updateCountdownDisplay() {
  const h = Math.floor(countdownSeconds / 3600);
  const m = Math.floor((countdownSeconds % 3600) / 60);
  const s = countdownSeconds % 60;
  document.getElementById('alert-countdown').textContent = 
    `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

document.getElementById('btn-dismiss').addEventListener('click', () => {
  document.getElementById('alert-modal').classList.add('hidden');
  if(countdownTimer) clearInterval(countdownTimer);
});

// Canvas Export / Share
document.getElementById('btn-share').addEventListener('click', async () => {
  const btn = document.getElementById('btn-share');
  btn.textContent = "Processing...";
  
  // Hide buttons for screenshot
  const footer = document.querySelector('.alert-footer');
  footer.style.display = 'none';
  
  const card = document.getElementById('alert-card');
  
  try {
    const canvas = await html2canvas(card, {
      backgroundColor: '#f97316',
      scale: 2
    });
    
    // Restore footer
    footer.style.display = 'flex';
    btn.textContent = "😱 Share This Warning";
    
    // Create download link
    const link = document.createElement('a');
    link.download = `zodiac-scam-${selectedSign.name.toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
  } catch(e) {
    console.error("Export failed", e);
    footer.style.display = 'flex';
    btn.textContent = "Failed ❌";
    setTimeout(() => btn.textContent = "😱 Share This Warning", 2000);
  }
});

// Premium Button
document.getElementById('btn-premium').addEventListener('click', () => {
  const msg = document.getElementById('premium-message');
  msg.textContent = "Processing payment...";
  msg.classList.remove('hidden');
  
  setTimeout(() => {
    msg.textContent = "Just kidding. There is no protection. The universe always wins.";
  }, 2000);
});


// Init
resizeCanvas();
renderGrid();
updateHistoryUI();
