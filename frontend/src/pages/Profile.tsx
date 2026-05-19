import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext.tsx';
import { getCurrentUser, updateProfile } from '../services/authService.ts';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/button.tsx';
import { Input } from '../components/ui/input.tsx';
import { Label } from '../components/ui/label.tsx';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Save,
  Edit3,
  X,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  createdAt: string;
  isActive?: boolean;
  store?: string;
}

const Profile: React.FC = () => {
  const { } = useDarkMode();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser as UserProfile);
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: (currentUser as any).phone || '',
        address: (currentUser as any).address || ''
      });

      // Load saved profile image from localStorage
      const savedImage = localStorage.getItem(`profileImage_${currentUser.id}`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } else {
      navigate('/login');
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone number is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Try to update via API first
      try {
        const updatedUser = await updateProfile(formData);
        setUser(updatedUser as unknown as UserProfile);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      } catch (apiError) {
        console.warn('API update failed, updating locally:', apiError);
        // Fallback: Update locally if API fails
        const updatedUser: UserProfile = {
          id: user?.id || '',
          name: formData.name,
          email: formData.email,
          role: user?.role || '',
          createdAt: user?.createdAt || new Date().toISOString(),
          phone: formData.phone,
          address: formData.address,
          isActive: user?.isActive,
          store: user?.store
        };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }

      setIsEditing(false);
      setErrors({});

      // Save profile image to localStorage
      if (profileImage && user) {
        localStorage.setItem(`profileImage_${user.id}`, profileImage);
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('profileImageUpdated'));
      }

      // Show success message
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ general: 'Failed to update profile. Please try again.' });
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Check if there are any changes
    const hasChanges = user && (
      formData.name !== (user.name || '') ||
      formData.email !== (user.email || '') ||
      formData.phone !== (user.phone || '') ||
      formData.address !== (user.address || '')
    );

    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }

    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, or GIF)');
      return;
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setImageFile(file);
    setUploadingImage(true);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string);
      setUploadingImage(false);
      toast.success('Image selected successfully!');

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('profileImageUpdated'));
    };
    reader.onerror = () => {
      setUploadingImage(false);
      toast.error('Failed to load image');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImageFile(null);

    // Remove from localStorage
    if (user) {
      localStorage.removeItem(`profileImage_${user.id}`);
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('profileImageUpdated'));
    }

    // Reset the file input
    const fileInput = document.getElementById('profile-image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    toast.success('Image removed');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load your profile information.</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header - Sticky and Compact */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm dark:shadow-slate-900/20 mb-8">
        <div className="page-container max-w-4xl py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">My Profile</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage account information</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 rounded-lg">
                  <Edit3 className="w-4 h-4" />
                  <span className="text-sm font-medium">Editing</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="page-container max-w-4xl mb-6 sm:mb-8">

        {/* Error Message */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-red-700">{errors.general}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-slate-800">
              <div className="bg-blue-600 dark:bg-blue-700 p-8 text-center">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                <h2 className={`text-xl font-bold text-white`}>
                  {user.name}
                </h2>
                <p className="text-blue-100 mt-1">{user.email}</p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">
                        Role
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {user.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">
                        Member Since
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">
                        Status
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {user.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-slate-800">
              <div className="bg-slate-700 dark:bg-slate-800 px-8 py-6">
                <h3 className="text-xl font-bold text-white">
                  {isEditing ? 'Edit Profile Information' : 'Profile Information'}
                </h3>
                <p className="text-gray-200 mt-1">
                  {isEditing ? 'Update your personal details below' : 'View your account details'}
                </p>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    {isEditing ? (
                      <div>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={`mt-2 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white ${errors.name ? 'border-red-300 dark:border-red-600' : ''}`}
                          placeholder="Enter your full name"
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-lg text-slate-800 dark:text-white">
                        {user.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    {isEditing ? (
                      <div>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`mt-2 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white ${errors.email ? 'border-red-300 dark:border-red-600' : ''}`}
                          placeholder="Enter your email address"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-lg text-slate-800 dark:text-white">
                        {user.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    {isEditing ? (
                      <div>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`mt-2 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white ${errors.phone ? 'border-red-300 dark:border-red-600' : ''}`}
                          placeholder="Enter your phone number"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-lg text-slate-800 dark:text-white">
                        {user.phone || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* Address Field */}
                  <div>
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </Label>
                    {isEditing ? (
                      <div>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="mt-2 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                          placeholder="Enter your address"
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-lg text-slate-800 dark:text-white">
                        {user.address || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* Profile Picture Field */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Profile Picture
                    </Label>
                    {isEditing ? (
                      <div className="mt-2">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {profileImage ? (
                              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
                                <img
                                  src={profileImage}
                                  alt="Profile preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                {uploadingImage ? (
                                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                                ) : (
                                  <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex gap-2 mb-2">
                              <input
                                id="profile-image-upload"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('profile-image-upload')?.click()}
                                disabled={uploadingImage}
                              >
                                {uploadingImage ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    Uploading...
                                  </>
                                ) : (
                                  'Upload Photo'
                                )}
                              </Button>
                              {profileImage && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleRemoveImage}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">JPG, PNG, GIF up to 2MB</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-4">
                        {profileImage ? (
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
                            <img
                              src={profileImage}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <p className="text-sm text-gray-500">
                          {profileImage ? 'Custom avatar' : 'Default avatar'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
