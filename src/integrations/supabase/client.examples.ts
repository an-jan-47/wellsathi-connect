/**
 * Examples of using the secure Supabase client wrapper
 * 
 * This file demonstrates proper usage patterns for the Supabase client
 * with HTTPS enforcement and error handling.
 */

import { supabase, handleSupabaseError } from './client';

/**
 * Example 1: Basic query with error handling
 */
export async function fetchClinicsExample() {
  try {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('is_approved', true);

    if (error) {
      // This will transform SSL/connection errors into user-friendly messages
      handleSupabaseError(error);
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch clinics:', error);
    throw error;
  }
}

/**
 * Example 2: Insert with error handling
 */
export async function createAppointmentExample(appointmentData: any) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error);
    }

    return data;
  } catch (error) {
    console.error('Failed to create appointment:', error);
    throw error;
  }
}

/**
 * Example 3: Update with error handling
 */
export async function updateClinicExample(clinicId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', clinicId)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error);
    }

    return data;
  } catch (error) {
    console.error('Failed to update clinic:', error);
    throw error;
  }
}

/**
 * Example 4: Authentication with error handling
 */
export async function signInExample(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      handleSupabaseError(error);
    }

    return data;
  } catch (error) {
    console.error('Failed to sign in:', error);
    throw error;
  }
}

/**
 * Example 5: Real-time subscription with error handling
 */
export function subscribeToAppointmentsExample(userId: string, callback: (payload: any) => void) {
  const channel = supabase
    .channel('appointments-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe((status, error) => {
      if (error) {
        console.error('Subscription error:', error);
        try {
          handleSupabaseError(error);
        } catch (e) {
          console.error('Failed to handle subscription error:', e);
        }
      }
    });

  return channel;
}

/**
 * Example 6: File upload with error handling
 */
export async function uploadFileExample(bucket: string, path: string, file: File) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      handleSupabaseError(error);
    }

    return data;
  } catch (error) {
    console.error('Failed to upload file:', error);
    throw error;
  }
}

/**
 * Example 7: Transaction-like operation with error handling
 */
export async function createClinicWithDoctorsExample(clinicData: any, doctorsData: any[]) {
  try {
    // Insert clinic
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .insert(clinicData)
      .select()
      .single();

    if (clinicError) {
      handleSupabaseError(clinicError);
    }

    // Insert doctors
    const doctorsWithClinicId = doctorsData.map(doctor => ({
      ...doctor,
      clinic_id: clinic.id,
    }));

    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .insert(doctorsWithClinicId)
      .select();

    if (doctorsError) {
      // In a real transaction, you'd want to rollback the clinic insert
      // Supabase doesn't support transactions in the client, so you'd need to handle this
      // with database functions or by manually cleaning up
      handleSupabaseError(doctorsError);
    }

    return { clinic, doctors };
  } catch (error) {
    console.error('Failed to create clinic with doctors:', error);
    throw error;
  }
}
