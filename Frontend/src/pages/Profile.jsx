import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import PageShell from '../components/PageShell';
import api, { getFileUrl } from '../services/api';
import { patchUser } from '../store/slices/authSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user || {});
  const [employee, setEmployee] = useState(user);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api.get('/employees').then((res) => {
      const match = res.data.find((e) => e._id === user._id || e.employeeId === user.employeeId);
      if (match) setEmployee(match);
    }).catch(console.error);
  }, [user._id, user.employeeId]);

  const initials = (employee.name || 'E').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const photo = employee.profilePicture ? getFileUrl(employee.profilePicture) : '';

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Use a JPG, PNG, or WEBP photo');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be under 2 MB');
      return;
    }
    const body = new FormData();
    body.append('photo', file);
    setUploading(true);
    try {
      const res = await api.post('/employees/me/photo', body);
      setEmployee((prev) => ({ ...prev, profilePicture: res.data.profilePicture }));
      dispatch(patchUser({ profilePicture: res.data.profilePicture }));
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not upload photo');
    } finally {
      setUploading(false);
    }
  };

  const fields = [
    ['Name', employee.name],
    ['Email', employee.email],
    ['Employee ID', employee.employeeId],
    ['Department', employee.department],
    ['Designation', employee.designation],
    ['Branch', employee.branch],
    ['Role', employee.role],
  ];

  return (
    <PageShell title="Profile" description="Your account. Only you can change your photo.">
      <div className="w-full overflow-hidden rounded border border-line bg-surface">
        <div className="flex flex-col items-start gap-4 border-b border-line px-4 py-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand text-white"
            aria-label="Change profile photo"
          >
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-semibold">{initials}</span>
            )}
            <span className="absolute inset-0 flex items-end justify-center bg-black/45 pb-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
              {uploading ? 'Saving' : 'Change'}
            </span>
          </button>
          <div>
            <p className="text-[15px] font-semibold text-ink">{employee.name || 'Employee'}</p>
            <p className="text-[12px] text-muted">{employee.designation || employee.department || 'Employee'}</p>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="mt-2 rounded bg-brand px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Upload photo'}
            </button>
            <p className="mt-1 text-[11px] text-muted">JPG, PNG, or WEBP. Max 2 MB. Square photos look best.</p>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
        </div>
        <dl className="divide-y divide-line">
          {fields.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 px-4 py-3 text-[13px]">
              <dt className="text-muted">{label}</dt>
              <dd className="font-medium text-ink">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </PageShell>
  );
};

export default Profile;
