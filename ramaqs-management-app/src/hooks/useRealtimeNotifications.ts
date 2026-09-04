// src/hooks/useRealtimeNotifications.ts

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../store/store';
import { api } from '../store/api/api';
import { useState } from 'react';



let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

// Déverrouille l'AudioContext au premier clic — obligatoire sur tous les navigateurs modernes
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

function playChime() {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  const play = () => {
    try {
      const now = ctx.currentTime;
      const note = (freq: number, start: number, dur: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.start(start);
        osc.stop(start + dur);
      };
      note(995,  now,        0.45, 0.25);
      note(1320, now + 0.18, 0.45, 0.20);
    } catch (e) {
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      play();
    }).catch((e) => {
    });
  } else if (ctx.state === 'running') {
    play();
  } else {
    
  }
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function useRealtimeNotifications() {
  
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  
  const getToken = () => {
    const token = localStorage.getItem('access_token');
    return token;
  };

  
  useEffect(() => {
    const handleInteraction = () => {
      unlockAudio();
    };
    
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  useEffect(() => {

    if (!user) {
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
      retryTimer.current = setTimeout(() => {
      }, 2000);
      return;
    }

    

    const connect = () => {
      const token = getToken();

      if (!token) {
        reconnectTimer.current = setTimeout(connect, 2000);
        return;
      }

      const wsUrl = `${WS_URL}/ws/notifications/?token=${token}`;
      
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current);
            reconnectTimer.current = null;
          }
        };

        ws.onmessage = (event) => {
          
          try {
            const msg = JSON.parse(event.data);
            
            if (msg.type === 'notification') {
              
              
             
              unlockAudio();
              
              
              setTimeout(() => playChime(), 50);
              
             
              dispatch(api.util.invalidateTags([{ type: 'Notification', id: 'LIST' }]));

              if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(msg.data?.titre || 'Nouvelle notification', {
                    body: msg.data?.message || '',
                    icon: '/favicon.ico',
                  });
              }
               
              const entiteType = msg.data?.entite_type;
              if (entiteType === 'document') {
                dispatch(api.util.invalidateTags([{ type: 'Document', id: 'LIST' }]));
              } else if (entiteType === 'tache') {
                dispatch(api.util.invalidateTags([
                  { type: 'Tache', id: 'LIST' },
                  { type: 'Projet', id: 'LIST' },
                ]));
              } else if (entiteType === 'projet') {
                dispatch(api.util.invalidateTags([{ type: 'Projet', id: 'LIST' }]));
              }



            } else if (msg.type === 'play_sound') {
              unlockAudio();
              setTimeout(() => playChime(), 50);
            } else if (msg.type === 'ping') {
            }
          } catch (error) {
          }
        };

        ws.onclose = (event) => {
          if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current);
          }
          reconnectTimer.current = setTimeout(connect, 5000);
        };

        ws.onerror = (error) => {
          ws.close();
        };
      } catch (error) {
        // Réessayer après 5 secondes
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
        }
        reconnectTimer.current = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user?.id, dispatch]);
}