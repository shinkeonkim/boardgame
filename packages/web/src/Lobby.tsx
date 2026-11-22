import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { BOT_LEVELS, BotLevel, EmoteEvent, RoomView, botLevelLabel } from '@bg/core';
import { ConfirmButton, EmoteBubble, EmoteButton, EmoteFeed, Notice, ThemeToggle, Toggle, Icon } from '@bg/ui';
import { useGameClient } from './App';
import type { Act } from './client';
import { GuideButton } from './Guide';
import { BASE, store } from './runtime';

/** QR·공유 링크의 바깥 주소: 서버 PUBLIC_URL(운영) → 로컬 개발이면 LAN 주소 → 지금 주소 */
function useShareBase() {
  const [base, setBase] = useState(`${location.origin}${BASE}`);
  useEffect(() => {
    fetch(`${BASE}/api/info`)
      .then((r) => r.json())
      .then((info: { publicUrl: string | null; lanHosts: string[] }) => {
        if (info.publicUrl) setBase(info.publicUrl.replace(/\/$/, ''));
        else if (/^(localhost|127\.)/.test(location.hostname) && info.lanHosts[0]) {
          setBase(`${location.protocol}//${info.lanHosts[0]}${location.port ? `:${location.port}` : ''}${BASE}`);
        }
      })
      .catch(() => {});
  }, []);
  return base;
}

/** 방장 전용: 방 닫기 */
export function CloseRoomButton({ act, small }: { act: Act; small?: boolean }) {
  return <ConfirmButton label="방 닫기" warning="모두 첫 화면으로 나가요" onConfirm={() => act('close')} small={small} />;
}

/** 방장 전용: 게임 중지 → 모두 로비로 (설정을 바꾼 뒤 이어서 할 수 있음) */
export function StopGameButton({ act, small }: { act: Act; small?: boolean }) {
  return <ConfirmButton label="게임 멈추기" warning="모두 대기실로 돌아가요" onConfirm={() => act('stop')} small={small} />;
}

export function Lobby({ view, act, onLeave, emotes, onEmote }: { view: RoomView; act: Act; onLeave: () => void; emotes: EmoteEvent[]; onEmote: (id: string) => void }) {
  const client = useGameClient();
  const ConfigPanel = client.ConfigPanel;
  const emoteOf = (id: string) => emotes.find((e) => e.from === id);
  const me = view.members.find((m) => m.id === view.you)!;
  const isHost = view.hostId === view.you;
  const players = view.members.filter((m) => m.role === 'player');
  const spectators = view.members.filter((m) => m.role === 'spectator');
  const { maxPlayers } = view.lobby;
  const teams = client.teamsEnabled?.(view.config, players.length) ?? false;

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <span className="muted small">{client.title} · 방 코드</span>
          <div className="code big">{view.code}</div>
        </div>
        <div className="row tight">
          <ThemeToggle variant="icon" />
          <GuideButton />
          <EmoteButton onSend={onEmote} />
          {isHost && <CloseRoomButton act={act} />}
          <button className="btn ghost" onClick={onLeave}>
            나가기
          </button>
        </div>
      </header>
      {view.lobby.inResults.length > 0 && (
        <Notice>
          <Icon name="flag" /> <b>{view.lobby.inResults.join(', ')}</b> 님이 아직 결과를 보고 있어요. 대기실로 돌아오면 함께 시작할 수 있어요.
        </Notice>
      )}
      {view.lobby.paused && <PausedNotice view={view} isHost={isHost} />}

      <div className="lobby-grid">
        <ShareBox view={view} isHost={isHost} act={act} />

        <section className="panel">
          <h2>
            플레이어{' '}
            <span className="muted">
              {players.length}/{maxPlayers}
            </span>
          </h2>
          <ol className="members">
            {players.map((m, i) => (
              <li key={m.id} className={`${m.connected ? '' : 'away'} ${m.bot ? 'is-bot' : ''}`}>
                <span className="seat">{client.seatBadge ? client.seatBadge(i) : i + 1}</span>
                <span className="grow name-cell">
                  <EmoteBubble e={emoteOf(m.id)} />
                  {m.name}
                  {client.seatLabel && <span className="muted small">{client.seatLabel(i)}</span>}
                  {m.bot && <span className={`tag bot ${m.bot}`}>
                    <Icon name="bot" /> {botLevelLabel(m.bot)}
                  </span>}
                  {m.isHost && <span className="tag">방장</span>}
                  {m.id === view.you && <span className="tag mine">나</span>}
                  {teams && <span className="tag">{i % 2 === 0 ? 'A팀' : 'B팀'}</span>}
                  {!m.connected && <span className="tag">연결 끊김</span>}
                  {m.connected && m.inResults && <span className="tag results">결과 보는 중</span>}
                  {m.connected && !m.inResults && view.lobby.inResults.length > 0 && <span className="tag ready">준비됨</span>}
                </span>
                {isHost && (
                  <span className="mini-actions">
                    {m.bot && (
                      <select className="bot-level" aria-label={`${m.name} 난이도`} value={m.bot} onChange={(e) => act('botLevel', { id: m.id, level: e.target.value })}>
                        {BOT_LEVELS.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    )}
                    <button className="icon-btn" aria-label="위로" disabled={i === 0} onClick={() => act('reorder', { id: m.id, dir: -1 })}>
                      ↑
                    </button>
                    <button className="icon-btn" aria-label="아래로" disabled={i === players.length - 1} onClick={() => act('reorder', { id: m.id, dir: 1 })}>
                      ↓
                    </button>
                    {m.id !== view.you && (
                      <button className="icon-btn" aria-label={m.bot ? '봇 빼기' : '내보내기'} onClick={() => act('kick', { id: m.id })}>
                        <Icon name="x" />
                      </button>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ol>
          {isHost && players.length < maxPlayers && client.bots !== false && <AddBot act={act} />}
          <EmoteFeed items={emotes.filter((e) => spectators.some((s) => s.id === e.from))} />
          {spectators.length > 0 && <p className="muted small">관전 중: {spectators.map((m) => m.name).join(', ')}</p>}
          <div className="row">
            {me.role === 'player' ? (
              <button className="btn ghost" onClick={() => act('role', { role: 'spectator' })}>
                관전하기
              </button>
            ) : (
              <button className="btn" disabled={players.length >= maxPlayers} onClick={() => act('role', { role: 'player' })}>
                게임에 참여하기
              </button>
            )}
          </div>
          {teams && <p className="muted small">팀전: 1·3번째가 A팀, 2·4번째가 B팀이에요.</p>}
        </section>

        <section className="panel config">
          <h2>규칙 {!isHost && <span className="muted small">방장만 바꿀 수 있어요</span>}</h2>
          <ConfigPanel view={view} config={view.config} isHost={isHost} set={(patch) => isHost && act('config', { config: patch })} />
        </section>
      </div>

      <div className="start-bar">
        <div className="small">
          {view.lobby.summary}
          {view.lobby.errors.length === 0 && view.lobby.warnings.map((w) => <span key={w} className="warn"> · {w}</span>)}
          {view.lobby.errors[0] && <div className="warn">{view.lobby.errors[0]}</div>}
        </div>
        {isHost ? (
          view.lobby.paused ? (
            <div className="row tight">
              <button className="btn" disabled={view.lobby.errors.length > 0} onClick={() => act('start')}>
                새로 시작하기
              </button>
              <button className="btn primary" disabled={!!view.lobby.paused.blocked} onClick={() => act('resume')}>
                이어서 하기
              </button>
            </div>
          ) : view.lobby.inResults.length > 0 ? (
            <div className="row tight">
              <span className="muted small">{view.lobby.inResults.length}명이 결과를 보는 중</span>
              <button className="btn" disabled={view.lobby.errors.length > 0} onClick={() => act('start', { force: true })}>
                지금 시작하기
              </button>
            </div>
          ) : (
            <button className="btn primary" disabled={view.lobby.errors.length > 0} onClick={() => act('start')}>
              게임 시작하기
            </button>
          )
        ) : (
          <span className="muted small">방장이 시작하면 바로 시작돼요</span>
        )}
      </div>
    </main>
  );
}

/** 방장 전용: 빈자리에 봇 넣기 (난이도를 바로 골라 한 번에) */
function AddBot({ act }: { act: Act }) {
  const [last, setLast] = useState<BotLevel | null>(null);
  return (
    <div className="bot-add">
      <div className="bot-add-head">
        <Icon name="bot" /> <b>빈자리에 봇 넣기</b>
        <span className="muted small"> · 사람이 모자랄 때 함께해요</span>
      </div>
      <div className="row tight">
        {BOT_LEVELS.map((l) => (
          <button
            key={l.id}
            className={`btn small-btn bot-btn ${l.id}`}
            title={l.hint}
            onClick={async () => {
              if (await act('addBot', { level: l.id })) setLast(l.id);
            }}
          >
            + {l.label}
          </button>
        ))}
      </div>
      <p className="muted small">{BOT_LEVELS.find((l) => l.id === (last ?? 'normal'))!.hint}. 난이도는 넣은 뒤에도 바꿀 수 있어요.</p>
    </div>
  );
}

/** 중지된 게임 안내: 누적 점수와 이어서 하기 방식 */
function PausedNotice({ view, isHost }: { view: RoomView; isHost: boolean }) {
  const p = view.lobby.paused!;
  const done = p.roundOver ? p.round : p.round - 1;
  const changed =
    done === 0
      ? '규칙이 바뀌어서 같은 순서로 1판부터 새로 시작해요.'
      : `규칙이 바뀌어서 ${p.roundOver ? '' : '하던 판은 빼고 '}끝난 ${done}판의 점수를 이어 ${done + 1}판부터 새 규칙으로 해요.`;
  return (
    <Notice className="paused-notice">
      <div>
        <Icon name="pause" /> 방장이 게임을 멈췄어요 · <b>
          {p.round}/{p.rounds}판
        </b>
        {p.roundOver ? ' 끝난 뒤' : ' 하는 중'} ·{' '}
        {p.players.map((x, i) => (
          <span key={i} className="paused-score">
            {x.name} <b>{x.total}</b>
            {i < p.players.length - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
      <div className="small muted">
        {p.blocked ? p.blocked : p.sameConfig ? '하던 판을 그대로 이어서 해요. 규칙을 바꾸고 이어서 할 수도 있어요.' : changed}
        {isHost ? '' : ' 방장이 이어서 시작하면 돌아가요.'}
      </div>
    </Notice>
  );
}

function ShareBox({ view, isHost, act }: { view: RoomView; isHost: boolean; act: Act }) {
  const { title } = useGameClient();
  const base = useShareBase();
  const savedPw = store.password(view.code);
  const [includePw, setIncludePw] = useState(false);
  const [qr, setQr] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [editingPw, setEditingPw] = useState(false);

  const url = `${base}/r/${view.code}${includePw && savedPw && view.hasPassword ? `#pw=${encodeURIComponent(savedPw)}` : ''}`;

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 320, color: { dark: '#1b1a17', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [url]);

  const copy = async () => {
    try {
      if (navigator.share && /Mobi/.test(navigator.userAgent)) {
        await navigator.share({ title, text: `${title} 방 ${view.code}에 들어와요!`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 취소 */
    }
  };

  const savePw = async () => {
    const pw = pwInput.trim();
    if (await act('password', { password: pw || null })) {
      store.setPassword(view.code, pw || null);
      setEditingPw(false);
      setPwInput('');
    }
  };

  return (
    <section className="panel share">
      <h2>초대하기</h2>
      <div className="qr">{qr ? <img src={qr} alt={`방 ${view.code}에 들어오는 QR 코드`} /> : <div className="qr-ph" />}</div>
      <div className="url-row">
        <code className="url">{url.replace(/^https?:\/\//, '')}</code>
        <button className="btn" onClick={copy}>
          {copied ? '복사했어요' : '링크 보내기'}
        </button>
      </div>
      <div className="pw-row small">
        {view.hasPassword ? <span>
              <Icon name="lock" /> 암호 걸린 방
            </span> : <span className="muted">암호 없이 링크만 있으면 들어올 수 있어요</span>}
        {view.hasPassword && savedPw && (
          <label className="check">
            <input type="checkbox" checked={includePw} onChange={(e) => setIncludePw(e.target.checked)} /> QR과 링크에 암호 넣기
          </label>
        )}
      </div>
      {isHost && (
        <Toggle
          label="첫 화면 방 목록에 보이기"
          hint={view.listed ? '누구나 목록에서 이 방을 찾을 수 있어요' : '코드나 링크를 아는 사람만 들어올 수 있어요'}
          checked={view.listed}
          onChange={(v) => act('listed', { listed: v })}
        />
      )}
      {isHost &&
        (editingPw ? (
          <div className="row">
            <input className="grow" value={pwInput} placeholder="새 암호 (비우면 암호 없음)" maxLength={64} onChange={(e) => setPwInput(e.target.value)} />
            <button className="btn" onClick={savePw}>
              저장
            </button>
          </div>
        ) : (
          <button className="btn ghost small-btn" onClick={() => setEditingPw(true)}>
            암호 {view.hasPassword ? '바꾸기' : '걸기'}
          </button>
        ))}
    </section>
  );
}
