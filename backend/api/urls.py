from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GenusViewSet, SpeciesViewSet, GameViewSet

router = DefaultRouter()
router.register(r'genera', GenusViewSet)
router.register(r'species', SpeciesViewSet)
router.register(r'games', GameViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('active_game/', GameViewSet.as_view({'get': 'active'}), name='active_game'),
]
