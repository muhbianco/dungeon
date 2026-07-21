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
  tickSkillCooldowns,
  tryAutoCastSkill,
} from '../game/combat.js';

const TICK_MS = 50;
const MAX_CATCH_UP_MS = 2500;
const STEP_MS = 100;

function hpPct(current, max) {
  if (!max) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

function skillTypeLabel(skill) {
  if (skill.kind === 'heal') return 'Cura';
  if (skill.damageType === 'magic') return 'Mágica';
  if (skill.damageType === 'hybrid') return 'Híbrida';
  return 'Física';
}

export default function CombatScreen({
  classData,
  character,
  upgrades,
  settings,
  busy,
  onDie,
  onSettingsChange,
}) {
  const startedAt = useRef(Date.now());
  const playerRef = useRef(buildPlayerCombatant(classData, upgrades, {
    attrs: character?.attrs,
    equipmentBonuses: character?.equipmentBonuses,
    level: character?.level || 1,
    skills: character?.skills || [],
  }));
  const encounterRef = useRef(createFloorEncounter(1));
  const floorRef = useRef(1);
  const maxFloorRef = useRef(1);
  const runRef = useRef({ kills: 0, gold: 0, xp: 0 });
  const timersRef = useRef({ player: 0, enemy: 0, last: Date.now() });
  const logRef = useRef(['A masmorra se abre. Wave 1 começa.']);
  const deadHandledRef = useRef(false);
  const autoDescendRef = useRef(Boolean(settings?.autoDescend));
  const [autoDescend, setAutoDescend] = useState(Boolean(settings?.autoDescend));

  const [ui, setUi] = useState(() => snapshot());

  function snapshot() {
    const encounter = encounterRef.current;
    const player = playerRef.current;
    const enemy = getActiveEnemy(encounter);
    const wave = encounter.waves[encounter.waveIndex];
    return {
      floor: floorRef.current,
      maxFloor: maxFloorRef.current,
      player: {
        ...player,
        skills: (player.skills || []).map((s) => ({ ...s })),
      },
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

  function registerKill(enemy) {
    const player = playerRef.current;
    const encounter = encounterRef.current;
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
    if (status === 'farm_wave') pushLog(`Farm wave ${encounter.waveIndex + 1} — pode continuar no andar.`);
    if (status === 'unlocked') {
      if (autoDescendRef.current) {
        pushLog(`Escada liberada — descendo automaticamente…`);
        goDeeper();
      } else {
        pushLog(`Escada liberada no andar ${encounter.floor}. Pode descer ou continuar farmando.`);
      }
    }
  }

  function toggleAutoDescend() {
    const next = !autoDescendRef.current;
    autoDescendRef.current = next;
    setAutoDescend(next);
    onSettingsChange?.({ autoDescend: next });
    pushLog(next ? 'Descida automática: ligada.' : 'Descida automática: desligada.');
    refresh();
  }

  function resetFloor(nextFloor, { reason } = {}) {
    const f = Math.max(1, nextFloor);
    floorRef.current = f;
    maxFloorRef.current = Math.max(maxFloorRef.current, f);
    encounterRef.current = createFloorEncounter(f);
    timersRef.current.player = 0;
    timersRef.current.enemy = 0;
    timersRef.current.last = Date.now();
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
      reason: `Recuou para o andar ${floorRef.current - 1}`,
    });
  }

  function endPayload() {
    return {
      classId: classData?.id,
      maxFloor: maxFloorRef.current,
      kills: runRef.current.kills,
      goldEarned: runRef.current.gold,
      xpGained: runRef.current.xp,
      playTimeSeconds: Math.max(1, Math.floor((Date.now() - startedAt.current) / 1000)),
    };
  }

  function simulateStep(dt) {
    const player = playerRef.current;
    const encounter = encounterRef.current;
    if (player.hp <= 0) return;

    if (autoDescendRef.current && encounter.completed) {
      goDeeper();
      return;
    }

    applyRegen(player, dt);
    tickSkillCooldowns(player, dt);

    let enemy = getActiveEnemy(encounter);
    if (!enemy) {
      const status = advanceWaveOrComplete(encounter);
      if (status === 'next_wave') pushLog(`Wave ${encounter.waveIndex + 1} chegou!`);
      if (status === 'farm_wave') pushLog(`Farm wave ${encounter.waveIndex + 1} — pode continuar no andar.`);
      if (status === 'unlocked') {
        if (autoDescendRef.current) {
          pushLog(`Escada liberada — descendo automaticamente…`);
          goDeeper();
        } else {
          pushLog(`Escada liberada no andar ${encounter.floor}. Pode descer ou continuar farmando.`);
        }
      }
      return;
    }

    timersRef.current.player += dt;
    timersRef.current.enemy += dt;

    const cast = tryAutoCastSkill(player, enemy);
    if (cast) {
      if (cast.type === 'heal') {
        pushLog(`${cast.skill.name}: +${Math.ceil(cast.healed)} HP`);
      } else {
        pushLog(
          cast.crit
            ? `${cast.skill.name} crítico em ${enemy.name}: ${cast.damage}`
            : `${cast.skill.name} em ${enemy.name}: ${cast.damage}`
        );
        if (cast.killed) {
          registerKill(enemy);
          enemy = getActiveEnemy(encounter);
          if (!enemy) return;
        }
      }
    }

    if (enemy && timersRef.current.player >= player.attackIntervalMs) {
      timersRef.current.player = 0;
      const hit = playerAttack(player, enemy);
      pushLog(
        hit.crit
          ? `Crítico em ${enemy.name}: ${hit.damage}`
          : `Você acerta ${enemy.name}: ${hit.damage}`
      );

      if (hit.killed) {
        registerKill(enemy);
        enemy = getActiveEnemy(encounter);
        if (!enemy) return;
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

  useEffect(() => {
    // setInterval + Date.now: continua mesmo com aba em background / Alt+Tab
    const id = setInterval(() => {
      const now = Date.now();
      let remaining = Math.min(MAX_CATCH_UP_MS, now - timersRef.current.last);
      timersRef.current.last = now;

      while (remaining > 0 && playerRef.current.hp > 0) {
        const step = Math.min(STEP_MS, remaining);
        simulateStep(step);
        remaining -= step;
      }

      refresh();

      if (playerRef.current.hp <= 0 && !deadHandledRef.current) {
        deadHandledRef.current = true;
        setTimeout(() => onDie(endPayload()), 650);
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const threat = useMemo(() => summarizeThreat(ui.floor), [ui.floor]);

  return (
    <section className="panel combat">
      <div className="combat-head">
        <div>
          <h2>Expedição — {classData?.name} · Nv. {character?.level || 1}</h2>
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
            <span>{ui.encounter.completed ? 'Escada liberada (farm livre)' : 'Progresso do andar'}</span>
            <span>{ui.encounter.kills}/{ui.encounter.killsRequired}</span>
          </div>
          <div className="bar">
            <div
              className="bar-fill xp"
              style={{ width: `${hpPct(Math.min(ui.encounter.kills, ui.encounter.killsRequired), ui.encounter.killsRequired)}%` }}
            />
          </div>
        </div>
      </div>

      {ui.player.skills?.length ? (
        <div className="skill-hud">
          {ui.player.skills.map((skill) => {
            const ready = skill.cooldownRemaining <= 0;
            const pct = ready
              ? 100
              : 100 - Math.min(100, (skill.cooldownRemaining / skill.effectiveCooldownMs) * 100);
            return (
              <div key={skill.key} className={`skill-chip ${ready ? 'ready' : ''} ${skill.kind}`}>
                <div className="skill-chip-top">
                  <strong>{skill.name}</strong>
                  <span>{ready ? 'Pronta' : `${(skill.cooldownRemaining / 1000).toFixed(1)}s`}</span>
                </div>
                <small className="muted">{skillTypeLabel(skill)} · Nv. {skill.level}</small>
                <div className="bar skill-cd">
                  <div className="bar-fill skill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="arena">
        {ui.enemy ? (
          <div className={`enemy-card ${ui.encounter.completed ? 'clear' : ''}`}>
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
              Wave {ui.encounter.waveIndex + 1} · Dano {ui.enemy.damage} · Restam{' '}
              {ui.encounter.livingInWave} nesta wave
              {ui.encounter.completed ? ' · farmando' : ''}
            </p>
          </div>
        ) : (
          <div className="enemy-card">
            <strong>Preparando próxima wave…</strong>
          </div>
        )}
      </div>

      <div className="actions">
        <button
          type="button"
          disabled={!ui.encounter.completed || ui.dead || busy || autoDescend}
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
        <label className={`toggle-flag ${autoDescend ? 'on' : ''}`}>
          <input
            type="checkbox"
            checked={autoDescend}
            disabled={ui.dead || busy}
            onChange={toggleAutoDescend}
          />
          Descer sozinho
        </label>
        <button
          type="button"
          className="danger"
          disabled={busy}
          onClick={() => onDie(endPayload())}
        >
          Morrer / Encerrar Run
        </button>
      </div>

      {!ui.encounter.completed ? (
        <p className="hint muted">
          Elimine {Math.max(0, ui.encounter.killsRequired - ui.encounter.kills)} inimigo(s) para liberar a descida.
          Se ficar pesado, suba de andar.
        </p>
      ) : autoDescend ? (
        <p className="hint ok-text">Descida automática ligada — avançando para o próximo andar.</p>
      ) : (
        <p className="hint ok-text">
          Escada liberada. Pode descer quando quiser — ou continuar farmando neste andar.
        </p>
      )}

      <div className="combat-log" aria-live="polite">
        {ui.log.map((line, i) => (
          <p key={`${i}-${line.slice(0, 24)}`}>{line}</p>
        ))}
      </div>
    </section>
  );
}
