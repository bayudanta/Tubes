import { useState, useEffect } from 'react';
import axios from 'axios';
import api from './services/api';
import ResponseChart from './components/ResponseChart';

import { 
  FiActivity, FiTrash2, FiLogOut, FiPlus, FiGlobe, FiX, 
  FiServer, FiCheckCircle, FiAlertTriangle, FiEdit, FiSave, FiXCircle 
} from "react-icons/fi";

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  return token ? <Dashboard setToken={setToken} /> : <AuthPage setToken={setToken} />;
}

// --- 1. AUTH PAGE ---
function AuthPage({ setToken }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);``

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isRegister ? '/register' : '/login';
    try {
      const res = await axios.post(`http://localhost:5001${endpoint}`, { email, password });
      if (isRegister) {
        alert("Success! Please login.");
        setIsRegister(false);
      } else {
        localStorage.setItem('token', res.data.token); 
        setToken(res.data.token); 
      }
    } catch (err) {
      alert(err.response?.data?.error || "Error occurred");
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '3rem', color: '#DFE0EC', marginBottom: '10px' }}><FiGlobe /></div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Uptime Checker</h1>
        </div>
        <h2 className="mb-4" style={{ fontSize: '1.2rem', color: '#757179', fontWeight: 'normal' }}>
            {isRegister ? 'Create Access' : 'System Login'}
        </h2>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input className="input" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} type="email" required />
          <input className="input" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" required />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Authenticating...' : (isRegister ? 'Register' : 'Connect to System')}
          </button>
        </form>
        <p className="mt-4" style={{ fontSize: '14px', color: 'var(--text-sub)' }}>
          {isRegister ? "Already valid? " : "No credentials? " }
          <span style={{ color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Login here' : 'Register here'}
          </span>
        </p>
      </div>
    </div>
  );
}

// --- 2. DASHBOARD UTAMA ---
function Dashboard({ setToken }) {
  const [monitors, setMonitors] = useState([]); 
  const [newUrl, setNewUrl] = useState('');     
  const [newName, setNewName] = useState('');   
  const [loading, setLoading] = useState(false);
  const [selectedMonitorId, setSelectedMonitorId] = useState(null);
  const [chartLogs, setChartLogs] = useState([]);

  // STATE UNTUK EDIT 
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');

  // Hitung Statistik
  const totalSystems = monitors.length;
  const activeSystems = monitors.filter(m => m.status === 'UP').length;
  const downSystems = monitors.filter(m => m.status === 'DOWN').length;

  const fetchMonitors = async () => {
    try {
      if (editingId) return;

      const response = await api.get('/monitors'); 
      setMonitors(response.data);
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) handleLogout(); 
    }
  };

  useEffect(() => {
    fetchMonitors();
    const interval = setInterval(fetchMonitors, 10000);
    return () => clearInterval(interval);
  }, [editingId]); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUrl || !newName) return alert("Data incomplete");
    setLoading(true);
    try {
      await api.post('/monitors', { name: newName, url: newUrl });
      setNewUrl(''); setNewName(''); fetchMonitors(); 
    } catch (error) { alert("Failed to add monitor"); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if(!confirm("Terminate monitoring?")) return;
    try { await api.delete(`/monitors/${id}`); fetchMonitors(); } 
    catch (error) { alert("Failed to delete"); }
  };

  const handleEditClick = (monitor) => {
      setEditingId(monitor.id);
      setEditName(monitor.name);
      setEditUrl(monitor.url);
      setSelectedMonitorId(null); 
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setEditName('');
      setEditUrl('');
  };

  const handleSaveEdit = async (id) => {
      try {
          await api.put(`/monitors/${id}`, { name: editName, url: editUrl });
          setEditingId(null);
          fetchMonitors(); 
      } catch (error) {
          alert("Gagal update monitor");
      }
  };

  const handleLogout = () => { localStorage.removeItem('token'); setToken(null); };

  const handleShowChart = async (id) => {
    if (selectedMonitorId === id) { setSelectedMonitorId(null); return; }
    try {
        const res = await api.get(`/monitors/${id}/logs`);
        setChartLogs(res.data);
        setSelectedMonitorId(id);
    } catch (err) { alert("Failed to load metrics"); }
  };

  return (
    <div className="container">
      <div className="flex justify-between mb-4">
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiGlobe style={{ color: '#4D274E' }} /> SYSTEM STATUS
        </h1>
        <button onClick={handleLogout} className="btn btn-danger flex gap-2">
          <FiLogOut /> LOGOUT
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ marginBottom: 0, textAlign: 'center', borderTop: '3px solid #4D274E' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#DFE0EC' }}>{totalSystems}</div>
            <div style={{ color: '#757179', fontSize: '0.9rem', display:'flex', justifyContent:'center', gap:'5px', alignItems:'center' }}><FiServer /> Total Systems</div>
        </div>
        <div className="card" style={{ marginBottom: 0, textAlign: 'center', borderTop: '3px solid #00ff9d' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00ff9d' }}>{activeSystems}</div>
            <div style={{ color: '#757179', fontSize: '0.9rem', display:'flex', justifyContent:'center', gap:'5px', alignItems:'center' }}><FiCheckCircle /> Operational</div>
        </div>
        <div className="card" style={{ marginBottom: 0, textAlign: 'center', borderTop: '3px solid #ff0055' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff0055' }}>{downSystems}</div>
            <div style={{ color: '#757179', fontSize: '0.9rem', display:'flex', justifyContent:'center', gap:'5px', alignItems:'center' }}><FiAlertTriangle /> Critical Errors</div>
        </div>
      </div>
      
      <div className="card">
        <h3 className="mb-4 flex gap-2"><FiPlus /> Initialize New Monitor</h3>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input className="input" placeholder="System Name (e.g. Google)" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className="input" placeholder="Endpoint URL (https://...)" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
          <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }} disabled={loading}>
            {loading ? '...' : 'DEPLOY'}
          </button>
        </form>
      </div>

      <div>
        {monitors.map((monitor) => (
          <div key={monitor.id}>
            <div className="card flex justify-between" style={{ 
                marginBottom: selectedMonitorId === monitor.id ? '0' : '20px', 
                borderBottomLeftRadius: selectedMonitorId === monitor.id ? 0 : 16,
                borderBottomRightRadius: selectedMonitorId === monitor.id ? 0 : 16,
                transition: 'none' 
            }}>
              
              {/* === LOGIKA TAMPILAN EDIT === */}
              {editingId === monitor.id ? (

                 <div style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'center' }}>
                    <input className="input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" />
                    <input className="input" value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="URL" />
                    
                    <button onClick={() => handleSaveEdit(monitor.id)} className="btn" style={{ background: '#00ff9d', color: '#000' }} title="Save">
                        <FiSave size={18} />
                    </button>
                    <button onClick={handleCancelEdit} className="btn btn-danger" title="Cancel">
                        <FiXCircle size={18} />
                    </button>
                 </div>
              ) : (

                <>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap:'10px' }}>
                       {monitor.name}
                    </h3>
                    <a href={monitor.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', opacity: 0.7, display:'flex', alignItems:'center', gap:'5px' }}>
                       {monitor.url} <FiGlobe size={10} />
                    </a>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className={`status-badge ${monitor.status === 'UP' ? 'status-up' : 'status-down'}`}>
                      {monitor.status || 'PENDING'}
                    </div>
                    

                    <button onClick={() => handleEditClick(monitor)} className="btn btn-ghost" title="Edit Monitor">
                        <FiEdit size={18} />
                    </button>

                    <button onClick={() => handleShowChart(monitor.id)} className="btn btn-ghost" title="View Metrics">
                        {selectedMonitorId === monitor.id ? <FiX size={18} /> : <FiActivity size={18} />}
                    </button>
                    
                    <button onClick={() => handleDelete(monitor.id)} className="btn btn-danger" title="Delete Monitor">
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {selectedMonitorId === monitor.id && (
                <div className="card" style={{ 
                    borderTopLeftRadius: 0, borderTopRightRadius: 0, 
                    borderTop: 'none', background: 'rgba(23, 13, 33, 0.5)', marginTop: 0 
                }}>
                    {chartLogs.length > 0 ? <ResponseChart logs={chartLogs} /> : <p className="text-center" style={{opacity:0.5}}>No metrics available.</p>}
                </div>
            )}
          </div>
        ))}
        {monitors.length === 0 && <div className="text-center" style={{opacity: 0.5, marginTop: '50px', fontSize: '1.2rem'}}>SYSTEM IDLE.<br/>NO MONITORS DEPLOYED.</div>}
      </div>
    </div>
  );
}

export default App;