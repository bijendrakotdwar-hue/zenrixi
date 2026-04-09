export default async function handler(req, res) {
  return res.status(200).json({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "EXISTS (" + process.env.OPENAI_API_KEY.substring(0,10) + "...)" : "MISSING",
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? "EXISTS" : "MISSING",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "EXISTS" : "MISSING",
  });
}
