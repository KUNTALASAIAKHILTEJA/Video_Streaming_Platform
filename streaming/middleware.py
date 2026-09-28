from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication

class JWTRBACMiddleware:
    """Simple global middleware for JWT authentication & Admin RBAC rules."""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = JWTAuthentication()

    def __call__(self, request):
        # 1. Parse JWT Bearer Token if header is provided
        header = request.headers.get('Authorization', '')
        if header.startswith('Bearer '):
            try:
                auth_result = self.jwt_auth.authenticate(request)
                if auth_result:
                    request.user, request.auth = auth_result
            except Exception:
                pass

        path = request.path
        is_admin = bool(request.user and request.user.is_authenticated and request.user.is_staff)

        # 2. Restrict Catalog Write Operations (POST, PUT, DELETE) to Admins
        catalog_endpoints = ['/api/genre/', '/api/series/', '/api/seasons/', '/api/episodes/']
        if any(ep in path for ep in catalog_endpoints) and request.method not in ['GET', 'HEAD', 'OPTIONS']:
            if not is_admin:
                return JsonResponse({'detail': 'Forbidden: Admin privileges required for write operations.'}, status=403)

        # 3. Audit Logs  to Admins
        if '/api/auditlog/' in path and not is_admin:
            return JsonResponse({'detail': 'Forbidden: Only admin users can view audit logs.'}, status=403)

        return self.get_response(request)
