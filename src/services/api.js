import { supabase } from './supabase';

// Authentication management
export const auth = {
  getToken: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  },
  
  setToken: (token) => {
    // Supabase manages tokens automatically
    localStorage.setItem('token', token);
  },
  
  removeToken: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
  },
  
  isAuthenticated: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },
  
  getUser: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    
    // Check if user has profile data
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    return {
      id: session.user.id,
      email: session.user.email,
      role: profile?.role || session.user.user_metadata?.role || 'student',
      name: profile?.name || session.user.user_metadata?.name || session.user.email.split('@')[0],
      ...profile
    };
  }
};

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    const token = data.session.access_token;
    auth.setToken(token);
    
    return {
      token,
      user: data.user
    };
  },
  
  register: async (userData) => {
    const { email, password, name, ...rest } = userData;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'student',
          ...rest
        }
      }
    });
    
    if (error) throw error;
    
    // Create profile
    if (data.user) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        email,
        name,
        role: 'student',
        ...rest
      });
    }
    
    const token = data.session?.access_token;
    if (token) auth.setToken(token);
    
    return {
      token,
      user: data.user
    };
  },
  
  logout: async () => {
    await auth.removeToken();
  }
};

// Companies API
export const companiesAPI = {
  getAll: async (filters = {}) => {
    let query = supabase.from('companies').select('*');
    
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    if (filters.industry) {
      query = query.eq('industry', filters.industry);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  
  getById: async (id) => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getJobRoles: async (companyId) => {
    const { data, error} = await supabase
      .from('job_roles')
      .select('*')
      .eq('company_id', companyId);
    
    if (error) throw error;
    return data || [];
  }
};

// Jobs API
export const jobsAPI = {
  getAll: async (filters = {}) => {
    let query = supabase
      .from('job_roles')
      .select('*, companies(name, location)');
    
    if (filters.company) {
      query = query.eq('company_id', filters.company);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Flatten the company data
    return (data || []).map(job => ({
      ...job,
      company_name: job.companies?.name,
      company_location: job.companies?.location
    }));
  },
  
  getById: async (id) => {
    const { data, error } = await supabase
      .from('job_roles')
      .select('*, companies(*)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return {
      ...data,
      company_name: data.companies?.name
    };
  },
  
  apply: async (jobId, applicationData) => {
    const user = await auth.getUser();
    
    if (!user || !user.id) {
      throw new Error('User not authenticated. Please login again.');
    }
    
    const { data, error } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        student_id: user.id,
        status: 'pending',
        ...applicationData
      })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, application: data };
  }
};

// Applications API
export const applicationsAPI = {
  getMyApplications: async () => {
    const user = await auth.getUser();
    
    if (!user || !user.id) {
      throw new Error('User not authenticated. Please login again.');
    }
    
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job_roles(title, salary, location),
        companies(name)
      `)
      .eq('student_id', user.id)
      .order('applied_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(app => ({
      ...app,
      role_title: app.job_roles?.title,
      company_name: app.companies?.name
    }));
  },
  
  getById: async (id) => {
    const { data, error } = await supabase
      .from('applications')
      .select('*, job_roles(*), companies(*)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  withdraw: async (id) => {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  }
};

// Resume API
export const resumeAPI = {
  analyze: async (file) => {
    const user = await auth.getUser();
    
    if (!user || !user.id) {
      throw new Error('User not authenticated. Please login again.');
    }
    
    const token = await auth.getToken();
    
    const formData = new FormData();
    formData.append('resume', file);
    
    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-resume', {
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (error) throw error;
    
    // Store resume analysis
    if (data) {
      await supabase.from('resume_analyses').insert({
        user_id: user.id,
        score: data.score,
        feedback: data,
        created_at: new Date().toISOString()
      });
    }
    
    return data;
  },
  
  getScore: async (resumeId) => {
    const { data, error } = await supabase
      .from('resume_analyses')
      .select('score')
      .eq('id', resumeId)
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Company Prep API
export const prepAPI = {
  getCompanyInfo: async (companyId) => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    
    if (error) throw error;
    
    // Add additional prep data
    return {
      ...data,
      culture: data.culture || 'Information will be available soon',
      interview_process: data.interview_process || 'Standard interview process',
      tips: data.interview_tips || []
    };
  },
  
  getInterviewQuestions: async (companyId, role) => {
    const { data, error } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('company_id', companyId);
    
    if (error) throw error;
    return data || [];
  },
  
  getCodingPatterns: async (companyId) => {
    const { data, error } = await supabase
      .from('coding_patterns')
      .select('*')
      .eq('company_id', companyId);
    
    if (error) throw error;
    return data || [];
  }
};

// Admin API
export const adminAPI = {
  // Dashboard Stats
  getStats: async () => {
    const { count: companiesCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });
    
    const { count: applicationsCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true });
    
    const { count: pendingCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    const { count: studentsCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    return {
      totalCompanies: companiesCount || 0,
      totalApplications: applicationsCount || 0,
      pendingApplications: pendingCount || 0,
      totalStudents: studentsCount || 0
    };
  },
  
  getRecentApplications: async (limit = 10) => {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job_roles(title),
        companies(name),
        user_profiles(name, email)
      `)
      .order('applied_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return (data || []).map(app => ({
      ...app,
      student_name: app.user_profiles?.name,
      email: app.user_profiles?.email,
      role_title: app.job_roles?.title,
      company_name: app.companies?.name
    }));
  },
  
  // Company Management
  getCompanies: async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },
  
  getCompanyById: async (id) => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  createCompany: async (companyData) => {
    const { data, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  updateCompany: async (id, companyData) => {
    const { data, error } = await supabase
      .from('companies')
      .update(companyData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  deleteCompany: async (id) => {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  },

  // Job Roles Management
  getJobRolesByCompany: async (companyId) => {
    const { data, error } = await supabase
      .from('job_roles')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  createJobRole: async (roleData) => {
    const { data, error } = await supabase
      .from('job_roles')
      .insert(roleData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateJobRole: async (id, roleData) => {
    const { data, error } = await supabase
      .from('job_roles')
      .update(roleData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  deleteJobRole: async (id) => {
    const { error } = await supabase
      .from('job_roles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  },
  
  // Applicants Management
  getApplicants: async (filters = {}) => {
    let query = supabase
      .from('applications')
      .select(`
        *,
        job_roles(title, company_id),
        companies(name),
        user_profiles(name, email)
      `);
    
    if (filters.company) {
      query = query.eq('job_roles.company_id', filters.company);
    }
    if (filters.role) {
      query = query.eq('job_id', filters.role);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query.order('applied_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(app => ({
      ...app,
      student_name: app.user_profiles?.name,
      email: app.user_profiles?.email,
      role_title: app.job_roles?.title,
      company_name: app.companies?.name
    }));
  },
  
  getRolesByCompany: async (companyId) => {
    const { data, error } = await supabase
      .from('job_roles')
      .select('*')
      .eq('company_id', companyId);
    
    if (error) throw error;
    return data || [];
  },
  
  updateApplicationStatus: async (applicationId, status) => {
    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, application: data };
  },
  
  getApplicantDetails: async (applicationId) => {
    const { data, error } = await supabase
      .from('applications')
      .select('*, job_roles(*), companies(*), user_profiles(*)')
      .eq('id', applicationId)
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Admin Authentication API
export const adminAuthAPI = {
  // Admin login - checks admin_users table after auth
  login: async (email, password) => {
    // Step 1: Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError) {
      console.error('Admin auth error:', authError);
      throw authError;
    }
    
    console.log('Auth successful, checking admin_users table for user:', authData.user.id);
    
    // Step 2: Verify user is in admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', authData.user.id)
      .eq('is_active', true)
      .single();
    
    console.log('Admin check result:', { adminData, adminError });
    
    if (adminError || !adminData) {
      // User authenticated but not an admin - sign them out
      await supabase.auth.signOut();
      throw new Error('Access denied. Admin credentials required. User ID: ' + authData.user.id + ' not found in admin_users table.');
    }
    
    // Step 3: Update last login timestamp
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id);
    
    const token = authData.session.access_token;
    auth.setToken(token);
    
    // Store admin info in localStorage
    localStorage.setItem('adminUser', JSON.stringify({
      id: adminData.id,
      email: adminData.email,
      fullName: adminData.full_name,
      role: adminData.role
    }));
    
    return {
      token,
      user: authData.user,
      admin: adminData
    };
  },
  
  // Check if current user is admin
  isAdmin: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', session.user.id)
      .eq('is_active', true)
      .single();
    
    return !error && !!data;
  },
  
  // Get admin user info
  getAdminUser: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', session.user.id)
      .eq('is_active', true)
      .single();
    
    if (error) return null;
    return data;
  },
  
  // Admin logout
  logout: async () => {
    localStorage.removeItem('adminUser');
    await auth.removeToken();
  }
};
