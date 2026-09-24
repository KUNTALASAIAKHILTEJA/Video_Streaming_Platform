from rest_framework import viewsets, exceptions
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Genre, Series, Season, Episode, WatchHistory, Comment, AuditLog
from .serializers import (
    GenreSerializer, SeriesSerializer, SeasonSerializer,
    EpisodeSerializer, WatchHistorySerializer, CommentSerializer, AuditLogSerializer
)


# ==========================================
# 1. CATALOG VIEWSETS (Genre, Series, Season, Episode)
# ==========================================

class GenreViewset(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [IsAuthenticated]


class SeriesViewSet(viewsets.ModelViewSet):
    queryset = Series.objects.all()
    serializer_class = SeriesSerializer
    permission_classes = [IsAuthenticated]


class SeasonsViewset(viewsets.ModelViewSet):
    queryset = Season.objects.all()
    serializer_class = SeasonSerializer
    permission_classes = [IsAuthenticated]


class EpisodeViewset(viewsets.ModelViewSet):
    queryset = Episode.objects.all()
    serializer_class = EpisodeSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]


# ==========================================
# 2. USER VIEWSETS (WatchHistory, Comment)
# ==========================================

class WatchHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = WatchHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Admins see all watch history; regular users see only their own
        if self.request.user and self.request.user.is_staff:
            return WatchHistory.objects.all()
        return WatchHistory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically attach logged-in user
        serializer.save(user=self.request.user)


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Comment.objects.all()
        series_id = self.request.query_params.get('series')
        episode_id = self.request.query_params.get('episode')

        if series_id:
            queryset = queryset.filter(series_id=series_id)
        if episode_id:
            queryset = queryset.filter(episode_id=episode_id)
        return queryset

    def perform_create(self, serializer):
        # Auto-attach logged-in user
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        if not self.request.user.is_staff and instance.user != self.request.user:
            raise exceptions.PermissionDenied("You can only edit your own comments.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_staff and instance.user != self.request.user:
            raise exceptions.PermissionDenied("You can only delete your own comments.")
        instance.delete()


# ==========================================
# 3. SYSTEM AUDIT LOG VIEWSET
# ==========================================

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only admin/staff users can view system audit logs
        if not (self.request.user and self.request.user.is_staff):
            raise exceptions.PermissionDenied("Forbidden: Only admin users can view audit logs.")
        return AuditLog.objects.all()