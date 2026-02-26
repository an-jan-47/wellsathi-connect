/**
 * Consolidated application constants.
 * Single source of truth for specializations, services, and other shared values.
 */

export const SPECIALIZATIONS = [
  'General Medicine',
  'Pediatrics',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'ENT',
  'Ophthalmology',
  'Gynecology',
  'Neurology',
  'Psychiatry',
  'Dentistry',
  'Urology',
  'Physiotherapy',
  'Homeopathy',
  'Ayurveda',
  'General Surgery',
  'Radiology',
  'Pathology',
  'Anesthesiology',
  'Oncology',
] as const;

export const SERVICE_OPTIONS = [
  'General Consultation',
  'Follow-up Visit',
  'Health Checkup',
  'Vaccination',
  'Lab Tests',
  'X-Ray',
  'ECG',
  'Ultrasound',
  'Dental Cleaning',
  'Root Canal',
  'Eye Examination',
  'Blood Test',
  'Physiotherapy Session',
  'Surgery Consultation',
  'Pediatric Checkup',
] as const;

export type SortOption = 'rating' | 'fees_low' | 'fees_high' | 'name';

export const SORT_OPTIONS = [
  { value: 'rating' as const, label: 'Highest Rating' },
  { value: 'fees_low' as const, label: 'Lowest Fees' },
  { value: 'fees_high' as const, label: 'Highest Fees' },
  { value: 'name' as const, label: 'Name (A-Z)' },
] as const;
