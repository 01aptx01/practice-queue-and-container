import { useState, useEffect, useRef, useCallback } from 'react';

type TaskState = 'idle' | 'processing' | 'success' | 'failure';

interface UseTaskStatusResult {
  status: TaskState;
  taskId: string | null;
  triggerTask: (duration?: number) => Promise<void>;
  reset: () => void;
}

export function useTaskStatus(): UseTaskStatusResult {
  const [status, setStatus] = useState<TaskState>('idle');
  const [taskId, setTaskId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Ensure polling is cleared when the component unmounts
  useEffect(() => {
    return cleanupPolling;
  }, [cleanupPolling]);

  const pollStatus = useCallback(async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      // We poll the global tasks endpoint to find our specific task state
      const res = await fetch(`${apiUrl}/tasks`);
      
      if (!res.ok) throw new Error('Failed to fetch task status');
      
      const data = await res.json();
      
      // Handle both new API structure {metrics, tasks} and old structure []
      const tasksList = Array.isArray(data) ? data : (data.tasks || []);
      const task = tasksList.find((t: any) => t.id === id);
      
      if (!task) return; // Task might not be registered yet or was cleared

      if (task.status === 'SUCCESS') {
        setStatus('success');
        cleanupPolling();
      } else if (task.status === 'FAILURE' || task.status === 'REVOKED') {
        setStatus('failure');
        cleanupPolling();
      } else {
        setStatus('processing');
      }
    } catch (err) {
      console.error("Polling error:", err);
      setStatus('failure');
      cleanupPolling();
    }
  }, [cleanupPolling]);

  const triggerTask = useCallback(async (duration: number = 5) => {
    setStatus('processing');
    setTaskId(null);
    cleanupPolling();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ duration })
      });

      if (!res.ok) throw new Error('Failed to trigger task');

      const data = await res.json();
      setTaskId(data.task_id);

      // Start polling every 2 seconds
      pollingIntervalRef.current = setInterval(() => {
        pollStatus(data.task_id);
      }, 2000);
      
    } catch (err) {
      console.error("Trigger error:", err);
      setStatus('failure');
    }
  }, [pollStatus, cleanupPolling]);

  const reset = useCallback(() => {
    cleanupPolling();
    setStatus('idle');
    setTaskId(null);
  }, [cleanupPolling]);

  return { status, taskId, triggerTask, reset };
}
