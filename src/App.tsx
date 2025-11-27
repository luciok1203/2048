import React, { useState, useEffect, useCallback } from 'react';
import { type Map2048, moveMapIn2048Rule } from './logic';

type Direction = 'up' | 'down' | 'left' | 'right';

const ROWS = 4;
const COLS = 4;

/* ---------- 유틸 ---------- */
function createEmptyMap(rows = ROWS, cols = COLS): Map2048 {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );
}
function cloneMap(map: Map2048): Map2048 {
  return map.map((row) => row.slice());
}
function getEmptyCells(map: Map2048) {
  const out: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[r].length; c++) {
      if (map[r][c] === null) out.push({ r, c });
    }
  }
  return out;
}
function addRandomTile(map: Map2048): Map2048 {
  const empty = getEmptyCells(map);
  if (empty.length === 0) return map;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.1 ? 4 : 2;
  const next = cloneMap(map);
  next[r][c] = value;
  return next;
}
function hasAnyMove(map: Map2048): boolean {
  const dirs: Direction[] = ['up', 'down', 'left', 'right'];
  return dirs.some((d) => moveMapIn2048Rule(map, d).isMoved);
}
/** 128 이상 타일이 있으면 true */
function checkWin(map: Map2048): boolean {
  return map.some((row) => row.some((cell) => (cell ?? 0) >= 128));
}

/* ---------- 메인 컴포넌트 ---------- */
function App() {
  // map 복원
  const [map, setMap] = useState<Map2048>(() => {
    const saved = localStorage.getItem('map');
    if (saved) {
      try {
        return JSON.parse(saved) as Map2048;
      } catch {
        // 손상된 저장값 제거 후 새 게임으로 진행
        localStorage.removeItem('map');
      }
    }
    let m = createEmptyMap();
    m = addRandomTile(m);
    m = addRandomTile(m);
    return m;
  });

  // gameOver/win 복원 (값이 없으면 기본 false)
  const [gameOver, setGameOver] = useState<boolean>(() => {
    const v = localStorage.getItem('gameOver');
    return v === 'true';
  });
  const [win, setWin] = useState<boolean>(() => {
    const v = localStorage.getItem('win');
    return v === 'true';
  });

  const reset = useCallback(() => {
    let m = createEmptyMap();
    m = addRandomTile(m);
    m = addRandomTile(m);
    setMap(m);
    setGameOver(false);
    setWin(false);
  }, []);

  const tryMove = useCallback(
    (dir: Direction) => {
      if (gameOver || win) return;
      const { result, isMoved } = moveMapIn2048Rule(map, dir);
      if (!isMoved) return;

      const withNew = addRandomTile(result);
      setMap(withNew);

      // 128 도달 시 즉시 종료
      if (checkWin(withNew)) {
        setWin(true);
        setGameOver(true);
        return;
      }

      // 이동 불가 게임오버
      if (!hasAnyMove(withNew)) setGameOver(true);
    },
    [map, gameOver, win]
  );

  /* ------- 저장 ------- */
  useEffect(() => {
    localStorage.setItem('map', JSON.stringify(map));
  }, [map]);

  useEffect(() => {
    localStorage.setItem('gameOver', String(gameOver));
  }, [gameOver]);

  useEffect(() => {
    localStorage.setItem('win', String(win));
  }, [win]);

  /* ------- 방향키만 처리 (WASD 없음) ------- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameOver || win) return;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          tryMove('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          tryMove('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          tryMove('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          tryMove('right');
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tryMove, gameOver, win]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={{ margin: 0 }}>2048 GAME</h1>
        <button onClick={reset} style={styles.button}>
          New Game
        </button>
      </header>

      {/* 안내 문구 제거, 상태만 표시 */}
      <div style={styles.hint}>
        {win && (
          <strong style={{ marginLeft: 8, color: '#27ae60' }}>
            128 TILE! YOU WIN 🎉
          </strong>
        )}
        {!win && gameOver && (
          <strong style={{ marginLeft: 8, color: '#c0392b' }}>Game Over</strong>
        )}
      </div>

      <div
        style={{
          ...styles.board,
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {map.map((row, r) =>
          row.map((cell, c) => (
            <div key={`${r}-${c}`} style={styles.tile(cell)}>
              {cell ?? ''}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;

/* ---------- 스타일 ---------- */
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 16,
    background: '#faf8ef',
    padding: 24,
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
  header: {
    width: '100%',
    maxWidth: 480,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    background: '#8f7a66',
    color: '#fff',
    border: 0,
    borderRadius: 8,
    padding: '8px 12px',
    cursor: 'pointer',
  },
  hint: {
    width: '100%',
    maxWidth: 480,
    color: '#776e65',
    minHeight: 24,
    display: 'flex',
    alignItems: 'center',
  },
  board: {
    width: 480,
    height: 480,
    background: '#bbada0',
    borderRadius: 12,
    padding: 12,
    display: 'grid',
    gap: 12,
    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
  },
  tile: (val: number | null) =>
    ({
      background: val ? tileBg(val) : '#cdc1b4',
      color: val && val <= 4 ? '#776e65' : '#f9f6f2',
      fontWeight: 800,
      fontSize: val ? fontSizeFor(val) : 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      transition: 'all 120ms ease',
      userSelect: 'none' as const,
    }) as React.CSSProperties,
};

function tileBg(n: number) {
  const map: Record<number, string> = {
    2: '#eee4da',
    4: '#ede0c8',
    8: '#f2b179',
    16: '#f59563',
    32: '#f67c5f',
    64: '#f65e3b',
    128: '#edcf72',
    256: '#edcc61',
    512: '#edc850',
    1024: '#edc53f',
    2048: '#edc22e',
  };
  return map[n] ?? '#3c3a32';
}

function fontSizeFor(n: number) {
  const len = String(n).length;
  if (len <= 2) return 42;
  if (len === 3) return 36;
  if (len === 4) return 28;
  return 24;
}
