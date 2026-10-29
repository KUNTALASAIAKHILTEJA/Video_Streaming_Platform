from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError

from streaming.models import Episode, Season, Series

FILE_FIELDS = [
    (Series, ['thumbnail', 'banner']),
    (Season, ['thumbnail']),
    (Episode, ['thumbnail', 'video_file']),
]


class Command(BaseCommand):
    help = 'Upload files from the local media/ folder to Cloudinary and update the records.'

    def handle(self, *args, **options):
        if not settings.USE_CLOUDINARY:
            raise CommandError('Set CLOUDINARY_URL (and DATABASE_URL for production) first.')

        media_root = Path(settings.MEDIA_ROOT)
        for model, fields in FILE_FIELDS:
            for obj in model.objects.all():
                for name in fields:
                    field_file = getattr(obj, name)
                    if not field_file:
                        continue
                    local_path = media_root / field_file.name
                    if not local_path.exists():
                        self.stdout.write(self.style.WARNING(f'Missing locally, skipped: {field_file.name}'))
                        continue
                    with local_path.open('rb') as fh:
                        # Saving through the field uploads to the field's (Cloudinary) storage
                        field_file.save(local_path.name, File(fh), save=False)
                    model.objects.filter(pk=obj.pk).update(**{name: field_file.name})
                    self.stdout.write(f'Uploaded {model.__name__} {obj.pk} {name} -> {field_file.url}')

        self.stdout.write(self.style.SUCCESS('Done.'))
