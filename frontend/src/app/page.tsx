"use client";

import { useState, useEffect } from "react";
import { useTaskStatus } from "../hooks/useTaskStatus";

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

// Define global metrics structure
type Metrics = {
  total_received: number;
  total_success: number;
  total_failed: number;
  active: number;
  pending: number;
};

export default function Dashboard() {
  // Global Tasks State for the Table
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    total_received: 0,
    total_success: 0,
    total_failed: 0,
    active: 0,
    pending: 0
  });
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Hook for triggering specific tasks from the UI
  const { status: triggerStatus, taskId: triggeredTaskId, triggerTask } = useTaskStatus();

  /**
   * Effect hook to establish SSE connection for real-time task updates.
   */
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const eventSource = new EventSource(`${apiUrl}/tasks/stream`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.metrics && data.tasks) {
          setTasks(data.tasks);
          setMetrics(data.metrics);
        } else {
          setTasks(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to parse SSE data", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error (reconnecting...):", error);
      setIsConnected(false);
      // We explicitly DO NOT call eventSource.close() here 
      // so the browser's native auto-reconnect handles it.
    };

    return () => {
      eventSource.close(); // Cleanup on unmount
    };
  }, []);



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

  const requestSort = (key: keyof Task) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof Task) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const thClass = "py-3 px-4 font-semibold text-[#8b949e] uppercase tracking-wider cursor-pointer hover:text-white select-none transition-colors";

  // Helper for dynamic status UI
  const getStatusColor = () => {
    switch (triggerStatus) {
      case 'processing': return 'text-[#f2cc60] border-[#f2cc60]';
      case 'success': return 'text-[#39d353] border-[#39d353]';
      case 'failure': return 'text-[#ff7b72] border-[#ff7b72]';
      default: return 'text-[#8b949e] border-[#30363d]';
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-mono p-8 selection:bg-[#39d353] selection:text-black">
      {/* Header Section */}
      <header className="mb-8 border-b border-[#30363d] pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center">
            Telemetry Console
            {!isConnected && <span className="ml-3 text-xs px-2 py-0.5 bg-[#ff7b72]/10 text-[#ff7b72] border border-[#ff7b72]/30 rounded animate-pulse tracking-wide font-medium">Reconnecting...</span>}
          </h1>
          <p className="text-sm text-[#8b949e]">Real-time async task queue monitoring</p>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => triggerTask(5)}
            disabled={triggerStatus === 'processing'}
            className="px-4 py-2 bg-[#238636] text-white text-xs font-bold uppercase tracking-wide hover:bg-[#2ea043] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
          >
            {triggerStatus === 'processing' ? 'Processing...' : 'Trigger New Task'}
          </button>
          <button 
            onClick={handleClear}
            className="px-4 py-2 bg-[#21262d] border border-[#30363d] text-[#c9d1d9] text-xs font-bold uppercase tracking-wide hover:bg-[#30363d] hover:text-white transition-colors rounded"
          >
            Clear Queue
          </button>
        </div>
      </header>

      {/* Task Trigger Status Banner */}
      {triggerStatus !== 'idle' && (
        <div className={`mb-8 p-4 border rounded bg-[#161b22] flex items-center justify-between ${getStatusColor()}`}>
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold tracking-wider mb-1">Latest Triggered Task</span>
            <span className="text-sm">ID: {triggeredTaskId || 'Initializing...'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase">{triggerStatus}</span>
            {triggerStatus === 'processing' && (
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-current animate-spin"></div>
            )}
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#161b22] border border-[#30363d] p-5 rounded">
          <div className="text-sm text-[#8b949e] mb-1 uppercase tracking-wider">Total Received</div>
          <div className="text-3xl font-bold text-white">{metrics.total_received}</div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] p-5 rounded">
          <div className="text-sm text-[#8b949e] mb-1 uppercase tracking-wider">Pending</div>
          <div className="text-3xl font-bold text-[#f2cc60]">{metrics.pending}</div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] p-5 rounded">
          <div className="text-sm text-[#8b949e] mb-1 uppercase tracking-wider">Active (Processing)</div>
          <div className="text-3xl font-bold text-[#58a6ff]">{metrics.active}</div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] p-5 rounded">
          <div className="text-sm text-[#8b949e] mb-1 uppercase tracking-wider">Completed / Failed</div>
          <div className="text-3xl font-bold text-[#39d353]">{metrics.total_success} <span className="text-sm text-[#8b949e] font-normal mx-1">/</span> <span className="text-[#ff7b72]">{metrics.total_failed}</span></div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#161b22] border border-[#30363d] overflow-x-auto rounded">
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
                <td className="py-3 px-4 text-[#58a6ff] font-medium">{task.id}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wide border rounded
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
