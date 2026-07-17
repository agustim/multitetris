import Peer from 'peerjs';
import { MSG } from './messages.js';

export class PeerManager {
  constructor() {
    this.peer = null;
    this.myId = null;
    this.myName = '';
    this.myTheme = '';
    this.connections = new Map();
    this.players = new Map();
    this.isHost = false;
    this._listeners = new Map();
  }

  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    return () => this._listeners.get(event)?.delete(fn);
  }

  _emit(event, data) {
    this._listeners.get(event)?.forEach(fn => fn(data));
  }

  _getConn(peerId) {
    return this.connections.get(peerId);
  }

  _setConn(peerId, conn, name, theme) {
    this.connections.set(peerId, { conn, name, theme });
  }

  _send(conn, data) {
    if (conn && conn.open) conn.send(data);
  }

  _sendTo(peerId, data) {
    const entry = this._getConn(peerId);
    if (entry) this._send(entry.conn, data);
  }

  _broadcast(data, excludeId) {
    for (const [pid, entry] of this.connections) {
      if (pid !== excludeId) this._send(entry.conn, data);
    }
  }

  _setupConnection(conn) {
    conn.on('data', (data) => this._handleData(conn, data));
    conn.on('close', () => {
      for (const [pid, entry] of this.connections) {
        if (entry.conn === conn) {
          this.connections.delete(pid);
          this.players.delete(pid);
          this._emit('player-left', { id: pid });
          break;
        }
      }
    });
  }

  _sendJoin(conn) {
    this._send(conn, { type: MSG.JOIN, name: this.myName, theme: this.myTheme, id: this.myId });
  }

  _connectToPeer(targetId) {
    if (this.connections.has(targetId) || targetId === this.myId) return;
    const conn = this.peer.connect(targetId, { reliable: true });
    conn.on('open', () => {
      this._setupConnection(conn);
      this._sendJoin(conn);
    });
    conn.on('error', () => {});
  }

  _handleData(conn, data) {
    if (data.type === MSG.JOIN) {
      if (!this.connections.has(data.id)) {
        this._setConn(data.id, conn, data.name, data.theme);
      }
      if (!this.players.has(data.id)) {
        this.players.set(data.id, { name: data.name, theme: data.theme, state: { occupiedLines: 0, linesCleared: 0, score: 0, alive: true } });
      }

      if (this.isHost && data.id !== this.myId) {
        const otherPlayers = Array.from(this.players.entries())
          .filter(([id]) => id !== data.id && id !== this.myId);
        if (otherPlayers.length > 0) {
          this._send(conn, {
            type: MSG.PLAYER_LIST,
            players: otherPlayers.map(([id, p]) => ({ id, name: p.name, theme: p.theme })),
          });
        }
        for (const [pid, p] of otherPlayers) {
          this._send(conn, { type: MSG.CONNECT_TO, id: pid, name: p.name, theme: p.theme });
        }
        this._broadcast({ type: MSG.NEW_PEER, id: data.id, name: data.name, theme: data.theme }, data.id);
      }

      this._emit('player-joined', { id: data.id, name: data.name, theme: data.theme });
      return;
    }

    switch (data.type) {
      case MSG.CONNECT_TO:
        this._connectToPeer(data.id);
        break;

      case MSG.PLAYER_LIST:
        for (const pl of data.players) {
          if (pl.id !== this.myId && !this.players.has(pl.id)) {
            this.players.set(pl.id, { name: pl.name, theme: pl.theme, state: { occupiedLines: 0, linesCleared: 0, score: 0, alive: true } });
          }
        }
        this._emit('player-list-update', this.getPlayers());
        break;

      case MSG.NEW_PEER:
        if (!this.players.has(data.id)) {
          this.players.set(data.id, { name: data.name, theme: data.theme, state: { occupiedLines: 0, linesCleared: 0, score: 0, alive: true } });
        }
        this._emit('player-joined', { id: data.id, name: data.name, theme: data.theme });
        break;

      case MSG.PEER_LEFT:
        this.connections.delete(data.id);
        this.players.delete(data.id);
        this._emit('player-left', { id: data.id });
        break;

      case MSG.BOARD_STATE: {
        const pl = this.players.get(data.id);
        if (pl) pl.state = { ...data.state };
        this._emit('board-state', { id: data.id, state: data.state });
        break;
      }

      case MSG.ATTACK:
        this._emit('attack-received', { rows: data.rows, from: data.id });
        break;

      case MSG.GAME_OVER: {
        const pl2 = this.players.get(data.id);
        if (pl2) pl2.state.alive = false;
        this._emit('player-died', { id: data.id });
        break;
      }

      case MSG.GAME_START:
        this._emit('game-start');
        break;

      case MSG.GAME_WINNER:
        this._emit('game-winner', data);
        break;
    }
  }

  createRoom(roomId, name, theme) {
    this.myName = name;
    this.myTheme = theme;
    this.isHost = true;
    return new Promise((resolve, reject) => {
      this.peer = new Peer(roomId, { debug: 0 });
      this.peer.on('open', (id) => {
        this.myId = id;
        this.players.set(id, { name, theme, state: { occupiedLines: 0, linesCleared: 0, score: 0, alive: true } });
        this._emit('room-created', id);
        resolve(id);
      });
      this.peer.on('connection', (conn) => {
        conn.on('open', () => {
          this._setupConnection(conn);
        });
      });
      this.peer.on('error', (err) => {
        if (err.type === 'unavailable-id') reject(new Error(`L'ID "${roomId}" ja està en ús`));
        else reject(err);
      });
      this.peer.on('disconnected', () => setTimeout(() => this.peer?.reconnect(), 1000));
    });
  }

  joinRoom(roomId, name, theme) {
    this.myName = name;
    this.myTheme = theme;
    this.isHost = false;
    return new Promise((resolve, reject) => {
      this.peer = new Peer({ debug: 0 });
      this.peer.on('open', (id) => {
        this.myId = id;
        this.players.set(id, { name, theme, state: { occupiedLines: 0, linesCleared: 0, score: 0, alive: true } });
        const conn = this.peer.connect(roomId, { reliable: true });
        conn.on('open', () => {
          this._setupConnection(conn);
          this._sendJoin(conn);
          this.peer.on('connection', (incoming) => {
            incoming.on('open', () => {
              this._setupConnection(incoming);
              this._sendJoin(incoming);
            });
          });
          resolve();
        });
        conn.on('error', (err) => reject(err));
      });
      this.peer.on('error', (err) => reject(err));
    });
  }

  broadcastState(state) {
    const entry = this.players.get(this.myId);
    if (entry) entry.state = { ...state };
    this._broadcast({ type: MSG.BOARD_STATE, id: this.myId, state });
  }

  sendAttack(rows, targetId) {
    this._sendTo(targetId, { type: MSG.ATTACK, id: this.myId, rows });
  }

  broadcastGameOver() {
    this._broadcast({ type: MSG.GAME_OVER, id: this.myId });
  }

  broadcastGameStart() {
    this._broadcast({ type: MSG.GAME_START });
  }

  broadcastWinner(winnerId, winnerName) {
    this._broadcast({ type: MSG.GAME_WINNER, id: winnerId, name: winnerName });
  }

  getPlayers() {
    return Array.from(this.players.entries()).map(([id, p]) => ({ id, ...p }));
  }

  findAttackTarget() {
    let targetId = null;
    let minOccupied = Infinity;
    for (const [id, p] of this.players) {
      if (id === this.myId || !p.state?.alive) continue;
      const occ = p.state?.occupiedLines ?? 0;
      if (occ < minOccupied) {
        minOccupied = occ;
        targetId = id;
      }
    }
    return targetId;
  }

  destroy() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections.clear();
    this.players.clear();
    this._listeners.clear();
  }
}
