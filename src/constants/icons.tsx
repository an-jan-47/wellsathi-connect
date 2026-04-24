import {
  Stethoscope,
  Baby,
  HeartPulse,
  Activity,
  Bone,
  Ear,
  Eye,
  Microscope,
  Brain,
  Smile,
  ActivitySquare,
  PersonStanding,
  Leaf,
  Flower2,
  Syringe,
  TestTube,
  Scan,
  Cross,
  Users
} from 'lucide-react';
import React from 'react';

export const SPECIALTY_ICONS: Record<string, React.ElementType> = {
  'General Medicine': Stethoscope,
  'Pediatrics': Baby,
  'Cardiology': HeartPulse,
  'Dermatology': Activity,
  'Orthopedics': Bone,
  'ENT': Ear,
  'Ophthalmology': Eye,
  'Gynecology': Users,
  'Neurology': Brain,
  'Psychiatry': Brain,
  'Dentistry': Smile,
  'Urology': ActivitySquare,
  'Physiotherapy': PersonStanding,
  'Homeopathy': Flower2,
  'Ayurveda': Leaf,
  'General Surgery': Syringe,
  'Radiology': Scan,
  'Pathology': Microscope,
  'Anesthesiology': TestTube,
  'Oncology': Cross,
};

export function getSpecialtyIcon(specialty: string): React.ElementType {
  return SPECIALTY_ICONS[specialty] || Stethoscope;
}
