import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { handleCors, applyCorsHeaders } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate_limit.ts";

serve(async (req) => {
  // 1. Handle CORS Preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const responseHeaders = applyCorsHeaders(req);
  responseHeaders.set("Content-Type", "application/json");

  try {
    // 2. Global Rate Limiting
    const rateLimit = await checkRateLimit(req);
    if (!rateLimit.success) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { 
        status: 429, 
        headers: responseHeaders 
      });
    }

    // 3. Authenticate User securely
    const { user } = await requireAuth(req);
    const userId = user.id;

    // 4. Parse Request Payload
    const body = await req.json();
    const { clinicDetails, doctors, services } = body;

    if (!clinicDetails || !clinicDetails.name) {
      throw new Error("Invalid clinic details payload");
    }

    // 5. Initialize Service Role Client for elevated privileges
    // This bypasses RLS, ensuring we can securely manage roles and insertions
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 6. Transaction-like Operations using Service Role
    
    // a. Insert Clinic
    const { data: clinic, error: clinicError } = await serviceClient
      .from("clinics")
      .insert({
        owner_id: userId,
        name: clinicDetails.name,
        address: clinicDetails.address,
        city: clinicDetails.city,
        phone: clinicDetails.phone,
        description: clinicDetails.description,
        fees: clinicDetails.fees || 500,
        specializations: clinicDetails.specializations || [],
        images: clinicDetails.images || [],
        certificates: clinicDetails.certificates || [],
        registration_number: clinicDetails.registration_number,
        is_approved: false, // Default pending approval
      })
      .select("id")
      .single();

    if (clinicError) throw new Error(`Clinic creation failed: ${clinicError.message}`);

    const clinicId = clinic.id;

    // b. Insert Doctors
    if (doctors && doctors.length > 0) {
      const doctorInserts = doctors.map((doc: any) => ({
        clinic_id: clinicId,
        name: doc.name,
        specialization: doc.specialization,
        fee: doc.fee || clinicDetails.fees || 500,
      }));

      const { error: doctorError } = await serviceClient
        .from("doctors")
        .insert(doctorInserts);

      if (doctorError) console.error("Error creating doctors:", doctorError.message);
    }

    // c. Insert Services
    if (services && services.length > 0) {
      const serviceInserts = services.map((svc: any) => ({
        clinic_id: clinicId,
        service_name: svc.serviceName,
        fee: svc.fee,
      }));

      const { error: serviceError } = await serviceClient
        .from("clinic_services")
        .insert(serviceInserts);

      if (serviceError) console.error("Error creating services:", serviceError.message);
    }

    // d. Securely Assign Clinic Role in Profiles Table
    // We update the 'role' column on the profiles table securely.
    const { error: roleError } = await serviceClient
      .from("profiles")
      .update({ role: "clinic" })
      .eq("id", userId);

    if (roleError) {
      console.error("Error setting clinic role in profile:", roleError.message);
      throw new Error(`Role assignment failed: ${roleError.message}`);
    }

    // Return Success Response
    return new Response(JSON.stringify({ 
      success: true, 
      clinicId, 
      message: "Clinic registered successfully. Pending approval." 
    }), {
      status: 200,
      headers: responseHeaders,
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Register-Clinic Error:", errorMsg);
    
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 400,
      headers: responseHeaders,
    });
  }
});
