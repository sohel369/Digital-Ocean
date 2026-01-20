# Generate a secure JWT secret for Railway deployment
# Run this script to get a random secure secret

import secrets
import string

def generate_jwt_secret(length=64):
    """Generate a cryptographically secure random string for JWT secret."""
    # Use URL-safe characters
    alphabet = string.ascii_letters + string.digits + '-_'
    secret = ''.join(secrets.choice(alphabet) for _ in range(length))
    return secret

if __name__ == "__main__":
    print("=" * 80)
    print("🔐 JWT SECRET GENERATOR FOR RAILWAY")
    print("=" * 80)
    print()
    
    # Generate a 64-character secret
    jwt_secret = generate_jwt_secret(64)
    
    print("Generated JWT Secret (64 characters):")
    print()
    print(jwt_secret)
    print()
    print("=" * 80)
    print("📋 COPY THIS TO RAILWAY:")
    print("=" * 80)
    print()
    print("1. Go to: https://railway.app")
    print("2. Select your Backend Service")
    print("3. Click 'Variables' tab")
    print("4. Click 'New Variable'")
    print("5. Add these variables:")
    print()
    print(f"   Variable Name: JWT_SECRET")
    print(f"   Value: {jwt_secret}")
    print()
    print(f"   Variable Name: ACCESS_TOKEN_EXPIRE_MINUTES")
    print(f"   Value: 1440")
    print()
    print(f"   Variable Name: REFRESH_TOKEN_EXPIRE_DAYS")
    print(f"   Value: 30")
    print()
    print("6. Click 'Add' for each variable")
    print("7. Railway will automatically redeploy (wait 2-3 minutes)")
    print()
    print("=" * 80)
    print("⚠️  IMPORTANT: Keep this secret safe and NEVER share it!")
    print("=" * 80)
    
    # Also generate a shorter version for reference
    print()
    print("Alternative secrets (choose one):")
    print()
    for i in range(3):
        alt_secret = generate_jwt_secret(64)
        print(f"Option {i+1}: {alt_secret}")
    print()
