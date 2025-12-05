import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, InputState } from '@/game/types';
import { createInitialState, updateGame, startGame } from '@/game/engine';
import { render, renderMenu, renderGameOver } from '@/game/renderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/game/constants';
import { audioManager } from '@/game/audio';
import { ChevronLeft, ChevronRight, Crosshair } from 'lucide-react';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const inputRef = useRef<InputState>({ left: false, right: false, fire: false });
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleStart = useCallback(() => {
    audioManager.resume();
    if (gameState.gameStatus === 'menu' || gameState.gameStatus === 'gameOver') {
      setGameState(startGame(gameState));
    }
  }, [gameState]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = true;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        inputRef.current.fire = true;
        if (gameState.gameStatus !== 'playing') {
          handleStart();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = false;
      }
      if (e.code === 'Space') {
        inputRef.current.fire = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.gameStatus, handleStart]);

  // Touch/drag controls on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCanvasCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleX,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      audioManager.resume();
      
      if (gameState.gameStatus !== 'playing') {
        handleStart();
        return;
      }

      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      touchStartRef.current = coords;
      inputRef.current.touchX = coords.x;
      inputRef.current.fire = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!touchStartRef.current) return;
      
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      inputRef.current.touchX = coords.x;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      touchStartRef.current = null;
      inputRef.current.touchX = undefined;
      inputRef.current.fire = false;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [gameState.gameStatus, handleStart]);

  // Game loop
  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (gameState.gameStatus === 'playing') {
        setGameState((prev) => updateGame(prev, inputRef.current, deltaTime, timestamp));
      }

      // Render
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        if (gameState.gameStatus === 'menu') {
          renderMenu(ctx, gameState, timestamp);
        } else if (gameState.gameStatus === 'gameOver') {
          render(ctx, gameState, timestamp);
          renderGameOver(ctx, gameState, timestamp);
        } else {
          render(ctx, gameState, timestamp);
        }
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState]);

  // Button touch controls (fallback)
  const handleButtonStart = (action: 'left' | 'right' | 'fire') => {
    audioManager.resume();
    inputRef.current[action] = true;
  };

  const handleButtonEnd = (action: 'left' | 'right' | 'fire') => {
    inputRef.current[action] = false;
  };

  return (
    <div className="game-container" ref={containerRef}>
      <div className="stars" />
      
      <div className="relative touch-none">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas"
          onClick={() => {
            if (!isMobile && gameState.gameStatus !== 'playing') {
              handleStart();
            }
          }}
        />
        <div className="scanlines" />
      </div>

      {/* Mobile Controls - Alternative buttons */}
      <div className="mobile-controls">
        <button
          className="control-btn"
          onTouchStart={() => handleButtonStart('left')}
          onTouchEnd={() => handleButtonEnd('left')}
          onMouseDown={() => handleButtonStart('left')}
          onMouseUp={() => handleButtonEnd('left')}
          onMouseLeave={() => handleButtonEnd('left')}
        >
          <ChevronLeft className="w-8 h-8 text-primary" />
        </button>
        
        <button
          className="control-btn fire-btn"
          onTouchStart={() => {
            handleButtonStart('fire');
            if (gameState.gameStatus !== 'playing') {
              handleStart();
            }
          }}
          onTouchEnd={() => handleButtonEnd('fire')}
          onMouseDown={() => {
            handleButtonStart('fire');
            if (gameState.gameStatus !== 'playing') {
              handleStart();
            }
          }}
          onMouseUp={() => handleButtonEnd('fire')}
          onMouseLeave={() => handleButtonEnd('fire')}
        >
          <Crosshair className="w-10 h-10 text-secondary" />
        </button>
        
        <button
          className="control-btn"
          onTouchStart={() => handleButtonStart('right')}
          onTouchEnd={() => handleButtonEnd('right')}
          onMouseDown={() => handleButtonStart('right')}
          onMouseUp={() => handleButtonEnd('right')}
          onMouseLeave={() => handleButtonEnd('right')}
        >
          <ChevronRight className="w-8 h-8 text-primary" />
        </button>
      </div>

      {/* Touch instruction for mobile */}
      {isMobile && gameState.gameStatus === 'playing' && (
        <div className="text-center mt-2 text-xs text-muted-foreground opacity-50">
          Drag on screen to move • Touch to fire
        </div>
      )}
    </div>
  );
};

export default Game;
