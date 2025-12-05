export interface Vector2D {
  x: number;
  y: number;
}

export interface Player {
  position: Vector2D;
  velocity: Vector2D;
  width: number;
  height: number;
  fireRate: number;
  lastFired: number;
  lives: number;
  invincible: boolean;
  invincibleUntil: number;
}

export interface Bullet {
  position: Vector2D;
  velocity: Vector2D;
  width: number;
  height: number;
  isEnemy: boolean;
}

export type EnemyPattern = 'straight' | 'zigzag' | 'dive' | 'heavy';

export interface Enemy {
  position: Vector2D;
  velocity: Vector2D;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  pattern: EnemyPattern;
  patternData: {
    startX: number;
    amplitude: number;
    frequency: number;
    diveTriggered: boolean;
  };
  canShoot: boolean;
  lastShot: number;
  shootInterval: number;
  points: number;
}

export interface Boss {
  position: Vector2D;
  velocity: Vector2D;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  phase: number;
  lastShot: number;
  shootInterval: number;
  minionSpawnTime: number;
  points: number;
}

export interface Particle {
  position: Vector2D;
  velocity: Vector2D;
  color: string;
  size: number;
  lifetime: number;
  maxLifetime: number;
  type: 'explosion' | 'trail' | 'spark';
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

export interface WaveConfig {
  enemyCount: number;
  patterns: EnemyPattern[];
  spawnInterval: number;
  enemySpeed: number;
  hasBoss: boolean;
}

export interface GameState {
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  boss: Boss | null;
  particles: Particle[];
  stars: Star[];
  score: number;
  highScore: number;
  wave: number;
  waveEnemiesSpawned: number;
  waveEnemiesKilled: number;
  lastSpawnTime: number;
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameOver';
  screenShake: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  fire: boolean;
}
