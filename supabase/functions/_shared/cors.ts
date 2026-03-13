export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
        headers: corsHeaders, 
        status: 200 
    });
  }
  return null;
}

export function applyCorsHeaders(req: Request, responseHeaders: Headers = new Headers()) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
    });
    return responseHeaders;
}
