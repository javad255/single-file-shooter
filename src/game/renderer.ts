import { GameState } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './constants';

export const render = (ctx: CanvasRenderingContext2D, state: GameState, time: number) => {
  // Apply screen shake
  ctx.save();
  if (state.screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * state.screenShake * 2;
    const shakeY = (Math.random() - 0.5) * state.screenShake * 2;
    ctx.translate(shakeX, shakeY);
  }

  // Clear and draw background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw stars
  state.stars.forEach((star) => {
    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw particles
  state.particles.forEach((particle) => {
    const alpha = particle.lifetime / particle.maxLifetime;
    ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    ctx.beginPath();
    ctx.arc(particle.position.x, particle.position.y, particle.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw bullets
  state.bullets.forEach((bullet) => {
    const color = bullet.isEnemy ? COLORS.enemyBullet : COLORS.bullet;
    const glowColor = bullet.isEnemy ? COLORS.enemyGlow : COLORS.bulletGlow;

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
    let glowColor = COLORS.enemyGlow;

    if (enemy.pattern === 'heavy') {
      color = COLORS.heavy;
      glowColor = COLORS.heavyGlow;
    }

    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    // Draw enemy ship shape
    ctx.fillStyle = color;
    ctx.beginPath();
    const cx = enemy.position.x + enemy.width / 2;
    const cy = enemy.position.y + enemy.height / 2;
    
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
    ctx.shadowColor = COLORS.boss;
    ctx.shadowBlur = 20;
    ctx.fillStyle = COLORS.boss;

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
  drawUI(ctx, state);
};

const drawUI = (ctx: CanvasRenderingContext2D, state: GameState) => {
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

  // Wave
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

  ctx.shadowBlur = 0;
};

export const renderMenu = (ctx: CanvasRenderingContext2D, state: GameState, time: number) => {
  // Draw background
  ctx.fillStyle = COLORS.background;
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
  ctx.fillText('← → MOVE  |  SPACE FIRE', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.85);

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
