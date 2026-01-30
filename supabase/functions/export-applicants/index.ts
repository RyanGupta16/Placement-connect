// ============================================
// SUPABASE EDGE FUNCTION: EXPORT APPLICANTS TO EXCEL
// Admin-only feature to download applicant data
// ============================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  company_id?: string;
  job_role_id?: string;
}

interface ApplicantData {
  student_name: string;
  email: string;
  phone: string;
  branch: string;
  batch: number;
  cgpa: number;
  resume_url: string;
  application_status: string;
  applied_at: string;
  company_name: string;
  job_title: string;
  package: string;
  interview_date?: string;
  test_date?: string;
  remarks?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin privileges required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Admin user verified:', user.email, 'Role:', adminUser.role)

    // Parse request body
    const { company_id, job_role_id } = await req.json() as RequestBody

    if (!company_id && !job_role_id) {
      return new Response(
        JSON.stringify({ error: 'Either company_id or job_role_id must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build query based on filter
    let query = supabase
      .from('applications')
      .select(`
        id,
        status,
        applied_at,
        interview_date,
        test_date,
        remarks,
        user_profiles (
          name,
          email,
          phone,
          branch,
          batch,
          cgpa,
          resume_url
        ),
        job_roles (
          title,
          package_min,
          package_max,
          companies (
            name
          )
        )
      `)
      .order('applied_at', { ascending: false })

    // Apply filter
    if (job_role_id) {
      query = query.eq('job_id', job_role_id)
    } else if (company_id) {
      // Get all job roles for this company first
      const { data: jobRoles, error: jobError } = await supabase
        .from('job_roles')
        .select('id')
        .eq('company_id', company_id)
      
      if (jobError) throw jobError
      
      const jobIds = jobRoles?.map(j => j.id) || []
      if (jobIds.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No job roles found for this company' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      query = query.in('job_id', jobIds)
    }

    const { data: applications, error: queryError } = await query

    if (queryError) {
      console.error('Query error:', queryError)
      throw queryError
    }

    if (!applications || applications.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No applicants found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${applications.length} applicants`)

    // Transform data for Excel
    const excelData: ApplicantData[] = applications.map((app: any) => ({
      student_name: app.user_profiles?.name || 'N/A',
      email: app.user_profiles?.email || 'N/A',
      phone: app.user_profiles?.phone || 'N/A',
      branch: app.user_profiles?.branch || 'N/A',
      batch: app.user_profiles?.batch || 0,
      cgpa: app.user_profiles?.cgpa || 0,
      resume_url: app.user_profiles?.resume_url || 'N/A',
      application_status: app.status || 'pending',
      applied_at: new Date(app.applied_at).toLocaleDateString('en-US'),
      company_name: app.job_roles?.companies?.name || 'N/A',
      job_title: app.job_roles?.title || 'N/A',
      package: app.job_roles?.package_min && app.job_roles?.package_max
        ? `${app.job_roles.package_min} - ${app.job_roles.package_max} LPA`
        : 'N/A',
      interview_date: app.interview_date 
        ? new Date(app.interview_date).toLocaleDateString('en-US')
        : 'Not Scheduled',
      test_date: app.test_date
        ? new Date(app.test_date).toLocaleDateString('en-US')
        : 'Not Scheduled',
      remarks: app.remarks || ''
    }))

    // Create Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData, {
      header: [
        'student_name',
        'email', 
        'phone',
        'branch',
        'batch',
        'cgpa',
        'resume_url',
        'application_status',
        'applied_at',
        'company_name',
        'job_title',
        'package',
        'interview_date',
        'test_date',
        'remarks'
      ]
    })

    // Set column headers
    XLSX.utils.sheet_add_aoa(worksheet, [[
      'Student Name',
      'Email',
      'Phone',
      'Branch',
      'Batch',
      'CGPA',
      'Resume URL',
      'Status',
      'Applied Date',
      'Company',
      'Job Role',
      'Package',
      'Interview Date',
      'Test Date',
      'Remarks'
    ]], { origin: 'A1' })

    // Auto-size columns
    const maxWidth = 50
    const colWidths = [
      { wch: 20 }, // Student Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 25 }, // Branch
      { wch: 8 },  // Batch
      { wch: 8 },  // CGPA
      { wch: 40 }, // Resume URL
      { wch: 12 }, // Status
      { wch: 15 }, // Applied Date
      { wch: 20 }, // Company
      { wch: 25 }, // Job Role
      { wch: 15 }, // Package
      { wch: 15 }, // Interview Date
      { wch: 15 }, // Test Date
      { wch: 30 }  // Remarks
    ]
    worksheet['!cols'] = colWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applicants')

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    })

    // Generate filename
    const companyName = excelData[0]?.company_name.replace(/[^a-zA-Z0-9]/g, '_') || 'Company'
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${companyName}_Applicants_${timestamp}.xlsx`

    console.log(`Generated Excel file: ${filename}`)

    // Return Excel file
    return new Response(excelBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.byteLength.toString()
      }
    })

  } catch (error) {
    console.error('Error in export-applicants function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
