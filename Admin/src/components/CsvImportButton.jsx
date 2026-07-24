import React, { useState } from 'react';
import { FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

const CsvImportButton = ({ type, label, onDone }) => {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);

  const downloadTemplate = async () => {
    const { data } = await api.get(`/import/template/${type}`, { responseType: 'text' });
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(`/import/${type}`, { csv });
      toast.success(`Imported ${data.created} record(s)`);
      if (data.errors?.length) toast.error(`${data.errors.length} row(s) failed`);
      setOpen(false);
      setCsv('');
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-outline inline-flex h-8 items-center gap-1.5 px-3 text-[13px]">
        <FiUpload className="h-3.5 w-3.5" /> {label || 'Import CSV'}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-lg rounded border border-line bg-surface">
            <div className="border-b border-line px-4 py-3 font-semibold text-[15px] text-ink">Import {type}</div>
            <form onSubmit={submit} className="space-y-3 p-4">
              <p className="text-[13px] text-muted">
                Paste CSV content or{' '}
                <button type="button" onClick={downloadTemplate} className="text-brand hover:underline">download template</button>
              </p>
              <textarea
                required
                rows={8}
                className="app-input w-full font-mono text-[12px]"
                placeholder="name,company,email,..."
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
              />
              <div className="flex justify-end gap-2 border-t border-line pt-3">
                <button type="button" className="btn-outline h-9 px-3 text-[13px]" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" disabled={busy} className="btn-primary h-9 px-3 text-[13px]">{busy ? 'Importing…' : 'Import'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CsvImportButton;
