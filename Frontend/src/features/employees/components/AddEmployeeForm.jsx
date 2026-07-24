import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../../services/api';
import { FiEye, FiEyeOff, FiUploadCloud } from 'react-icons/fi';

// Define the validation schema using Zod
const employeeSchema = z.object({
  employeeId: z.string().optional(),
  salutation: z.string().optional(),
  name: z.string().min(2, 'Name is required (min 2 chars)'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must have at least 8 characters'),
  profilePicture: z.any().optional(), // For simple URL or file
  designation: z.string().min(1, 'Designation is required'),
  department: z.string().min(1, 'Department is required'),
  country: z.string().optional(),
  mobile: z.string().optional(),
  gender: z.string().optional(),
  joinDate: z.string().min(1, 'Joining Date is required'),
  dateOfBirth: z.string().optional(),
  reportingTo: z.string().optional(),
  language: z.string().optional(),
  role: z.string().optional(),
  address: z.string().optional(),
  about: z.string().optional(),
});

const AddEmployeeForm = ({ onCancel, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeId: `#EMP000000${Math.floor(Math.random() * 900) + 100}`,
      salutation: '',
      name: '',
      email: '',
      password: '',
      designation: '',
      department: '',
      country: '',
      mobile: '',
      gender: '',
      joinDate: new Date().toISOString().split('T')[0],
      dateOfBirth: '',
      reportingTo: '',
      language: '',
      role: 'Employee',
      address: '',
      about: '',
    }
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you would upload this to S3/Cloudinary and get a URL.
      // For now, we will use a local object URL to show preview, or convert to base64.
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setValue('profilePicture', reader.result); // Save base64 to form state
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Build the payload
      const payload = {
        ...data,
        // Ensure role has a default if empty
        role: data.role || 'Employee',
      };

      const response = await api.post('/employees/register', payload);
      onSuccess(response.data);
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Failed to add employee: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const InputLabel = ({ children, required }) => (
    <label className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1 block">
      {children} {required && <span className="text-brand">*</span>}
    </label>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Account Details Section */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-6 bg-surface/50 p-3 rounded-lg border border-line border-line">
            Account Details
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Left 4 Columns Container */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <InputLabel>Salutation</InputLabel>
                  <select {...register('salutation')} className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink">
                    <option value="">--</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                </div>
                <div>
                  <InputLabel required>Employee Name</InputLabel>
                  <input {...register('name')} type="text" placeholder="e.g. John Doe" className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink" />
                  {errors.name && <p className="text-brand text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <InputLabel required>Employee Email</InputLabel>
                  <input {...register('email')} type="email" placeholder="e.g. john.doe@example.com" className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink" />
                  {errors.email && <p className="text-brand text-xs mt-1">{errors.email.message}</p>}
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <InputLabel required>Password</InputLabel>
                  <div className="relative">
                    <input {...register('password')} type={showPassword ? "text" : "password"} className="w-full px-3 py-2 pr-10 bg-surface border border-line rounded-md text-sm text-ink text-ink" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-muted">
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-brand text-xs mt-1">{errors.password.message}</p>
                  ) : (
                    <p className="text-muted text-[10px] mt-1">Must have at least 8 characters</p>
                  )}
                </div>
                <div className="md:col-span-1">
                  <InputLabel required>Designation</InputLabel>
                  <div className="flex gap-2">
                    <input {...register('designation')} type="text" placeholder="e.g. Manager" className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink" />
                  </div>
                  {errors.designation && <p className="text-brand text-xs mt-1">{errors.designation.message}</p>}
                </div>
                <div className="md:col-span-1">
                  <InputLabel required>Department</InputLabel>
                  <div className="flex gap-2">
                    <input {...register('department')} type="text" placeholder="e.g. Engineering" className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink" />
                  </div>
                  {errors.department && <p className="text-brand text-xs mt-1">{errors.department.message}</p>}
                </div>
                <div></div> {/* Empty 4th column */}
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <InputLabel>Country</InputLabel>
                  <select {...register('country')} className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink">
                    <option value="">--</option>
                    <option value="Afghanistan">Afghanistan</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="India">India</option>
                  </select>
                </div>
                <div>
                  <InputLabel>Mobile</InputLabel>
                  <input {...register('mobile')} type="text" placeholder="e.g. 1234567890" className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink" />
                </div>
                <div>
                  <InputLabel>Gender</InputLabel>
                  <select {...register('gender')} className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink">
                    <option value="">--</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <InputLabel required>Joining Date</InputLabel>
                  <input {...register('joinDate')} type="date" className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink" />
                  {errors.joinDate && <p className="text-brand text-xs mt-1">{errors.joinDate.message}</p>}
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <InputLabel>Date of Birth</InputLabel>
                  <input {...register('dateOfBirth')} type="date" className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink" />
                </div>
                <div>
                  <InputLabel>Reporting To</InputLabel>
                  <select {...register('reportingTo')} className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink">
                    <option value="">--</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <InputLabel>Language</InputLabel>
                  <select {...register('language')} className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink">
                    <option value="">--</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>
                <div>
                  <InputLabel>User Role</InputLabel>
                  <select {...register('role')} className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink">
                    <option value="Employee">Employee</option>
                    <option value="HR">HR</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Profile Picture Column */}
            <div className="lg:col-span-1">
              <InputLabel>Profile Picture</InputLabel>
              <div className="mt-1 border-2 border-dashed border-line rounded-xl h-48 flex flex-col items-center justify-center bg-surface/50 hover:bg-white transition-colors relative cursor-pointer overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                {previewImage ? (
                  <img src={previewImage} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <FiUploadCloud className="w-8 h-8 text-muted mb-2" />
                    <span className="text-xs text-muted font-medium">Choose a file</span>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Address & About */}
        <div className="space-y-6">
          <div>
            <InputLabel>Address</InputLabel>
            <textarea 
              {...register('address')} 
              rows="2" 
              placeholder="e.g. 132, My Street, Kingston, New York 12401"
              className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink resize-none"
            ></textarea>
          </div>
          <div>
            <InputLabel>About</InputLabel>
            <textarea 
              {...register('about')} 
              rows="3" 
              className="w-full px-3 py-2 bg-surface border border-line rounded-md text-sm text-ink text-ink resize-none"
            ></textarea>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-line border-line">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-medium text-muted text-muted hover:bg-white hover:bg-surface rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium bg-brand hover:bg-brand-hover text-white rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : 'Save Employee'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddEmployeeForm;
