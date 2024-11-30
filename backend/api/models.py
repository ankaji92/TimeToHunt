from django.db import models
from django.core.validators import MinValueValidator
from django.db.models import Sum
from datetime import timedelta
from django.utils import timezone


class GameCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Game Categories"


class Game(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(GameCategory, on_delete=models.SET_NULL, null=True, related_name='games')
    parent_game = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subgames')
    
    # 時間関連のフィールド
    hunt_start_time = models.DateTimeField()
    estimated_hunting_time = models.DurationField(help_text="予定狩猟時間")
    actual_hunting_time = models.DurationField(null=True, blank=True, help_text="実際の狩猟時間")
    
    # ステータス関連
    STATUS_CHOICES = [
        ('NOT_STARTED', '未着手'),
        ('HUNTING', '狩猟中'),
        ('PENDING', '保留中'),
        ('CAPTURED', '捕獲完了'),
        ('ESCAPED', '見失う'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_STARTED')
    
    # 優先度
    priority = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="優先度（1が最高優先）"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    is_active = models.BooleanField(
        default=False,
        help_text="現在狩猟中のゲームかどうか"
    )
    is_leaf_game = models.BooleanField(
        default=True,
        help_text="最小単位のゲームかどうか"
    )
    
    deadline = models.DateTimeField(
        null=True,
        blank=True,
        help_text="狩猟の期限時刻"
    )

    @property
    def is_active_with_children(self):
        """自身または任意の子ゲームが狩猟中の場合にTrueを返す"""
        if self.is_active:
            return True
            
        children = self.subgames.all()
        if not children:
            return False
            
        for child in children:
            if child.is_active_with_children:
                return True
                
        return False

    @property
    def calculated_hunting_time(self):
        """子ゲームがある場合は合計時間を、ない場合は設定された狩猟時間を返す"""
        if self.is_leaf_game:
            return self.estimated_hunting_time
        subgame_time = self.subgames.aggregate(
            total=Sum('estimated_hunting_time'))['total'] or timedelta()
        return subgame_time

    @property
    def calculated_actual_hunting_time(self):
        """子ゲームがある場合は実際の狩猟時間の合計を、ない場合は設定された実際の狩猟時間を返す"""
        if self.is_leaf_game:
            return self.actual_hunting_time or timedelta()
        subgame_actual_time = self.subgames.aggregate(
            total=Sum('actual_hunting_time'))['total'] or timedelta()
        return subgame_actual_time

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
        # 新規作成時はis_leaf_gameをTrueに設定
        if not self.pk:
            self.is_leaf_game = True
        
        # 既存レコードの場合、状態変更の処理
        if self.pk:
            old_instance = Game.objects.get(pk=self.pk)
            # HUNTINGから他のステータスに変更される場合
            if old_instance.status == 'HUNTING' and self.status != 'HUNTING':
                # CAPTUREDまたはESCAPEDに明示的に変更される場合を除き、PENDINGに設定
                if self.status not in ['CAPTURED', 'ESCAPED']:
                    self.status = 'PENDING'

        # statusとis_activeの同期
        if self.status == 'HUNTING':
            self.is_active = True
        else:
            self.is_active = False

        # 既存のレコードの場合のみ子ゲームの存在チェック
        if self.pk and self.subgames.exists():
            self.is_leaf_game = False
            self.estimated_hunting_time = self.calculated_hunting_time
            self.actual_hunting_time = self.calculated_actual_hunting_time
        else:
            self.is_leaf_game = True

        # アクティブ状態の処理（他のアクティブなゲームを非アクティブにする）
        if self.is_active:
            Game.objects.filter(
                is_active=True, 
                is_leaf_game=True
            ).exclude(pk=self.pk).update(
                is_active=False,
                status='PENDING'  # 他のアクティブなゲームはPENDINGに変更
            )

        # 期限の自動設定
        if not self.deadline and self.hunt_start_time and self.estimated_hunting_time:
            self.deadline = self.hunt_start_time + self.estimated_hunting_time
        
        super().save(*args, **kwargs)

        # 親ゲームの更新
        if self.parent_game:
            self.parent_game.save()

    class Meta:
        ordering = ['priority', 'hunt_start_time']
        constraints = [
            models.CheckConstraint(
                check=models.Q(is_active=False) | (
                    models.Q(is_active=True) & models.Q(is_leaf_game=True)
                ),
                name='only_leaf_game_can_be_active'
            )
        ]