from django.contrib import admin
from .models import Genre, Series, Season, Episode, WatchHistory, Comment, AuditLog

# Register your models here.
admin.site.register(Genre)
admin.site.register(Series)
admin.site.register(Season)
admin.site.register(Episode)
admin.site.register(WatchHistory)
admin.site.register(Comment)
admin.site.register(AuditLog)
