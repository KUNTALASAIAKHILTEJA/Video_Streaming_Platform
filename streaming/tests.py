from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from streaming.models import Genre, Series, Season, Episode, WatchHistory, Comment, AuditLog

User = get_user_model()

class RBACTestCase(APITestCase):

    def setUp(self):
        # Create Admin User
        self.admin_user = User.objects.create_superuser(
            username='admin_user',
            email='admin@example.com',
            password='password123'
        )

        # Create Regular User 1
        self.regular_user = User.objects.create_user(
            username='regular_user',
            email='user1@example.com',
            password='password123'
        )

        # Create Regular User 2
        self.other_user = User.objects.create_user(
            username='other_user',
            email='user2@example.com',
            password='password123'
        )

        # Create test Genre & Series
        self.genre = Genre.objects.create(name='Action', slug='action', description='Action movies')
        self.series = Series.objects.create(
            title='Test Series',
            slug='test-series',
            description='A test series',
            status='ongoing',
            rating=4.5
        )

    def get_jwt_header(self, user):
        refresh = RefreshToken.for_user(user)
        return {'HTTP_AUTHORIZATION': f'Bearer {refresh.access_token}'}

    def test_jwt_token_obtain(self):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {'username': 'regular_user', 'password': 'password123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_catalog_rbac_regular_user_read_only(self):
        headers = self.get_jwt_header(self.regular_user)
        
        # GET should succeed
        get_response = self.client.get('/api/series/', **headers)
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)

        # POST (Write) should be blocked with 403 Forbidden
        post_response = self.client.post('/api/series/', {
            'title': 'Unauthorized Series',
            'slug': 'unauthorized-series'
        }, **headers)
        self.assertEqual(post_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_catalog_rbac_admin_full_access(self):
        headers = self.get_jwt_header(self.admin_user)
        
        # POST by Admin should succeed
        post_response = self.client.post('/api/series/', {
            'title': 'Admin Created Series',
            'slug': 'admin-created-series',
            'status': 'ongoing'
        }, **headers)
        self.assertEqual(post_response.status_code, status.HTTP_201_CREATED)

    def test_comment_ownership_and_moderation(self):
        headers1 = self.get_jwt_header(self.regular_user)
        headers2 = self.get_jwt_header(self.other_user)
        admin_headers = self.get_jwt_header(self.admin_user)

        # User 1 posts comment
        comment_resp = self.client.post('/api/comments/', {
            'series': self.series.id,
            'text': 'Great series!'
        }, **headers1)
        self.assertEqual(comment_resp.status_code, status.HTTP_201_CREATED)
        comment_id = comment_resp.data['id']

        # User 2 tries to edit User 1's comment -> 403 Forbidden
        patch_resp = self.client.patch(f'/api/comments/{comment_id}/', {
            'text': 'Hacked text!'
        }, **headers2)
        self.assertEqual(patch_resp.status_code, status.HTTP_403_FORBIDDEN)

        # Admin can delete any comment -> 204 No Content
        del_resp = self.client.delete(f'/api/comments/{comment_id}/', **admin_headers)
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_audit_log_access_control(self):
        headers_user = self.get_jwt_header(self.regular_user)
        headers_admin = self.get_jwt_header(self.admin_user)

        # Regular user cannot access audit logs -> 403 Forbidden
        user_resp = self.client.get('/api/auditlog/', **headers_user)
        self.assertEqual(user_resp.status_code, status.HTTP_403_FORBIDDEN)

        # Admin user can view audit logs -> 200 OK
        admin_resp = self.client.get('/api/auditlog/', **headers_admin)
        self.assertEqual(admin_resp.status_code, status.HTTP_200_OK)
