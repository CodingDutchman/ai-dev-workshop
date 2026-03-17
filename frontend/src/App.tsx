import { CheckCircle2, Circle, ClipboardList, Plus } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { completeTask, createTask, fetchTasks, uncompleteTask } from './services/api';
import { Task } from './types';

type FilterStatus = 'all' | 'active' | 'completed';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch(() => setError('Failed to load tasks. Is the backend running?'));
  }, []);

  const handleToggle = async (task: Task) => {
    try {
      const updated =
        task.status === 'done' ? await uncompleteTask(task.id) : await completeTask(task.id);
      setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const newTask = await createTask(inputValue.trim());
      setTasks(prev => [...prev, newTask]);
      setInputValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel = (status: Task['status']) => {
    if (status === 'done') return 'Completed';
    return 'Active';
  };

  const statusStyles = (status: Task['status']) => {
    if (status === 'done') {
      return 'bg-green-100 text-green-700';
    }
    return 'bg-blue-100 text-blue-700';
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return task.status !== 'done';
    if (filter === 'completed') return task.status === 'done';
    return true; // 'all'
  });

  const emptyStateMessage = () => {
    if (filter === 'active') return 'No active tasks. All tasks are completed!';
    if (filter === 'completed') return 'No completed tasks yet. Keep working!';
    return 'No tasks yet. Add one above to get started.';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <header className="flex items-center gap-3 mb-10">
          <ClipboardList className="w-9 h-9 text-indigo-600 shrink-0" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Tracker</h1>
            <p className="text-gray-500 text-sm mt-0.5">Keep track of what needs to get done</p>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'completed'] as FilterStatus[]).map(filterOption => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{emptyStateMessage()}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {filteredTasks.map(task => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <button
                    onClick={() => handleToggle(task)}
                    aria-label={task.status === 'done' ? 'Mark as incomplete' : 'Mark as complete'}
                    className="shrink-0 transition-colors hover:text-indigo-500 text-gray-300"
                  >
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    {task.title}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles(task.status)}`}
                  >
                    {statusLabel(task.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {filteredTasks.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}{' '}
            {filter !== 'all' && `(${filter})`}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
