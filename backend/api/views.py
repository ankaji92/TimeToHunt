from rest_framework import viewsets
from .models import GameCategory, Game
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


class GameCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = GameCategory
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']


class GameSerializer(serializers.ModelSerializer):
    remaining_time = serializers.DurationField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = Game
        fields = [
            'id', 'title', 'description', 'category', 
            'parent_game', 'hunt_start_time', 'estimated_hunting_time',
            'actual_hunting_time', 'status', 'priority', 
            'created_at', 'updated_at', 'is_active',
            'deadline', 'remaining_time', 'is_expired'
        ]


class GameCategoryViewSet(viewsets.ModelViewSet):
    queryset = GameCategory.objects.all()
    serializer_class = GameCategorySerializer


class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer


@api_view(['GET'])
def get_active_game(request):
    try:
        active_game = Game.objects.get(is_active=True, is_leaf_game=True)
        print("test")
        print(active_game)
        serializer = GameSerializer(active_game)
        return Response(serializer.data)
    except Game.DoesNotExist:
        return Response(
            {"message": "アクティブなゲームが見つかりません"},
            status=status.HTTP_404_NOT_FOUND
        )
