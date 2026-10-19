import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status})`);
  }
  return data;
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadTasks = useCallback(async () => {
    setError('');
    try {
      const data = await api('/tasks');
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  );

  async function addTask(event) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setBusy(true);
    setError('');
    try {
      const task = await api('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: cleanTitle }),
      });
      setTasks((current) => [task, ...current]);
      setTitle('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(task) {
    setError('');
    try {
      const updated = await api(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !task.completed }),
      });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    } catch (err) {
      setError(err.message);
    }
  }

  async function editTask(task) {
    const nextTitle = window.prompt('Edit task title:', task.title);
    if (nextTitle === null || !nextTitle.trim()) return;

    setError('');
    try {
      const updated = await api(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: nextTitle.trim() }),
      });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTask(task) {
    setError('');
    try {
      await api(`/tasks/${task.id}`, { method: 'DELETE' });
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Taskflow home">
          <span className="brand-mark">✓</span>
          <span>taskflow</span>
        </a>
        <span className="connection"><i /> Local API</span>
      </header>

      <section className="hero">
        <p className="eyebrow">YOUR SPACE TO GET THINGS DONE</p>
        <h1>Make today<br /><span>count.</span></h1>
        <p className="hero-copy">One small step at a time. Keep your focus on what matters.</p>
      </section>

      <section className="task-panel" aria-label="To-do tasks">
        <div className="panel-heading">
          <div>
            <h2>My tasks</h2>
            <p>{tasks.length === 0 ? 'A fresh start is a good place to begin.' : `${completedCount} of ${tasks.length} completed`}</p>
          </div>
          <span className="task-count">{tasks.length.toString().padStart(2, '0')}</span>
        </div>

        <form className="add-form" onSubmit={addTask}>
          <input
            aria-label="New task"
            placeholder="What needs to get done?"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={160}
          />
          <button type="submit" disabled={busy || !title.trim()}>
            {busy ? 'Adding…' : 'Add task'} <span aria-hidden="true">＋</span>
          </button>
        </form>

        {error && <p className="error" role="alert">{error}</p>}

        {loading ? (
          <div className="empty-state">Loading your tasks…</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✦</span>
            <strong>Nothing on your list yet</strong>
            <span>Add a task above and make a start.</span>
          </div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li className={task.completed ? 'task completed' : 'task'} key={task.id}>
                <button
                  className="check-button"
                  onClick={() => toggleTask(task)}
                  aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                >
                  {task.completed ? '✓' : ''}
                </button>
                <span className="task-title">{task.title}</span>
                <div className="task-actions">
                  <button onClick={() => editTask(task)} aria-label={`Edit ${task.title}`} title="Edit">Edit</button>
                  <button onClick={() => deleteTask(task)} aria-label={`Delete ${task.title}`} title="Delete">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="footer">
        <span>Built with AWS SAM, Lambda &amp; DynamoDB</span>
        <button onClick={loadTasks} className="refresh-button">Refresh list ↻</button>
      </footer>
    </main>
  );
}
