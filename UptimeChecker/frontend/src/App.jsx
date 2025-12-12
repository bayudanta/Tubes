import { useState, useEffect } from 'react';
import api from './services/api';

function App() {
  const [monitors, setMonitors] = useState([]); 
  const [newUrl, setNewUrl] = useState('');     
  const [newName, setNewName] = useState('');   
  const [loading, setLoading] = useState(false);

  const fetchMonitors = async () => {
    try {
      const response = await api.get('/monitors');
      setMonitors(response.data);
    } catch (error) {
      console.error("Gagal ambil data:", error);
    }
  };

  useEffect(() => {
    fetchMonitors();
    
    const interval = setInterval(fetchMonitors, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUrl || !newName) return alert("Isi nama dan URL dulu!");

    setLoading(true);
    try {
      await api.post('/monitors', { name: newName, url: newUrl });
      setNewUrl('');
      setNewName('');
      fetchMonitors(); 
    } catch (error) {
      alert("Gagal menambah monitor");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if(!confirm("Apakah anda yakin?")) return;
    try {
      await api.delete(`/monitors/${id}`);
      fetchMonitors();
    } catch (error) {
      alert("Gagal menghapus");
    }
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center' }}>🌐 Website Uptime Checker 🌐</h1>
      
      <div className="card">
        <h3>Tambahkan Website</h3>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input 
            className="input" 
            placeholder="Nama (misal: Google)" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input 
            className="input" 
            placeholder="URL (https://...)" 
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '...' : 'Tambah'}
          </button>
        </form>
      </div>

      <div>
        {monitors.map((monitor) => (
          <div key={monitor.id} className="card flex justify-between">
            <div>
              <h3 style={{ margin: '0 0 5px 0' }}>{monitor.name}</h3>
              <a href={monitor.url} target="_blank" className="text-gray" style={{ fontSize: '12px' }}>
                {monitor.url}
              </a>
            </div>
            
            <div className="flex gap-2">
              <div style={{ 
                padding: '5px 10px', 
                borderRadius: '15px', 
                backgroundColor: monitor.status === 'UP' ? '#d1fae5' : '#fee2e2',
                color: monitor.status === 'UP' ? '#065f46' : '#991b1b',
                fontWeight: 'bold'
              }}>
                {monitor.status || 'PENDING'}
              </div>

              <button onClick={() => handleDelete(monitor.id)} className="btn btn-danger">
                Hapus
              </button>
            </div>
          </div>
        ))}

        {monitors.length === 0 && <p style={{textAlign:'center'}}>Belum ada website yang ditambahkan.</p>}
      </div>
    </div>
  );
}

export default App;