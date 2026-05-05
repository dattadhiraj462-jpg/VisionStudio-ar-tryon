const FRAMES = [
    { id: 'f1', name: 'Midnight Venice', color: '#1e293b', lens: 'rgba(15, 23, 42, 0.7)', type: 'bold' },
    { id: 'f2', name: 'Arctic Marble', color: '#f1f5f9', lens: 'rgba(148, 163, 184, 0.15)', type: 'round' },
    { id: 'f3', name: 'Desert Chrome', color: '#b45309', lens: 'rgba(180, 83, 9, 0.25)', type: 'aviator' },
    { id: 'f4', name: 'Carbon Square', color: '#111827', lens: 'rgba(0, 0, 0, 0.8)', type: 'bold' },
    { id: 'f5', name: 'Copper Foundry', color: '#92400e', lens: 'rgba(146, 64, 14, 0.4)', type: 'bold' },
    { id: 'f6', name: 'Deep Sea Teal', color: '#0d9488', lens: 'rgba(13, 148, 136, 0.3)', type: 'round' },
    { id: 'f7', name: 'Solaris Gold', color: '#fbbf24', lens: 'rgba(251, 191, 36, 0.2)', type: 'aviator' },
    { id: 'f8', name: 'Royal Round', color: '#f8fafc', lens: 'rgba(148, 163, 184, 0.1)', type: 'round' },
    { id: 'f9', name: 'Onyx Shadow', color: '#000000', lens: 'rgba(0, 0, 0, 0.8)', type: 'bold' },
    { id: 'f10', name: 'Ghost Silver', color: '#94a3b8', lens: 'rgba(203, 213, 225, 0.2)', type: 'round' }
];

let currentFrame = 'f1';
let isMirror = true;
const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');

async function init() {
    lucide.createIcons();
    const URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    await faceapi.nets.tinyFaceDetector.loadFromUri(URL);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(URL);
    renderFrames();
}

function handleEntry() {
    const name = document.getElementById('userInput').value;
    if (!name) return alert("Please enter your name to proceed");
    document.getElementById('nameTarget').innerText = name.toUpperCase();
    document.getElementById('userDisplay').style.display = 'flex';
    document.getElementById('login-screen').style.display = 'none';
    startAR();
}

async function startAR() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        loop();
    };
}

async function loop() {
    const detect = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(true);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (detect) drawDesignerGlasses(detect.landmarks.positions);
    requestAnimationFrame(loop);
}

function drawDesignerGlasses(pts) {
    const lE = pts[36], rE = pts[45];
    const mX = (lE.x + rE.x) / 2, mY = (lE.y + rE.y) / 2;
    const w = Math.hypot(rE.x - lE.x, rE.y - lE.y) * 2.8;
    const ang = Math.atan2(rE.y - lE.y, rE.x - lE.x);
    const f = FRAMES.find(x => x.id === currentFrame);

    ctx.save();
    ctx.translate(mX, mY); ctx.rotate(ang);

    const lW = w * 0.44, lH = w * 0.30, g = w * 0.07; 

    ctx.fillStyle = f.lens;
    drawPath(ctx, -g - lW, -lH/2, lW, lH, f.type); ctx.fill();
    drawPath(ctx, g, -lH/2, lW, lH, f.type); ctx.fill();

    ctx.strokeStyle = f.color;
    ctx.lineWidth = w * 0.045; 
    ctx.lineCap = 'round';
    drawPath(ctx, -g - lW, -lH/2, lW, lH, f.type); ctx.stroke();
    drawPath(ctx, g, -lH/2, lW, lH, f.type); ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = w * 0.035;
    ctx.moveTo(-g, -w*0.01); ctx.quadraticCurveTo(0, -w*0.13, g, -w*0.01);
    ctx.stroke();
    ctx.restore();
}

function drawPath(c, x, y, w, h, t) {
    c.beginPath();
    if (t === 'round') c.arc(x + w/2, y + h/2, w/2, 0, Math.PI*2);
    else if (t === 'aviator') {
        c.moveTo(x,y); c.bezierCurveTo(x+w, y, x+w, y+h*1.3, x+w/2, y+h*1.3); 
        c.bezierCurveTo(x, y+h*1.3, x, y, x, y);
    } else {
        if (c.roundRect) c.roundRect(x, y, w, h, 14);
        else c.rect(x,y,w,h);
    }
}

function renderFrames() {
    const list = document.getElementById('frameList');
    list.innerHTML = "";
    FRAMES.forEach(f => {
        const el = document.createElement('div');
        el.className = `frame-item ${f.id === currentFrame ? 'active' : ''}`;
        el.innerHTML = `<div style="width:16px; height:16px; background:${f.color}; border-radius:50%; border:2px solid rgba(255,255,255,0.1)"></div> <span style="font-size:13px; font-weight:600">${f.name}</span>`;
        el.onclick = () => { selectFrameSilently(f.id); };
        list.appendChild(el);
    });
}

function handleChat() {
    const input = document.getElementById('chatInput');
    const area = document.getElementById('chatArea');
    const msg = input.value.toLowerCase().trim();
    if(!msg) return;

    area.innerHTML += `<div class="bubble user">${input.value}</div>`;
    const userQuery = input.value;
    input.value = "";

    let reply = "I'm Aura, your boutique specialist. How can I assist with your style today?";

    const frameMatch = FRAMES.find(f => userQuery.toLowerCase().includes(f.name.toLowerCase()));

    if (frameMatch) {
        selectFrameSilently(frameMatch.id);
        reply = `Excellent choice! The **${frameMatch.name}** really complements your features.`;
    } 
    else if(msg.includes("suggest") || msg.includes("frame") || msg.includes("recommend")) {
        const shuffled = [...FRAMES].sort(() => 0.5 - Math.random());
        const picks = shuffled.slice(0, 5);
        reply = `I've selected 5 unique looks for you, including the **${picks[0].name}**. <br><br>`;
        picks.forEach(p => {
            reply += `<div class="suggestion-chip" onclick="handleChipClick('${p.id}', '${p.name}')">${p.name}</div> `;
        });
        reply += `<br><br>Which of these speaks to you?`;
    } 
    else if (msg.includes("thank") || msg.includes("ok")) {
        reply = "It was my pleasure! Thank you for trusting Aura with your look. Let me know if you'd like to explore more styles.";
    }

    setTimeout(() => {
        area.innerHTML += `<div class="bubble ai">${reply}</div>`;
        area.scrollTop = area.scrollHeight;
    }, 500);
}

function selectFrameSilently(id) {
    if (currentFrame !== id) {
        currentFrame = id;
        renderFrames();
    }
}

function handleChipClick(id, name) {
    selectFrameSilently(id);
}

function toggleMirror() { isMirror = !isMirror; video.classList.toggle('mirror'); canvas.classList.toggle('mirror'); }

function capture() {
    const temp = document.createElement('canvas');
    temp.width = canvas.width; temp.height = canvas.height;
    const tctx = temp.getContext('2d');
    if(isMirror) { tctx.translate(temp.width,0); tctx.scale(-1,1); }
    tctx.drawImage(video, 0, 0); tctx.drawImage(canvas, 0, 0);
    const link = document.createElement('a');
    link.download = 'VisionStudio_AuraLook.png';
    link.href = temp.toDataURL();
    link.click();
}

init();