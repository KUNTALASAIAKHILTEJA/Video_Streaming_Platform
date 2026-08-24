from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SeriesViewSet,GenreViewset,SeasonsViewset,EpisodeViewset,WatchHistoryViewSet

router = DefaultRouter()
router.register(r'genre', GenreViewset, basename='genre')
router.register(r'series', SeriesViewSet, basename='series')
router.register(r'seasons', SeasonsViewset, basename='seasons')
router.register(r'episodes', EpisodeViewset, basename='episodes')
router.register(r'watchhistory',WatchHistoryViewSet,basename='watchhistory')

urlpatterns = [
    path('api/', include(router.urls)),
]
