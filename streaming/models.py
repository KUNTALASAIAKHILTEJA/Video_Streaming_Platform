from django.db import models
from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver



# Create your models here.

###====== 1.GENRE MODEL ======###
class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=200,unique=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name
    

###====== 2.SERIES MODEL ======###    
class Series(models.Model):
    STATUS_CHOICES = [
        ("ongoing","Ongoing"),
        ("completed","Completed"),
    ]
    
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    thumbnail = models.ImageField(upload_to='series/thumbnails/',blank=True,null=True)
    banner = models.ImageField(upload_to='series/banner/',blank=True,null=True)
    status = models.CharField(max_length=30,choices=STATUS_CHOICES, default="ongoing")
    rating =  models.DecimalField(max_digits=3,decimal_places=1,default=0.0)
    age_rating = models.CharField(max_length=10,default="13+")
    language = models.JSONField(max_length=50,default=list,blank=True)
    country = models.CharField(max_length=50, default='INDIA')
    
    #Many to Many Relationship with Genre (SERIES_GENRE table automatically)
    genres = models.ManyToManyField(Genre,related_name='series',blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    
###====== 3.SEASON MODEL ======###  
class Season(models.Model):
    
    # One to Many Relationship with Series
    series = models.ForeignKey(Series,on_delete=models.CASCADE, related_name="seasons")
    season_number = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    thumbnail = models.ImageField(upload_to='seasons/thumbnail/',blank=True,null=True)
    episode_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['season_number']
        constraints = [models.UniqueConstraint(fields=['series','season_number'], name='unique_series_season_number' )]
    
    def __str__(self):
        return f"{self.series.title} - Season{self.season_number}"

###====== 4.EPISODE MODEL ======###
class Episode(models.Model):
    
    # One to Many Relationship with Seasons 
    season = models.ForeignKey(Season,on_delete=models.CASCADE,related_name='episodes')
    episode_number = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True) 
    thumbnail = models.ImageField(upload_to='episodes/thumbnails/',blank=True,null=True)
    video_file = models.FileField(upload_to='episodes/videos/',blank=True,null=True)
    duration = models.PositiveIntegerField(help_text="Duration in minutes", default=0)
    
    #Many to Many Relationship with Genre (EPISODE_GENRE table automatically)
    genres = models.ManyToManyField(Genre,related_name='episodes',blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) 
    
    class Meta:
        ordering = ['episode_number']
        constraints = [models.UniqueConstraint(fields=['season','episode_number'], name='unique_season_episode_number' )]
        
        def __str__(self):
            return f"S{self.season.season_number}E{self.episode_number}: {self.title}"
        
        
###====== 5.WATCH_HISTORY MODEL ======###       
class WatchHistory(models.Model):
    
    #One to Many Relationship with User and Episode
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="watch_history")
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, related_name="watch_history")
    progress_seconds = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    last_watched_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "episode"], name="unique_user_episode")
        ]
        def __str__(self):
            return f"{self.user.username} - {self.episode.title}"        
        
####======for delete the media files also=====###  
@receiver(post_delete,sender=Series)
def delete_series_files(sender,instance, **kwargs):
    if instance.thumbnail:
        instance.thumbnail.delete(save=False)
    if instance.banner:
        instance.banner.delete(save=False)
        

@receiver(post_delete,sender=Season)
def delete_season_files(sender,instance, **kwargs):
    if instance.thumbnail:
        instance.thumbnail.delete(save=False)                 
        
        
@receiver(post_delete,sender=Episode)
def delete_episode_files(sender,instance, **kwargs):
    if instance.thumbnail:
        instance.thumbnail.delete(save=False)
        
    if instance.video_file:
        instance.video_file.delete(save=False)         