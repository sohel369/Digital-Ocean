from fastapi import Request
import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

async def get_country_from_ip(request: Request) -> Optional[str]:
    """
    Detects the user's country from their IP address.
    In production, this should use a headers like X-Forwarded-For or CF-IPCountry.
    """
    # 1. Try to get IP from headers (Standard for proxies/load balancers)
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "127.0.0.1"

    # 2. Skip detection for local IP
    if ip in ("127.0.0.1", "localhost", "::1"):
        logger.debug(f"Local IP detected ({ip}), skipping geo-lookup.")
        return None

    # 3. Use a geo-lookup service (Mocked for speed, but prepared for real API)
    # Using ip-api.com (free for testing)
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"http://ip-api.com/json/{ip}?fields=status,countryCode")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    return data.get("countryCode") # e.g., 'US', 'IN'
    except Exception as e:
        logger.error(f"GeoIP look up failed for {ip}: {e}")
    
    return None
