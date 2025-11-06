// Admin Login Debug Script
// Run this in your browser console on http://localhost:3000

async function adminLoginDebug() {
    try {
        console.log('🔐 Starting admin login debug...');
        
        // Step 1: Login with correct credentials
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@aura.ca',
                password: 'Admin@123'
            }),
        });
        
        const loginData = await loginResponse.json();
        console.log('📡 Login response:', loginData);
        
        if (loginData.success && loginData.data) {
            const { user, tokens } = loginData.data;
            
            // Step 2: Store in localStorage
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('access_token', tokens.accessToken);
            localStorage.setItem('tcf_tef_admin_session', JSON.stringify({
                user: user,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresAt: Date.now() + (15 * 60 * 1000),
                lastActivity: Date.now()
            }));
            
            // Step 3: Set cookies that middleware expects
            const maxAge = 60 * 60 * 24 * 7; // 7 days
            document.cookie = `auth=1; path=/; max-age=${maxAge}; SameSite=Lax`;
            document.cookie = `role=${user.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
            document.cookie = `user_id=${user.id}; path=/; max-age=${maxAge}; SameSite=Lax`;
            
            console.log('✅ Admin session set successfully!');
            console.log('🍪 Cookies set:', document.cookie);
            console.log('💾 localStorage keys:', Object.keys(localStorage));
            
            // Step 4: Test the verify endpoint
            const verifyResponse = await fetch('http://localhost:3001/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${tokens.accessToken}`
                }
            });
            
            const verifyData = await verifyResponse.json();
            console.log('🔍 Verify response:', verifyData);
            
            if (verifyData.success) {
                console.log('✅ Authentication is working! You should now be able to access /admin');
                console.log('🔄 Try refreshing the page or navigating to /admin');
            } else {
                console.error('❌ Token verification failed');
            }
            
        } else {
            console.error('❌ Login failed:', loginData.message);
        }
        
    } catch (error) {
        console.error('❌ Error during admin login:', error);
    }
}

// Run the debug function
adminLoginDebug();
