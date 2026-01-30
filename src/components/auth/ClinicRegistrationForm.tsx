import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, MapPin, Phone, Mail, Lock, User, IndianRupee, 
  Loader2, Stethoscope 
} from 'lucide-react';
import { z } from 'zod';

const clinicRegistrationSchema = z.object({
  ownerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email').max(255),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  clinicName: z.string().min(2, 'Clinic name must be at least 2 characters').max(200),
  address: z.string().min(5, 'Address must be at least 5 characters').max(500),
  city: z.string().min(2, 'City must be at least 2 characters').max(100),
  fees: z.number().min(0, 'Fees cannot be negative').max(100000),
  specializations: z.string().optional(),
  description: z.string().max(1000).optional(),
});

export type ClinicRegistrationData = {
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  clinicName: string;
  address: string;
  city: string;
  fees: number;
  specializations?: string;
  description?: string;
};

interface ClinicRegistrationFormProps {
  onSubmit: (data: ClinicRegistrationData) => Promise<void>;
  isLoading: boolean;
}

export function ClinicRegistrationForm({ onSubmit, isLoading }: ClinicRegistrationFormProps) {
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    clinicName: '',
    address: '',
    city: '',
    fees: '',
    specializations: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = clinicRegistrationSchema.parse({
        ...formData,
        fees: parseFloat(formData.fees) || 0,
      });
      await onSubmit(validated as ClinicRegistrationData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Owner Name */}
        <div>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="ownerName"
              placeholder="Your Name"
              value={formData.ownerName}
              onChange={handleChange}
              className="pl-11"
            />
          </div>
          {errors.ownerName && (
            <p className="text-sm text-destructive mt-1">{errors.ownerName}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="phone"
              placeholder="Your Phone"
              value={formData.phone}
              onChange={handleChange}
              className="pl-11"
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-destructive mt-1">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="email"
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="pl-11"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="pl-11"
          />
        </div>
        {errors.password && (
          <p className="text-sm text-destructive mt-1">{errors.password}</p>
        )}
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Clinic Details</h3>
      </div>

      {/* Clinic Name */}
      <div>
        <div className="relative">
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="clinicName"
            placeholder="Clinic Name"
            value={formData.clinicName}
            onChange={handleChange}
            className="pl-11"
          />
        </div>
        {errors.clinicName && (
          <p className="text-sm text-destructive mt-1">{errors.clinicName}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* City */}
        <div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className="pl-11"
            />
          </div>
          {errors.city && (
            <p className="text-sm text-destructive mt-1">{errors.city}</p>
          )}
        </div>

        {/* Fees */}
        <div>
          <div className="relative">
            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="fees"
              type="number"
              placeholder="Consultation Fee (₹)"
              value={formData.fees}
              onChange={handleChange}
              className="pl-11"
            />
          </div>
          {errors.fees && (
            <p className="text-sm text-destructive mt-1">{errors.fees}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div>
        <div className="relative">
          <MapPin className="absolute left-4 top-3 h-4 w-4 text-muted-foreground" />
          <Textarea
            name="address"
            placeholder="Full Address"
            value={formData.address}
            onChange={handleChange}
            className="pl-11 min-h-[80px]"
          />
        </div>
        {errors.address && (
          <p className="text-sm text-destructive mt-1">{errors.address}</p>
        )}
      </div>

      {/* Specializations */}
      <div>
        <div className="relative">
          <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="specializations"
            placeholder="Specializations (comma separated)"
            value={formData.specializations}
            onChange={handleChange}
            className="pl-11"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          e.g., General Medicine, Pediatrics, Dermatology
        </p>
      </div>

      {/* Description */}
      <div>
        <Textarea
          name="description"
          placeholder="Brief description about your clinic (optional)"
          value={formData.description}
          onChange={handleChange}
          className="min-h-[80px]"
        />
        {errors.description && (
          <p className="text-sm text-destructive mt-1">{errors.description}</p>
        )}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Register Clinic'
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your clinic will be reviewed and approved by our team within 24-48 hours.
      </p>
    </form>
  );
}
