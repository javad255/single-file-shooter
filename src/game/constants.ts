import { WaveConfig, EnemyPattern } from './types';

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 600;

export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 30;
export const PLAYER_SPEED = 6;
export const PLAYER_FIRE_RATE = 150; // ms between shots

export const BULLET_WIDTH = 4;
export const BULLET_HEIGHT = 12;
export const BULLET_SPEED = 10;
export const ENEMY_BULLET_SPEED = 5;

export const ENEMY_WIDTH = 30;
export const ENEMY_HEIGHT = 25;
export const ENEMY_BASE_SPEED = 2;

export const BOSS_WIDTH = 80;
export const BOSS_HEIGHT = 60;
export const BOSS_SPEED = 2;

export const INVINCIBILITY_DURATION = 2000; // ms

export const COLORS = {
  background: '#0a0a12',
  player: '#00ffff',
  playerGlow: 'rgba(0, 255, 255, 0.5)',
  bullet: '#00ffff',
  bulletGlow: 'rgba(0, 255, 255, 0.8)',
  enemy: '#ff00ff',
  enemyGlow: 'rgba(255, 0, 255, 0.5)',
  enemyBullet: '#ff00ff',
  boss: '#ff4444',
  bossGlow: 'rgba(255, 68, 68, 0.5)',
  heavy: '#ff8800',
  heavyGlow: 'rgba(255, 136, 0, 0.5)',
  particle: '#ffff00',
  explosion: '#ff6600',
  star: '#ffffff',
  ui: '#00ffff',
  uiSecondary: '#ff00ff',
};

export const getWaveConfig = (wave: number): WaveConfig => {
  const baseEnemies = 5 + Math.floor(wave * 1.5);
  const patterns: EnemyPattern[] = ['straight'];
  
  if (wave >= 2) patterns.push('zigzag');
  if (wave >= 3) patterns.push('dive');
  if (wave >= 4) patterns.push('heavy');
  
  return {
    enemyCount: Math.min(baseEnemies, 20),
    patterns,
    spawnInterval: Math.max(1500 - wave * 100, 500),
    enemySpeed: ENEMY_BASE_SPEED + wave * 0.2,
    hasBoss: wave % 5 === 0 && wave > 0,
  };
};

export const ENEMY_CONFIG: Record<EnemyPattern, { hp: number; speed: number; canShoot: boolean; points: number }> = {
  straight: { hp: 1, speed: 1, canShoot: false, points: 100 },
  zigzag: { hp: 1, speed: 0.8, canShoot: true, points: 150 },
  dive: { hp: 2, speed: 1.2, canShoot: false, points: 200 },
  heavy: { hp: 4, speed: 0.5, canShoot: true, points: 300 },
};
