import React, { useState, useEffect } from 'react';
import { 
  getTimetableHistory, 
  activateTimetableVersion, 
  renameTimetableVersion, 
  deleteTimetableVersion 
} from '../utils/api';

const TimetableHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Rename states
  const [renamingId, setRenamingId] = useState(null);
  const [renamingLabel, setRenamingLabel] = useState('');
  const [savingRename, setSavingRename] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTimetableHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError('Failed to fetch timetable version history.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    setError('');
    setSuccess('');
    try {
      await activateTimetableVersion(id);
      setSuccess('✨ Timetable version activated and published successfully!');
      await fetchHistory();
      
      // Auto-clear success banner after 3s
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to activate version:', err);
      setError(err.message || 'Failed to activate timetable version.');
    }
  };

  const handleOpenRename = (item) => {
    setRenamingId(item.id);
    setRenamingLabel(item.label);
    
    // Open DaisyUI modal
    document.getElementById('rename-modal').showModal();
  };

  const handleSaveRename = async () => {
    if (!renamingLabel.trim()) return;
    
    setSavingRename(true);
    setError('');
    try {
      await renameTimetableVersion(renamingId, renamingLabel.trim());
      
      // Close modal
      document.getElementById('rename-modal').close();
      setRenamingId(null);
      
      setSuccess('✏️ Version renamed successfully.');
      await fetchHistory();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to rename version:', err);
      setError(err.message || 'Failed to rename timetable version.');
    } finally {
      setSavingRename(false);
    }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`⚠️ Are you sure you want to permanently delete "${label}"? This action cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await deleteTimetableVersion(id);
      setSuccess('🗑️ Timetable version deleted successfully.');
      await fetchHistory();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to delete version:', err);
      setError(err.message || 'Failed to delete timetable version.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
          Timetable Version Control
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage generated timetables, review statistical profiles, and activate draft versions on the fly.
        </p>
      </div>

      {/* Banners */}
      {success && (
        <div className="alert alert-success shadow-md text-white font-medium bg-green-500">
          <div>
            <span>{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error shadow-lg text-white font-medium bg-red-500">
          <div>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-slate-500 font-medium animate-pulse">Loading timetable database logs...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && history.length === 0 && (
        <div className="text-center py-20 card bg-white border border-slate-100 shadow-lg">
          <div className="text-7xl mb-4 animate-bounce">🗂️</div>
          <h3 className="text-2xl font-bold text-slate-800 mb-1">No Timetables Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
            You haven't generated any timetables yet. Go to the "Generate Timetable" tab to create one.
          </p>
        </div>
      )}

      {/* History Grid */}
      {history.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item) => (
            <div 
              key={item.id}
              className={`card bg-white shadow-xl transition-all duration-300 transform hover:scale-102 hover:shadow-2xl border ${
                item.isActive 
                  ? 'border-2 border-emerald-500 ring-4 ring-emerald-500/10' 
                  : 'border-slate-100'
              }`}
            >
              <div className="card-body p-6 flex flex-col justify-between">
                <div>
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge font-bold uppercase text-[10px] px-2.5 py-1 ${
                      item.isActive 
                        ? 'badge-success text-white bg-emerald-500' 
                        : 'badge-ghost text-slate-500 bg-slate-100'
                    }`}>
                      {item.isActive ? '🟢 Active & Published' : '⚪ Draft / Archive'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(item.generatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title & Rename */}
                  <div className="group flex items-start justify-between gap-2 mb-4">
                    <h3 className="text-base font-extrabold text-slate-800 leading-snug">
                      {item.label}
                    </h3>
                    <button 
                      onClick={() => handleOpenRename(item)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-bold opacity-75 hover:opacity-100 shrink-0 mt-0.5"
                      title="Rename Version"
                    >
                      ✏️
                    </button>
                  </div>

                  {/* Profile Statistics Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center mb-6">
                    <div>
                      <div className="text-base font-extrabold text-slate-800">
                        {item.stats?.totalClasses || 0}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Classes</div>
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-slate-800">
                        {item.stats?.totalTeachers || 0}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Teachers</div>
                    </div>
                    <div>
                      <div className={`text-base font-extrabold ${item.stats?.conflicts > 0 ? 'text-red-500 font-black' : 'text-slate-800'}`}>
                        {item.stats?.conflicts || 0}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Conflicts</div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
                  <button
                    onClick={() => handleDelete(item.id, item.label)}
                    className="btn btn-error btn-outline border border-red-200 text-red-500 btn-xs rounded-lg px-3 flex-1"
                    title="Delete Draft"
                  >
                    🗑️ Delete
                  </button>
                  
                  {!item.isActive && (
                    <button
                      onClick={() => handleActivate(item.id)}
                      className="btn btn-emerald text-white bg-emerald-500 hover:bg-emerald-600 border-none btn-xs rounded-lg px-4 flex-1 font-bold"
                    >
                      📢 Activate
                    </button>
                  )}
                  {item.isActive && (
                    <span className="btn btn-disabled btn-xs rounded-lg flex-1 text-slate-400 italic">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename Modal */}
      <dialog id="rename-modal" className="modal">
        <div className="modal-box max-w-sm rounded-xl p-6 bg-white shadow-2xl border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-1.5">
            <span>✏️</span> Rename Timetable
          </h3>
          <div className="space-y-4">
            <input 
              type="text" 
              value={renamingLabel} 
              onChange={(e) => setRenamingLabel(e.target.value)}
              className="input input-bordered w-full rounded-lg"
              placeholder="Enter new label name..."
            />
          </div>
          <div className="modal-action flex justify-end gap-2 mt-4 pt-3 border-t">
            <button 
              type="button" 
              className="btn btn-ghost btn-sm rounded-lg"
              onClick={() => {
                document.getElementById('rename-modal').close();
                setRenamingId(null);
              }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSaveRename}
              className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white border-none btn-sm rounded-lg"
              disabled={savingRename || !renamingLabel.trim()}
            >
              {savingRename ? 'Saving...' : 'Save Name'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default TimetableHistory;
