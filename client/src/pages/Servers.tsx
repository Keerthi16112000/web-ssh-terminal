import React, { useEffect, useState } from 'react';
import { Plus, Terminal, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const Servers = () => {
  const [servers, setServers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 22,
    username: '',
    authType: 'password',
    password: '',
    privateKey: ''
  });

  const fetchServers = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${apiUrl}/servers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setServers(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await fetch(`${apiUrl}/servers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', host: '', port: 22, username: '', authType: 'password', password: '', privateKey: '' });
        fetchServers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this server?')) return;
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await fetch(`${apiUrl}/servers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchServers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Servers</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Add Server
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {servers.map((server: any) => (
          <div key={server.id} className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{server.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{server.username}@{server.host}:{server.port}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => navigate(`/terminal/${server.id}`)} className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Connect">
                  <Terminal size={16} color="var(--accent-primary)" />
                </button>
                <button onClick={() => handleDelete(server.id)} className="btn btn-danger" style={{ padding: '0.5rem' }} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Auth: <span style={{ color: 'var(--text-primary)' }}>{server.authType}</span></span>
              <Button onClick={() => navigate(`/terminal/${server.id}`)} className="w-full" style={{ width: '100%', marginTop: '0.5rem' }}>
                Connect
              </Button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div className="card glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Add New Server</h2>
            <form onSubmit={handleAddServer}>
              <Input label="Server Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
                <Input label="Hostname / IP" value={formData.host} onChange={(e) => setFormData({...formData, host: e.target.value})} required />
                <Input label="Port" type="number" value={formData.port} onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})} required />
              </div>

              <Input label="Username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />

              <div className="input-group">
                <label className="input-label">Authentication Type</label>
                <select 
                  className="input-field" 
                  value={formData.authType}
                  onChange={(e) => setFormData({...formData, authType: e.target.value})}
                >
                  <option value="password">Password</option>
                  <option value="key">SSH Key</option>
                </select>
              </div>

              {formData.authType === 'password' ? (
                <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              ) : (
                <div className="input-group">
                  <label className="input-label">Private Key</label>
                  <textarea 
                    className="input-field" 
                    rows={4}
                    value={formData.privateKey}
                    onChange={(e) => setFormData({...formData, privateKey: e.target.value})}
                    required
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Server</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
