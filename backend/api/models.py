from django.db import models
from django.core.validators import MinValueValidator
from datetime import timedelta
from django.utils import timezone
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


class Genus(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Genera"


class Species(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    genus = models.ForeignKey(Genus, on_delete=models.CASCADE, null=True, related_name='species')
    parent_species = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subspecies'
    )
    priority = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Priority (1 is highest)"
    )
    estimated_hunting_time = models.DurationField(
        help_text="Estimated hunting time"
    )
    is_leaf_species = models.BooleanField(
        default=True,
        help_text="Whether this is a leaf species"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def aggregate_hunting_time(self):
        """統一されたインターフェースとしての推定所要時間"""
        if self.is_leaf_species:
            return self.estimated_hunting_time

        total_time = timedelta()
        for subspecies in self.subspecies.all():
            if subspecies.estimated_hunting_time:
                total_time += subspecies.estimated_hunting_time
        self.estimated_hunting_time = total_time
        return self.estimated_hunting_time

    def save(self, *args, **kwargs):
        if not self.pk:
            self.is_leaf_species = True
            super().save(*args, **kwargs)
            return

        self.is_leaf_species = not self.subspecies.exists()
        if not self.is_leaf_species:
            self.aggregate_hunting_time()

        super().save(*args, **kwargs)

    class Meta:
        verbose_name_plural = "Species"


class Game(models.Model):
    species = models.ForeignKey(Species, on_delete=models.CASCADE, related_name='games')

    # 時間関連のフィールド
    hunt_start_time = models.DateTimeField()
    actual_hunting_time = models.DurationField(
        null=True,
        blank=True,
        help_text="実際の所要時間"
    )

    # ステータス関連
    STATUS_CHOICES = [
        ('NOT_STARTED', '未着手'),
        ('HUNTING', '狩猟中'),
        ('PENDING', '保留中'),
        ('CAPTURED', '捕獲完了'),
        ('ESCAPED', '見失う'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='NOT_STARTED'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_active = models.BooleanField(
        default=False,
        help_text="現在狩猟中のゲームかどうか"
    )

    deadline = models.DateTimeField(
        null=True,
        blank=True,
        help_text="狩猟の期限時刻"
    )

    @property
    def estimated_hunting_time(self):
        """種から推定所要時間を取得"""
        return self.species.estimated_hunting_time

    @property
    def is_expired(self):
        """期限切れかどうかを確認"""
        if not self.deadline:
            return False
        return timezone.now() > self.deadline

    @property
    def remaining_time(self):
        """残り時間を計算"""
        if not self.deadline:
            return None
        now = timezone.now()
        if now > self.deadline:
            return timedelta()
        return self.deadline - now

    def save(self, *args, **kwargs):
        # statusとis_activeの同期
        if self.status == 'HUNTING':
            self.is_active = True
        else:
            self.is_active = False

        # 期限の自動設定
        if not self.deadline and self.hunt_start_time:
            self.deadline = self.hunt_start_time + self.estimated_hunting_time

        # アクティブ状態の処理（他のアクティブなゲームを非アクティブにする）
        if self.is_active:
            Game.objects.filter(
                is_active=True
            ).exclude(pk=self.pk).update(
                is_active=False,
                status='PENDING'
            )

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.species.title} ({self.get_status_display()})"


@receiver(post_save, sender=Species)
def update_parent_species(sender, instance, created, **kwargs):
    """Update parent species when a subspecies is created or updated"""
    """Note: parentに対してsaveメソッドを呼ぶことで、親の親も再帰的に更新される"""
    if instance.parent_species:
        parent = instance.parent_species
        parent.save()


@receiver(post_delete, sender=Species)
def handle_deleted_species(sender, instance, **kwargs):
    """Update parent species when a subspecies is deleted"""
    # CASCADEで削除されるので、親Speciesが存在するか確認
    def safe_get_parent(sp):
        try:
            parent = sp.parent_species
            return parent, parent is not None
        except Species.DoesNotExist:
            return None, False

    parent, parent_exists = safe_get_parent(instance)
    if parent_exists:
        # 他の子Speciesがないか確認
        if not parent.subspecies.exclude(pk=instance.pk).exists():
            parent.is_leaf_species = True
        parent.save()
