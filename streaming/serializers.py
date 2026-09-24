from rest_framework import serializers
from .models import Genre, Series, Season, Episode, WatchHistory, Comment, AuditLog


###=====1.Genre Serializer=====###
class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id','name','slug','description']
        read_only_fields =['id']

###=====2.Series Serializer=====###
class SeriesSerializer(serializers.ModelSerializer):
    
    genre_ids = serializers.PrimaryKeyRelatedField(source='genres',queryset = Genre.objects.all(),many=True,write_only=True,required=False)
    genres = GenreSerializer(many=True,read_only=True)
    
    class Meta:
        model = Series
        fields = ['id','title','slug','description','thumbnail','banner','status','rating','age_rating','language','country','genre_ids','genres','created_at','updated_at']
        read_only_fields =['id','created_at','updated_at']
  
###=====3.Season Serializer=====###        
class SeasonSerializer(serializers.ModelSerializer):
    
    
    episode_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Season
        fields = ['id','series','season_number','title','description','thumbnail','episode_count','created_at','updated_at']
        read_only_fields =['id','created_at','updated_at']
        
    def get_episode_count(self, obj):
        return obj.episodes.count()   
        
        
###=====4.Episode Serializer=====### 
class EpisodeSerializer(serializers.ModelSerializer):
    
    genre_ids = serializers.PrimaryKeyRelatedField(source='genres',queryset = Genre.objects.all(),many=True,write_only=True,required=False)
    genres = GenreSerializer(many=True,read_only=True)
    
    class Meta:
        model = Episode
        fields = ['id','season','episode_number','title','description','thumbnail','video_file','genre_ids','genres','duration','created_at','updated_at']        
        read_only_fields =['id','created_at','updated_at']
        
    
###=====5.WatchHistory Serializer=====###
class WatchHistorySerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = WatchHistory 
        fields = ['id','user','user_username','episode','progress_seconds','completed','last_watched_at','created_at','updated_at']  
        read_only_fields =['id','user','created_at','updated_at']            


###=====6.Comment Serializer=====###
class CommentSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Comment
        fields = ['id','user','user_username','series','episode','text','created_at','updated_at']
        read_only_fields = ['id','user','created_at','updated_at']


###=====7.AuditLog Serializer=====###
class AuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = AuditLog
        fields = ['id','user','user_username','action','model_name','object_id','details','ip_address','timestamp']
        read_only_fields = ['id','timestamp']
            