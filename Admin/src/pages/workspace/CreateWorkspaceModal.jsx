import React, { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import Button from '../../components/Button';
import { sameId } from './workspaceUtils';

const TITLES = {
  team: 'New team',
  channel: 'New channel',
  dm: 'New chat',
  group: 'New group',
};

const CreateWorkspaceModal = ({
  kind,
  form,
  setForm,
  teams,
  contacts,
  meId,
  saving,
  onClose,
  onSubmit,
}) => {
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const canSubmit =
    kind === 'dm' ? Boolean(form.peerId)
      : kind === 'group' ? Boolean(form.name.trim() && form.memberIds)
        : Boolean(form.name.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 px-4" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ws-create-title"
        className="w-full max-w-[420px] rounded-lg border border-line bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 id="ws-create-title" className="text-[15px] font-semibold text-ink">{TITLES[kind]}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:bg-soft hover:text-ink" aria-label="Close">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {kind === 'channel' && (
          <label className="mt-4 block text-[12px] font-medium text-ink">
            Team
            <select
              ref={firstRef}
              className="app-input mt-1"
              value={form.teamId}
              onChange={(e) => setForm({ ...form, teamId: e.target.value })}
            >
              {teams.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </label>
        )}

        {kind !== 'dm' && (
          <label className="mt-3 block text-[12px] font-medium text-ink">
            Name
            <input
              ref={kind === 'channel' ? undefined : firstRef}
              className="app-input mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={kind === 'channel' ? 'e.g. design' : 'Name'}
            />
          </label>
        )}

        {kind === 'channel' && (
          <label className="mt-3 block text-[12px] font-medium text-ink">
            Visibility
            <select className="app-input mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="public">Public — anyone in the team</option>
              <option value="private">Private — invited members</option>
              <option value="announcement">Announcements — posting limited</option>
            </select>
          </label>
        )}

        {kind === 'dm' && (
          <label className="mt-3 block text-[12px] font-medium text-ink">
            Teammate
            <select
              ref={firstRef}
              className="app-input mt-1"
              value={form.peerId}
              onChange={(e) => setForm({ ...form, peerId: e.target.value })}
            >
              <option value="">Select a person</option>
              {contacts.filter((c) => !sameId(c._id, meId)).map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </label>
        )}

        {kind === 'group' && (
          <fieldset className="mt-3">
            <legend className="text-[12px] font-medium text-ink">Members</legend>
            <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-line p-2">
              {contacts.filter((c) => !sameId(c._id, meId)).map((c) => {
                const selected = form.memberIds.split(',').map((s) => s.trim()).includes(String(c._id));
                return (
                  <label key={c._id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-[13px] hover:bg-soft">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        const ids = form.memberIds.split(',').map((s) => s.trim()).filter(Boolean);
                        const next = selected ? ids.filter((id) => id !== String(c._id)) : [...ids, String(c._id)];
                        setForm({ ...form, memberIds: next.join(',') });
                      }}
                    />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {(kind === 'team' || kind === 'channel') && (
          <label className="mt-3 block text-[12px] font-medium text-ink">
            Description
            <textarea
              className="app-input mt-1 min-h-[72px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional"
            />
          </label>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onSubmit} disabled={!canSubmit} isLoading={saving}>Create</Button>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;
