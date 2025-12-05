import {
  GameState,
  InputState,
  Player,
  Bullet,
  Enemy,
  Boss,
  Particle,
  Star,
  EnemyPattern,
} from './types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_FIRE_RATE,
  BULLET_WIDTH,
  BULLET_HEIGHT,
  BULLET_SPEED,
  ENEMY_BULLET_SPEED,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  BOSS_WIDTH,
  BOSS_HEIGHT,
  BOSS_SPEED,
  INVINCIBILITY_DURATION,
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
    stars: createStarfield(),
    score: 0,
    highScore,
    wave: 1,
    waveEnemiesSpawned: 0,
    waveEnemiesKilled: 0,
    lastSpawnTime: 0,
    gameStatus: 'menu',
    screenShake: 0,
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
});

const createStarfield = (): Star[] => {
  const stars: Star[] = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 2 + 0.5,
      brightness: Math.random() * 0.5 + 0.5,
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

const createBullet = (x: number, y: number, isEnemy: boolean, vx = 0): Bullet => ({
  position: { x, y },
  velocity: { x: vx, y: isEnemy ? ENEMY_BULLET_SPEED : -BULLET_SPEED },
  width: BULLET_WIDTH,
  height: BULLET_HEIGHT,
  isEnemy,
});

const createExplosion = (x: number, y: number, count: number, color: string): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      position: { x, y },
      velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      color,
      size: 2 + Math.random() * 3,
      lifetime: 0.5 + Math.random() * 0.5,
      maxLifetime: 0.5 + Math.random() * 0.5,
      type: 'explosion',
    });
  }
  return particles;
};

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
  const dt = deltaTime / 16.67; // Normalize to 60fps

  // Update stars
  newState.stars = newState.stars.map((star) => ({
    ...star,
    y: star.y + star.speed * dt,
    ...(star.y > CANVAS_HEIGHT && {
      y: 0,
      x: Math.random() * CANVAS_WIDTH,
    }),
  }));

  // Update player
  let playerVx = 0;
  if (input.left) playerVx -= PLAYER_SPEED;
  if (input.right) playerVx += PLAYER_SPEED;

  newState.player = {
    ...newState.player,
    position: {
      x: Math.max(0, Math.min(CANVAS_WIDTH - newState.player.width, newState.player.position.x + playerVx * dt)),
      y: newState.player.position.y,
    },
    invincible: currentTime < newState.player.invincibleUntil,
  };

  // Player shooting
  if (input.fire && currentTime - newState.player.lastFired >= newState.player.fireRate) {
    const bulletX = newState.player.position.x + newState.player.width / 2 - BULLET_WIDTH / 2;
    const bulletY = newState.player.position.y;
    newState.bullets = [...newState.bullets, createBullet(bulletX, bulletY, false)];
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

      // Update phase based on HP
      const hpPercent = boss.hp / boss.maxHp;
      if (hpPercent < 0.33) boss.phase = 3;
      else if (hpPercent < 0.66) boss.phase = 2;
    }

    newState.boss = boss;
  }

  // Collision: player bullets vs enemies
  const playerBullets = newState.bullets.filter((b) => !b.isEnemy);
  playerBullets.forEach((bullet) => {
    newState.enemies.forEach((enemy, ei) => {
      if (checkCollision(bullet, enemy)) {
        newState.enemies[ei] = { ...enemy, hp: enemy.hp - 1 };
        newState.bullets = newState.bullets.filter((b) => b !== bullet);
        
        if (newState.enemies[ei].hp <= 0) {
          newState.score += enemy.points;
          newState.waveEnemiesKilled++;
          newState.particles = [
            ...newState.particles,
            ...createExplosion(
              enemy.position.x + enemy.width / 2,
              enemy.position.y + enemy.height / 2,
              15,
              enemy.pattern === 'heavy' ? '#ff8800' : '#ff00ff'
            ),
          ];
          newState.screenShake = 5;
          audioManager.explosion();
        }
      }
    });

    // Player bullets vs boss
    if (newState.boss && checkCollision(bullet, newState.boss)) {
      newState.boss = { ...newState.boss, hp: newState.boss.hp - 1 };
      newState.bullets = newState.bullets.filter((b) => b !== bullet);
      newState.particles = [
        ...newState.particles,
        ...createExplosion(bullet.position.x, bullet.position.y, 5, '#ff4444'),
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
  if (!newState.player.invincible) {
    const enemyBullets = newState.bullets.filter((b) => b.isEnemy);
    enemyBullets.forEach((bullet) => {
      if (checkCollision(bullet, newState.player)) {
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

    // Collision: enemies vs player
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
    audioManager.waveComplete();
  }

  return newState;
};

export const startGame = (state: GameState): GameState => ({
  ...createInitialState(),
  highScore: state.highScore,
  gameStatus: 'playing',
});
