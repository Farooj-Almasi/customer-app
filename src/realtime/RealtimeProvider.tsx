import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { API_BASE_URL } from '../api/config';
import { useAuth } from '../auth/AuthProvider';

/**
 * The server-pushed events the customer app listens for.
 *
 * Deliberately only the two a customer cares about: their order moved, and
 * their driver's position changed. Staff/driver events exist on the backend but
 * are never routed to a customer's room, so they would never arrive here.
 */
export type RealtimeEvent = 'order.transitioned' | 'driver.location';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

type Handler = (payload: unknown) => void;

interface RealtimeContextValue {
  status: ConnectionStatus;
  /** Subscribe to one server event. Returns an unsubscribe function. */
  subscribe: (event: RealtimeEvent, handler: Handler) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

/** The API base is `<origin>/api/v1`; the socket lives at `<origin>` path `/realtime`. */
function socketOrigin(): string {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    // React Native has no window.location; strip the known API path instead.
    return API_BASE_URL.replace(/\/api(\/v\d+)?\/?$/, '');
  }
}

/**
 * Owns a single authenticated socket.io connection for the signed-in customer
 * and fans server events out to any subscribed screen. Auth mirrors HTTP: the
 * access token rides in the handshake, re-read on every (re)connect, so a
 * refreshed or revoked token is honoured. Emission is one-directional — the
 * client only listens; every write still goes through the REST choke points.
 *
 * This is the accelerator the order-tracking screen needed: the 8-second poll
 * stays as the floor (a phone in a lift still catches up on reconnect), and the
 * socket removes the wait on the one screen somebody watches *because* they want
 * to know where their food is now.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { isAuthenticated, getAccessToken } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setStatus('disconnected');
      return;
    }

    setStatus('connecting');
    const socket = io(socketOrigin(), {
      path: '/realtime',
      transports: ['websocket'],
      // Re-read the token on every (re)connect so a refreshed token is used.
      auth: (cb) => cb({ token: getAccessToken() ?? '' }),
    });
    socketRef.current = socket;

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', () => setStatus('disconnected'));
    // The server disconnects an unauthorised socket after emitting this.
    socket.on('unauthorized', () => setStatus('disconnected'));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
    // getAccessToken is stable (reads a ref); isAuthenticated drives reconnects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      status,
      subscribe: (event, handler) => {
        const socket = socketRef.current;
        if (!socket) return () => undefined;
        socket.on(event, handler);
        return () => {
          socket.off(event, handler);
        };
      },
    }),
    // `status` is included so a subscribe made before connect re-binds once the
    // socket exists (the effect recreates the socket, but the ref stays current).
    [status],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

const NOOP_REALTIME: RealtimeContextValue = {
  status: 'disconnected',
  subscribe: () => () => undefined,
};

/**
 * Deliberately does **not** throw without a provider, unlike `useAuth`. A screen
 * with no socket still works — it falls back to its poll — and the alternative
 * is a missing provider turning into a blank view on a phone someone is holding.
 * The screen tests mount without it.
 */
export function useRealtime(): RealtimeContextValue {
  return useContext(RealtimeContext) ?? NOOP_REALTIME;
}

/**
 * Subscribe to one or more realtime events and run `onEvent` when any fires,
 * plus once on (re)connect to catch up on anything missed while briefly offline.
 * Intended to drive a screen `reload()`.
 */
export function useRealtimeReload(events: RealtimeEvent[], onEvent: () => void): ConnectionStatus {
  const { status, subscribe } = useRealtime();
  const cb = useRef(onEvent);
  cb.current = onEvent;

  useEffect(() => {
    const unsubs = events.map((e) => subscribe(e, () => cb.current()));
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, status, events.join(',')]);

  const wasConnected = useRef(false);
  useEffect(() => {
    if (status === 'connected' && !wasConnected.current) {
      wasConnected.current = true;
      cb.current();
    } else if (status !== 'connected') {
      wasConnected.current = false;
    }
  }, [status]);

  return status;
}
