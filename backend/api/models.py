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
        default=timedelta(0),
        help_text="Estimated hunting time",
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
    parent_game = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='child_games'
    )

    # 時間関連のフィールド
    hunt_start_time = models.DateTimeField(
        default=timezone.now,
        help_text="狩猟開始時刻"
    )
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
        help_text="現在狩猟中のゲームかどうか.特に、HUNTINGとは異なり、最も細かいゲームに対して付与される。"
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
    
    @property
    def is_leaf_game(self):
        """葉のGameかどうかを確認"""
        return self.child_games.count() == 0

    def save(self, *args, **kwargs):
        if self.status == 'HUNTING' and self.child_games.count() == 0:
            self.is_active = True
            Game.objects.filter(
                status='HUNTING',
            ).exclude(pk=self.pk).update(
                is_active=False,
                status='PENDING'
            )
        else:
            self.is_active = False

        if not self.deadline and self.hunt_start_time:
            self.deadline = self.hunt_start_time + self.estimated_hunting_time

        super().save(*args, **kwargs)

        # 親Gameの状態を更新（parent_gameを使用）
        if self.parent_game:
            parent_game = self.parent_game
            child_games = parent_game.child_games.all()
            
            # 状態の伝搬ルール
            if child_games.filter(status='HUNTING').exists():
                parent_game.status = 'HUNTING'
            elif child_games.filter(status='ESCAPED').exists():
                parent_game.status = 'ESCAPED'
            elif child_games.exclude(status='CAPTURED').count() == 0:
                parent_game.status = 'CAPTURED'
            elif child_games.filter(status='PENDING').exists():
                parent_game.status = 'PENDING'
            else:
                parent_game.status = 'NOT_STARTED'
            
            parent_game.save()

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
