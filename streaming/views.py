from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Genre,Series,Season,Episode,WatchHistory
from .serializers import GenreSerializer,SeriesSerializer,SeasonSerializer,EpisodeSerializer,WatchHistorySerializer

# Create your views here.
###=====1.GenreViewset=====###
class GenreViewset(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [IsAuthenticated]


###=====2.SeriesViewset=====###
class SeriesViewSet(viewsets.ModelViewSet):
    queryset = Series.objects.all()
    serializer_class = SeriesSerializer
    permission_classes = [IsAuthenticated]
    
###=====3.SeasonViewset=====###    
class SeasonsViewset(viewsets.ModelViewSet):
    queryset = Season.objects.all()
    serializer_class = SeasonSerializer
    permission_classes = [IsAuthenticated]
    
###=====4.EpisodeViewset=====###    
class EpisodeViewset(viewsets.ModelViewSet):
    queryset = Episode.objects.all()
    serializer_class = EpisodeSerializer
    permission_classes = [IsAuthenticated]
           
    
    parser_classes = [MultiPartParser,FormParser]
    
###=====5.WatchHistoryViewset=====###    
class WatchHistoryViewSet(viewsets.ModelViewSet):

    serializer_class = WatchHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WatchHistory.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user
        )    