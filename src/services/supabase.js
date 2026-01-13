import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xpkpjmnmxwaxopskwwzn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa3BqbW5teHdheG9wc2t3d3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzOTcyNDUsImV4cCI6MjA4MTk3MzI0NX0.O-bzDC6O14fPGoVQuj35lCMy8CRyXOwa4pnK72bM7sk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
