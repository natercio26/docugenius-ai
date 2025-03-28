
  const createAdminUser = async (): Promise<void> => {
    if (useMockAuth) {
      console.log('Mock admin user created successfully');
      return;
    }

    const adminUsername = 'adminlicencedocumentum';
    const adminEmail = `${adminUsername}@documentum.com`;
    const adminPassword = 'adminlicence';
    
    try {
      // Check if admin user already exists
      const { data: existingUsers, error: searchError } = await supabase
        .from('auth.users')
        .select('*')
        .eq('email', adminEmail)
        .single();
      
      if (searchError && searchError.code !== 'PGRST116') {
        console.error('Error checking for existing admin:', searchError);
      }
      
      if (existingUsers) {
        console.log('Admin user already exists');
        return;
      }
      
      // Create the admin user
      const { data, error } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            isAdmin: true,
            name: 'Admin Documentum',
            username: adminUsername
          }
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('Admin user created successfully');
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
  };
