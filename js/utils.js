// --- SHURIKEN DRAWING UTILITY FOR CANVAS ---
window.drawShuriken = function (
  ctx,
  cx,
  cy,
  spikes,
  outerRadius,
  innerRadius,
  fillStyle,
  strokeStyle,
  rotateRad = 0,
) {
  let rot = (Math.PI / 2) * 3 + rotateRad;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();

  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }
};

// --- SMOKE PUFF VISUAL EFFECT TRIGGER ( billowing smoke overlay ) ---
window.triggerSmokePuff = function (cardId) {
  const cardElement = document.querySelector(`.task-card[data-id="${cardId}"]`);
  if (!cardElement) return;

  const container = document.createElement('div');
  container.className = 'smoke-puff-container';

  // Create 6 puff particles
  for (let i = 0; i < 6; i++) {
    const particle = document.createElement('div');
    particle.className = 'smoke-particle';

    // Randomize size, position, and delay
    const size = Math.random() * 45 + 35; // 35px to 80px
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${Math.random() * 60 + 20}%`;
    particle.style.top = `${Math.random() * 60 + 20}%`;
    particle.style.animationDelay = `${Math.random() * 0.12}s`;

    container.appendChild(particle);
  }

  cardElement.appendChild(container);

  // Auto remove after animation completes
  setTimeout(() => {
    container.remove();
  }, 850);
};
