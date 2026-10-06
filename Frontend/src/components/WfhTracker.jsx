import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

const IDLE_MS = 3 * 60 * 1000;

const WfhTracker = () => {
  const location = useLocation();
  const page = useRef(location.pathname);
  const inputs = useRef(0);
  const lastInput = useRef(Date.now());
  const onBreak = useRef(false);
  const tracking = useRef(false);

  page.current = location.pathname;

  useEffect(() => {
    const mark = () => {
      lastInput.current = Date.now();
      inputs.current += 1;
    };
    const onBreakEvent = (event) => {
      onBreak.current = Boolean(event.detail);
    };
    window.addEventListener('mousemove', mark);
    window.addEventListener('keydown', mark);
    window.addEventListener('wfh-break', onBreakEvent);
    return () => {
      window.removeEventListener('mousemove', mark);
      window.removeEventListener('keydown', mark);
      window.removeEventListener('wfh-break', onBreakEvent);
    };
  }, []);

  useEffect(() => {
    let timer;
    const tick = async () => {
      try {
        const { data } = await api.get('/wfh/me');
        tracking.current = Boolean(data.tracking);
        if (!data.tracking) return;
        const sent = inputs.current;
        inputs.current = 0;
        const idle = !onBreak.current && Date.now() - lastInput.current > IDLE_MS;
        await api.post('/wfh/pulse', {
          elapsed: 30,
          idle,
          status: onBreak.current ? 'break' : 'online',
          page: page.current,
          inputs: sent,
        });
      } catch {
        tracking.current = false;
      }
    };
    tick();
    timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, []);

  return null;
};

export default WfhTracker;
