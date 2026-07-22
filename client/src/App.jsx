import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import CombatScreen from './components/CombatScreen.jsx';

const SCREENS = {
  BOOT: 'boot',
  LOGIN: 'login',
  MENU: 'menu',
  CLASS: 'class',
  GEAR: 'gear',
  SKILLS: 'skills',
  RUN: 'run',
  GUARDIAN: 'guardian',
  RANKING: 'ranking',
};

function skillKindLabel(skill) {
  if (skill.kind === 'heal') return 'Cura';
  if (skill.damageType === 'magic') return 'Mágica';
  if (skill.damageType === 'hybrid') return 'Híbrida';
  return 'Física';
}

function formatBonus(n) {
  const value = Number(n) || 0;
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(/\.0$/, '');
}

function equipStatLine(item) {
  if (item?.bonusLines?.length) {
    return item.bonusLines
      .map((line) => `${line.statLabel} ${formatBonus(line.currentBonus)} → ${formatBonus(line.nextBonus)}`)
      .join(' · ');
  }
  if (!item?.statLabel) return null;
  return `${item.statLabel} ${formatBonus(item.currentBonus)} → ${formatBonus(item.nextBonus)}`;
}

function formatPercent(n) {
  const value = Number(n) || 0;
  if (Number.isInteger(value)) return `${value}%`;
  return `${value.toFixed(1).replace(/\.0$/, '')}%`;
}

function upgradeStatLine(item, level) {
  const pct = Number(item?.percentPerLevel) || 0;
  if (!pct) return null;
  const maxLevel = item.costs?.length || 0;
  const current = level * pct;
  const next = Math.min(level + 1, maxLevel) * pct;
  if (level >= maxLevel) return `+${formatPercent(current)} (máx)`;
  return `+${formatPercent(current)} → +${formatPercent(next)}`;
}

function authMessageFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const auth = params.get('auth');
  if (!auth) return '';
  const map = {
    disabled: 'Login Discord não configurado no servidor.',
    not_in_guild: 'Você precisa estar no servidor Discord permitido.',
    state_mismatch: 'Sessão OAuth inválida. Tente de novo.',
    failed: 'Falha no login Discord.',
    denied: 'Login negado.',
  };
  return map[auth] || `Auth: ${auth}`;
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.BOOT);
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState({});
  const [selectedClass, setSelectedClass] = useState(null);
  const [gearClass, setGearClass] = useState(null);
  const [skillsClass, setSkillsClass] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState(authMessageFromQuery());
  const [busy, setBusy] = useState(false);
  const [authConfigured, setAuthConfigured] = useState(true);

  const activeCharacter = useMemo(() => {
    if (!selectedClass || !profile?.characters) return null;
    return profile.characters.find((c) => c.classId === selectedClass) || null;
  }, [profile, selectedClass]);

  const gearCharacter = useMemo(() => {
    const id = gearClass || selectedClass;
    if (!id || !profile?.characters) return null;
    return profile.characters.find((c) => c.classId === id) || null;
  }, [profile, gearClass, selectedClass]);

  const skillsCharacter = useMemo(() => {
    const id = skillsClass || selectedClass;
    if (!id || !profile?.characters) return null;
    return profile.characters.find((c) => c.classId === id) || null;
  }, [profile, skillsClass, selectedClass]);

  async function loadProfile() {
    const [meta, me] = await Promise.all([api.meta(), api.me()]);
    setClasses(meta.classes || {});
    setProfile(me);
    return me;
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const status = await api.authStatus();
        if (!alive) return;
        setAuthConfigured(status.configured);
        if (!status.authenticated) {
          setScreen(SCREENS.LOGIN);
          return;
        }
        await loadProfile();
        if (!alive) return;
        window.history.replaceState({}, '', '/');
        setScreen(SCREENS.MENU);
      } catch (err) {
        if (!alive) return;
        setError(err.message || 'Falha ao conectar');
        setScreen(SCREENS.LOGIN);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function refresh() {
    const next = await api.me();
    setProfile(next);
    return next;
  }

  async function finishRun(payload) {
    setBusy(true);
    setError('');
    try {
      const result = await api.endRun(payload);
      await refresh();
      setScreen(SCREENS.MENU);
      setSelectedClass(null);
      const levelMsg = result.levelsGained
        ? ` · +${result.levelsGained} level(s)`
        : '';
      alert(`Run encerrada. +${result.awardedEssences} essências · +${result.goldBanked} ouro${levelMsg}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function buyUpgrade(upgradeKey) {
    setBusy(true);
    setError('');
    try {
      await api.buyUpgrade(upgradeKey);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function buyEquipment(slot) {
    if (!gearClass) return;
    setBusy(true);
    setError('');
    try {
      await api.buyEquipment(gearClass, slot);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function startRun() {
    if (!selectedClass) return;
    setBusy(true);
    setError('');
    try {
      await api.ensureCharacter(selectedClass);
      await refresh();
      setScreen(SCREENS.RUN);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function openGear(classId) {
    setBusy(true);
    setError('');
    try {
      await api.ensureCharacter(classId);
      await refresh();
      setGearClass(classId);
      setScreen(SCREENS.GEAR);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function openSkills(classId) {
    setBusy(true);
    setError('');
    try {
      await api.ensureCharacter(classId);
      await refresh();
      setSkillsClass(classId);
      setScreen(SCREENS.SKILLS);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function buySkill(skillKey) {
    if (!skillsClass) return;
    setBusy(true);
    setError('');
    try {
      await api.buySkill(skillsClass, skillKey);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function openRanking() {
    setBusy(true);
    setError('');
    try {
      const data = await api.ranking();
      setRanking(data.ranking || []);
      setScreen(SCREENS.RANKING);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateSettings(partial) {
    const next = { ...(profile?.settings || {}), ...partial };
    setProfile((prev) => (prev ? { ...prev, settings: next } : prev));
    try {
      const { settings } = await api.saveSettings(next);
      setProfile((prev) => (prev ? { ...prev, settings } : prev));
    } catch (err) {
      setError(err.message);
    }
  }

  async function logout() {
    await api.logout();
    setProfile(null);
    setScreen(SCREENS.LOGIN);
  }

  if (screen === SCREENS.BOOT) {
    return (
      <div className="shell">
        <h1>Dungeon Descent</h1>
        <p className="muted">{error || 'Conectando ao servidor…'}</p>
      </div>
    );
  }

  if (screen === SCREENS.LOGIN) {
    return (
      <div className="shell">
        <section className="panel login-panel">
          <h1 className="brand">Dungeon Descent</h1>
          <p className="muted">Entre com Discord para salvar level, ouro e equipamentos.</p>
          {error ? <p className="error">{error}</p> : null}
          {!authConfigured ? (
            <p className="error">Auth Discord não configurado (envs no Portainer).</p>
          ) : (
            <div className="actions">
              <a className="btn-link" href="/auth/discord/login">Entrar com Discord</a>
            </div>
          )}
        </section>
      </div>
    );
  }

  const player = profile?.player;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="user-chip">
          {player?.avatar ? <img src={player.avatar} alt="" className="avatar" /> : null}
          <div>
            <p className="brand">Dungeon Descent</p>
            <p className="muted">{player?.globalName || player?.displayName || 'Aventureiro'}</p>
          </div>
        </div>
        <div className="stats-row">
          <span>Ouro: <strong>{player?.gold ?? 0}</strong></span>
          <span>Essências: <strong>{player?.essences ?? 0}</strong></span>
          <span>Recorde: <strong>Andar {player?.maxFloorRecord ?? 0}</strong></span>
          <span>Runs: <strong>{profile?.stats?.runs ?? 0}</strong></span>
          <button type="button" className="ghost" onClick={logout}>Sair</button>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {screen === SCREENS.MENU && (
        <section className="panel">
          <h2>Cidade Inicial</h2>
          <p className="muted">Expedições, ferreiro, mentor de habilidades e Guardião das Almas.</p>
          <div className="actions">
            <button type="button" onClick={() => setScreen(SCREENS.CLASS)}>Entrar na Masmorra</button>
            <button type="button" className="ghost" onClick={() => openGear(selectedClass || 'warrior')}>
              Ferreiro / Equipamentos
            </button>
            <button type="button" className="ghost" onClick={() => openSkills(selectedClass || 'warrior')}>
              Mentor de Habilidades
            </button>
            <button type="button" className="ghost" onClick={() => setScreen(SCREENS.GUARDIAN)}>
              Guardião das Almas
            </button>
            <button type="button" className="ghost" onClick={openRanking} disabled={busy}>
              Ranking
            </button>
          </div>

          {profile?.characters?.length ? (
            <div className="char-list">
              <h3>Personagens</h3>
              <div className="grid">
                {profile.characters.map((ch) => (
                  <div key={ch.classId} className="upgrade">
                    <div>
                      <strong>{ch.className}</strong>
                      <p className="muted">Nv. {ch.level} · XP {ch.xp}/{ch.xpToNext}</p>
                      <small className="muted">
                        STR {ch.attrs.str} · CON {ch.attrs.con} · AGI {ch.attrs.agi} · DEX {ch.attrs.dex} · INT {ch.attrs.int}
                      </small>
                    </div>
                    <div className="char-actions">
                      <button type="button" className="ghost" onClick={() => openGear(ch.classId)}>Gear</button>
                      <button type="button" className="ghost" onClick={() => openSkills(ch.classId)}>Skills</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {screen === SCREENS.CLASS && (
        <section className="panel">
          <h2>Escolher Classe</h2>
          <div className="grid">
            {Object.values(classes).map((cls) => {
              const owned = profile?.characters?.find((c) => c.classId === cls.id);
              return (
                <button
                  key={cls.id}
                  type="button"
                  className={`card-btn ${selectedClass === cls.id ? 'active' : ''}`}
                  onClick={() => setSelectedClass(cls.id)}
                >
                  <strong>{cls.name}</strong>
                  <span>{cls.passive}</span>
                  <small>
                    {owned
                      ? `Nv. ${owned.level} · STR ${owned.attrs.str} CON ${owned.attrs.con} AGI ${owned.attrs.agi} DEX ${owned.attrs.dex} INT ${owned.attrs.int}`
                      : `Base STR ${cls.attrs.str} · CON ${cls.attrs.con} · AGI ${cls.attrs.agi} · DEX ${cls.attrs.dex} · INT ${cls.attrs.int}`}
                  </small>
                </button>
              );
            })}
          </div>
          <div className="actions">
            <button type="button" className="ghost" onClick={() => setScreen(SCREENS.MENU)}>Voltar</button>
            <button type="button" disabled={!selectedClass || busy} onClick={startRun}>
              Começar Run
            </button>
          </div>
        </section>
      )}

      {screen === SCREENS.GEAR && (
        <section className="panel">
          <h2>Ferreiro</h2>
          <div className="actions" style={{ marginTop: 0 }}>
            {Object.values(classes).map((cls) => (
              <button
                key={cls.id}
                type="button"
                className={gearClass === cls.id ? '' : 'ghost'}
                onClick={() => openGear(cls.id)}
              >
                {cls.name}
              </button>
            ))}
          </div>
          {gearCharacter ? (
            <p className="muted">
              {gearCharacter.className} · Nv. {gearCharacter.level} · XP {gearCharacter.xp}/{gearCharacter.xpToNext}
            </p>
          ) : (
            <p className="muted">Selecione uma classe para equipar.</p>
          )}
          <div className="grid">
            {(profile?.slots || []).map((slot) => {
              const owned = gearCharacter?.equipment?.[slot];
              const shop = gearCharacter?.shop?.[slot]
                || profile?.shop?.[gearClass]?.[slot];
              const cost = owned ? owned.nextCost : shop?.buyCost;
              const stats = owned || shop;
              const statLine = equipStatLine(stats);
              return (
                <div key={slot} className="upgrade">
                  <div>
                    <strong>{profile?.slotLabels?.[slot] || slot}</strong>
                    <p className="muted">
                      {owned
                        ? `${owned.name} · Nv. ${owned.itemLevel}`
                        : `${shop?.name || 'Vazio'} · não equipado`}
                    </p>
                    {statLine ? <p className="equip-stat">{statLine}</p> : null}
                  </div>
                  <button
                    type="button"
                    disabled={busy || !gearClass || cost == null || (player?.gold ?? 0) < cost}
                    onClick={() => buyEquipment(slot)}
                  >
                    {owned ? `Upgrade ${cost}g` : `Comprar ${cost}g`}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="actions">
            <button type="button" className="ghost" onClick={() => setScreen(SCREENS.MENU)}>Voltar</button>
          </div>
        </section>
      )}

      {screen === SCREENS.SKILLS && (
        <section className="panel">
          <h2>Mentor de Habilidades</h2>
          <p className="muted">4 habilidades por classe · auto-cast em combate · upgrade com ouro.</p>
          <div className="actions" style={{ marginTop: 0 }}>
            {Object.values(classes).map((cls) => (
              <button
                key={cls.id}
                type="button"
                className={skillsClass === cls.id ? '' : 'ghost'}
                onClick={() => openSkills(cls.id)}
              >
                {cls.name}
              </button>
            ))}
          </div>
          {skillsCharacter ? (
            <p className="muted">
              {skillsCharacter.className} · Nv. {skillsCharacter.level}
              {(profile?.upgrades?.skill_cdr || 0) > 0
                ? ` · CDR Guardião −${(profile.upgrades.skill_cdr || 0) * 5}%`
                : ''}
            </p>
          ) : (
            <p className="muted">Selecione uma classe para treinar.</p>
          )}
          <div className="grid">
            {(skillsCharacter?.skills || []).map((skill) => {
              const maxed = skill.level >= 10 || skill.nextCost == null;
              const cost = skill.nextCost;
              return (
                <div key={skill.key} className="upgrade">
                  <div>
                    <strong>{skill.name}</strong>
                    <p className="muted">
                      {skillKindLabel(skill)} · CD {skill.cooldownLabel} · Nv. {skill.level}/10
                    </p>
                    <p className="equip-stat">{skill.description}</p>
                    <small className="muted">
                      {skill.kind === 'heal'
                        ? `Cura ~${Math.round((skill.healPower || 0) * (skill.powerMult || 1) * 100)}% HP máx`
                        : `Poder x${((skill.power || 1) * (skill.powerMult || 1)).toFixed(2)}`}
                    </small>
                  </div>
                  <button
                    type="button"
                    disabled={busy || !skillsClass || maxed || (player?.gold ?? 0) < cost}
                    onClick={() => buySkill(skill.key)}
                  >
                    {maxed ? 'Máximo' : `Upgrade ${cost}g`}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="actions">
            <button type="button" className="ghost" onClick={() => setScreen(SCREENS.MENU)}>Voltar</button>
          </div>
        </section>
      )}

      {screen === SCREENS.RUN && selectedClass && activeCharacter && (
        <CombatScreen
          key={`${selectedClass}-${activeCharacter.id}-${activeCharacter.level}`}
          classData={classes[selectedClass]}
          character={activeCharacter}
          upgrades={profile?.upgrades || {}}
          settings={profile?.settings || {}}
          busy={busy}
          onDie={finishRun}
          onSettingsChange={updateSettings}
        />
      )}

      {screen === SCREENS.GUARDIAN && (
        <section className="panel">
          <h2>Guardião das Almas</h2>
          <p className="muted">Troque essências por melhorias permanentes.</p>
          <div className="grid">
            {Object.entries(profile?.catalog || {}).map(([key, item]) => {
              const level = profile?.upgrades?.[key] ?? 0;
              const maxed = level >= item.costs.length;
              const cost = maxed ? null : item.costs[level];
              const statLine = upgradeStatLine(item, level);
              return (
                <div key={key} className="upgrade">
                  <div>
                    <strong>{item.label}</strong>
                    <p className="muted">Nível {level}/{item.costs.length}</p>
                    {statLine ? <p className="equip-stat">{statLine}</p> : null}
                  </div>
                  <button
                    type="button"
                    disabled={busy || maxed || (player?.essences ?? 0) < cost}
                    onClick={() => buyUpgrade(key)}
                  >
                    {maxed ? 'Máximo' : `${cost} essências`}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="actions">
            <button type="button" className="ghost" onClick={() => setScreen(SCREENS.MENU)}>Voltar</button>
          </div>
        </section>
      )}

      {screen === SCREENS.RANKING && (
        <section className="panel">
          <h2>Ranking</h2>
          <p className="muted">Maiores andares alcançados.</p>
          {ranking.length ? (
            <div className="ranking-list">
              {ranking.map((entry) => (
                <div
                  key={entry.id}
                  className={`ranking-row ${entry.id === player?.id ? 'me' : ''}`}
                >
                  <span className="rank-pos">#{entry.rank}</span>
                  {entry.avatar ? (
                    <img src={entry.avatar} alt="" className="avatar ranking-avatar" />
                  ) : (
                    <span className="avatar ranking-avatar placeholder" />
                  )}
                  <div className="ranking-info">
                    <strong>{entry.name}</strong>
                    <small className="muted">{entry.runs} runs</small>
                  </div>
                  <span className="rank-floor">Andar {entry.maxFloor}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Nenhum recorde ainda. Entre na masmorra!</p>
          )}
          <div className="actions">
            <button type="button" className="ghost" onClick={() => setScreen(SCREENS.MENU)}>Voltar</button>
            <button type="button" className="ghost" onClick={openRanking} disabled={busy}>Atualizar</button>
          </div>
        </section>
      )}
    </div>
  );
}
