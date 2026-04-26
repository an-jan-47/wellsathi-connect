import { z } from 'zod';

import { validatePhoneNumber } from '@/components/ui/phone-input';
import { validatePasswordStrength, getPasswordErrorMessage } from '@/components/ui/password-input';

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

// Step 1: User Account
export const userAccountSchema = z.object({
  ownerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().min(1, 'Please enter your email address').regex(emailRegex, 'Please enter a valid email address').max(255),
  phone: z.string().min(1, 'Phone is required').refine(validatePhoneNumber, 'Invalid phone number for selected country'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72).refine(validatePasswordStrength, getPasswordErrorMessage()),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Step 2: Clinic Details
export const clinicDetailsSchema = z.object({
  clinicName: z.string().min(2, 'Clinic name is required').max(100),
  city: z.string().min(2, 'City is required').max(50),
  address: z.string().min(5, 'Address is required').max(255),
  description: z.string().max(500).optional(),
  clinicImages: z.array(z.string()).default([]),
});

// Step 3: Doctors and Services
export const doctorSchema = z.object({
  name: z.string().min(2, 'Doctor name is required').max(100),
  specialization: z.string().min(2, 'Specialization is required'),
  fee: z.number().min(0, 'Fee must be positive').default(0),
});

export const serviceSchema = z.object({
  serviceName: z.string().min(2, 'Service name is required').max(100),
  fee: z.number().min(0, 'Fee must be positive'),
});

export const doctorsServicesSchema = z.object({
  doctors: z.array(doctorSchema).min(1, 'Add at least one doctor'),
  services: z.array(serviceSchema).default([]),
  defaultFee: z.number().min(0, 'Default fee must be positive'),
});

// Step 4: Certificates
export const certificatesSchema = z.object({
  registrationNumber: z.string().min(5, 'Registration number is required').max(50),
  certificates: z.array(z.string()).min(1, 'Upload at least one certificate'),
});

// Combined form data
export interface ClinicRegistrationData {
  // Step 1
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  
  // Step 2
  clinicName: string;
  city: string;
  address: string;
  description?: string;
  clinicImages: string[];
  
  // Step 3
  doctors: Doctor[];
  services: Service[];
  defaultFee: number;
  
  // Step 4
  registrationNumber: string;
  certificates: string[];
}

export interface Doctor {
  name: string;
  specialization: string;
  fee: number;
}

export interface Service {
  serviceName: string;
  fee: number;
}

export type UserAccountData = z.infer<typeof userAccountSchema>;
export type ClinicDetailsData = z.infer<typeof clinicDetailsSchema>;
export type DoctorsServicesData = z.infer<typeof doctorsServicesSchema>;
export type CertificatesData = z.infer<typeof certificatesSchema>;

// Specialization options (sorted alphabetically)
export const SPECIALIZATIONS = [
  'Ayurveda',
  'Cardiology',
  'Dentistry',
  'Dermatology',
  'Endocrinology',
  'ENT',
  'Gastroenterology',
  'General Medicine',
  'General Surgery',
  'Gynecology',
  'Homeopathy',
  'Nephrology',
  'Neurology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Physiotherapy',
  'Psychiatry',
  'Pulmonology',
] as const;

// Service options (sorted alphabetically)
export const SERVICES = [
  'Allergy Testing',
  'Blood Test',
  'CT Scan',
  'Dental Cleaning',
  'Diabetes Management',
  'ECG',
  'Eye Examination',
  'General Consultation',
  'Health Checkup',
  'Hypertension Management',
  'MRI',
  'Minor Surgery',
  'Physiotherapy Session',
  'Postnatal Care',
  'Prenatal Care',
  'Root Canal',
  'Skin Treatment',
  'Ultrasound',
  'Vaccination',
  'X-Ray',
] as const;
