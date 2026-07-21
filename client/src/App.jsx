import { useEffect, useState } from 'react';
import { api, getStoredPlayerKey, storePlayerKey } from './api.js';

const SCREENS = {
  BOOT: 'boot',
  MENU: 'menu',
  CLASS: 'class',
  RUN: 'run',
  GUARDIAN: 'guardian',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.BOOT);
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState({});
  const [selectedClass, setSelectedClass] = useState(null);
  const [runFloor, setRunFloor] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const meta = await api.meta();
        const boot = await api.bootstrap(getStoredPlayerKey());
        storePlayerKey(boot.player.playerKey);
        if (!alive) return;
        setClasses(meta.classes || {});
        setProfile(boot);
        setScreen(SCREENS.MENU);
      } catch (err) {
        if (!alive) return;
        setError(err.message || 'Falha ao conectar');
      }
    })();
    return () => { alive = false; };
  }, []);

  async function refresh() {
    const key = getStoredPlayerKey();
    const next = await api.me(key);
    setProfile(next);
    return next;
  }

  async function finishRun() {
    setBusy(true);
    setError('');
    try {
      const result = await api.endRun(getStoredPlayerKey(), {
        maxFloor: runFloor,
        kills: runFloor * 3,
        goldEarned: runFloor * 10,
        playTimeSeconds: runFloor * 30,
      });
      await refresh();
      setScreen(SCREENS.MENU);
      setSelectedClass(null);
      setRunFloor(1);
      alert(`Run encerrada. +${result.awardedEssences} essências.`);
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
      await api.buyUpgrade(getStoredPlayerKey(), upgradeKey);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (screen === SCREENS.BOOT) {
    return (
      <div className="shell">
        <h1>Dungeon Descent</h1>
        <p className="muted">{error || 'Conectando ao servidor…'}</p>
      </div>
    );
  }

  const player = profile?.player;

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="brand">Dungeon Descent</p>
          <p className="muted">Node + React · MariaDB</p>
        </div>
        <div className="stats-row">
          <span>Essências: <strong>{player?.essences ?? 0}</strong></span>
          <span>Recorde: <strong>Andar {player?.maxFloorRecord ?? 0}</strong></span>
          <span>Runs: <strong>{profile?.stats?.runs ?? 0}</strong></span>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {screen === SCREENS.MENU && (
        <section className="panel">
          <h2>Cidade Inicial</h2>
          <p className="muted">Escolha uma expedição ou fale com o Guardião das Almas.</p>
          <div className="actions">
            <button type="button" onClick={() => setScreen(SCREENS.CLASS)}>Entrar na Masmorra</button>
            <button type="button" className="ghost" onClick={() => setScreen(SCREENS.GUARDIAN)}>
              Guardião das Almas
            </button>
          </div>
        </section>
      )}

      {screen === SCREENS.CLASS && (
        <section className="panel">
          <h2>Escolher Classe</h2>
          <div className="grid">
            {Object.values(classes).map((cls) => (
              <button
                key={cls.id}
                type="button"
                className={`card-btn ${selectedClass === cls.id ? 'active' : ''}`}
                onClick={() => setSelectedClass(cls.id)}
              >
                <strong>{cls.name}</strong>
                <span>{cls.passive}</span>
                <small>
                  STR {cls.attrs.str} · CON {cls.attrs.con} · AGI {cls.attrs.agi} · DEX {cls.attrs.dex} · INT {cls.attrs.int}
                </small>
              </button>
            ))}
          </div>
          <div className="actions">
            <button type="button" className="ghost" onClick={() => setScreen(SCREENS.MENU)}>Voltar</button>
            <button
              type="button"
              disabled={!selectedClass}
              onClick={() => {
                setRunFloor(1);
                setScreen(SCREENS.RUN);
              }}
            >
              Começar Run
            </button>
          </div>
        </section>
      )}

      {screen === SCREENS.RUN && (
        <section className="panel">
          <h2>Expedição — {classes[selectedClass]?.name}</h2>
          <p>Andar atual: <strong>{runFloor}</strong></p>
          <p className="muted">Combate automático entra na próxima iteração. Por enquanto simule a progressão.</p>
          <div className="actions">
            <button type="button" onClick={() => setRunFloor((f) => f + 1)}>Descer andar</button>
            <button type="button" className="danger" disabled={busy} onClick={finishRun}>
              Morrer / Encerrar Run
            </button>
            <button type="button" className="ghost" onClick={() => setScreen(SCREENS.MENU)}>Abandonar</button>
          </div>
        </section>
      )}

      {screen === SCREENS.GUARDIAN && (
        <section className="panel">
          <h2>Guardião das Almas</h2>
          <p className="muted">Troque essências por melhorias permanentes (salvas no MariaDB).</p>
          <div className="grid">
            {Object.entries(profile?.catalog || {}).map(([key, item]) => {
              const level = profile?.upgrades?.[key] ?? 0;
              const maxed = level >= item.costs.length;
              const cost = maxed ? null : item.costs[level];
              return (
                <div key={key} className="upgrade">
                  <div>
                    <strong>{item.label}</strong>
                    <p className="muted">Nível {level}/{item.costs.length}</p>
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
    </div>
  );
}
