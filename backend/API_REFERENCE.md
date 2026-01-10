# API Endpoints Reference

Complete reference guide for all API endpoints in the Advertiser Dashboard Backend.

## Base URL
```
Local: http://localhost:8000
Production: https://your-domain.com
```

## Authentication Header
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

---

## 🔐 Authentication Endpoints

### Sign Up
**POST** `/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "advertiser",
  "country": "US"
}
```

**Response:** `201 Created`
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

---

### Login (Form Data)
**POST** `/auth/login`

Login with email and password using OAuth2 form data.

**Request Body:** (form-urlencoded)
```
username=john@example.com
password=securepassword123
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

---

### Login (JSON)
**POST** `/auth/login/json`

Login with JSON body (alternative).

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

---

### Google OAuth Login
**GET** `/auth/google/login`

Redirects to Google OAuth consent screen.

---

### Get Current User
**GET** `/auth/me`

Get authenticated user information.

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "advertiser",
  "country": "US",
  "profile_picture": null,
  "created_at": "2024-01-08T12:00:00Z",
  "last_login": "2024-01-08T12:30:00Z"
}
```

---

## 📊 Campaign Endpoints

### Create Campaign
**POST** `/campaigns/create`

Create a new advertising campaign.

**Request Body:**
```json
{
  "name": "Summer Sale 2024",
  "industry_type": "retail",
  "start_date": "2024-06-01",
  "end_date": "2024-08-31",
  "budget": 5000.0,
  "coverage_type": "state",
  "target_state": "CA",
  "target_country": "US",
  "description": "Summer promotional campaign",
  "tags": ["summer", "sale", "retail"]
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "advertiser_id": 1,
  "name": "Summer Sale 2024",
  "industry_type": "retail",
  "start_date": "2024-06-01",
  "end_date": "2024-08-31",
  "budget": 5000.0,
  "calculated_price": 4500.0,
  "status": "draft",
  "coverage_type": "state",
  "coverage_area": "State-wide: CA, US",
  "impressions": 0,
  "clicks": 0,
  "ctr": 0.0,
  "created_at": "2024-01-08T12:00:00Z"
}
```

---

### List Campaigns
**GET** `/campaigns/list?status=active&skip=0&limit=10`

List campaigns for the current user.

**Query Parameters:**
- `status` (optional): Filter by status (draft, pending, active, paused, completed, rejected)
- `skip` (optional): Pagination offset (default: 0)
- `limit` (optional): Results per page (default: 100, max: 100)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Summer Sale 2024",
    "status": "active",
    ...
  }
]
```

---

### Get Campaign
**GET** `/campaigns/{campaign_id}`

Get details of a specific campaign.

---

### Update Campaign
**PUT** `/campaigns/{campaign_id}`

Update an existing campaign.

**Request Body:**
```json
{
  "name": "Updated Campaign Name",
  "status": "paused",
  "budget": 6000.0
}
```

---

### Delete Campaign
**DELETE** `/campaigns/{campaign_id}`

Delete a campaign (must be paused or draft).

---

## 📁 Media Endpoints

### Upload Media
**POST** `/media/upload?campaign_id=1`

Upload a media file for a campaign.

**Request:** (multipart/form-data)
- `file`: Media file (image or video)
- `campaign_id`: Campaign ID (query parameter)

**Response:** `201 Created`
```json
{
  "id": 1,
  "campaign_id": 1,
  "file_path": "/uploads/campaign_1/uuid.jpg",
  "file_type": "image",
  "file_size": 1048576,
  "mime_type": "image/jpeg",
  "width": 1920,
  "height": 1080,
  "approved_status": "pending",
  "uploaded_at": "2024-01-08T12:00:00Z"
}
```

---

### Get Campaign Media
**GET** `/media/campaign/{campaign_id}`

Get all media files for a campaign.

---

### Delete Media
**DELETE** `/media/{media_id}`

Delete a media file.

---

### Approve Media (Admin)
**POST** `/media/{media_id}/approve`

Approve or reject media (Admin only).

**Request Body:**
```json
{
  "approved": true,
  "rejection_reason": null
}
```

---

## 💰 Pricing Endpoints

### Calculate Pricing
**POST** `/pricing/calculate`

Calculate campaign pricing estimate.

**Request Body:**
```json
{
  "industry_type": "retail",
  "advert_type": "display",
  "coverage_type": "state",
  "target_state": "CA",
  "target_country": "US",
  "duration_days": 90
}
```

**Response:** `200 OK`
```json
{
  "base_rate": 500.0,
  "multiplier": 1.2,
  "coverage_multiplier": 2.5,
  "discount": 135.0,
  "estimated_reach": 39538223,
  "total_price": 1215.0,
  "breakdown": {
    "base_rate": 500.0,
    "industry_multiplier": 1.2,
    "coverage_multiplier": 2.5,
    "duration_days": 90,
    "gross_price": 1350.0,
    "state_discount_percent": 10.0,
    "discount_amount": 135.0,
    "coverage_area_description": "State-wide: CA, US"
  }
}
```

---

### Get Pricing Matrix (Admin)
**GET** `/pricing/admin/matrix?industry_type=retail`

Get all pricing configurations.

---

### Create Pricing Matrix (Admin)
**POST** `/pricing/admin/matrix`

Create a new pricing configuration.

**Request Body:**
```json
{
  "industry_type": "retail",
  "advert_type": "display",
  "coverage_type": "state",
  "base_rate": 500.0,
  "multiplier": 1.2,
  "state_discount": 10.0,
  "national_discount": 15.0,
  "country_id": "US"
}
```

---

## 📈 Analytics Endpoints

### Get Campaign Analytics
**GET** `/analytics/campaign/{campaign_id}`

Get performance metrics for a campaign.

**Response:** `200 OK`
```json
{
  "campaign_id": 1,
  "campaign_name": "Summer Sale 2024",
  "impressions": 150000,
  "clicks": 4500,
  "ctr": 3.0,
  "budget": 5000.0,
  "spent": 4500.0,
  "remaining_budget": 500.0,
  "start_date": "2024-06-01",
  "end_date": "2024-08-31",
  "status": "active"
}
```

---

### Get User Summary
**GET** `/analytics/user/summary`

Get aggregated analytics for all user campaigns.

**Response:** `200 OK`
```json
{
  "total_campaigns": 5,
  "active_campaigns": 2,
  "total_impressions": 500000,
  "total_clicks": 15000,
  "average_ctr": 3.0,
  "total_spent": 15000.0,
  "total_budget": 20000.0
}
```

---

## 💳 Payment Endpoints

### Create Checkout Session
**POST** `/payment/create-checkout-session`

Create a Stripe checkout session for campaign payment.

**Request Body:**
```json
{
  "campaign_id": 1,
  "success_url": "https://yourapp.com/success",
  "cancel_url": "https://yourapp.com/cancel"
}
```

**Response:** `200 OK`
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/cs_test_...",
  "session_id": "cs_test_..."
}
```

---

### Get Transactions
**GET** `/payment/transactions`

Get payment transactions for current user.

---

## ⚙️ Admin Endpoints

### Get All Users
**GET** `/admin/users?role=advertiser&skip=0&limit=100`

List all users (Admin only).

---

### Update User
**PUT** `/admin/users/{user_id}`

Update user information (Admin only).

---

### Get All Campaigns
**GET** `/admin/campaigns?status=pending`

List all campaigns across all users (Admin only).

---

### Update Campaign Status
**PUT** `/admin/campaigns/{campaign_id}/status?new_status=approved`

Approve or reject campaigns (Admin only).

---

### Get System Stats
**GET** `/admin/stats`

Get system-wide statistics (Admin only).

**Response:** `200 OK`
```json
{
  "users": {
    "total": 150,
    "advertisers": 145,
    "admins": 5
  },
  "campaigns": {
    "total": 500,
    "active": 125,
    "pending": 25
  },
  "media": {
    "total": 1500,
    "pending_approval": 45
  },
  "revenue": {
    "total": 250000.0
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "detail": "Detailed error description",
  "status_code": 400
}
```

Common status codes:
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

---

## Rate Limiting

API is rate-limited to 100 requests per minute per IP address.

---

For interactive documentation, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
