import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xpkpjmnmxwaxopskwwzn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa3BqbW5teHdheG9wc2t3d3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzOTcyNDUsImV4cCI6MjA4MTk3MzI0NX0.O-bzDC6O14fPGoVQuj35lCMy8CRyXOwa4pnK72bM7sk'

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing!')
  throw new Error('Supabase URL or key is not configured')
}

console.log('Initializing Supabase client with URL:', supabaseUrl)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'placement-connect-auth'
  },
  global: {
    headers: {
      'X-Client-Info': 'placement-connect'
    }
  }
})

// Test connection on init
supabase.from('companies').select('count').limit(1).then(
  ({ data, error }) => {
    if (error) {
      console.error('Supabase connection test failed:', error)
    } else {
      console.log('Supabase connected successfully')
    }
  }
)

export default supabase
