// Railway Deployment Test Helper
// Run this in your browser console (F12 → Console) on your Railway frontend

console.log('%c🔍 Railway Deployment Diagnostic Test', 'font-size: 20px; color: #4CAF50; font-weight: bold');
console.log('='.repeat(50));

// 1. Check current environment
console.log('\n📍 Environment Check:');
console.log('Current URL:', window.location.href);
console.log('Hostname:', window.location.hostname);
console.log('Protocol:', window.location.protocol);

// 2. Check API URL configuration
console.log('\n🚀 API Configuration:');
const viteApiUrl = import.meta.env.VITE_API_URL;
console.log('VITE_API_URL:', viteApiUrl || 'NOT SET ❌');

// 3. Test backend health
console.log('\n🏥 Testing Backend Health...');
const apiUrl = viteApiUrl || (window.location.origin + '/api');
console.log('Testing URL:', apiUrl + '/health');

fetch(apiUrl + '/health')
    .then(res => res.json())
    .then(data => {
        console.log('✅ Backend is HEALTHY:', data);
    })
    .catch(err => {
        console.error('❌ Backend Health Check FAILED:', err.message);
        console.log('\n🔧 Possible Fixes:');
        console.log('1. Check if VITE_API_URL environment variable is set in Railway');
        console.log('2. Make sure backend service is running');
        console.log('3. Verify backend URL is correct');
    });

// 4. Test if we can reach the campaigns endpoint
console.log('\n📋 Testing Campaigns Endpoint...');
fetch(apiUrl + '/campaigns', {
    headers: {
        'Authorization': 'Bearer ' + (localStorage.getItem('access_token') || 'none')
    }
})
    .then(res => {
        if (res.status === 401) {
            console.log('⚠️ Not authenticated (401) - This is normal if not logged in');
        } else if (res.ok) {
            console.log('✅ Campaigns endpoint reachable');
            return res.json();
        } else {
            console.error('❌ Campaigns endpoint error:', res.status, res.statusText);
        }
    })
    .catch(err => {
        console.error('❌ Cannot reach campaigns endpoint:', err.message);
    });

console.log('\n' + '='.repeat(50));
console.log('%c📊 Test Complete! Check results above.', 'font-size: 16px; color: #2196F3; font-weight: bold');
console.log('\nShare these results with your developer for debugging.');
