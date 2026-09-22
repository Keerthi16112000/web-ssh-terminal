import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
import { TerminalManager } from '../terminal/TerminalManager';
import { WebSocketClient } from '../services/WebSocketClient';
import { Button } from '../components/Button';

export const TerminalPage = () => {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const terminalRef = useRef<HTMLDivElement>(null);
  const termManagerRef = useRef<TerminalManager | null>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);
  
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'closed'>('connecting');
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    let sessionId: string | null = null;

    const initConnection = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        // 1. Fetch server info
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const serverRes = await fetch(`${apiUrl}/servers/${serverId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!serverRes.ok) throw new Error('Server not found');
        const serverData = await serverRes.json();
        if (isMounted) setServerInfo(serverData.data);

        // 2. Create SSH Session via HTTP
        const sessionRes = await fetch(`${apiUrl}/sessions`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ serverId })
        });
        
        if (!sessionRes.ok) throw new Error('Failed to create SSH session');
        const sessionData = await sessionRes.json();
        sessionId = sessionData.data.sessionId;

        // 3. Connect WebSocket
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
        const ws = new WebSocketClient(wsUrl);
        wsClientRef.current = ws;

        await ws.connect();
        
        if (!isMounted) return ws.disconnect();

        // 4. Initialize Terminal UI
        if (terminalRef.current) {
          const term = new TerminalManager(
            terminalRef.current,
            (data) => ws.sendInput(data),
            (cols, rows) => ws.resize(cols, rows)
          );
          termManagerRef.current = term;

          // 5. Setup WS Listeners
          ws.on('connection', () => {
            if (isMounted) {
              setStatus('connected');
              term.write('\r\n\x1b[32m*** Connected to SSH Server ***\x1b[0m\r\n');
            }
          });

          ws.on('output', (data: string) => {
            term.write(data);
          });

          ws.on('error', (err: any) => {
            if (isMounted) {
              setStatus('error');
              setErrorMsg(typeof err === 'string' ? err : 'WebSocket error');
              term.write(`\r\n\x1b[31m*** Error: ${err} ***\x1b[0m\r\n`);
            }
          });

          ws.on('close', () => {
            if (isMounted) {
              setStatus('closed');
              term.write('\r\n\x1b[33m*** Connection Closed ***\x1b[0m\r\n');
            }
          });

          // 6. Authenticate WS
          ws.authenticate(token, sessionId);
        }

      } catch (err: any) {
        console.error(err);
        if (isMounted) {
          setStatus('error');
          setErrorMsg(err.message);
        }
      }
    };

    initConnection();

    return () => {
      isMounted = false;
      if (wsClientRef.current) wsClientRef.current.disconnect();
      if (termManagerRef.current) termManagerRef.current.dispose();
    };
  }, [serverId, navigate]);

  const handleDisconnect = () => {
    if (wsClientRef.current) wsClientRef.current.disconnect();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/servers')} 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem', borderRadius: '50%' }}
          >
            <ArrowLeft size={18} />
          </button>
          
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {serverInfo ? serverInfo.name : 'Terminal'}
              <span className={`status-dot ${status}`} />
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {serverInfo ? `${serverInfo.username}@${serverInfo.host}` : 'Connecting...'} 
              {status === 'error' && <span style={{ color: 'var(--error)', marginLeft: '0.5rem' }}>({errorMsg})</span>}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            <RefreshCw size={16} /> Reconnect
          </Button>
          <Button variant="danger" onClick={handleDisconnect}>
            <XCircle size={16} /> Disconnect
          </Button>
        </div>
      </div>

      <div className="terminal-wrapper" style={{ flex: 1, minHeight: '400px' }}>
        <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};
