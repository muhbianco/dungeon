import { useEffect, useMemo, useRef, useState } from 'react';
import {
  advanceWaveOrComplete,
  applyRegen,
  buildPlayerCombatant,
  createFloorEncounter,
  enemyAttack,
  getActiveEnemy,
  playerAttack,
  summarizeThreat,
} from '../game/combat.js';

function hpPct(current, max) {
  if (!max) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

export default function CombatScreen({
  classData,
  upgrades,
  busy,
  onDie,
  onAbandon,
}) {
  const startedAt = useRef(Date.now());
  const playerRef = useRef(buildPlayerCombatant(classData, upgrades));
  const encounterRef = useRef(createFloorEncounter(1));
  const floorRef = useRef(1);
  const maxFloorRef = useRef(1);
  const runRef = useRef({ kills: 0, gold: 0, xp: 0 });
  const timersRef = useRef({ player: 0, enemy: 0, last: performance.now() });
  const logRef = useRef(['A masmorra se abre. Wave 1 começa.']);
  const pausedRef = useRef(false);

  const [paused, setPaused] = useState(false);
  const [ui, setUi] = useState(() => snapshot());

  function snapshot() {
    const encounter = encounterRef.current;
    const player = playerRef.current;
    const enemy = getActiveEnemy(encounter);
    const wave = encounter.waves[encounter.waveIndex];
    return {
      floor: floorRef.current,
      maxFloor: maxFloorRef.current,
      player: { ...player },
      encounter: {
        kills: encounter.kills,
        killsRequired: encounter.killsRequired,
        waveIndex: encounter.waveIndex,
        waveCount: encounter.waves.length,
        completed: encounter.completed,
        livingInWave: wave ? wave.enemies.filter((e) => e.hp > 0).length : 0,
      },
      enemy: enemy
        ? {
            name: enemy.name,
            hp: enemy.hp,
            maxHp: enemy.maxHp,
            damage: enemy.damage,
          }
        : null,
      run: { ...runRef.current },
      log: [...logRef.current],
      dead: player.hp <= 0,
    };
  }

  function refresh() {
    setUi(snapshot());
  }

  function pushLog(message) {
    logRef.current = [message, ...logRef.current].slice(0, 40);
  }

  function resetFloor(nextFloor, { heal = false, reason } = {}) {
    const f = Math.max(1, nextFloor);
    floorRef.current = f;
    maxFloorRef.current = Math.max(maxFloorRef.current, f);
    encounterRef.current = createFloorEncounter(f);
    timersRef.current.player = 0;
    timersRef.current.enemy = 0;
    timersRef.current.last = performance.now();
    if (heal) playerRef.current.hp = playerRef.current.maxHp;
    pushLog(`${reason || `Andar ${f}`}. Precisa eliminar ${summarizeThreat(f).killsRequired} inimigos.`);
    refresh();
  }

  function goDeeper() {
    if (!encounterRef.current.completed || playerRef.current.hp <= 0) return;
    resetFloor(floorRef.current + 1, { reason: `Desceu para o andar ${floorRef.current + 1}` });
  }

  function retreat() {
    if (floorRef.current <= 1 || playerRef.current.hp <= 0) return;
    resetFloor(floorRef.current - 1, {
      heal: true,
      reason: `Recuou para o andar ${floorRef.current - 1}`,
    });
  }

  function endPayload() {
    return {
      maxFloor: maxFloorRef.current,
      kills: runRef.current.kills,
      goldEarned: runRef.current.gold,
      playTimeSeconds: Math.max(1, Math.floor((Date.now() - startedAt.current) / 1000)),
    };
  }

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    let raf = 0;
    let uiAcc = 0;
    let dirty = false;

    const tick = (now) => {
      const dt = Math.min(100, now - timersRef.current.last);
      timersRef.current.last = now;
      uiAcc += dt;

      const player = playerRef.current;
      const encounter = encounterRef.current;

      if (!pausedRef.current && player.hp > 0 && !encounter.completed) {
        applyRegen(player, dt);
        dirty = true;

        let enemy = getActiveEnemy(encounter);
        if (!enemy) {
          const status = advanceWaveOrComplete(encounter);
          if (status === 'next_wave') pushLog(`Wave ${encounter.waveIndex + 1} chegou!`);
          if (status === 'completed') pushLog(`Andar ${encounter.floor} limpo. Pode descer.`);
        } else {
          timersRef.current.player += dt;
          timersRef.current.enemy += dt;

          if (timersRef.current.player >= player.attackIntervalMs) {
            timersRef.current.player = 0;
            const hit = playerAttack(player, enemy);
            pushLog(
              hit.crit
                ? `Crítico em ${enemy.name}: ${hit.damage}`
                : `Você acerta ${enemy.name}: ${hit.damage}`
            );

            if (hit.killed) {
              encounter.kills += 1;
              const goldGain = Math.floor(enemy.gold * player.goldGainMult);
              const xpGain = Math.floor(enemy.xp * player.xpGainMult);
              runRef.current.kills += 1;
              runRef.current.gold += goldGain;
              runRef.current.xp += xpGain;
              pushLog(`${enemy.name} derrotado (+${xpGain} XP, +${goldGain} ouro)`);
              timersRef.current.enemy = 0;

              const status = advanceWaveOrComplete(encounter);
              if (status === 'next_wave') pushLog(`Wave ${encounter.waveIndex + 1} chegou!`);
              if (status === 'completed') pushLog(`Andar ${encounter.floor} limpo. Pode descer.`);
            }
          }

          enemy = getActiveEnemy(encounter);
          if (enemy && timersRef.current.enemy >= enemy.attackIntervalMs) {
            timersRef.current.enemy = 0;
            const hit = enemyAttack(enemy, player);
            pushLog(`${enemy.name} acerta você: ${hit.damage}`);
            if (hit.dead) pushLog('Você caiu na masmorra…');
          }
        }
      }

      if (dirty && uiAcc >= 80) {
        uiAcc = 0;
        dirty = false;
        refresh();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!ui.dead) return undefined;
    const t = setTimeout(() => onDie(endPayload()), 650);
    return () => clearTimeout(t);
  }, [ui.dead]); // eslint-disable-line react-hooks/exhaustive-deps

  const threat = useMemo(() => summarizeThreat(ui.floor), [ui.floor]);

  return (
    <section className="panel combat">
      <div className="combat-head">
        <div>
          <h2>Expedição — {classData?.name}</h2>
          <p className="muted">
            Andar <strong>{ui.floor}</strong> · Ameaça <strong>{threat.label}</strong> (x{threat.scale.toFixed(2)})
          </p>
        </div>
        <div className="combat-meta">
          <span>Ouro: <strong>{ui.run.gold}</strong></span>
          <span>XP: <strong>{ui.run.xp}</strong></span>
          <span>Kills: <strong>{ui.run.kills}</strong></span>
        </div>
      </div>

      <div className="bars">
        <div className="bar-block">
          <div className="bar-label">
            <span>{ui.player.name}</span>
            <span>{Math.ceil(ui.player.hp)}/{ui.player.maxHp}</span>
          </div>
          <div className="bar">
            <div className="bar-fill hp" style={{ width: `${hpPct(ui.player.hp, ui.player.maxHp)}%` }} />
          </div>
        </div>

        <div className="bar-block">
          <div className="bar-label">
            <span>Progresso do andar</span>
            <span>{ui.encounter.kills}/{ui.encounter.killsRequired}</span>
          </div>
          <div className="bar">
            <div
              className="bar-fill xp"
              style={{ width: `${hpPct(ui.encounter.kills, ui.encounter.killsRequired)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="arena">
        {ui.encounter.completed ? (
          <div className="enemy-card clear">
            <strong>Andar limpo</strong>
            <p className="muted">Pode descer — o próximo andar será mais forte.</p>
          </div>
        ) : ui.enemy ? (
          <div className="enemy-card">
            <div className="bar-label">
              <span>{ui.enemy.name}</span>
              <span>{Math.ceil(ui.enemy.hp)}/{ui.enemy.maxHp}</span>
            </div>
            <div className="bar">
              <div
                className="bar-fill enemy"
                style={{ width: `${hpPct(ui.enemy.hp, ui.enemy.maxHp)}%` }}
              />
            </div>
            <p className="muted">
              Wave {ui.encounter.waveIndex + 1}/{ui.encounter.waveCount} · Dano {ui.enemy.damage} · Restam{' '}
              {ui.encounter.livingInWave} nesta wave
            </p>
          </div>
        ) : (
          <div className="enemy-card">
            <strong>Preparando próxima wave…</strong>
          </div>
        )}

        <div className="wave-dots" aria-hidden>
          {Array.from({ length: ui.encounter.waveCount }, (_, idx) => {
            const cleared = idx < ui.encounter.waveIndex
              || (idx === ui.encounter.waveIndex && ui.encounter.completed);
            const current = idx === ui.encounter.waveIndex && !ui.encounter.completed;
            return (
              <span
                key={idx}
                className={`wave-dot ${cleared ? 'done' : ''} ${current ? 'current' : ''}`}
              />
            );
          })}
        </div>
      </div>

      <div className="actions">
        <button
          type="button"
          disabled={!ui.encounter.completed || ui.dead || busy}
          onClick={goDeeper}
        >
          Descer andar
        </button>
        <button
          type="button"
          className="ghost"
          disabled={ui.floor <= 1 || ui.dead || busy}
          onClick={retreat}
        >
          Subir andar
        </button>
        <button
          type="button"
          className="ghost"
          disabled={ui.dead || busy}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? 'Retomar' : 'Pausar'}
        </button>
        <button
          type="button"
          className="danger"
          disabled={busy}
          onClick={() => onDie(endPayload())}
        >
          Morrer / Encerrar Run
        </button>
        <button type="button" className="ghost" disabled={busy} onClick={onAbandon}>
          Abandonar
        </button>
      </div>

      {!ui.encounter.completed ? (
        <p className="hint muted">
          Elimine {ui.encounter.killsRequired - ui.encounter.kills} inimigo(s) para liberar a descida.
          Se ficar pesado, suba de andar.
        </p>
      ) : (
        <p className="hint ok-text">Escada liberada. Desça com cuidado — a ameaça sobe a cada andar.</p>
      )}

      <div className="combat-log" aria-live="polite">
        {ui.log.map((line, i) => (
          <p key={`${i}-${line.slice(0, 24)}`}>{line}</p>
        ))}
      </div>
    </section>
  );
}
