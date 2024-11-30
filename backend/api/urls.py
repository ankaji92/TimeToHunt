from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

router.register(r'categories', views.GameCategoryViewSet)
router.register(r'games', views.GameViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # 追加のURLパターンはここに記述します
    path('active_game/', views.get_active_game, name='get-active-game'),
]
