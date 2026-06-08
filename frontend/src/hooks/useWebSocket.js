import { useEffect, useRef, useCallback } from 'react';
import { WS } from '../api';

export default function useWebSocket(convId, onMsg) {
  const wsRef   = useRef(null);
  const retry   = useRef(null);
  const cbRef   = useRef(onMsg);
  cbRef.current = onMsg;          // always up-to-date callback, no stale closure

  const connect = useCallback(() => {
    // Close any existing socket first
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent auto-retry loop on intentional close
      wsRef.current.close();
    }

    const token = localStorage.getItem('access');
    if (!token || !convId) return;

    const socket = new WebSocket(`${WS}/ws/chat/${convId}/?token=${token}`);
    wsRef.current = socket;

    socket.onopen = () => {
      clearTimeout(retry.current);
      console.log('[WS] connected to conv', convId);
    };

    socket.onmessage = e => {
      try {
        cbRef.current(JSON.parse(e.data));
      } catch(err) {
        console.error('[WS] bad message', err);
      }
    };

    socket.onclose = e => {
      console.log('[WS] closed, code=', e.code, '— retrying in 3s');
      retry.current = setTimeout(connect, 3000);
    };

    socket.onerror = err => {
      console.error('[WS] error', err);
      socket.close();
    };
  }, [convId]);  // reconnect whenever convId changes

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retry.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;  // don't retry on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback(data => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('[WS] tried to send but socket not open, state=',
        wsRef.current?.readyState);
    }
  }, []);

  return send;
}