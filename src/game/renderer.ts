import { GameState } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, POWERUP_COLORS } from './constants';

export const render = (ctx: CanvasRenderingContext2D, state: GameState, time: number) => {
  // Apply screen shake
  ctx.save();
  if (state.screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * state.screenShake * 2;
    const shakeY = (Math.random() - 0.5) * state.screenShake * 2;
    ctx.translate(shakeX, shakeY);
  }

  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, COLORS.backgroundGradientTop);
  gradient.addColorStop(1, COLORS.backgroundGradientBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw stars (parallax layers)
  state.stars.forEach((star) => {
    const twinkle = 0.7 + Math.sin(time * 0.003 + star.x * star.y) * 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw particles
  state.particles.forEach((particle) => {
    const alpha = particle.lifetime / particle.maxLifetime;
    
    if (particle.type === 'ring') {
      ctx.strokeStyle = particle.color.replace(')', `, ${alpha * 0.5})`).replace('rgb', 'rgba').replace('#', '');
      if (particle.color.startsWith('#')) {
        const r = parseInt(particle.color.slice(1, 3), 16);
        const g = parseInt(particle.color.slice(3, 5), 16);
        const b = parseInt(particle.color.slice(5, 7), 16);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`;
      }
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      let color = particle.color;
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      } else {
        ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      }
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Draw power-ups
  state.powerUps.forEach((powerUp) => {
    const color = POWERUP_COLORS[powerUp.type];
    const pulse = 1 + Math.sin(time * 0.01) * 0.1;
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    
    // Draw power-up icon
    ctx.beginPath();
    const cx = powerUp.position.x + powerUp.width / 2;
    const cy = powerUp.position.y + powerUp.height / 2;
    const radius = powerUp.width / 2 * pulse;
    
    // Outer ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner symbol
    ctx.beginPath();
    if (powerUp.type === 'multishot') {
      // Three dots
      ctx.arc(cx - 5, cy, 3, 0, Math.PI * 2);
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.arc(cx + 5, cy, 3, 0, Math.PI * 2);
    } else if (powerUp.type === 'rapidfire') {
      // Lightning bolt
      ctx.moveTo(cx + 3, cy - 6);
      ctx.lineTo(cx - 2, cy);
      ctx.lineTo(cx + 1, cy);
      ctx.lineTo(cx - 3, cy + 6);
    } else if (powerUp.type === 'shield') {
      // Shield shape
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    } else if (powerUp.type === 'bomb') {
      // Bomb
      ctx.arc(cx, cy + 2, 5, 0, Math.PI * 2);
      ctx.moveTo(cx, cy - 3);
      ctx.lineTo(cx, cy - 6);
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Draw bullets
  state.bullets.forEach((bullet) => {
    const color = bullet.isEnemy ? COLORS.enemyBullet : COLORS.bullet;

    // Glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.fillRect(bullet.position.x, bullet.position.y, bullet.width, bullet.height);
    ctx.shadowBlur = 0;
  });

  // Draw enemies
  state.enemies.forEach((enemy) => {
    let color = COLORS.enemy;

    if (enemy.pattern === 'heavy') {
      color = COLORS.heavy;
    }

    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    // Draw enemy ship shape
    ctx.fillStyle = color;
    ctx.beginPath();
    const cx = enemy.position.x + enemy.width / 2;
    
    // Inverted triangle ship
    ctx.moveTo(cx, enemy.position.y + enemy.height);
    ctx.lineTo(enemy.position.x, enemy.position.y);
    ctx.lineTo(enemy.position.x + enemy.width, enemy.position.y);
    ctx.closePath();
    ctx.fill();

    // Health bar for heavy enemies
    if (enemy.pattern === 'heavy' && enemy.hp < enemy.maxHp) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#333';
      ctx.fillRect(enemy.position.x, enemy.position.y - 8, enemy.width, 4);
      ctx.fillStyle = color;
      ctx.fillRect(enemy.position.x, enemy.position.y - 8, enemy.width * (enemy.hp / enemy.maxHp), 4);
    }

    ctx.shadowBlur = 0;
  });

  // Draw boss
  if (state.boss) {
    const boss = state.boss;
    const phaseColor = boss.phase === 3 ? '#ff0000' : boss.phase === 2 ? '#ff6600' : COLORS.boss;
    
    ctx.shadowColor = phaseColor;
    ctx.shadowBlur = 20 + Math.sin(time * 0.01) * 5;
    ctx.fillStyle = phaseColor;

    // Boss shape - large menacing ship
    ctx.beginPath();
    const bcx = boss.position.x + boss.width / 2;
    
    // Main body
    ctx.moveTo(bcx, boss.position.y);
    ctx.lineTo(boss.position.x + boss.width, boss.position.y + boss.height * 0.3);
    ctx.lineTo(boss.position.x + boss.width * 0.8, boss.position.y + boss.height);
    ctx.lineTo(boss.position.x + boss.width * 0.2, boss.position.y + boss.height);
    ctx.lineTo(boss.position.x, boss.position.y + boss.height * 0.3);
    ctx.closePath();
    ctx.fill();

    // Boss health bar
    ctx.shadowBlur = 0;
    const hpBarWidth = boss.width + 20;
    const hpBarX = boss.position.x - 10;
    ctx.fillStyle = '#333';
    ctx.fillRect(hpBarX, boss.position.y - 15, hpBarWidth, 8);
    
    const hpPercent = boss.hp / boss.maxHp;
    const hpColor = hpPercent > 0.66 ? '#00ff00' : hpPercent > 0.33 ? '#ffff00' : '#ff0000';
    ctx.fillStyle = hpColor;
    ctx.fillRect(hpBarX, boss.position.y - 15, hpBarWidth * hpPercent, 8);

    ctx.shadowBlur = 0;
  }

  // Draw player
  if (state.gameStatus === 'playing') {
    const player = state.player;
    const flashOn = !player.invincible || Math.floor(time / 100) % 2 === 0;

    // Draw shield if active
    if (player.powerUps.shield > 0) {
      const shieldAlpha = 0.3 + Math.sin(time * 0.01) * 0.1;
      ctx.strokeStyle = `rgba(0, 200, 255, ${shieldAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        player.position.x + player.width / 2,
        player.position.y + player.height / 2,
        player.width * 0.8,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.fillStyle = `rgba(0, 200, 255, ${shieldAlpha * 0.3})`;
      ctx.fill();
    }

    if (flashOn) {
      ctx.shadowColor = COLORS.player;
      ctx.shadowBlur = 20;
      ctx.fillStyle = COLORS.player;

      // Player ship shape - arrow pointing up
      ctx.beginPath();
      const pcx = player.position.x + player.width / 2;
      ctx.moveTo(pcx, player.position.y);
      ctx.lineTo(player.position.x + player.width, player.position.y + player.height);
      ctx.lineTo(pcx, player.position.y + player.height * 0.7);
      ctx.lineTo(player.position.x, player.position.y + player.height);
      ctx.closePath();
      ctx.fill();

      // Engine glow
      ctx.fillStyle = COLORS.playerGlow;
      ctx.beginPath();
      ctx.ellipse(
        pcx,
        player.position.y + player.height + 5,
        8,
        12 + Math.sin(time * 0.02) * 4,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  ctx.restore();

  // Draw UI (not affected by screen shake)
  drawUI(ctx, state, time);
};

const drawUI = (ctx: CanvasRenderingContext2D, state: GameState, time: number) => {
  ctx.font = 'bold 16px "Orbitron", sans-serif';
  ctx.textAlign = 'left';

  // Score
  ctx.fillStyle = COLORS.ui;
  ctx.shadowColor = COLORS.ui;
  ctx.shadowBlur = 10;
  ctx.fillText(`SCORE: ${state.score.toString().padStart(8, '0')}`, 10, 25);

  // High score
  ctx.fillStyle = COLORS.uiSecondary;
  ctx.shadowColor = COLORS.uiSecondary;
  ctx.fillText(`HIGH: ${state.highScore.toString().padStart(8, '0')}`, 10, 45);

  // Combo
  if (state.combo > 1) {
    const comboAlpha = state.comboTimer / 2000;
    ctx.font = 'bold 14px "Orbitron", sans-serif';
    ctx.fillStyle = `rgba(255, 255, 0, ${comboAlpha})`;
    ctx.shadowColor = COLORS.combo;
    ctx.fillText(`COMBO x${Math.min(state.combo, 10)}`, 10, 65);
  }

  // Wave
  ctx.font = 'bold 16px "Orbitron", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.ui;
  ctx.shadowColor = COLORS.ui;
  ctx.fillText(`WAVE ${state.wave}`, CANVAS_WIDTH - 10, 25);

  // Lives
  ctx.fillStyle = COLORS.player;
  ctx.shadowColor = COLORS.player;
  for (let i = 0; i < state.player.lives; i++) {
    const x = CANVAS_WIDTH - 30 - i * 25;
    ctx.beginPath();
    ctx.moveTo(x, 45);
    ctx.lineTo(x + 10, 55);
    ctx.lineTo(x, 52);
    ctx.lineTo(x - 10, 55);
    ctx.closePath();
    ctx.fill();
  }

  // Active power-ups indicator
  const activePowerUps: string[] = [];
  if (state.player.powerUps.multishot > 0) activePowerUps.push('MULTI');
  if (state.player.powerUps.rapidfire > 0) activePowerUps.push('RAPID');
  if (state.player.powerUps.shield > 0) activePowerUps.push('SHIELD');
  
  if (activePowerUps.length > 0) {
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 5;
    ctx.fillText(activePowerUps.join(' | '), CANVAS_WIDTH - 10, 70);
  }

  // Wave announcement
  if (state.waveAnnouncement > 0) {
    const alpha = Math.min(state.waveAnnouncement / 500, 1);
    ctx.font = 'bold 32px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.shadowColor = COLORS.ui;
    ctx.shadowBlur = 20;
    ctx.fillText(`WAVE ${state.wave}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    
    ctx.font = '14px "Share Tech Mono", monospace';
    ctx.fillStyle = `rgba(255, 0, 255, ${alpha})`;
    ctx.shadowColor = COLORS.uiSecondary;
    ctx.fillText('INCOMING', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  }

  ctx.shadowBlur = 0;
};

export const renderMenu = (ctx: CanvasRenderingContext2D, state: GameState, time: number) => {
  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, COLORS.backgroundGradientTop);
  gradient.addColorStop(1, COLORS.backgroundGradientBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw animated stars
  state.stars.forEach((star) => {
    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * (0.5 + Math.sin(time * 0.001 + star.x) * 0.5)})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Title
  ctx.textAlign = 'center';
  ctx.font = 'bold 48px "Orbitron", sans-serif';
  ctx.fillStyle = COLORS.ui;
  ctx.shadowColor = COLORS.ui;
  ctx.shadowBlur = 30;
  
  const titleY = CANVAS_HEIGHT * 0.3 + Math.sin(time * 0.002) * 5;
  ctx.fillText('BLASTAR', CANVAS_WIDTH / 2, titleY);

  // Subtitle
  ctx.font = '16px "Share Tech Mono", monospace';
  ctx.fillStyle = COLORS.uiSecondary;
  ctx.shadowColor = COLORS.uiSecondary;
  ctx.shadowBlur = 15;
  ctx.fillText('ARCADE SHOOTER', CANVAS_WIDTH / 2, titleY + 35);

  // High score
  ctx.font = '14px "Share Tech Mono", monospace';
  ctx.fillStyle = COLORS.ui;
  ctx.fillText(`HIGH SCORE: ${state.highScore.toString().padStart(8, '0')}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.5);

  // Start prompt
  ctx.font = '18px "Orbitron", sans-serif';
  const alpha = 0.5 + Math.sin(time * 0.005) * 0.5;
  ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
  ctx.fillText('PRESS SPACE OR TAP TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.65);

  // Controls
  ctx.font = '12px "Share Tech Mono", monospace';
  ctx.fillStyle = COLORS.uiSecondary;
  ctx.shadowBlur = 5;
  ctx.fillText('← → MOVE  |  SPACE FIRE', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.8);
  ctx.fillText('MOBILE: DRAG TO MOVE | TAP FIRE', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.85);

  ctx.shadowBlur = 0;
};

export const renderGameOver = (ctx: CanvasRenderingContext2D, state: GameState, time: number) => {
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(10, 10, 18, 0.9)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';

  // Game Over text
  ctx.font = 'bold 40px "Orbitron", sans-serif';
  ctx.fillStyle = COLORS.boss;
  ctx.shadowColor = COLORS.boss;
  ctx.shadowBlur = 30;
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.35);

  // Final score
  ctx.font = '20px "Share Tech Mono", monospace';
  ctx.fillStyle = COLORS.ui;
  ctx.shadowColor = COLORS.ui;
  ctx.shadowBlur = 15;
  ctx.fillText(`FINAL SCORE: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.48);

  // Wave reached
  ctx.fillStyle = COLORS.uiSecondary;
  ctx.shadowColor = COLORS.uiSecondary;
  ctx.fillText(`WAVE REACHED: ${state.wave}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.55);

  // New high score
  if (state.score >= state.highScore && state.score > 0) {
    ctx.font = '16px "Orbitron", sans-serif';
    ctx.fillStyle = COLORS.particle;
    ctx.shadowColor = COLORS.particle;
    ctx.shadowBlur = 20;
    const flashAlpha = 0.5 + Math.sin(time * 0.01) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 0, ${flashAlpha})`;
    ctx.fillText('★ NEW HIGH SCORE! ★', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.65);
  }

  // Restart prompt
  ctx.font = '16px "Orbitron", sans-serif';
  const alpha = 0.5 + Math.sin(time * 0.005) * 0.5;
  ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
  ctx.shadowBlur = 10;
  ctx.fillText('PRESS SPACE OR TAP TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.8);

  ctx.shadowBlur = 0;
};
