import {
  GameState,
  InputState,
  Player,
  Bullet,
  Enemy,
  Boss,
  Particle,
  Star,
  PowerUp,
  EnemyPattern,
  PowerUpType,
} from './types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_FIRE_RATE,
  PLAYER_FIRE_RATE_RAPID,
  BULLET_WIDTH,
  BULLET_HEIGHT,
  BULLET_SPEED,
  ENEMY_BULLET_SPEED,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  BOSS_WIDTH,
  BOSS_HEIGHT,
  BOSS_SPEED,
  POWERUP_WIDTH,
  POWERUP_HEIGHT,
  POWERUP_SPEED,
  POWERUP_DURATION,
  POWERUP_DROP_CHANCE,
  INVINCIBILITY_DURATION,
  COMBO_TIMEOUT,
  getWaveConfig,
  ENEMY_CONFIG,
} from './constants';
import { audioManager } from './audio';

const HIGH_SCORE_KEY = 'blastar_high_score';

export const createInitialState = (): GameState => {
  const highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
  
  return {
    player: createPlayer(),
    bullets: [],
    enemies: [],
    boss: null,
    particles: [],
    powerUps: [],
    stars: createStarfield(),
    score: 0,
    highScore,
    combo: 0,
    comboTimer: 0,
    wave: 1,
    waveEnemiesSpawned: 0,
    waveEnemiesKilled: 0,
    lastSpawnTime: 0,
    gameStatus: 'menu',
    screenShake: 0,
    waveAnnouncement: 0,
  };
};

const createPlayer = (): Player => ({
  position: { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20 },
  velocity: { x: 0, y: 0 },
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  fireRate: PLAYER_FIRE_RATE,
  lastFired: 0,
  lives: 3,
  invincible: false,
  invincibleUntil: 0,
  powerUps: {
    multishot: 0,
    rapidfire: 0,
    shield: 0,
  },
});

const createStarfield = (): Star[] => {
  const stars: Star[] = [];
  for (let i = 0; i < 150; i++) {
    const layer = Math.floor(Math.random() * 3);
    stars.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: 0.5 + layer * 0.5 + Math.random() * 0.5,
      speed: 0.3 + layer * 0.8 + Math.random() * 0.3,
      brightness: 0.3 + layer * 0.2 + Math.random() * 0.3,
      layer,
    });
  }
  return stars;
};

export const createEnemy = (pattern: EnemyPattern, baseSpeed: number): Enemy => {
  const config = ENEMY_CONFIG[pattern];
  const x = Math.random() * (CANVAS_WIDTH - ENEMY_WIDTH);
  
  return {
    position: { x, y: -ENEMY_HEIGHT },
    velocity: { x: 0, y: baseSpeed * config.speed },
    width: pattern === 'heavy' ? ENEMY_WIDTH * 1.3 : ENEMY_WIDTH,
    height: pattern === 'heavy' ? ENEMY_HEIGHT * 1.3 : ENEMY_HEIGHT,
    hp: config.hp,
    maxHp: config.hp,
    pattern,
    patternData: {
      startX: x,
      amplitude: 50 + Math.random() * 30,
      frequency: 0.02 + Math.random() * 0.01,
      diveTriggered: false,
    },
    canShoot: config.canShoot,
    lastShot: 0,
    shootInterval: 2000 + Math.random() * 1000,
    points: config.points,
  };
};

export const createBoss = (wave: number): Boss => ({
  position: { x: CANVAS_WIDTH / 2 - BOSS_WIDTH / 2, y: -BOSS_HEIGHT },
  velocity: { x: BOSS_SPEED, y: 1 },
  width: BOSS_WIDTH,
  height: BOSS_HEIGHT,
  hp: 20 + wave * 5,
  maxHp: 20 + wave * 5,
  phase: 1,
  lastShot: 0,
  shootInterval: 500,
  minionSpawnTime: 0,
  points: 2000 + wave * 500,
});

const createBullet = (x: number, y: number, isEnemy: boolean, vx = 0, vy?: number): Bullet => ({
  position: { x, y },
  velocity: { x: vx, y: vy ?? (isEnemy ? ENEMY_BULLET_SPEED : -BULLET_SPEED) },
  width: BULLET_WIDTH,
  height: BULLET_HEIGHT,
  isEnemy,
});

const createPowerUp = (x: number, y: number): PowerUp => {
  const types: PowerUpType[] = ['multishot', 'rapidfire', 'shield', 'bomb'];
  const weights = [0.35, 0.35, 0.2, 0.1];
  let rand = Math.random();
  let type: PowerUpType = 'multishot';
  
  for (let i = 0; i < types.length; i++) {
    rand -= weights[i];
    if (rand <= 0) {
      type = types[i];
      break;
    }
  }
  
  return {
    position: { x: x - POWERUP_WIDTH / 2, y },
    velocity: { x: 0, y: POWERUP_SPEED },
    width: POWERUP_WIDTH,
    height: POWERUP_HEIGHT,
    type,
    lifetime: 10000,
  };
};

const createExplosion = (x: number, y: number, count: number, color: string, type: 'explosion' | 'spark' = 'explosion'): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      position: { x, y },
      velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      color,
      size: type === 'spark' ? 1 + Math.random() * 2 : 2 + Math.random() * 3,
      lifetime: type === 'spark' ? 0.3 + Math.random() * 0.3 : 0.5 + Math.random() * 0.5,
      maxLifetime: type === 'spark' ? 0.3 + Math.random() * 0.3 : 0.5 + Math.random() * 0.5,
      type,
    });
  }
  return particles;
};

const createRing = (x: number, y: number, color: string): Particle => ({
  position: { x, y },
  velocity: { x: 0, y: 0 },
  color,
  size: 10,
  lifetime: 0.4,
  maxLifetime: 0.4,
  type: 'ring',
});

const createTrail = (x: number, y: number, color: string): Particle => ({
  position: { x, y },
  velocity: { x: (Math.random() - 0.5) * 2, y: 2 + Math.random() * 2 },
  color,
  size: 2 + Math.random() * 2,
  lifetime: 0.2 + Math.random() * 0.2,
  maxLifetime: 0.2 + Math.random() * 0.2,
  type: 'trail',
});

const checkCollision = (
  a: { position: { x: number; y: number }; width: number; height: number },
  b: { position: { x: number; y: number }; width: number; height: number }
): boolean => {
  return (
    a.position.x < b.position.x + b.width &&
    a.position.x + a.width > b.position.x &&
    a.position.y < b.position.y + b.height &&
    a.position.y + a.height > b.position.y
  );
};

export const updateGame = (
  state: GameState,
  input: InputState,
  deltaTime: number,
  currentTime: number
): GameState => {
  if (state.gameStatus !== 'playing') return state;

  let newState = { ...state };
  const dt = deltaTime / 16.67;

  // Update stars (parallax)
  newState.stars = newState.stars.map((star) => ({
    ...star,
    y: star.y + star.speed * dt,
    ...(star.y > CANVAS_HEIGHT && {
      y: 0,
      x: Math.random() * CANVAS_WIDTH,
    }),
  }));

  // Update wave announcement
  if (newState.waveAnnouncement > 0) {
    newState.waveAnnouncement -= deltaTime;
  }

  // Update combo timer
  if (newState.comboTimer > 0) {
    newState.comboTimer -= deltaTime;
    if (newState.comboTimer <= 0) {
      newState.combo = 0;
    }
  }

  // Update player power-up timers
  newState.player = {
    ...newState.player,
    powerUps: {
      multishot: Math.max(0, newState.player.powerUps.multishot - deltaTime),
      rapidfire: Math.max(0, newState.player.powerUps.rapidfire - deltaTime),
      shield: Math.max(0, newState.player.powerUps.shield - deltaTime),
    },
  };

  // Update player position
  let playerVx = 0;
  
  // Keyboard/button controls
  if (input.left) playerVx -= PLAYER_SPEED;
  if (input.right) playerVx += PLAYER_SPEED;
  
  // Touch drag controls
  if (input.touchX !== undefined) {
    const targetX = input.touchX - newState.player.width / 2;
    const diff = targetX - newState.player.position.x;
    playerVx = Math.sign(diff) * Math.min(Math.abs(diff) * 0.3, PLAYER_SPEED * 1.5);
  }

  newState.player = {
    ...newState.player,
    position: {
      x: Math.max(0, Math.min(CANVAS_WIDTH - newState.player.width, newState.player.position.x + playerVx * dt)),
      y: newState.player.position.y,
    },
    invincible: currentTime < newState.player.invincibleUntil || newState.player.powerUps.shield > 0,
  };

  // Player engine trail
  if (Math.random() < 0.3) {
    const trailX = newState.player.position.x + newState.player.width / 2 + (Math.random() - 0.5) * 10;
    const trailY = newState.player.position.y + newState.player.height;
    newState.particles = [...newState.particles, createTrail(trailX, trailY, '#00ffff')];
  }

  // Player shooting
  const fireRate = newState.player.powerUps.rapidfire > 0 ? PLAYER_FIRE_RATE_RAPID : PLAYER_FIRE_RATE;
  if (input.fire && currentTime - newState.player.lastFired >= fireRate) {
    const centerX = newState.player.position.x + newState.player.width / 2 - BULLET_WIDTH / 2;
    const bulletY = newState.player.position.y;
    
    if (newState.player.powerUps.multishot > 0) {
      newState.bullets = [
        ...newState.bullets,
        createBullet(centerX - 10, bulletY, false, -1),
        createBullet(centerX, bulletY, false),
        createBullet(centerX + 10, bulletY, false, 1),
      ];
    } else {
      newState.bullets = [...newState.bullets, createBullet(centerX, bulletY, false)];
    }
    newState.player.lastFired = currentTime;
    audioManager.shoot();
  }

  // Spawn enemies
  const waveConfig = getWaveConfig(newState.wave);
  if (
    !newState.boss &&
    newState.waveEnemiesSpawned < waveConfig.enemyCount &&
    currentTime - newState.lastSpawnTime > waveConfig.spawnInterval
  ) {
    const pattern = waveConfig.patterns[Math.floor(Math.random() * waveConfig.patterns.length)];
    newState.enemies = [...newState.enemies, createEnemy(pattern, waveConfig.enemySpeed)];
    newState.waveEnemiesSpawned++;
    newState.lastSpawnTime = currentTime;
  }

  // Spawn boss
  if (waveConfig.hasBoss && newState.waveEnemiesKilled >= waveConfig.enemyCount && !newState.boss) {
    newState.boss = createBoss(newState.wave);
  }

  // Update bullets
  newState.bullets = newState.bullets
    .map((bullet) => ({
      ...bullet,
      position: {
        x: bullet.position.x + bullet.velocity.x * dt,
        y: bullet.position.y + bullet.velocity.y * dt,
      },
    }))
    .filter(
      (bullet) =>
        bullet.position.y > -BULLET_HEIGHT &&
        bullet.position.y < CANVAS_HEIGHT &&
        bullet.position.x > -BULLET_WIDTH &&
        bullet.position.x < CANVAS_WIDTH
    );

  // Update enemies
  newState.enemies = newState.enemies.map((enemy) => {
    let newX = enemy.position.x;
    let newY = enemy.position.y + enemy.velocity.y * dt;
    let newVy = enemy.velocity.y;
    const patternData = { ...enemy.patternData };

    switch (enemy.pattern) {
      case 'zigzag':
        newX = enemy.patternData.startX + Math.sin(newY * enemy.patternData.frequency) * enemy.patternData.amplitude;
        break;
      case 'dive':
        if (newY > CANVAS_HEIGHT * 0.3 && !patternData.diveTriggered) {
          patternData.diveTriggered = true;
          newVy = enemy.velocity.y * 3;
        }
        break;
    }

    // Enemy shooting
    let lastShot = enemy.lastShot;
    if (enemy.canShoot && currentTime - enemy.lastShot > enemy.shootInterval && newY > 0 && newY < CANVAS_HEIGHT * 0.5) {
      const bulletX = enemy.position.x + enemy.width / 2 - BULLET_WIDTH / 2;
      const bulletY = enemy.position.y + enemy.height;
      newState.bullets = [...newState.bullets, createBullet(bulletX, bulletY, true)];
      lastShot = currentTime;
      audioManager.enemyShoot();
    }

    return {
      ...enemy,
      position: { x: newX, y: newY },
      velocity: { x: enemy.velocity.x, y: newVy },
      patternData,
      lastShot,
    };
  });

  // Filter out enemies that left the screen
  newState.enemies = newState.enemies.filter((enemy) => enemy.position.y < CANVAS_HEIGHT + ENEMY_HEIGHT);

  // Update boss
  if (newState.boss) {
    let boss = { ...newState.boss };
    
    // Move boss into position
    if (boss.position.y < 50) {
      boss.position = { ...boss.position, y: boss.position.y + 1 * dt };
    } else {
      // Horizontal movement
      boss.position = { ...boss.position, x: boss.position.x + boss.velocity.x * dt };
      if (boss.position.x <= 0 || boss.position.x >= CANVAS_WIDTH - boss.width) {
        boss.velocity = { ...boss.velocity, x: -boss.velocity.x };
      }

      // Boss shooting
      if (currentTime - boss.lastShot > boss.shootInterval) {
        const centerX = boss.position.x + boss.width / 2 - BULLET_WIDTH / 2;
        const bulletY = boss.position.y + boss.height;
        
        // Phase-based attack patterns
        if (boss.phase === 1) {
          newState.bullets = [...newState.bullets, createBullet(centerX, bulletY, true)];
        } else if (boss.phase === 2) {
          newState.bullets = [
            ...newState.bullets,
            createBullet(centerX - 20, bulletY, true, -1),
            createBullet(centerX, bulletY, true),
            createBullet(centerX + 20, bulletY, true, 1),
          ];
        } else {
          // Phase 3: spread shot
          for (let i = -2; i <= 2; i++) {
            newState.bullets = [...newState.bullets, createBullet(centerX, bulletY, true, i * 1.5)];
          }
        }
        boss.lastShot = currentTime;
        audioManager.enemyShoot();
      }

      // Spawn minions in phase 3
      if (boss.phase === 3 && currentTime - boss.minionSpawnTime > 5000) {
        newState.enemies = [
          ...newState.enemies,
          createEnemy('dive', waveConfig.enemySpeed),
          createEnemy('dive', waveConfig.enemySpeed),
        ];
        boss.minionSpawnTime = currentTime;
      }

      // Update phase based on HP
      const hpPercent = boss.hp / boss.maxHp;
      if (hpPercent < 0.33) boss.phase = 3;
      else if (hpPercent < 0.66) boss.phase = 2;
    }

    newState.boss = boss;
  }

  // Update power-ups
  newState.powerUps = newState.powerUps
    .map((p) => ({
      ...p,
      position: { ...p.position, y: p.position.y + p.velocity.y * dt },
      lifetime: p.lifetime - deltaTime,
    }))
    .filter((p) => p.position.y < CANVAS_HEIGHT && p.lifetime > 0);

  // Collision: player vs power-ups
  newState.powerUps.forEach((powerUp) => {
    if (checkCollision(powerUp, newState.player)) {
      if (powerUp.type === 'bomb') {
        // Clear all enemies and bullets
        newState.enemies.forEach((enemy) => {
          newState.score += enemy.points;
          newState.particles = [
            ...newState.particles,
            ...createExplosion(enemy.position.x + enemy.width / 2, enemy.position.y + enemy.height / 2, 10, '#ff00ff'),
          ];
        });
        newState.enemies = [];
        newState.bullets = newState.bullets.filter((b) => !b.isEnemy);
        newState.screenShake = 15;
        audioManager.bossExplosion();
      } else {
        newState.player = {
          ...newState.player,
          powerUps: {
            ...newState.player.powerUps,
            [powerUp.type]: POWERUP_DURATION,
          },
        };
      }
      newState.particles = [
        ...newState.particles,
        createRing(powerUp.position.x + powerUp.width / 2, powerUp.position.y + powerUp.height / 2, '#ffffff'),
        ...createExplosion(powerUp.position.x + powerUp.width / 2, powerUp.position.y + powerUp.height / 2, 8, '#ffffff', 'spark'),
      ];
      audioManager.powerUp();
    }
  });
  newState.powerUps = newState.powerUps.filter((p) => !checkCollision(p, newState.player));

  // Collision: player bullets vs enemies
  const playerBullets = newState.bullets.filter((b) => !b.isEnemy);
  playerBullets.forEach((bullet) => {
    newState.enemies.forEach((enemy, ei) => {
      if (checkCollision(bullet, enemy)) {
        newState.enemies[ei] = { ...enemy, hp: enemy.hp - 1 };
        newState.bullets = newState.bullets.filter((b) => b !== bullet);
        
        // Hit sparks
        newState.particles = [
          ...newState.particles,
          ...createExplosion(bullet.position.x, bullet.position.y, 4, '#ffffff', 'spark'),
        ];
        
        if (newState.enemies[ei].hp <= 0) {
          // Update combo
          newState.combo++;
          newState.comboTimer = COMBO_TIMEOUT;
          const comboMultiplier = Math.min(newState.combo, 10);
          newState.score += enemy.points * comboMultiplier;
          
          newState.waveEnemiesKilled++;
          newState.particles = [
            ...newState.particles,
            ...createExplosion(
              enemy.position.x + enemy.width / 2,
              enemy.position.y + enemy.height / 2,
              15,
              enemy.pattern === 'heavy' ? '#ff8800' : '#ff00ff'
            ),
            createRing(enemy.position.x + enemy.width / 2, enemy.position.y + enemy.height / 2, enemy.pattern === 'heavy' ? '#ff8800' : '#ff00ff'),
          ];
          newState.screenShake = 5;
          audioManager.explosion();

          // Power-up drop
          if (Math.random() < POWERUP_DROP_CHANCE) {
            newState.powerUps = [
              ...newState.powerUps,
              createPowerUp(enemy.position.x + enemy.width / 2, enemy.position.y + enemy.height / 2),
            ];
          }
        }
      }
    });

    // Player bullets vs boss
    if (newState.boss && checkCollision(bullet, newState.boss)) {
      newState.boss = { ...newState.boss, hp: newState.boss.hp - 1 };
      newState.bullets = newState.bullets.filter((b) => b !== bullet);
      newState.particles = [
        ...newState.particles,
        ...createExplosion(bullet.position.x, bullet.position.y, 5, '#ff4444', 'spark'),
      ];

      if (newState.boss.hp <= 0) {
        newState.score += newState.boss.points;
        newState.particles = [
          ...newState.particles,
          ...createExplosion(
            newState.boss.position.x + newState.boss.width / 2,
            newState.boss.position.y + newState.boss.height / 2,
            40,
            '#ff4444'
          ),
          ...createExplosion(
            newState.boss.position.x + newState.boss.width / 2,
            newState.boss.position.y + newState.boss.height / 2,
            20,
            '#ffff00'
          ),
        ];
        newState.screenShake = 20;
        newState.boss = null;
        audioManager.bossExplosion();
      }
    }
  });

  // Remove dead enemies
  newState.enemies = newState.enemies.filter((e) => e.hp > 0);

  // Collision: enemy bullets vs player
  const isShielded = newState.player.powerUps.shield > 0;
  if (!newState.player.invincible || isShielded) {
    const enemyBullets = newState.bullets.filter((b) => b.isEnemy);
    enemyBullets.forEach((bullet) => {
      if (checkCollision(bullet, newState.player)) {
        if (isShielded) {
          // Shield absorbs hit
          newState.bullets = newState.bullets.filter((b) => b !== bullet);
          newState.particles = [
            ...newState.particles,
            ...createExplosion(bullet.position.x, bullet.position.y, 8, '#00aaff', 'spark'),
          ];
        } else if (!newState.player.invincible) {
          newState.player = {
            ...newState.player,
            lives: newState.player.lives - 1,
            invincible: true,
            invincibleUntil: currentTime + INVINCIBILITY_DURATION,
          };
          newState.bullets = newState.bullets.filter((b) => b !== bullet);
          newState.particles = [
            ...newState.particles,
            ...createExplosion(
              newState.player.position.x + newState.player.width / 2,
              newState.player.position.y + newState.player.height / 2,
              20,
              '#00ffff'
            ),
          ];
          newState.screenShake = 10;
          newState.combo = 0;
          audioManager.playerHit();

          if (newState.player.lives <= 0) {
            newState.gameStatus = 'gameOver';
            if (newState.score > newState.highScore) {
              newState.highScore = newState.score;
              localStorage.setItem(HIGH_SCORE_KEY, newState.score.toString());
            }
            audioManager.gameOver();
          }
        }
      }
    });

    // Collision: enemies vs player
    if (!isShielded && !newState.player.invincible) {
      newState.enemies.forEach((enemy) => {
        if (checkCollision(enemy, newState.player)) {
          newState.player = {
            ...newState.player,
            lives: newState.player.lives - 1,
            invincible: true,
            invincibleUntil: currentTime + INVINCIBILITY_DURATION,
          };
          newState.particles = [
            ...newState.particles,
            ...createExplosion(
              newState.player.position.x + newState.player.width / 2,
              newState.player.position.y + newState.player.height / 2,
              25,
              '#00ffff'
            ),
          ];
          newState.screenShake = 15;
          newState.combo = 0;
          audioManager.playerHit();

          if (newState.player.lives <= 0) {
            newState.gameStatus = 'gameOver';
            if (newState.score > newState.highScore) {
              newState.highScore = newState.score;
              localStorage.setItem(HIGH_SCORE_KEY, newState.score.toString());
            }
            audioManager.gameOver();
          }
        }
      });
    }
  }

  // Update particles
  newState.particles = newState.particles
    .map((p) => ({
      ...p,
      position: {
        x: p.position.x + p.velocity.x * dt,
        y: p.position.y + p.velocity.y * dt,
      },
      lifetime: p.lifetime - deltaTime / 1000,
      velocity: {
        x: p.velocity.x * 0.98,
        y: p.velocity.y * 0.98,
      },
      size: p.type === 'ring' ? p.size + 3 * dt : p.size,
    }))
    .filter((p) => p.lifetime > 0);

  // Update screen shake
  newState.screenShake = Math.max(0, newState.screenShake - 0.5 * dt);

  // Check wave completion
  const waveComplete =
    newState.waveEnemiesKilled >= waveConfig.enemyCount &&
    newState.enemies.length === 0 &&
    !newState.boss;

  if (waveComplete) {
    newState.wave++;
    newState.waveEnemiesSpawned = 0;
    newState.waveEnemiesKilled = 0;
    newState.waveAnnouncement = 2000;
    audioManager.waveComplete();
  }

  return newState;
};

export const startGame = (state: GameState): GameState => ({
  ...createInitialState(),
  highScore: state.highScore,
  gameStatus: 'playing',
  waveAnnouncement: 2000,
});
