import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, InputState } from '@/game/types';
import { createInitialState, updateGame, startGame } from '@/game/engine';
import { render, renderMenu, renderGameOver } from '@/game/renderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/game/constants';
import { audioManager } from '@/game/audio';
import { ChevronLeft, ChevronRight, Crosshair } from 'lucide-react';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const inputRef = useRef<InputState>({ left: false, right: false, fire: false });
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

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

  // Touch controls
  const handleTouchStart = (action: 'left' | 'right' | 'fire') => {
    audioManager.resume();
    inputRef.current[action] = true;
  };

  const handleTouchEnd = (action: 'left' | 'right' | 'fire') => {
    inputRef.current[action] = false;
  };

  return (
    <div className="game-container">
      <div className="stars" />
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas"
          onClick={handleStart}
        />
        <div className="scanlines" />
      </div>

      {/* Mobile Controls */}
      <div className="mobile-controls">
        <button
          className="control-btn"
          onTouchStart={() => handleTouchStart('left')}
          onTouchEnd={() => handleTouchEnd('left')}
          onMouseDown={() => handleTouchStart('left')}
          onMouseUp={() => handleTouchEnd('left')}
          onMouseLeave={() => handleTouchEnd('left')}
        >
          <ChevronLeft className="w-8 h-8 text-primary" />
        </button>
        
        <button
          className="control-btn fire-btn"
          onTouchStart={() => {
            handleTouchStart('fire');
            if (gameState.gameStatus !== 'playing') {
              handleStart();
            }
          }}
          onTouchEnd={() => handleTouchEnd('fire')}
          onMouseDown={() => {
            handleTouchStart('fire');
            if (gameState.gameStatus !== 'playing') {
              handleStart();
            }
          }}
          onMouseUp={() => handleTouchEnd('fire')}
          onMouseLeave={() => handleTouchEnd('fire')}
        >
          <Crosshair className="w-10 h-10 text-secondary" />
        </button>
        
        <button
          className="control-btn"
          onTouchStart={() => handleTouchStart('right')}
          onTouchEnd={() => handleTouchEnd('right')}
          onMouseDown={() => handleTouchStart('right')}
          onMouseUp={() => handleTouchEnd('right')}
          onMouseLeave={() => handleTouchEnd('right')}
        >
          <ChevronRight className="w-8 h-8 text-primary" />
        </button>
      </div>
    </div>
  );
};

export default Game;
