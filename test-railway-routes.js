/**
 * Railway Route Testing Script
 * 
 * Run this in your browser console (F12 → Console) when on your Railway frontend
 * to diagnose route problems.
 * 
 * Usage:
 * 1. Open your Railway frontend URL
 * 2. Press F12 to open DevTools
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter
 * 6. Review the test results
 */

(async function testRailwayRoutes() {
    console.clear();
    console.log('%c🔍 Railway Route Diagnostic Test', 'font-size: 24px; color: #4CAF50; font-weight: bold; padding: 10px;');
    console.log('='.repeat(80));

    const results = {
        passed: [],
        failed: [],
        warnings: []
    };

    // Helper function to test a route
    async function testRoute(name, url, options = {}) {
        console.log(`\n🧪 Testing: ${name}`);
        console.log(`   URL: ${url}`);

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (response.ok) {
                console.log(`   ✅ PASS (${response.status})`);
                console.log(`   Response:`, data);
                results.passed.push({ name, url, status: response.status, data });
                return { success: true, data, status: response.status };
            } else {
                console.log(`   ⚠️  FAIL (${response.status})`);
                console.log(`   Response:`, data);
                results.failed.push({ name, url, status: response.status, data });
                return { success: false, data, status: response.status };
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            results.failed.push({ name, url, error: error.message });
            return { success: false, error: error.message };
        }
    }

    // 1. Environment Check
    console.log('\n' + '='.repeat(80));
    console.log('%c📍 STEP 1: Environment Check', 'font-size: 18px; color: #2196F3; font-weight: bold;');
    console.log('='.repeat(80));

    const currentUrl = window.location.href;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    console.log('Current URL:', currentUrl);
    console.log('Hostname:', hostname);
    console.log('Protocol:', protocol);

    // Check if VITE_API_URL is set
    let apiUrl;
    try {
        apiUrl = import.meta.env.VITE_API_URL;
        console.log('VITE_API_URL:', apiUrl || '❌ NOT SET');

        if (!apiUrl) {
            results.warnings.push('VITE_API_URL environment variable is not set');
            console.warn('⚠️  WARNING: VITE_API_URL is not set. Using fallback.');
            apiUrl = window.location.origin + '/api';
        }
    } catch (e) {
        console.warn('⚠️  Cannot access import.meta.env (might be in production build)');
        apiUrl = window.location.origin + '/api';
    }

    console.log('Using API URL:', apiUrl);

    // Validate API URL format
    if (!apiUrl.startsWith('http')) {
        console.error('❌ API URL must start with http:// or https://');
        results.failed.push({ name: 'API URL Validation', error: 'Invalid protocol' });
    }

    if (!apiUrl.endsWith('/api')) {
        console.warn('⚠️  API URL should end with /api');
        results.warnings.push('API URL does not end with /api');
    }

    // 2. Backend Health Check
    console.log('\n' + '='.repeat(80));
    console.log('%c🏥 STEP 2: Backend Health Check', 'font-size: 18px; color: #2196F3; font-weight: bold;');
    console.log('='.repeat(80));

    const healthUrl = apiUrl.replace('/api', '') + '/health';
    await testRoute('Health Check', healthUrl);

    // 3. API Root
    console.log('\n' + '='.repeat(80));
    console.log('%c🌐 STEP 3: API Root', 'font-size: 18px; color: #2196F3; font-weight: bold;');
    console.log('='.repeat(80));

    await testRoute('API Root', apiUrl);

    // 4. Debug Routes (if available)
    console.log('\n' + '='.repeat(80));
    console.log('%c🔧 STEP 4: Debug Endpoints', 'font-size: 18px; color: #2196F3; font-weight: bold;');
    console.log('='.repeat(80));

    await testRoute('List All Routes', `${apiUrl}/debug/routes`);
    await testRoute('Database Status', `${apiUrl}/debug/db`);
    await testRoute('Environment Check', `${apiUrl}/debug/env`);

    // 5. Authentication Check
    console.log('\n' + '='.repeat(80));
    console.log('%c🔐 STEP 5: Authentication Check', 'font-size: 18px; color: #2196F3; font-weight: bold;');
    console.log('='.repeat(80));

    const token = localStorage.getItem('access_token');
    console.log('Access Token:', token ? '✅ Found' : '❌ Not found');

    if (token) {
        console.log('Token (first 20 chars):', token.substring(0, 20) + '...');

        // Test authenticated endpoints
        const authHeaders = {
            'Authorization': `Bearer ${token}`
        };

        await testRoute('Get Stats (Authenticated)', `${apiUrl}/stats`, { headers: authHeaders });
        await testRoute('List Campaigns (Authenticated)', `${apiUrl}/campaigns`, { headers: authHeaders });
        await testRoute('Get Notifications (Authenticated)', `${apiUrl}/notifications`, { headers: authHeaders });
    } else {
        console.log('⚠️  Skipping authenticated endpoint tests (no token)');
        results.warnings.push('No access token found - authenticated endpoints not tested');
    }

    // 6. Public Endpoints
    console.log('\n' + '='.repeat(80));
    console.log('%c🌍 STEP 6: Public Endpoints', 'font-size: 18px; color: #2196F3; font-weight: bold;');
    console.log('='.repeat(80));

    await testRoute('Pricing Config', `${apiUrl}/pricing/config`);
    await testRoute('Geo Regions (US)', `${apiUrl}/geo/regions/US`);

    // 7. CORS Check
    console.log('\n' + '='.repeat(80));
    console.log('%c🔀 STEP 7: CORS Check', 'font-size: 18px; color: #2196F3; font-weight: bold;');
    console.log('='.repeat(80));

    try {
        const corsTest = await fetch(healthUrl, {
            method: 'OPTIONS',
            headers: {
                'Origin': window.location.origin,
                'Access-Control-Request-Method': 'GET'
            }
        });

        console.log('CORS Preflight Status:', corsTest.status);
        console.log('CORS Headers:');
        corsTest.headers.forEach((value, key) => {
            if (key.toLowerCase().includes('access-control')) {
                console.log(`  ${key}: ${value}`);
            }
        });

        if (corsTest.ok || corsTest.status === 200) {
            console.log('✅ CORS is properly configured');
            results.passed.push({ name: 'CORS Check', status: 'OK' });
        } else {
            console.log('⚠️  CORS might have issues');
            results.warnings.push('CORS preflight returned non-200 status');
        }
    } catch (error) {
        console.log('❌ CORS Error:', error.message);
        results.failed.push({ name: 'CORS Check', error: error.message });
    }

    // 8. Summary
    console.log('\n' + '='.repeat(80));
    console.log('%c📊 TEST SUMMARY', 'font-size: 20px; color: #FF9800; font-weight: bold; padding: 10px;');
    console.log('='.repeat(80));

    console.log(`\n✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);

    if (results.failed.length > 0) {
        console.log('\n%c❌ Failed Tests:', 'color: #f44336; font-weight: bold;');
        results.failed.forEach(test => {
            console.log(`  - ${test.name}: ${test.error || `HTTP ${test.status}`}`);
        });
    }

    if (results.warnings.length > 0) {
        console.log('\n%c⚠️  Warnings:', 'color: #ff9800; font-weight: bold;');
        results.warnings.forEach(warning => {
            console.log(`  - ${warning}`);
        });
    }

    // 9. Recommendations
    console.log('\n' + '='.repeat(80));
    console.log('%c💡 RECOMMENDATIONS', 'font-size: 18px; color: #9C27B0; font-weight: bold;');
    console.log('='.repeat(80));

    if (results.failed.some(f => f.name === 'Health Check')) {
        console.log('\n🔴 CRITICAL: Backend is not responding!');
        console.log('   1. Check if backend service is running in Railway');
        console.log('   2. Verify the backend URL is correct');
        console.log('   3. Check Railway backend logs for errors');
    }

    if (!apiUrl || apiUrl.includes('localhost')) {
        console.log('\n🟡 WARNING: API URL points to localhost');
        console.log('   Set VITE_API_URL in Railway frontend environment variables');
        console.log('   Example: VITE_API_URL=https://your-backend.railway.app/api');
    }

    if (!token) {
        console.log('\n🟡 INFO: Not logged in');
        console.log('   Some endpoints require authentication');
        console.log('   Login to test authenticated routes');
    }

    if (results.failed.length === 0 && results.warnings.length === 0) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('   Your Railway deployment routes are working correctly!');
    }

    // 10. Export Results
    console.log('\n' + '='.repeat(80));
    console.log('💾 Results saved to window.railwayTestResults');
    console.log('   Access with: window.railwayTestResults');
    console.log('='.repeat(80));

    window.railwayTestResults = {
        timestamp: new Date().toISOString(),
        apiUrl,
        currentUrl,
        token: !!token,
        results
    };

    return window.railwayTestResults;
})();
