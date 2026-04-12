import { useState, useEffect } from 'react';
import { User, Phone, Users, MapPinIcon, Save, Loader2 } from 'lucide-react';
import { useUpdateProfile } from '@/hooks/queries/useProfile';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface ProfileFormProps {
  onSuccess?: () => void;
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const { user, profile } = useAuthStore();
  const updateProfileMutation = useUpdateProfile();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    gender: '' as 'male' | 'female' | 'other' | 'prefer_not_to_say' | '',
    age: '',
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    }
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        age: profile.age?.toString() || '',
        address: {
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          postal_code: profile.address?.postal_code || '',
          country: profile.address?.country || ''
        }
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !user) {
      toast.error('Name is required');
      return;
    }

    const updateData: any = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
    };

    // Add gender if provided
    if (form.gender) {
      updateData.gender = form.gender;
    }

    // Add age if provided and valid
    if (form.age.trim()) {
      const ageNum = parseInt(form.age.trim());
      if (!isNaN(ageNum) && ageNum >= 0 && ageNum <= 150) {
        updateData.age = ageNum;
      } else {
        toast.error('Age must be between 0 and 150');
        return;
      }
    }

    // Add address if any field is provided
    const hasAddressData = Object.values(form.address).some(val => val.trim());
    if (hasAddressData) {
      updateData.address = Object.fromEntries(
        Object.entries(form.address)
          .filter(([_, value]) => value.trim())
          .map(([key, value]) => [key, value.trim()])
      );
    }

    try {
      await updateProfileMutation.mutateAsync({
        userId: user.id,
        data: updateData,
      });
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value as any })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
              >
                <option value="">Select gender (optional)</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <input
              type="number"
              min="0"
              max="150"
              value={form.age}
              onChange={e => setForm({ ...form, age: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter your age (optional)"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={form.address.street}
                onChange={e => setForm({
                  ...form,
                  address: { ...form.address, street: e.target.value }
                })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter street address (optional)"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={form.address.city}
                onChange={e => setForm({
                  ...form,
                  address: { ...form.address, city: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter city (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={form.address.state}
                onChange={e => setForm({
                  ...form,
                  address: { ...form.address, state: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter state (optional)"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code
              </label>
              <input
                type="text"
                value={form.address.postal_code}
                onChange={e => setForm({
                  ...form,
                  address: { ...form.address, postal_code: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter postal code (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={form.address.country}
                onChange={e => setForm({
                  ...form,
                  address: { ...form.address, country: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter country (optional)"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={updateProfileMutation.isPending}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {updateProfileMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save Profile
      </button>
    </form>
  );
}