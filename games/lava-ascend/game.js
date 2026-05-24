// game.js – simple “Lava Ascend” canvas game
// Canvas element: <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = (canvas.width = canvas.offsetWidth || 800)
  const H = (canvas.height = canvas.offsetHeight || 600)

  // ==== Game entities ====
  const player = {
    w: 30,
    h: 50,
    x: W / 2 - 15,
    y: H - 60,
    vx: 0,
    vy: 0,
    speed: 4,
    jumpPower: 15,
    onGround: false,
  }

  const platforms = [] // {x, y, w, h}
  const lava = { y: H } // rises upward
  const riseSpeed = 0.8 // lava rise per frame

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.frequency.value = freq
    osc.type = 'sine'
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01)
    osc.start()
    osc.stop(audioCtx.currentTime + duration)
  }
  // Background lava rumble loop
  setInterval(() => {
    // low freq rumble, short burst
    playTone(70, 0.05)
  }, 1200)

  // Starfield background
  const starCount = 80
  const stars = []
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      radius: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    })
  }

  // ==== Helpers ====
  const rand = (a, b) => Math.random() * (b - a) + a

  function spawnPlatform() {
    const w = rand(50, 120)
    const h = 12
    const x = rand(0, W - w)
    const y = -rand(100, 300) // start above view
    platforms.push({ x, y, w, h })
  }

  // Initial platforms
  for (let i = 0; i < 8; i++) spawnPlatform()

  // ==== Input ====
  const keys = {}
  // Unlock AudioContext on first user interaction
  let audioUnlocked = false
  window.addEventListener('keydown', e => {
    keys[e.key] = true
    if (!audioUnlocked && audioCtx.state !== 'running') {
      audioCtx.resume()
      audioUnlocked = true
    }
  })
  window.addEventListener('keyup', e => (keys[e.key] = false))

  // ==== Main loop ====
  function update(dt) {
    // Player horizontal movement
    if (keys.ArrowLeft || keys.a) player.vx = -player.speed
    else if (keys.ArrowRight || keys.d) player.vx = player.speed
    else player.vx = 0

    // Jump
    if ((keys.ArrowUp || keys.w || keys.Space) && player.onGround) {
      player.vy = -player.jumpPower
      player.onGround = false
      playTone(440, 0.1) // jump cue
    }

    // Apply gravity
    player.vy += 0.6 // gravity

    // Move player
    player.x += player.vx
    player.y += player.vy

    // Constrain to canvas horizontally
    if (player.x < 0) player.x = 0
    if (player.x + player.w > W) player.x = W - player.w

    // Platform collision (simple AABB, only when falling)
    player.onGround = false
    for (const p of platforms) {
      if (
        player.vy >= 0 && // only check when falling
        player.x < p.x + p.w &&
        player.x + player.w > p.x &&
        player.y + player.h > p.y &&
        player.y + player.h - player.vy <= p.y
      ) {
        player.y = p.y - player.h
        player.vy = 0
        player.onGround = true
      }
    }

    // Remove platforms that fell below view
    platforms.forEach((p, i) => {
      if (p.y - lava.y > H) platforms.splice(i, 1)
    })

    // Spawn new platforms as needed
    while (platforms.length < 8) spawnPlatform()

    // Move platforms, lava, and stars upward
    const rise = riseSpeed // lava rise speed (px/frame)
    lava.y -= rise
    platforms.forEach(p => (p.y -= rise))
    // Parallax star movement (slower)
    stars.forEach(s => {
      s.y -= rise * 0.2
      if (s.y < 0) s.y = H
    })

    // Lose condition
    if (player.y + player.h > lava.y) {
      cancelAnimationFrame(raf)
      playTone(150, 0.5) // game over cue
      alert('Game Over – the lava got you!')
    }
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, W, H)

    // Background gradient (dark sky)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
    bgGrad.addColorStop(0, '#0d0d1a')
    bgGrad.addColorStop(1, '#1a1a33')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // Starfield (twinkling)
    stars.forEach(s => {
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`
      ctx.fill()
    })

    // Lava with vertical gradient and wavy top
    const lavaHeight = H - lava.y
    const lavaGrad = ctx.createLinearGradient(0, lava.y, 0, H)
    lavaGrad.addColorStop(0, '#ff8c00')
    lavaGrad.addColorStop(1, '#ff4500')
    ctx.fillStyle = lavaGrad
    ctx.beginPath()
    ctx.moveTo(0, lava.y)
    ctx.quadraticCurveTo(W * 0.25, lava.y - 10, W * 0.5, lava.y)
    ctx.quadraticCurveTo(W * 0.75, lava.y + 10, W, lava.y)
    ctx.lineTo(W, H)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fill()

    // Platforms with simple shading
    for (const p of platforms) {
      const platGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h)
      platGrad.addColorStop(0, '#777')
      platGrad.addColorStop(1, '#444')
      ctx.fillStyle = platGrad
      ctx.fillRect(p.x, p.y, p.w, p.h)
    }

    // Player as a rounded rect with gradient fill
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h)
    playerGrad.addColorStop(0, '#33ccff')
    playerGrad.addColorStop(1, '#0066aa')
    ctx.fillStyle = playerGrad
    const radius = 6
    ctx.beginPath()
    ctx.moveTo(player.x + radius, player.y)
    ctx.lineTo(player.x + player.w - radius, player.y)
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius)
    ctx.lineTo(player.x + player.w, player.y + player.h - radius)
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h)
    ctx.lineTo(player.x + radius, player.y + player.h)
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius)
    ctx.lineTo(player.x, player.y + radius)
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y)
    ctx.closePath()
    ctx.fill()
  }

  let last = performance.now()
  function loop(now) {
    const dt = now - last
    last = now
    update(dt)
    draw()
    raf = requestAnimationFrame(loop)
  }
  let raf = requestAnimationFrame(loop)
})()
