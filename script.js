/* ===== THREE.JS background, cursor, card tilt and marquee ===== */

// Initialize Lucide vector icons
try {
  lucide.createIcons();
} catch (e) {}

// 1. THREE.JS 3D NEURAL CONSTELLATION
// If the Three.js CDN fails to load, keep the rest of the site working: use an inert stand-in and skip the animation loop.
const HAS_THREE = typeof THREE !== 'undefined';
if (!HAS_THREE) {
  const inert = () => new Proxy(function () {}, {
    get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : inert()),
    apply: () => inert(),
    construct: () => inert(),
    set: () => true
  });
  window.THREE = new Proxy({}, { get: () => function () { return inert(); } });
}
const canvas = document.getElementById('neuralCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.z = 400;

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const particleCount = innerWidth < 800 ? 70 : 140;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const velocities = [];

for (let i = 0; i < particleCount * 3; i += 3) {
  positions[i] = (Math.random() - 0.5) * 850;
  positions[i + 1] = (Math.random() - 0.5) * 650;
  positions[i + 2] = (Math.random() - 0.5) * 400;

  velocities.push({
    x: (Math.random() - 0.5) * 0.45,
    y: (Math.random() - 0.5) * 0.45,
    z: (Math.random() - 0.5) * 0.3
  });
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const pMaterial = new THREE.PointsMaterial({
  color: 0x0A0908,
  size: 3.5,
  transparent: true,
  opacity: 0.9
});

const particles = new THREE.Points(geometry, pMaterial);
scene.add(particles);

// Line connections between nearby particles
const lineMaterial = new THREE.LineBasicMaterial({
  color: 0x0A0908,
  transparent: true,
  opacity: 0.32
});

const LMAX = particleCount * 6;
const lbuf = new Float32Array(LMAX * 6);
const lgeo = new THREE.BufferGeometry();

lgeo.setAttribute('position', new THREE.BufferAttribute(lbuf, 3));
lgeo.attributes.position.setUsage(THREE.DynamicDrawUsage);

const lineSeg = new THREE.LineSegments(lgeo, lineMaterial);
lineSeg.frustumCulled = false;
scene.add(lineSeg);

let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animateThree() {
  requestAnimationFrame(animateThree);

  if (document.hidden) return;

  targetX = mouseX * 0.0003;
  targetY = mouseY * 0.0003;

  particles.rotation.y += 0.0008;
  particles.rotation.x += (targetY - particles.rotation.x) * 0.05;
  particles.rotation.y += (targetX - particles.rotation.y) * 0.05;

  const pos = particles.geometry.attributes.position.array;

  for (let i = 0; i < particleCount; i++) {
    pos[i * 3] += velocities[i].x;
    pos[i * 3 + 1] += velocities[i].y;
    pos[i * 3 + 2] += velocities[i].z;

    if (pos[i * 3] < -425 || pos[i * 3] > 425) velocities[i].x *= -1;
    if (pos[i * 3 + 1] < -325 || pos[i * 3 + 1] > 325) velocities[i].y *= -1;
    if (pos[i * 3 + 2] < -200 || pos[i * 3 + 2] > 200) velocities[i].z *= -1;
  }

  particles.geometry.attributes.position.needsUpdate = true;

  if (window.__hv === false) return;

  camera.position.x += (mouseX * 0.06 - camera.position.x) * 0.04;
  camera.position.y += (-mouseY * 0.06 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  let k = 0;

  for (let i = 0; i < particleCount; i++) {
    for (let j = i + 1; j < particleCount; j++) {
      const dx = pos[i * 3] - pos[j * 3];
      const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
      const dz = pos[i * 3 + 2] - pos[j * 3 + 2];

      if (dx * dx + dy * dy + dz * dz < 12100 && k < LMAX) {
        const o = k * 6;
        lbuf[o] = pos[i * 3];
        lbuf[o + 1] = pos[i * 3 + 1];
        lbuf[o + 2] = pos[i * 3 + 2];
        lbuf[o + 3] = pos[j * 3];
        lbuf[o + 4] = pos[j * 3 + 1];
        lbuf[o + 5] = pos[j * 3 + 2];
        k++;
      }
    }
  }

  lgeo.setDrawRange(0, k * 2);
  lgeo.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
}

if (HAS_THREE) animateThree();

// 2. GLOBAL CURSOR TRACKING AND SPOTLIGHT
const ambientTorch = document.getElementById('ambientTorch');
const heroSpotlight = document.getElementById('heroSpotlight');
const portraitStage = document.getElementById('portraitStage');

let mmE = null;
let mmR = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX - window.innerWidth / 2;
  mouseY = e.clientY - window.innerHeight / 2;
  mmE = e;

  if (mmR) return;

  mmR = requestAnimationFrame(() => {
    mmR = 0;
    const x = mmE.clientX;
    const y = mmE.clientY;

    ambientTorch.style.setProperty('--cursor-x', `${x}px`);
    ambientTorch.style.setProperty('--cursor-y', `${y}px`);
    heroSpotlight.style.setProperty('--mouse-x', `${x}px`);
    heroSpotlight.style.setProperty('--mouse-y', `${y}px`);
  });
}, { passive: true });

window.addEventListener('mouseleave', () => {
  ambientTorch.style.setProperty('--cursor-x', '-9999px');
  ambientTorch.style.setProperty('--cursor-y', '-9999px');
  heroSpotlight.style.setProperty('--mouse-x', '-9999px');
  heroSpotlight.style.setProperty('--mouse-y', '-9999px');
});

// 3. 3D CARD TILT AND SPECULAR SHINE
const tiltCards = document.querySelectorAll('.tilt-card, .branch-card');

tiltCards.forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--card-mouse-x', `${x}px`);
    card.style.setProperty('--card-mouse-y', `${y}px`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    card.style.transform =
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform =
      'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  });
});

// 4. MARQUEE TOUCH AND DRAG
const marqueeWrapper = document.getElementById('marqueeWrapper') || document.createElement('div');
const marqueeTrack = document.getElementById('marqueeTrack') || document.createElement('div');

let isDown = false;
let startX;
let scrollLeft;

marqueeWrapper.addEventListener('mousedown', (e) => {
  isDown = true;
  startX = e.pageX - marqueeWrapper.offsetLeft;
  scrollLeft = marqueeWrapper.scrollLeft;
  marqueeTrack.style.animationPlayState = 'paused';
});

marqueeWrapper.addEventListener('mouseleave', () => {
  isDown = false;
  marqueeTrack.style.animationPlayState = 'running';
});

marqueeWrapper.addEventListener('mouseup', () => {
  isDown = false;
  marqueeTrack.style.animationPlayState = 'running';
});

marqueeWrapper.addEventListener('mousemove', (e) => {
  if (!isDown) return;

  e.preventDefault();

  const x = e.pageX - marqueeWrapper.offsetLeft;
  const walk = (x - startX) * 1.5;
  marqueeWrapper.scrollLeft = scrollLeft - walk;
});

marqueeWrapper.addEventListener('touchstart', () => {
  marqueeTrack.style.animationPlayState = 'paused';
}, { passive: true });

marqueeWrapper.addEventListener('touchend', () => {
  marqueeTrack.style.animationPlayState = 'running';
}, { passive: true });

/* PROJECT DETAILS AND SKILLS CONSTELLATION */
(() => {
  const $ = (q, c = document) => c.querySelector(q);
  const $$ = (q, c = document) => [...c.querySelectorAll(q)];

  const P = [
    ['Zepto', ['Dataset', 'SQL cleaning', 'Aggregation', 'Restocking insight'], ['Data Cleaning', 'Filtering']],
    ['Customer', ['Retail data', 'Clean + EDA', 'Power BI dashboards', 'Buying trends'], ['SQL', 'NumPy', 'Matplotlib']],
    ['Zomato', ['User query', 'Keyword / NLP match', 'Restaurant data', 'Response'], ['Machine Learning', 'Keyword Matching']],
    ['RAG', ['User query', 'Embedding', 'Vector search', 'Retrieval', 'Response'], ['Python', 'NLP', 'Embeddings']],
    ['ESP32', ['ESP32 + BMP280', 'Firebase', 'Web interface', 'Temperature analysis'], ['BMP280', 'Arduino IDE', 'HTML']]
  ];

  $$('.project-card').forEach((c) => {
    const h = ($('h3', c) || {}).textContent || '';
    const p = P.find((x) => h.includes(x[0]));
    if (!p) return;

    const gh = $('a[href*="github"]', c);
    const box = gh && gh.parentElement.firstElementChild;

    if (box && box.firstElementChild) {
      const have = box.textContent.toLowerCase();

      p[2].forEach((t) => {
        if (have.includes(t.toLowerCase())) return;

        const n = box.firstElementChild.cloneNode(true);
        n.textContent = t;
        box.appendChild(n);
      });
    }

    const f = document.createElement('div');
    f.className = 'flow';
    f.innerHTML = p[1]
      .map((t, i) => `<b style="animation-delay:${i * 0.9}s">${t}</b>`)
      .join('<i>&rarr;</i>');

    c.appendChild(f);
  });

  const C = [
    ['Programming', ['Python', 'SQL', 'R']],
    ['Analytics', ['Data Cleaning', 'EDA', 'Statistical Analysis', 'Reporting']],
    ['Visualization', ['Power BI', 'Tableau', 'Excel', 'Streamlit']],
    ['Databases', ['MySQL', 'PostgreSQL']],
    ['Libraries', ['Pandas', 'NumPy', 'Scikit-learn', 'PySpark']],
    ['AI and ML', ['Machine Learning', 'NLP', 'LangChain', 'Vector Database']]
  ];

  $('#skList').innerHTML = C.map((c) =>
    `<div class="branch-card rounded-2xl p-5">
      <div class="font-display text-2xl text-[#D6E949] mb-3 uppercase">${c[0]}</div>
      <div class="flex flex-wrap gap-2">
        ${c[1].map((t) => `<span class="skill-leaf rounded-lg px-3 py-1.5 text-xs text-neutral-200">${t}</span>`).join('')}
      </div>
    </div>`
  ).join('');

  const cv = $('#skNet');
  const x = cv.getContext('2d');

  let W, H, mx = -1e3, my = -1e3, t = 0;

  const rs = () => {
    const d = Math.min(devicePixelRatio, 2);
    W = cv.clientWidth;
    H = cv.clientHeight;
    cv.width = W * d;
    cv.height = H * d;
    x.setTransform(d, 0, 0, d, 0, 0);
  };

  rs();
  addEventListener('resize', rs);

  cv.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  });

  cv.addEventListener('pointerleave', () => {
    mx = my = -1e3;
  });

  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pill = (s, px, py, a, hot, big) => {
    x.font = (big ? '700 15px' : '500 12px') + ' Inter,sans-serif';

    const w = x.measureText(s).width + (big ? 36 : 22);
    const h = big ? 38 : 26;
    x.globalAlpha = a;

    const ov = !hot && !big &&
      mx > px - w / 2 && mx < px + w / 2 &&
      my > py - h / 2 && my < py + h / 2;

    const on = hot || ov;

    x.fillStyle = on ? '#D6E949' : '#0A0908';
    x.strokeStyle = on ? '#D6E949' : 'rgba(231,231,233,.7)';
    x.shadowColor = '#D6E949';
    x.shadowBlur = on ? 18 : 0;

    x.beginPath();
    x.roundRect(px - w / 2, py - h / 2, w, h, h / 2);
    x.fill();
    x.stroke();

    x.shadowBlur = 0;
    x.fillStyle = on ? '#0A0908' : '#E7E7E9';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(s, px, py + 1);
    x.globalAlpha = 1;
  };

  const line = (a, b, al, hot) => {
    x.globalAlpha = al;
    x.strokeStyle = hot ? '#D6E949' : 'rgba(231,231,233,.35)';
    x.lineWidth = hot ? 1.6 : 1;
    x.beginPath();
    x.moveTo(a[0], a[1]);
    x.lineTo(b[0], b[1]);
    x.stroke();
    x.globalAlpha = 1;
  };

  const CW = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]];
  const star = Array.from({ length: 80 }, () => [Math.random(), Math.random(), Math.random()]);

  let skVis = true;
  try {
    new IntersectionObserver((e) => {
      skVis = e[0].isIntersecting;
    }).observe(cv);
  } catch (_) {}

  (function L() {
    requestAnimationFrame(L);
    if (!W || !skVis || document.hidden || cv.offsetParent === null) return;

    t += RM ? 0 : 0.004;
    x.clearRect(0, 0, W, H);

    x.fillStyle = '#E7E7E9';
    star.forEach(([a, b, c]) => {
      x.globalAlpha = 0.08 + 0.25 * Math.abs(Math.sin(t * 3 + c * 9));
      x.fillRect(a * W, b * H, 1.4, 1.4);
    });
    x.globalAlpha = 1;

    const cx = W / 2;
    const cy = H / 2;
    const rr = Math.min(W / 3 * 0.34, H / 2 * 0.36);

    const hubs = C.map(([n, sk], i) => {
      const [c, r] = CW[i];
      const hx = W * (0.2 + c * 0.3) + Math.sin(t * 2 + i) * 4;
      const hy = H * (0.27 + r * 0.48) + Math.cos(t * 2.2 + i) * 4;
      const ang = sk.length === 4 ? [-135, -45, 45, 135] : (r ? [90, -30, -150] : [-90, 30, 150]);

      return {
        n,
        p: [hx, hy],
        k: sk.map((s, j) => {
          const a = ang[j] * Math.PI / 180;
          return {
            s,
            p: [
              hx + Math.cos(a) * rr * 1.15 + Math.sin(t * 2.6 + j + i) * 3,
              hy + Math.sin(a) * rr + Math.cos(t * 2.1 + j) * 3
            ]
          };
        })
      };
    });

    [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5]]
      .forEach(([a, b]) => line(hubs[a].p, hubs[b].p, 0.14, false));

    hubs.forEach((h, i) => {
      line([cx, cy], h.p, 0.55, true);
      h.k.forEach((q) => line(h.p, q.p, 0.3, false));

      const u = (t * 0.9 + i * 0.17) % 1;
      x.fillStyle = '#D6E949';
      x.globalAlpha = 0.9;
      x.beginPath();
      x.arc(cx + (h.p[0] - cx) * u, cy + (h.p[1] - cy) * u, 2.4, 0, 6.283);
      x.fill();
      x.globalAlpha = 1;
    });

    hubs.forEach((h) => h.k.forEach((q) => pill(q.s, q.p[0], q.p[1], 0.95, false, false)));
    hubs.forEach((h) => pill(h.n, h.p[0], h.p[1], 1, true, true));
    pill('Data Science', cx, cy, 1, false, true);
  })();

  const cm = $('#copyMail');

  if (cm) {
    cm.onclick = () => {
      const l = $('span', cm);

      navigator.clipboard.writeText('anishaalobo@gmail.com')
        .then(() => {
          l.textContent = 'Copied';
          setTimeout(() => l.textContent = 'Copy email', 1800);
        })
        .catch(() => location.href = 'mailto:anishaalobo@gmail.com');
    };
  }

  if (matchMedia('(hover:hover)').matches) {
    $$('.mag').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
      });

      b.addEventListener('pointerleave', () => {
        b.style.transform = '';
      });
    });
  }

  try {
    lucide.createIcons();
  } catch (e) {}
})();
/* EXPERIENCE, PROJECTS, NAVIGATION, BEYOND THE RESUME AND HANDSHAKE */

try {
  (() => {
    const $ = (q, c = document) => c.querySelector(q);
    const $$ = (q, c = document) => [...c.querySelectorAll(q)];
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mob = innerWidth < 800;

    if (RM) document.documentElement.classList.add('rm');

    // EXPERIENCE: expandable cards
    $$('.exh').forEach((h) => {
      const c = h.parentNode;

      const toggle = () => {
        h.setAttribute('aria-expanded', c.classList.toggle('open'));
      };

      h.addEventListener('click', toggle);

      h.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });

    // PROJECTS: each project owns its own repository URL
    const MP = [
      [
        'AI Hiring Intelligence',
        'SEP 2026',
        'A data analytics project that uses Python, SQL and DuckDB to explore hiring data, identify recruitment trends and generate actionable insights to support data-driven hiring decisions.',
        ['Python', 'SQL', 'DuckDB', 'Data Analysis'],
        'Data Analytics / Business Analytics',
        'https://github.com/Anishaalobo/AI-Hiring-Intelligence',
        'View on GitHub'
      ],
      [
        'India Cost of Living Tracker 2025–2026',
        'OCT 2026',
        'An interactive Tableau dashboard that analyzes essential commodity prices across India, compares current retail prices with historical changes and highlights commodities with notable price increases.',
        ['Tableau', 'Data Analytics', 'Data Visualization'],
        '',
        'https://github.com/Anishaalobo/India_Cost_of_Living_Tracker_2025_2026',
        'View on GitHub'
      ],
      [
        'Customer Shopping Behaviour Analysis',
        'NOV 2025',
        'A retail customer analytics project involving data cleaning, preprocessing and exploratory analysis to uncover purchasing trends and customer behaviour patterns, supported by Power BI dashboards.',
        ['Python', 'SQL', 'Pandas', 'NumPy', 'Power BI', 'Matplotlib'],
        '',
        'https://github.com/Anishaalobo/customer_shopping_behaviour__analysis',
        'View on GitHub'
      ],
      [
        'Zepto SQL Data Analysis',
        'DEC 2025',
        'A SQL-based analysis of Zepto inventory data to investigate product demand, stock availability and product performance, generating insights to support inventory planning and restocking decisions.',
        ['SQL', 'MySQL', 'Excel'],
        'Data Analytics / Inventory Analysis',
        'https://github.com/Anishaalobo/zepto_SQL_data_analysis',
        'View on GitHub'
      ],
      [
        'Zomato Style Chatbot',
        'SEP 2025',
        'An LLM-powered restaurant recommendation chatbot that answers Zomato-related queries using structured restaurant data, keyword matching and an interactive Chainlit interface.',
        ['Python', 'Chainlit', 'Machine Learning'],
        'Conversational AI / NLP',
        'https://github.com/Anishaalobo/zomato-chatbot',
        'View on GitHub'
      ],
      [
        'RAG-Based Medical Chatbot',
        'AUG 2025',
        'An NLP-based medical chatbot built using Retrieval-Augmented Generation (RAG) to retrieve relevant information from medical learning resources and provide context-aware responses with a focus on reducing unsupported answers.',
        ['Python', 'NLP', 'LangChain', 'Streamlit', 'Vector Database'],
        'Generative AI / Natural Language Processing',
        'https://github.com/Anishaalobo/rag-medical-chatbot',
        'View on GitHub'
      ],
      [
        'ESP32-Based Temperature Sensor',
        'APR 2024',
        'An IoT-based temperature monitoring system using an ESP32 and BMP280 sensor to collect readings, transmit data wirelessly and display measurements through a web interface for monitoring temperature variations.',
        ['ESP32', 'Arduino IDE', 'BMP280 Sensor', 'Firebase', 'HTML'],
        'IoT & Embedded Systems',
        'https://github.com/Anishaalobo/esp32-based-temperature-sensor',
        'View on GitHub'
      ]
    ];

    const ring = $('#mwring');

    ring.innerHTML = MP.map((p, i) => `
      <article class="mp">
        <div>
          <div class="md">
            <b>${String(i + 1).padStart(2, '0')}</b>
            <span>${p[1]}</span>
          </div>
          <h3>${p[0]}${p[4] ? `<small>${p[4]}</small>` : ''}</h3>
          <p>${p[2]}</p>
        </div>
        <div>
          <div class="mtl">Tools</div>
          <div class="mchips">${p[3].map(t => `<span>${t}</span>`).join('')}</div>
          <a class="gh2"
             href="${p[5]}"
             target="_blank"
             rel="noopener noreferrer">${p[6]} &#8599;</a>
        </div>
      </article>
    `).join('');

    const mps = $$('.mp');
    const N = mps.length;
    const TH = 360 / N;
    const dts = $$('#mwdots i');
    const st = { a: 0 };

    let R0 = 0;
    let tw = null;
    let tmr = null;
    let hold = false;
    let seen = false;

    const lay = () => {
      R0 = (mps[0].offsetWidth / 2) /
        Math.tan(TH / 2 * Math.PI / 180);

      mps.forEach((m, i) => {
        m.style.transform = `rotateY(${i * TH}deg) translateZ(${R0}px)`;
      });
    };

    /*
     * Only the project nearest the front of the carousel is clickable.
     * Its genuine anchor always retains that project's own repository.
     */
    const setA = (a) => {
      ring.style.transform = `translateZ(${-R0}px) rotateY(${-a * TH}deg)`;

      const active = ((Math.round(a) % N) + N) % N;

      mps.forEach((m, i) => {
        let d = ((i - a) % N + N) % N;
        d = Math.min(d, N - d);

        const isActive = i === active;
        const link = $('a.gh2', m);

        m.classList.toggle('is-active', isActive);
        m.style.pointerEvents = isActive ? 'auto' : 'none';
        m.style.zIndex = isActive ? '50' : '1';

        if (link) {
          link.href = MP[i][5];
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.style.pointerEvents = isActive ? 'auto' : 'none';
        }

        m.style.opacity = Math.max(0.14, 1 - d * 0.62);
        m.style.filter = d > 0.4
          ? `blur(${Math.min(3, d * 1.1)}px) brightness(${Math.max(0.45, 1 - d * 0.28)})`
          : 'none';
      });

      dts.forEach((e, i) => e.classList.toggle('on', i === active));
      placeCta(a, active);
    };

    /*
     * A flat (non-3D) link laid exactly over the front card's button. Hit-testing inside the
     * 3D ring is unreliable for some card angles, so this link always receives the click.
     */
    const cta = document.createElement('a');
    cta.id = 'mwcta';
    cta.target = '_blank';
    cta.rel = 'noopener noreferrer';
    cta.tabIndex = -1;
    $('#projects').appendChild(cta);

    let ctaIdx = -1;
    const placeCta = (a, active) => {
      const settled = Math.abs(a - Math.round(a)) < 0.02;
      if (!settled) { cta.style.display = 'none'; return; }
      const btn = $('a.gh2', mps[active]);
      if (!btn) { cta.style.display = 'none'; return; }
      const s = $('#projects').getBoundingClientRect();
      const r = btn.getBoundingClientRect();
      cta.href = MP[active][5];
      cta.setAttribute('aria-label', `${MP[active][6] || 'View on GitHub'}: ${MP[active][0]}`);
      cta.style.cssText = `display:block;left:${r.left - s.left}px;top:${r.top - s.top}px;width:${r.width}px;height:${r.height}px`;
      ctaIdx = active;
    };
    cta.addEventListener('pointerenter', () => { if (ctaIdx > -1) $('a.gh2', mps[ctaIdx]).classList.add('is-hover'); });
    cta.addEventListener('pointerleave', () => mps.forEach((m) => $('a.gh2', m).classList.remove('is-hover')));

    const go = (n) => {
      if (tw) tw.kill();

      tw = gsap.to(st, {
        a: n,
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: () => setA(st.a),
        onComplete: () => setA(st.a)
      });
    };

    let pauseUntil = 0;

    const loop = () => {
      clearTimeout(tmr);

      tmr = setTimeout(() => {
        if (!hold && seen && Date.now() > pauseUntil) {
          go(Math.round(st.a) + 1);
        }

        loop();
      }, 4200);
    };

    const nudge = (d) => {
      go(Math.round(st.a) + d);
      pauseUntil = Date.now() + 7000;
      loop();
    };

    if (!RM) {
      lay();
      setA(0);

      addEventListener('resize', () => {
        lay();
        setA(st.a);
      });

      const pj = $('#projects');

      new IntersectionObserver((e) => {
        seen = e[0].isIntersecting;
      }, { threshold: 0.35 }).observe(pj);

      dts.forEach((d, i) => {
        d.addEventListener('click', () => {
          const c = Math.round(st.a);
          let df = ((i - c) % N + N) % N;

          if (df > N / 2) df -= N;

          go(c + df);
          pauseUntil = Date.now() + 7000;
          loop();
        });
      });

      const mw = $('.mw');
      let dg = null;
      let moved = false;

      mw.style.touchAction = 'pan-y';
      mw.style.cursor = 'grab';

      // Do not start a drag when the user presses a real link or button.
      mw.addEventListener('pointerdown', (e) => {
        if (e.button > 0 ||
            (e.target.closest && e.target.closest('a,button,[role=button]'))) {
          return;
        }

        dg = {
          x: e.clientX,
          y: e.clientY,
          a: st.a,
          id: e.pointerId,
          on: false
        };
      });

      addEventListener('pointermove', (e) => {
        if (!dg || e.pointerId !== dg.id) return;

        const dx = e.clientX - dg.x;
        const dy = e.clientY - dg.y;

        if (!dg.on) {
          if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;

          dg.on = true;
          moved = true;

          if (tw) tw.kill();
          clearTimeout(tmr);

          try {
            mw.setPointerCapture(e.pointerId);
          } catch (_) {}

          mw.style.cursor = 'grabbing';
        }

        st.a = dg.a - dx / (mps[0].offsetWidth * 0.85);
        setA(st.a);
      });

      const endDrag = (e) => {
        if (!dg || (e && e.pointerId !== dg.id)) return;

        const d = dg;
        dg = null;
        mw.style.cursor = 'grab';

        if (!d.on) return;

        const dx = (e ? e.clientX : d.x) - d.x;
        let n = Math.round(st.a);

        if (Math.abs(dx) > 40 && n === Math.round(d.a)) {
          n += dx < 0 ? 1 : -1;
        }

        go(n);
        pauseUntil = Date.now() + 7000;
        loop();

        setTimeout(() => {
          moved = false;
        }, 50);
      };

      addEventListener('pointerup', endDrag);
      addEventListener('pointercancel', endDrag);

      mw.addEventListener('click', (e) => {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      mw.addEventListener('dragstart', (e) => e.preventDefault());

      // Trackpad horizontal swipe and Shift+wheel
      let wacc = 0;
      let wlock = 0;

      mw.addEventListener('wheel', (e) => {
        const h = Math.abs(e.deltaX) > Math.abs(e.deltaY)
          ? e.deltaX
          : (e.shiftKey ? e.deltaY : 0);

        if (!h) return;

        e.preventDefault();

        const now = Date.now();
        if (now < wlock) return;

        wacc += h;

        if (Math.abs(wacc) > 50) {
          nudge(wacc > 0 ? 1 : -1);
          wacc = 0;
          wlock = now + 650;
        }

        clearTimeout(mw._w);
        mw._w = setTimeout(() => wacc = 0, 200);
      }, { passive: false });

      addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '') ||
            e.metaKey || e.ctrlKey || e.altKey) return;

        const r = pj.getBoundingClientRect();
        const vh = innerHeight;
        const vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);

        if (vis < vh * 0.4) return;

        e.preventDefault();
        nudge(e.key === 'ArrowRight' ? 1 : -1);
      });

      const pv = $('#mwprev');
      const nx = $('#mwnext');

      if (pv) pv.addEventListener('click', () => nudge(-1));
      if (nx) nx.addEventListener('click', () => nudge(1));

      loop();
    }

    // NAVIGATION: smooth vertical scroll
    let sAnim = 0;
    const stopAnim = () => { sAnim++; };

    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) => {
      addEventListener(ev, stopAnim, { passive: true });
    });

    const goTo = (t) => {
      const y0 = scrollY;
      const top = () => Math.max(0, t.getBoundingClientRect().top + scrollY);
      const d0 = Math.abs(top() - y0);

      if (RM || d0 < 2) {
        scrollTo({ top: top(), behavior: 'instant' });
        return;
      }

      const id = ++sAnim;
      const dur = Math.min(900, Math.max(380, d0 / 3));
      const t0 = performance.now();

      const ez = (p) => p < 0.5
        ? 2 * p * p
        : 1 - Math.pow(-2 * p + 2, 2) / 2;

      const step = (n) => {
        if (id !== sAnim) return;

        const p = Math.min(1, (n - t0) / dur);
        const y = y0 + (top() - y0) * ez(p);

        scrollTo({ top: y, behavior: 'instant' });

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          scrollTo({ top: top(), behavior: 'instant' });

          setTimeout(() => {
            if (id === sAnim) {
              scrollTo({ top: top(), behavior: 'instant' });
            }
          }, 400);
        }
      };

      requestAnimationFrame(step);
    };

    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');

        if (id.length < 2) return;

        const t = document.querySelector(id);
        if (!t) return;

        e.preventDefault();
        goTo(t);

        try {
          history.replaceState(null, '', id);
        } catch (_) {}
      });
    });

    // BEYOND THE RESUME: cards, photos and external links
    const CARDS = [
      {
        t: "Master's Convocation",
        b: ['Master Convocation', 'Masters Convocation', "Master's Convocation"],
        c: ["The first girl in my family to have a Master's degree.", 'A proud moment for my dad and mom.', 'Two years of hard work, growth and memories that shaped this journey.']
      },
      {
        t: 'SACAIM 2025',
        b: ['SACAIM 2025', 'Sacaim', 'SACAIM'],
        c: ['Served as MC and presented a research paper at SACAIM 2025, an international conference.'],
        link: 'https://staloysius.edu.in/department/software-technology/activity/sacaim-2025',
        linkLabel: 'Visit the SACAIM 2025 conference page',
        linkIcon: 'external-link'
      },
      {
        t: 'Rural Immersion',
        b: ['Rural', 'Rural Immersion'],
        c: ['A meaningful part of my college journey that took learning beyond the classroom and offered a closer look at everyday life in rural communities.']
      },
      {
        t: 'Sangam 2025',
        key: 'sangam',
        b: ['Sangam 2025', 'Hostel day', 'Hostel Day', 'Hostel Day Celebration'],
        c: ['I was the MC (Master of Ceremonies) at the Hostel Day Celebration.'],
        link: 'https://www.youtube.com/watch?v=6XhOZliKCgA&t=677s',
        linkLabel: 'Watch the Sangam 2025 Hostel Day celebration on YouTube',
        linkIcon: 'youtube'
      },
      {
        t: 'Degree Convocation',
        b: ['Degree Convocation'],
        c: ['One chapter came to a close and another began.']
      },
      {
        t: 'College Leadership',
        p: "Throughout my undergraduate and postgraduate years, I actively contributed to college fests and events, taking on responsibilities in event management, stage coordination, committee work and student leadership. My roles included Event Head for Math Fiesta (2022) and Imprints (2023), Committee Member for Electriphy (2022), Stage Committee Head for Aloysian Dance League (2024), Student Coordinator for Star of Imprints under Aloysian Fest (2024) and Food Committee Head for Epitome (2024). These are some of the college events I have been involved in, not an exhaustive list.",
        tone: 'dark'
      },
      {
        t: 'Hostel Leadership',
        p: "My hostel journey has been an important part of my leadership experience. During my undergraduate years, I was part of the Hostel Core Committee, took on several leadership responsibilities and hosted numerous programmes as an MC. During the first year of my Master’s, I served as Assistant Hostel Leader, was the Main Organiser for Sports Day and took on both Decoration Head and Overall Head responsibilities for Sayonara 2025. These experiences strengthened my skills in event planning, team coordination, public speaking and taking responsibility for bringing people together.",
        tone: 'dark'
      }
    ];

    const bg = $('#bgrid');
    bg.className += ' bgrid';

    bg.innerHTML = CARDS.map((c, i) => c.p
      ? `<article class="bc bc-text bc-${c.tone}" aria-label="${c.t}">
          <div class="bx">
            <h3 class="bh">${c.t}</h3>
            <p class="bp">${c.p}</p>
          </div>
        </article>`
      : `<article class="bc" data-card="${c.key || ''}" tabindex="0">
          <div class="bimg">
            <div class="bph">
              <i data-lucide="image" class="w-5 h-5"></i>
              <span>Photos coming soon</span>
            </div>
            ${c.link ? `<a class="bcard-link" href="${c.link}" target="_blank" rel="noopener noreferrer" aria-label="${c.linkLabel}" title="${c.linkLabel}">
                <i data-lucide="${c.linkIcon || 'external-link'}" class="w-4 h-4"></i>
              </a>` : ''}
            <div class="bdots"></div>
            <div class="bt">${c.t}<p class="bcap">${c.c[0] || ''}</p></div>
          </div>
        </article>`
    ).join('');

    $$('.bcard-link').forEach((a) => {
      a.addEventListener('click', (e) => e.stopPropagation());
    });

    try {
      lucide.createIcons();
    } catch (e) {}

    const tryImg = (u) => new Promise((r) => {
      const i = new Image();
      i.onload = () => r(u);
      i.onerror = () => r(null);
      i.src = u;
    });

    const find = async (bases) => {
      const out = [];
      const ex = ['jpeg', 'jpg', 'png', 'JPG', 'JPEG', 'PNG'];
      const fm = [
        (b, n) => `${b} (${n})`,
        (b, n) => `${b}(${n})`
      ];

      let pick = null;

      for (let n = 1; n <= 8; n++) {
        let hit = null;
        const all = [];

        bases.forEach((b) => {
          fm.forEach((f, fi) => {
            ex.forEach((e) => all.push([b, e, fi]));
          });
        });

        const combos = pick ? [pick, ...all] : all;

        for (const [b, e, fi] of combos) {
          hit = await tryImg(`assets/${fm[fi](b, n)}.${e}`);
          if (hit) {
            pick = [b, e, fi];
            break;
          }
        }

        if (!hit) break;
        out.push(hit);
      }

      return out;
    };

    $$('.bc').forEach((card, ci) => {
      if (CARDS[ci].p) return;

      find(CARDS[ci].b).then((urls) => {
        if (!urls.length) return;

        const box = $('.bimg', card);
        const cap = $('.bcap', card);
        const cs = CARDS[ci].c;
        const dts = $('.bdots', card);

        $('.bph', card).remove();

        const imgs = urls.map((u) => {
          const im = document.createElement('img');
          im.src = u;
          im.alt = CARDS[ci].t;
          im.loading = 'lazy';
          box.insertBefore(im, dts);
          return im;
        });

        dts.innerHTML = urls.length > 1 ? urls.map(() => '<i></i>').join('') : '';

        let k = 0;
        let step = 0;
        let iv;

        const show = (n) => {
          if (n !== k) step++;
          k = (n + urls.length) % urls.length;

          imgs.forEach((im, j) => im.classList.toggle('on', j === k));
          $$('i', dts).forEach((d, j) => d.classList.toggle('on', j === k));

          cap.textContent = cs.length > 1 ? (cs[step % cs.length] || '') : cs[0];
        };

        show(0);

        if (urls.length > 1) {
          card.addEventListener('mouseenter', () => {
            iv = setInterval(() => show(k + 1), 1500);
          });

          card.addEventListener('mouseleave', () => clearInterval(iv));
          card.addEventListener('click', () => show(k + 1));

          card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') show(k + 1);
          });
        }
      });
    });

    // HANDSHAKE: keep the original WebGL ray-marched animation
    const hc = $('#handsC');

    if (hc) {
      (() => {
        const fb = $('#handsFb');
        const useFb = () => {
          hc.style.display = 'none';
          if (fb) fb.style.display = 'flex';
        };

        const gl = hc.getContext('webgl', {
          alpha: true,
          premultipliedAlpha: true,
          antialias: false,
          powerPreference: 'high-performance'
        });

        if (!gl ||
            gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) < 120 ||
            !((gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT) || {}).precision)) {
          return useFb();
        }

        const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

        const FS = `precision highp float;
uniform vec2 uRes;uniform float uDist,uAlpha;uniform vec4 uA[48];uniform vec4 uB[48];
float d2(vec3 v){return dot(v,v);}
float rc(vec3 p,vec3 a,vec3 b,float r1,float r2){
 vec3 ba=b-a;float l2=dot(ba,ba),rr=r1-r2,a2=l2-rr*rr,il2=1./l2;
 vec3 pa=p-a;float y=dot(pa,ba),z=y-l2,x2=d2(pa*l2-ba*y),y2=y*y*l2,z2=z*z*l2,k=sign(rr)*rr*rr*x2;
 if(sign(z)*a2*z2>k)return sqrt(x2+z2)*il2-r2;
 if(sign(y)*a2*y2<k)return sqrt(x2+y2)*il2-r1;
 return (sqrt(x2*a2*il2)+y*rr)*il2-r1;}
float sm(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
vec2 map(vec3 p){
 float dl=1e5,dr=1e5;
 for(int i=0;i<21;i++){dl=sm(dl,rc(p,uA[i].xyz,uB[i].xyz,uA[i].w,uB[i].w),.03);}
 for(int i=0;i<21;i++){dr=sm(dr,rc(p,uA[21+i].xyz,uB[21+i].xyz,uA[21+i].w,uB[21+i].w),.03);}
 vec2 r=vec2(dl,1.);
 if(dr<r.x)r=vec2(dr,2.);
 float s=rc(p,uA[42].xyz,uB[42].xyz,uA[42].w,uB[42].w);if(s<r.x)r=vec2(s,3.);
 s=rc(p,uA[43].xyz,uB[43].xyz,uA[43].w,uB[43].w);if(s<r.x)r=vec2(s,3.);
 s=rc(p,uA[44].xyz,uB[44].xyz,uA[44].w,uB[44].w);if(s<r.x)r=vec2(s,4.);
 s=rc(p,uA[45].xyz,uB[45].xyz,uA[45].w,uB[45].w);if(s<r.x)r=vec2(s,4.);
 s=rc(p,uA[46].xyz,uB[46].xyz,uA[46].w,uB[46].w);if(s<r.x)r=vec2(s,5.);
 s=rc(p,uA[47].xyz,uB[47].xyz,uA[47].w,uB[47].w);if(s<r.x)r=vec2(s,5.);
 return r;}
vec3 nor(vec3 p){vec2 e=vec2(1.,-1.)*.5773*.0012;return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x);}
float shd(vec3 ro,vec3 rd){float res=1.,t=.025;for(int i=0;i<26;i++){float h=map(ro+rd*t).x;res=min(res,9.*h/t);t+=clamp(h,.02,.22);if(res<.002||t>2.5)break;}return clamp(res,0.,1.);}
float ao(vec3 p,vec3 n){float o=0.,s=1.;for(int i=1;i<=5;i++){float h=.012+.06*float(i);o+=(h-map(p+n*h).x)*s;s*=.72;}return clamp(1.-1.7*o,0.,1.);}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
 vec3 ro=vec3(0.,.3,uDist),ta=vec3(0.,-.02,0.);
 vec3 ww=normalize(ta-ro),uu=normalize(cross(ww,vec3(0.,1.,0.))),vv=cross(uu,ww);
 vec3 rd=normalize(uv.x*uu+uv.y*vv+ww*2.352);
 vec3 bmin=vec3(-5.4,-2.6,-1.3),bmax=vec3(5.4,2.6,1.3),inv=1./rd,t0=(bmin-ro)*inv,t1=(bmax-ro)*inv;
 vec3 tn=min(t0,t1),tf=max(t0,t1);float tN=max(max(tn.x,tn.y),max(tn.z,0.)),tF=min(min(tf.x,tf.y),tf.z);
 if(tN>=tF){gl_FragColor=vec4(0.);return;}
 float t=tN,id=0.;bool hit=false;
 for(int i=0;i<88;i++){vec2 h=map(ro+rd*t);if(h.x<.0012*t){hit=true;id=h.y;break;}t+=h.x*.92;if(t>tF)break;}
 if(!hit){gl_FragColor=vec4(0.);return;}
 vec3 p=ro+rd*t,n=nor(p);
 vec3 alb=vec3(.0);float spec=.2,sp=40.,sss=0.;
 if(id<1.5){alb=vec3(.66,.41,.29);spec=.22;sp=36.;sss=1.;}
 else if(id<2.5){alb=vec3(.48,.29,.2);spec=.2;sp=34.;sss=1.;}
 else if(id<3.5){alb=vec3(.022,.021,.02);spec=.35;sp=14.;}
 else if(id<4.5){alb=vec3(.78,.78,.80);spec=.25;sp=22.;}
 else {alb=vec3(.84,.91,.29)*.9;spec=.8;sp=60.;}
 vec3 L1=normalize(vec3(-.55,.8,.62)),L2=normalize(vec3(.75,.25,.65)),L3=normalize(vec3(.5,.55,-.7));
 float s1=shd(p+n*.01,L1);
 float a=ao(p,n);
 float w=sss>0.?.45:0.;
 float dif1=clamp((dot(n,L1)+w)/(1.+w),0.,1.)*s1;
 float dif2=clamp(dot(n,L2),0.,1.);
 vec3 col=alb*(vec3(1.,.95,.88)*2.0*dif1+vec3(.55,.55,.57)*.5*dif2+vec3(.5,.5,.52)*.22*(.5+.5*n.y))*a;
 if(sss>0.){float tm=clamp(1.-abs(dot(n,L1)-.1)*2.2,0.,1.);col+=vec3(.5,.12,.06)*tm*.28*a*s1*alb.r;}
 vec3 h=normalize(L1-rd);col+=vec3(1.,.96,.9)*spec*pow(max(dot(n,h),0.),sp)*s1*a;
 float fr=pow(1.-max(dot(n,-rd),0.),3.);
 col+=vec3(.84,.91,.29)*fr*(.25+.75*max(dot(n,L3),0.))*.55*a;
 col=col/(1.+col*.22);col=pow(col,vec3(.4545));
 gl_FragColor=vec4(col*uAlpha,uAlpha);}`;

        const sh = (ty, src) => {
          const s = gl.createShader(ty);
          gl.shaderSource(s, src);
          gl.compileShader(s);

          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.warn(gl.getShaderInfoLog(s));
            return null;
          }

          return s;
        };

        const vs = sh(gl.VERTEX_SHADER, VS);
        const fs = sh(gl.FRAGMENT_SHADER, FS);

        if (!vs || !fs) return useFb();

        const pr = gl.createProgram();
        gl.attachShader(pr, vs);
        gl.attachShader(pr, fs);
        gl.linkProgram(pr);

        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return useFb();

        gl.useProgram(pr);

        const bf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

        const al = gl.getAttribLocation(pr, 'p');
        gl.enableVertexAttribArray(al);
        gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);

        const U = n => gl.getUniformLocation(pr, n);
        const uRes = U('uRes');
        const uDist = U('uDist');
        const uAlpha = U('uAlpha');
        const uA = U('uA[0]');
        const uB = U('uB[0]');

        const cb = (...p) => p.reduce(
          (r, [v, k]) => [r[0] + v[0] * k, r[1] + v[1] * k, r[2] + v[2] * k],
          [0, 0, 0]
        );

        const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
        const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

        const nrm = a => {
          const l = Math.hypot(a[0], a[1], a[2]) || 1;
          return [a[0] / l, a[1] / l, a[2] / l];
        };

        const rot = (v, ax, an) => {
          const c = Math.cos(an);
          const s = Math.sin(an);
          const k = cross(ax, v);
          const d = dot(ax, v) * (1 - c);

          return [
            v[0] * c + k[0] * s + ax[0] * d,
            v[1] * c + k[1] * s + ax[1] * d,
            v[2] * c + k[2] * s + ax[2] * d
          ];
        };

        const cap = (o, a, ra, b, rb) => o.push([a, ra, b, rb]);
        const SC = [1, 1.1, 1, 0.82];
        const FR = [0.050, 0.046, 0.041, 0.034];

        const hand = (out, o, f, n, c, th, cfg) => {
          const s = nrm(cross(f, n));
          const acr = i => mul(s, (i - 1.5) * 0.11);

          for (let i = 0; i < 4; i++) {
            cap(out, cb([o, 1], [acr(i), 0.5]), 0.085, cb([o, 1], [f, 0.52], [acr(i), 1]), 0.088);
          }

          cap(out, cb([o, 1], [f, 0.04], [s, -0.13], [n, -0.03]), 0.09, cb([o, 1], [f, 0.30], [s, -0.17], [n, -0.05]), 0.085);

          for (let i = 0; i < 4; i++) {
            let p = cb([o, 1], [f, 0.52], [acr(i), 1]);
            const d0 = rot(f, n, (i - 1.5) * 0.08 * (1 - c));
            let ang = 0;
            let r = FR[i];
            const L = [0.27 * SC[i], 0.17 * SC[i], 0.13 * SC[i]];

            for (let j = 0; j < 3; j++) {
              ang += c * cfg.fa[j] * cfg.fv[i];

              const d = rot(d0, s, -ang);
              const q = cb([p, 1], [d, L[j]]);
              const r2 = r * (j === 2 ? 0.8 : 0.9);

              cap(out, p, r, q, r2);
              p = q;
              r = r2;
            }
          }

          let p = cb([o, 1], [f, 0.17], [s, -0.15], [n, -0.03]);
          const dO = [
            nrm(cb([f, 0.55], [s, -0.75], [n, -0.1])),
            nrm(cb([f, 0.7], [s, -0.6])),
            nrm(cb([f, 0.7], [s, -0.5]))
          ];

          const TL = [0.20, 0.17, 0.14];
          const TR = [0.066, 0.056, 0.048, 0.040];

          for (let j = 0; j < 3; j++) {
            const w = cfg.td[j];
            const dC = nrm(cb([f, w[0]], [s, w[1]], [n, w[2]]));
            const d = nrm(cb([dO[j], 1 - th], [dC, th]));
            const q = cb([p, 1], [d, TL[j]]);

            cap(out, p, TR[j], q, TR[j + 1]);
            p = q;
          }

          cap(out, cb([o, 1], [f, 0.03]), 0.082, cb([o, 1], [f, -0.46]), 0.096);
        };

        const CFG_L = { fa: [0.72, 1.2, 1.0], fv: [1, 1, 1, 1], td: [[0.55, -0.45, -0.55], [0.7, -0.05, -0.75], [0.4, 0, -0.9]] };
        const CFG_R = { fa: [0.85, 1.35, 1.05], fv: [0.45, 0.62, 0.9, 1], td: [[0.55, -0.35, -0.85], [0.8, -0.05, -0.8], [0.7, 0, -0.4]] };

        const fL = nrm([0.95, -0.2, 0]);
        const nL = [0, 0, 1];
        const fR = nrm([-0.93, -0.26, 0]);
        const nR = [0, 0, -1];

        const A = new Float32Array(48 * 4);
        const B = new Float32Array(48 * 4);

        const pose = (q, t) => {
          const ea = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
          const Q = ea(q.Q);
          const C = ea(q.C);
          const kk = 1 - Q;
          const cc = 1 - C;

          const oL = [-0.42 - kk * 2.6 + cc * 0.02, 0.10 - kk * 0.12, 0.06 + cc * 0.13];
          const oR = [0.34 + kk * 2.6 + cc * 0.02, 0.08 - kk * 0.08, -0.06 - cc * 0.13];

          const sl = [];
          const sr = [];
          const ex = [];

          hand(sl, oL, fL, nL, C, C, CFG_L);
          hand(sr, oR, fR, nR, C, C, CFG_R);

          const sleeve = (o, f) => cap(ex, cb([o, 1], [f, -0.56]), 0.14, cb([o, 1], [f, -4.4]), 0.23);
          const cuff = (o, f) => cap(ex, cb([o, 1], [f, -0.40]), 0.125, cb([o, 1], [f, -0.55]), 0.127);

          sleeve(oL, fL);
          sleeve(oR, fR);
          cuff(oL, fL);
          cuff(oR, fR);

          const st = (o, f, n, sd) => {
            const p = cb([o, 1], [f, -0.47], [n, 0.13 * sd], [nrm(cross(f, n)), 0.0]);
            cap(ex, p, 0.03, p, 0.03);
          };

          st(oL, fL, nL, 1);
          st(oR, fR, nR, -1);

          const pump = u => u >= 0 && u < 1 ? Math.sin(u * Math.PI * 6) * (1 - u) * 0.07 : 0;
          const pu = C > 0.999
            ? (q.K < 1 ? pump(q.K) : pump((t % 7) / 7 * 2.4) * 0.55)
            : 0;

          const all = sl.concat(sr, ex);

          all.forEach((pr, i) => {
            const a = pr[0];
            const b = pr[2];
            const wa = pu * Math.exp(-Math.pow(a[0] / 1.5, 2));
            const wb = pu * Math.exp(-Math.pow(b[0] / 1.5, 2));

            A.set([a[0], a[1] + wa, a[2], pr[1]], i * 4);
            B.set([b[0], b[1] + wb, b[2], pr[3]], i * 4);
          });
        };

        const q = {
          Q: RM ? 1 : 0,
          C: RM ? 1 : 0,
          K: RM ? 1 : 0,
          V: RM ? 1 : 0
        };

        let W = 0;
        let H = 0;
        let vis = false;
        let dirty = true;

        const rs = () => {
          const sc = Math.min(devicePixelRatio || 1, 1.5) * (mob ? 0.62 : 0.9);
          W = hc.clientWidth;
          H = hc.clientHeight;
          hc.width = Math.max(2, W * sc | 0);
          hc.height = Math.max(2, H * sc | 0);
          gl.viewport(0, 0, hc.width, hc.height);
          dirty = true;
        };

        rs();
        addEventListener('resize', rs);

        new IntersectionObserver((e) => {
          vis = e[0].isIntersecting;
          if (vis) dirty = true;
        }).observe(hc);

        if (!RM) {
          ScrollTrigger.create({
            trigger: '#hands',
            start: 'top 80%',
            once: true,
            onEnter: () => gsap.timeline()
              .to(q, { V: 1, duration: 0.9, ease: 'power1.out' })
              .to(q, { Q: 1, duration: 1.8, ease: 'none' }, 0.1)
              .to(q, { C: 1, duration: 1.1, ease: 'none' }, 1.7)
              .to(q, { K: 1, duration: 2.4, ease: 'none' }, 2.8)
          });
        }

        let last = 0;

        const draw = () => {
          if (!vis) return;

          const now = performance.now();
          if (now - last < 33) return;

          last = now;
          const t = now / 1000;
          const idle = q.K >= 1 && ((t % 7) / 7 * 2.4) < 1;

          if (!(dirty || q.V < 1 || q.Q < 1 || q.C < 1 || q.K < 1 || idle)) return;

          dirty = false;

          const asp = W / H;
          const dist = Math.max(3.5, 1.05 / (asp * 0.2126));

          pose(q, t);

          gl.uniform2f(uRes, hc.width, hc.height);
          gl.uniform1f(uDist, dist);
          gl.uniform1f(uAlpha, q.V);
          gl.uniform4fv(uA, A);
          gl.uniform4fv(uB, B);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        };

        gsap.ticker.add(draw);

        if (RM) {
          setTimeout(() => {
            vis = true;
            dirty = true;
            draw();
          }, 300);
        }
      })();
    }

    addEventListener('load', () => {
      setTimeout(() => ScrollTrigger.refresh(), 300);
    });

  })();
} catch (err) {
  console.warn('transitions skipped', err);
}

/* NAVIGATION STATE, SECTION REVEALS AND HOME ENTRANCE */
try {
  (() => {
    const $ = (q, c = document) => c.querySelector(q);
    const $$ = (q, c = document) => [...c.querySelectorAll(q)];
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      if (window.__L && !RM) __L.stop();
      setTimeout(() => {
        try { __L.start(); } catch (e) {}
      }, 9000);
    } catch (e) {}

    const pg = ['home', 'about', 'experience', 'education', 'projects', 'skills', 'beyond', 'contact'];
    const els = pg.map(i => document.getElementById(i));
    let cur = '';

    const navMap = { home: '' };
    const navA = $$('nav [data-p]');
    let tk = 0;

    const upd = () => {
      tk = 0;
      const y = innerHeight * 0.45;
      let c = pg[0];

      els.forEach((e, i) => {
        if (e && e.getBoundingClientRect().top <= y) c = pg[i];
      });

      if (c !== cur) {
        cur = c;
        const k = c in navMap ? navMap[c] : c;

        navA.forEach((a) => {
          const on = a.dataset.p === k && k !== 'home';

          if (on) a.setAttribute('aria-current', 'page');
          else a.removeAttribute('aria-current');
        });
      }
    };

    const qu = () => {
      if (!tk) tk = requestAnimationFrame(upd);
    };

    addEventListener('scroll', qu, { passive: true });
    addEventListener('resize', qu);
    upd();

    // Section-entry choreography
    try {
      if (!RM && window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);

        const SEC = ['about', 'experience', 'education', 'projects', 'skills', 'beyond', 'contact']
          .map(i => document.getElementById(i))
          .filter(Boolean);

        const CARD = '.ex,.edu,.bc,.branch-card';
        const G = { h: [], t: [], i: [], c: [], x: [] };
        const seen = new Set();

        const add = (k, e) => {
          if (e && !seen.has(e)) {
            seen.add(e);
            G[k].push(e);
          }
        };

        SEC.forEach((sec) => {
          $$('h2', sec).forEach((h) => {
            if (h.closest(CARD)) return;

            h.childNodes.forEach((n) => {
              if (n.nodeType === 3 && n.textContent.trim()) {
                const f = document.createDocumentFragment();

                n.textContent.split(/(\s+)/).forEach((p) => {
                  if (!p.trim()) {
                    f.appendChild(document.createTextNode(p));
                    return;
                  }

                  const sp = document.createElement('span');
                  sp.className = 'w';
                  sp.style.display = 'inline-block';
                  sp.textContent = p;
                  f.appendChild(sp);
                });

                n.replaceWith(f);
              }
            });

            G.h.push(h);
          });

          if (sec.id === 'projects') {
            add('i', $('.mw', sec));
            add('x', $('#mwdots', sec));
            return;
          }

          $$('p,blockquote', sec).forEach((p) => {
            if (!p.closest(CARD + ',.bcap,#skList,#bgrid')) add('t', p);
          });

          $$('img,canvas', sec).forEach((m) => {
            if (m.closest(CARD + ',#hands')) return;

            const b = m.parentElement;
            if (b && b !== sec && !b.querySelector('p,h2')) add('i', b);
          });

          $$(CARD, sec).forEach((c) => add('c', c));
          $$('a.action-badge', sec).forEach((a) => add('x', a));

          [...sec.children].forEach((c) => {
            if (!seen.has(c) &&
                !c.querySelector('h2,p,.ex,.edu,.bc,.branch-card,canvas,a') &&
                !/absolute|fixed/.test(getComputedStyle(c).position) &&
                c.id !== 'hands' &&
                c.tagName !== 'H2') {
              add('x', c);
            }
          });
        });

        const P = {
          t: { y: 26, d: 1.7, e: 'power3.out', st: 0.2, delay: 0.3 },
          c: { y: 30, d: 1.5, e: 'power3.out', st: 0.2, delay: 0.4 },
          i: { y: 24, d: 1.9, e: 'power3.out', st: 0.2, delay: 0.3, scale: 0.985 },
          x: { y: 22, d: 1.4, e: 'power3.out', st: 0.16, delay: 0.4 }
        };

        const clear = (els) => gsap.set(els, { clearProps: 'opacity,transform,visibility' });

        const run = (k, els) => {
          const p = P[k];

          gsap.fromTo(
            els,
            { opacity: 0, y: p.y, scale: p.scale || 1 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: p.d,
              ease: p.e,
              stagger: p.st,
              delay: p.delay,
              overwrite: 'auto',
              onComplete: () => clear(els)
            }
          );
        };

        Object.keys(P).forEach((k) => {
          if (!G[k].length) return;

          gsap.set(G[k], { opacity: 0, y: P[k].y, scale: P[k].scale || 1 });

          ScrollTrigger.batch(G[k], {
            start: 'top 90%',
            end: 'max',
            once: true,
            batchMax: 8,
            interval: 0.1,
            onEnter: (els) => run(k, els)
          });
        });

        G.h.forEach((h) => {
          const w = $$('.w', h);
          const tg = w.length ? w : [h];

          gsap.set(tg, { opacity: 0, y: 30 });

          ScrollTrigger.create({
            trigger: h,
            start: 'top 90%',
            end: 'max',
            once: true,
            onEnter: () => gsap.to(tg, {
              opacity: 1,
              y: 0,
              duration: 2,
              ease: 'power3.out',
              stagger: 0.18,
              overwrite: 'auto',
              onComplete: () => clear(tg)
            })
          });
        });

        addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(), 400));

        const ab = $('#about img');

        if (ab && ab.parentElement) {
          const bx = ab.parentElement;
          let on = false;
          let tk2 = 0;

          const mv = () => {
            tk2 = 0;
            const r = bx.getBoundingClientRect();
            const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
            bx.style.translate = '0 ' + (-c * 28).toFixed(1) + 'px';
          };

          new IntersectionObserver((e) => {
            on = e[0].isIntersecting;
            if (on) mv();
          }).observe(bx);

          addEventListener('scroll', () => {
            if (on && !tk2) tk2 = requestAnimationFrame(mv);
          }, { passive: true });
        }
      }
    } catch (err) {
      console.warn('reveal skipped', err);
    }

    // Home: preloader and choreographed entrance
    const stage = $('#heroStage');
    const base = stage.children[0];
    const spot = $('#heroSpotlight');

    const nm = (r) => $$('span.font-display', r).filter((e) =>
      /^(ANISHA|LOBO)$/.test(e.textContent.trim())
    );

    [base, spot].forEach((r) => {
      const e = nm(r)[0];
      if (e) e.parentElement.parentElement.classList.add('nm-wrap');
    });

    const fitName = () => {
      const a = nm(base);
      if (a.length < 2) return;

      const ph = $('#basePhoto');
      const ps = $('#portraitStage');
      const mob = innerWidth < 700;
      const ar = ph && ph.naturalWidth ? ph.naturalWidth / ph.naturalHeight : 0.8;

      const h = Math.min(
        innerHeight * (mob ? 0.62 : 0.85),
        innerWidth * (mob ? 0.95 : 0.6) / ar
      );

      const pw = h * ar;

      if (ps && ph) {
        ps.style.height = h + 'px';
        ph.style.maxHeight = h + 'px';
      }

      const fs = parseFloat(getComputedStyle(a[0]).fontSize);
      const wA = a[0].getBoundingClientRect().width / fs;
      const wL = a[1].getBoundingClientRect().width / fs;
      const gap = mob ? innerWidth * 0.05 : pw * 1.1;
      const side = (innerWidth - gap) / 2 - innerWidth * 0.014;
      const t = 1.1 * Math.max(
        26,
        Math.min(mob ? innerWidth * 0.9 / (wA + wL) : side / Math.max(wA, wL), innerHeight * (mob ? 0.19 : 0.3))
      );

      document.documentElement.style.setProperty('--nmgap', gap + 'px');

      [base, spot].forEach((r) => {
        nm(r).forEach((n) => n.style.fontSize = t + 'px');
      });
    };

    [base, spot].forEach((r) => {
      nm(r).forEach((e) => {
        e.innerHTML = [...e.textContent.trim()].map((c) => `<i class="nl">${c}</i>`).join('');
      });
    });

    const LB = $$('.nl', base);
    const LS = $$('.nl', spot);
    const fin = LB.map((e) => e.textContent);
    const GL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const both = (q) => [...$$(q, base), ...$$(q, spot)];

    let tl = null;
    let glitchOn = RM;

    const build = () => {
      fitName();

      LB.forEach((a, i) => {
        const w = a.getBoundingClientRect().width;
        [a, LS[i]].forEach((e) => e.style.width = w + 'px');
      });

      tl = gsap.timeline({
        paused: true,
        defaults: { ease: 'expo.out' },
        onComplete: () => {
          glitchOn = true;
          $$('.nl').forEach((e) => e.style.width = '');
          fitName();
          window.__buildHome && window.__buildHome();

          try {
            __L && __L.start();
          } catch (e) {}
        }
      });

      tl.from('#basePhoto', { y: 140, opacity: 0, scale: 1.12, duration: 1.8, clearProps: 'transform,opacity' }, 0)
        .from('#home>header', { y: -30, opacity: 0, duration: 1, clearProps: 'transform,opacity' }, 0.5)
        .from(both('h2'), { y: 44, opacity: 0, duration: 1.1, stagger: 0.08, clearProps: 'transform,opacity' }, 0.55)
        .from(both('blockquote'), { y: 30, opacity: 0, duration: 1.1, clearProps: 'transform,opacity' }, 1.05)
        .from('nav', { y: 70, opacity: 0, duration: 1.1, clearProps: 'transform,opacity' }, 1.2);

      LB.forEach((a, i) => {
        const b = LS[i];
        const o = { p: 0 };
        const at = 0.25 + i * 0.07;

        tl.from([a, b], {
          yPercent: 120,
          rotateZ: (i % 2 ? 1 : -1) * 14,
          scale: 0.5,
          opacity: 0,
          transformOrigin: '50% 100%',
          duration: 1.3,
          clearProps: 'transform,opacity'
        }, at).to(o, {
          p: 1,
          duration: 0.85,
          ease: 'none',
          onUpdate: () => {
            a.textContent = b.textContent = o.p < 0.8
              ? GL[Math.random() * 26 | 0]
              : fin[i];
          }
        }, at);
      });
    };

    const imgReady = new Promise((r) => {
      const i = $('#basePhoto');
      if (!i || (i.complete && i.naturalWidth)) return r();

      i.addEventListener('load', r);
      i.addEventListener('error', r);
      setTimeout(r, 4000);
    });

    const ready = Promise.all([document.fonts.ready, imgReady]).then(() => {
      if (!RM) build();
    });

    imgReady.then(() => {
      if (glitchOn) fitName();
    });

    addEventListener('resize', () => {
      if (glitchOn) {
        $$('.nl').forEach((e) => e.style.width = '');
        fitName();
      }
    });

    if (RM) {
      $('#pre').remove();
    } else {
      const n = { v: 1 };
      const pn = $('#preN');

      gsap.to(n, {
        v: 100,
        duration: 2.6,
        ease: 'power2.inOut',
        onUpdate: () => pn.textContent = Math.round(n.v),
        onComplete: () => ready.then(() => {
          gsap.to('#pre', {
            yPercent: -100,
            duration: 1,
            ease: 'expo.inOut',
            onComplete: () => $('#pre').remove()
          });

          gsap.delayedCall(0.3, () => tl && tl.play());
        })
      });
    }

    // Portrait hover glitch
    const ps = $('#portraitStage');
    const pi = $('#basePhoto');

    if (ps && pi && !RM && matchMedia('(hover:hover)').matches) {
      let bands = [];
      let last = 0;
      let px = 0;
      let py = 0;

      const sync = () => {
        const cs = getComputedStyle(pi);

        bands.forEach((b) => Object.assign(b.style, {
          left: pi.offsetLeft + 'px',
          top: pi.offsetTop + 'px',
          width: pi.offsetWidth + 'px',
          height: pi.offsetHeight + 'px',
          objectFit: cs.objectFit,
          objectPosition: cs.objectPosition,
          transform: cs.transform === 'none' ? '' : cs.transform,
          transformOrigin: cs.transformOrigin
        }));
      };

      for (let i = 0; i < 5; i++) {
        const b = document.createElement('img');
        b.src = pi.currentSrc || pi.src;
        b.alt = '';
        b.setAttribute('aria-hidden', 'true');
        b.style.cssText = 'position:absolute;opacity:0;pointer-events:none;z-index:5;filter:brightness(1.25) contrast(1.08)';
        pi.after(b);
        bands.push(b);
      }

      addEventListener('resize', sync);

      ps.addEventListener('pointermove', (e) => {
        const r = ps.getBoundingClientRect();
        const sp = Math.hypot(e.clientX - px, e.clientY - py);
        const now = performance.now();

        px = e.clientX;
        py = e.clientY;

        if (!glitchOn || sp < 5 || now - last < 50) return;

        last = now;
        sync();

        const cy = (e.clientY - r.top) / r.height * 100;

        bands.forEach((b) => {
          const y = Math.min(95, Math.max(0, cy + (Math.random() - 0.5) * 30));
          const h = 3 + Math.random() * 9;

          b.style.clipPath = `inset(${y}% 0 ${Math.max(0, 100 - y - h)}% 0)`;

          gsap.fromTo(
            b,
            { x: (Math.random() - 0.5) * 2 * Math.min(34, sp * 1.1), opacity: 0.85 },
            { x: 0, opacity: 0, duration: 0.55, ease: 'power3.out', overwrite: true }
          );
        });
      });

      ps.addEventListener('pointerleave', () => {
        gsap.to(bands, { x: 0, opacity: 0, duration: 0.4 });
      });
    }
  })();
} catch (err) {
  console.warn('home choreography skipped', err);
  const p = document.getElementById('pre');
  if (p) p.remove();
}

/* SOFT CURSOR, SCROLL PROGRESS AND DEPTH */
try {
  (() => {
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $$ = (q, c = document) => [...c.querySelectorAll(q)];

    const bar = document.createElement('div');
    bar.id = 'prog';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    let pt = 0;

    const prog = () => {
      pt = 0;
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0).toFixed(4) + ')';
    };

    addEventListener('scroll', () => {
      if (!pt) pt = requestAnimationFrame(prog);
    }, { passive: true });

    prog();

    if (RM) return;

    const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

    if (fine) {
      const ring = document.createElement('div');
      const dot = document.createElement('div');
      ring.id = 'cur';
      dot.id = 'curDot';

      const tr = [[0.11, 10, 0.38], [0.065, 7, 0.2]].map(([k, sz, o]) => {
        const e = document.createElement('div');
        e.className = 'curT';
        e.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;margin:' + (-sz / 2) + 'px 0 0 ' + (-sz / 2) + 'px;--o:' + o;
        return { e, k, x: 0, y: 0 };
      });

      [...tr.map(t => t.e), ring, dot].forEach((e) => {
        e.setAttribute('aria-hidden', 'true');
        document.body.appendChild(e);
      });

      let tx = 0;
      let ty = 0;
      let x = 0;
      let y = 0;
      let run = false;
      let shown = false;

      const tick = () => {
        x += (tx - x) * 0.18;
        y += (ty - y) * 0.18;

        ring.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;

        let busy = Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1;

        tr.forEach((t) => {
          t.x += (tx - t.x) * t.k;
          t.y += (ty - t.y) * t.k;

          t.e.style.transform = `translate3d(${t.x.toFixed(1)}px,${t.y.toFixed(1)}px,0)`;

          if (Math.abs(tx - t.x) > 0.1 || Math.abs(ty - t.y) > 0.1) busy = true;
        });

        if (busy) requestAnimationFrame(tick);
        else run = false;
      };

      const show = (on) => {
        shown = on;
        [ring, dot, ...tr.map(t => t.e)].forEach((e) => e.classList.toggle('on', on));
        document.documentElement.classList.toggle('has-cur', on);
      };

      const HOT = 'a,button,[role=button],nav,.bc,.mp,.mwarr,.exh,.branch-card,#mwdots i,.lc-btn,.action-badge,summary,label';

      addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') return;

        tx = e.clientX;
        ty = e.clientY;
        dot.style.transform = `translate3d(${tx}px,${ty}px,0)`;

        if (!shown) {
          x = tx;
          y = ty;
          tr.forEach(t => {
            t.x = tx;
            t.y = ty;
          });
          show(true);
        }

        if (!run) {
          run = true;
          requestAnimationFrame(tick);
        }

        const t = e.target.closest && e.target;
        const txt = t && t.closest('input,textarea,select');

        ring.classList.toggle('big', !!(t && t.closest(HOT)));
        [ring, dot].forEach(el => el.style.opacity = txt ? 0 : '');
      }, { passive: true });

      addEventListener('pointerdown', () => ring.classList.add('press'));
      addEventListener('pointerup', () => ring.classList.remove('press'));
      document.addEventListener('pointerleave', () => show(false));
      addEventListener('blur', () => show(false));

      $$('.ex').forEach((c) => {
        let f = 0;

        c.addEventListener('pointermove', (e) => {
          if (f) return;

          f = requestAnimationFrame(() => {
            f = 0;
            const r = c.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;

            c.style.transform = `perspective(1200px) rotateX(${(-py * 2.4).toFixed(2)}deg) rotateY(${(px * 3).toFixed(2)}deg)`;
          });
        });

        c.addEventListener('pointerleave', () => {
          c.style.transform = '';
        });
      });
    }

    const H = $$('section h2').filter(h => !/absolute/.test(h.className));
    const vis = new Set();
    let ht = 0;

    const drift = () => {
      ht = 0;

      vis.forEach((h) => {
        const r = h.getBoundingClientRect();
        const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        h.style.translate = '0 ' + (c * -16).toFixed(1) + 'px';
      });
    };

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => {
          if (e.isIntersecting) vis.add(e.target);
          else vis.delete(e.target);
        });
      });

      H.forEach((h) => io.observe(h));

      addEventListener('scroll', () => {
        if (vis.size && !ht) ht = requestAnimationFrame(drift);
      }, { passive: true });
    }
  })();
} catch (e) {
  console.warn('polish skipped', e);
}


/* Education: the timeline dots light up in sequence, Bachelor's first and then Master's */
try {
  (() => {
    const t = document.querySelector('.edu-track');
    if (!t || matchMedia('(prefers-reduced-motion:reduce)').matches || !('IntersectionObserver' in window)) return;
    t.classList.add('dots-wait');
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) {
        io.disconnect();
        setTimeout(() => t.classList.remove('dots-wait'), 500);
      }
    }, { threshold: 0.55 });
    io.observe(t);
  })();
} catch (e) {}