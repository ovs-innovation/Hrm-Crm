import React, { useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import api from '../services/api';

const Policies = () => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    api.get('/announcements').then((res) => setAnnouncements(res.data)).catch(console.error);
  }, []);

  return (
    <PageShell title="Announcements" description="Company updates and policies" count={announcements.length}>
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <p className="text-[13px] text-muted">No announcements published.</p>
        ) : announcements.map((a) => (
          <article key={a._id} className="rounded border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-medium text-ink">{a.title}</h2>
              <span className="shrink-0 rounded bg-soft px-2 py-0.5 text-xs text-muted">{a.type}</span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{a.description}</p>
            <p className="mt-2 text-xs text-muted">{new Date(a.date).toLocaleDateString('en-IN')}</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
};

export default Policies;
