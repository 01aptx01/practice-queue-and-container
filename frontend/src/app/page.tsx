"use client";

import { useState, useEffect } from "react";

// Define the structure of a Task object returned from the API
type Task = {
  id: string;
  status: string;
  startTime: string;
  duration: string;
  result: string;
};

// Define the configuration for table sorting
type SortConfig = {
  key: keyof Task;
  direction: 'asc' | 'desc';
};

export default function Dashboard() {
  // State to hold the list of tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  // State to manage the current sorting configuration
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  /**
   * Fetches the latest task queue data from the backend API.
   * Runs on mount and via interval polling.
   */
  const fetchTasks = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  /**
   * Effect hook to initialize data fetching and setup a polling interval.
   * Polls every 2000 milliseconds (2 seconds).
   */
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 2000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Calculate dynamic metrics for the top cards
  const activeCount = tasks.filter(t => t.status === "PENDING" || t.status === "STARTED" || t.status === "RETRY").length;
  const successCount = tasks.filter(t => t.status === "SUCCESS").length;
  const failedCount = tasks.filter(t => t.status === "FAILURE").length;

  /**
   * Sends a DELETE request to flush the task queue from Redis,
   * then resets the local state immediately.
   */
  const handleClear = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/tasks`, { method: "DELETE" });
      if (res.ok) {
        setTasks([]);
      }
    } catch (err) {
      console.error("Failed to clear tasks", err);
    }
  };

  // Create a localized copy of tasks to apply sorting without mutating original state
  const sortedTasks = [...tasks];
  if (sortConfig !== null) {
    sortedTasks.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Toggles the sorting direction or changes the active sorting column.
   * @param key The column key to sort by.
   */
  const requestSort = (key: keyof Task) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  /**
   * Renders a directional arrow indicating the active sort column and direction.
   * @param key The column key to evaluate.
   */
  const getSortIndicator = (key: keyof Task) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // Reusable CSS class for table headers
  const thClass = "py-3 px-4 font-semibold text-[#8b949e] uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors";

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-mono p-8 selection:bg-[#39d353] selection:text-black">
      {/* Header Section */}
      <header className="mb-8 border-b border-[#30363d] pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Telemetry Console</h1>
          <p className="text-sm text-[#8b949e]">Real-time async task queue monitoring</p>
        </div>
        <button 
          onClick={handleClear}
          className="px-4 py-2 bg-[#21262d] border border-[#30363d] text-[#c9d1d9] text-xs font-bold uppercase tracking-wide hover:bg-[#30363d] hover:text-white transition-colors"
        >
          Clear Queue
        </button>
      </header>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#161b22] border border-[#30363d] p-5">
          <div className="text-sm text-[#8b949e] mb-1 uppercase tracking-wider">Pending Tasks</div>
          <div className="text-3xl font-bold text-[#f2cc60]">{activeCount}</div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] p-5">
          <div className="text-sm text-[#8b949e] mb-1 uppercase tracking-wider">Successful Tasks</div>
          <div className="text-3xl font-bold text-[#39d353]">{successCount}</div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] p-5">
          <div className="text-sm text-[#8b949e] mb-1 uppercase tracking-wider">Failed Tasks</div>
          <div className="text-3xl font-bold text-[#ff7b72]">{failedCount}</div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#161b22] border border-[#30363d] overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#30363d] bg-[#0d1117]">
              <th className={thClass} onClick={() => requestSort('id')}>
                Task ID<span className="text-[#58a6ff]">{getSortIndicator('id')}</span>
              </th>
              <th className={thClass} onClick={() => requestSort('status')}>
                Status<span className="text-[#58a6ff]">{getSortIndicator('status')}</span>
              </th>
              <th className={thClass} onClick={() => requestSort('startTime')}>
                Start Time<span className="text-[#58a6ff]">{getSortIndicator('startTime')}</span>
              </th>
              <th className={thClass} onClick={() => requestSort('duration')}>
                Duration<span className="text-[#58a6ff]">{getSortIndicator('duration')}</span>
              </th>
              <th className={thClass} onClick={() => requestSort('result')}>
                Payload<span className="text-[#58a6ff]">{getSortIndicator('result')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]">
            {sortedTasks.map((task) => (
              <tr key={task.id} className="hover:bg-[#1f242b] transition-colors">
                <td className="py-3 px-4 text-[#58a6ff]">{task.id}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wide border
                    ${task.status === 'SUCCESS' ? 'text-[#39d353] border-[#39d353]/30 bg-[#39d353]/10' : 
                      task.status === 'FAILURE' ? 'text-[#ff7b72] border-[#ff7b72]/30 bg-[#ff7b72]/10' : 
                      'text-[#f2cc60] border-[#f2cc60]/30 bg-[#f2cc60]/10'}
                  `}>
                    {task.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-[#c9d1d9]">{new Date(task.startTime).toLocaleTimeString()}</td>
                <td className="py-3 px-4 text-[#c9d1d9]">{task.duration}</td>
                <td className="py-3 px-4 text-[#8b949e] truncate max-w-xs">{task.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
