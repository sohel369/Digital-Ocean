# Railway Production Fix Instructions

## 1. Fix "Failed to update user" (400 Bad Request)
The error you saw (`400 Bad Request`) when editing "Sohel Admin" is likely because you are trying to **demote your own account** from "Super Admin" to "Advertiser".
- The system protects you from accidentally locking yourself out.
- **Solution:** You cannot change your own role to something other than Admin. Create a separate test account for testing Advertiser features.

## 2. Fix "Railway Campaign Create Error" & Missing BD Regions
The "Silent fetch for BD regions" implies the frontend is looking for Bangladesh data, but the Railway database is likely empty for BD regions. This prevents selecting a state, which causes Campaign Creation to fail.

We have added a new "One-Click Fix" endpoint to the backend.

### Steps to Fix on Railway:
1. **Deploy Updates:** Commit and push the changes (including the new `AdminUsers.jsx` and `admin.py`). Wait for Railway to redeploy.
2. **Run the Fix:**
   Once deployed, you can trigger the data seed directly from your browser's Developer Tools Console (while logged into the production site), or use Postman/Curl.
   
   **Option A: Browser Console (Easiest)**
   1. Log in to your **Railway Production** Admin Dashboard.
   2. Press `F12` to open Developer Tools -> **Console**.
   3. Paste this code and hit Enter:
      ```javascript
      // Replace with your actual production URL if it's not detected
      const BASE_URL = window.location.origin; 
      const token = localStorage.getItem('token') || sessionStorage.getItem('token'); // Adjust key if needed based on your auth
      // Usually stored in localStorage as 'access_token' or 'token'. Let's try 'access_token' commonly.
      
      fetch(`${BASE_URL}/api/admin/seed/bd-data`, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`, 
              'Content-Type': 'application/json'
          }
      })
      .then(r => r.json())
      .then(data => console.log("✅ RESULT:", data))
      .catch(e => console.error("❌ ERROR:", e));
      ```

   **Option B: CURL**
   ```bash
   curl -X POST "https://digital-ocean-production-01ee.up.railway.app/api/admin/seed/bd-data" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

3. **Verify:**
   After seeing "Bangladesh data seeded successfully", refresh the "Create Campaign" page. You should now see Dhaka, Chittagong, etc., in the dropdown.

## 3. Logs & Diagnostics
To check if the fix worked, look for the "Bangladesh data seeded successfully" response.
If you still face "Admin Save Error" for *other* users, check the console logs. We improved the error messages in `AdminUsers.jsx` to tell you exactly *why* it failed (e.g., duplicate email, invalid data).
