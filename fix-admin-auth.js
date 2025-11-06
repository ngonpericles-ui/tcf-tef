// Simple script to fix admin authentication
const jwt = require('jsonwebtoken');

// Create a valid admin token
const adminToken = jwt.sign(
  { 
    id: 'cmh16ikce00009jys8xnr3y37',
    userId: 'cmh16ikce00009jys8xnr3y37', 
    email: 'mfondomerlin@gmail.com', 
    role: 'ADMIN',
    subscriptionTier: 'PREMIUM',
    type: 'access'
  },
  'your-super-secret-jwt-key-change-in-production',
  { 
    expiresIn: '24h',
    issuer: 'tcf-tef-api',
    audience: 'tcf-tef-app'
  }
);

console.log('🔑 Admin Token:', adminToken);

// Store in localStorage for the frontend
if (typeof window !== 'undefined') {
  localStorage.setItem('access_token', adminToken);
  localStorage.setItem('tcf_tef_admin_session', JSON.stringify({
    accessToken: adminToken,
    user: {
      id: 'cmh16ikce00009jys8xnr3y37',
      email: 'mfondomerlin@gmail.com',
      role: 'ADMIN'
    }
  }));
  console.log('✅ Token stored in localStorage');
} else {
  console.log('⚠️ Run this in browser console to store token');
}
