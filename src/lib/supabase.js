import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://nurlnqzmiyryfviuujsq.supabase.co'
const SUPABASE_KEY = 'sb_publishable_WTdQ9aVR43R1weeWFHgTBQ_CdUkjR09'
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
export { SUPABASE_URL, SUPABASE_KEY }
