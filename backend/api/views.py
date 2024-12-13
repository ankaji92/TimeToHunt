from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Genus, Species, Game
from .serializers import GenusSerializer, SpeciesSerializer, GameSerializer
from datetime import datetime
from django.db.models import Q


class GenusViewSet(viewsets.ModelViewSet):
    """
    ゲームの大分類（属）を管理するViewSet
    """
    queryset = Genus.objects.all()
    serializer_class = GenusSerializer

    @action(detail=True)
    def species(self, request, pk=None):
        """特定の属に属する種を取得"""
        genus = self.get_object()
        species = Species.objects.filter(genus=genus)
        serializer = SpeciesSerializer(species, many=True)
        return Response(serializer.data)


class SpeciesViewSet(viewsets.ModelViewSet):
    """
    ゲームの種類を管理するViewSet
    """
    queryset = Species.objects.all()
    serializer_class = SpeciesSerializer

    def get_queryset(self):
        queryset = Species.objects.all()
        genus = self.request.query_params.get('genus', None)
        parent_species = self.request.query_params.get('parent_species', None)

        if genus is not None:
            queryset = queryset.filter(genus=genus)
        if parent_species is not None:
            if parent_species == 'null':
                queryset = queryset.filter(parent_species__isnull=True)
            else:
                queryset = queryset.filter(parent_species=parent_species)

        return queryset

    @action(detail=True)
    def games(self, request, pk=None):
        """特定の種に属するゲームインスタンスを取得"""
        species = self.get_object()
        games = Game.objects.filter(species=species)
        serializer = GameSerializer(games, many=True)
        return Response(serializer.data)

    @action(detail=True)
    def subspecies(self, request, pk=None):
        """子種を取得"""
        species = self.get_object()
        subspecies = Species.objects.filter(parent_species=species)
        serializer = SpeciesSerializer(subspecies, many=True)
        return Response(serializer.data)


class GameViewSet(viewsets.ModelViewSet):
    """
    個別のゲームインスタンスを管理するViewSet
    """
    queryset = Game.objects.all()
    serializer_class = GameSerializer

    def create(self, request, *args, **kwargs):
        # 親Gameを作成
        response = super().create(request, *args, **kwargs)
        parent_game = Game.objects.get(id=response.data['id'])
        parent_species = parent_game.species

        # 子Speciesが存在する場合、子Gameも作成
        def create_child_games(parent_game, parent_species):
            for child_species in parent_species.subspecies.all():
                child_game = Game.objects.create(
                    species=child_species,
                    parent_game=parent_game,
                    hunt_start_time=parent_game.hunt_start_time,
                    status='NOT_STARTED'
                )
                # さらに子がいれば再帰的に作成
                if not child_species.is_leaf_species:
                    create_child_games(child_game, child_species)

        if not parent_species.is_leaf_species:
            create_child_games(parent_game, parent_species)

        # 更新されたデータを返す
        updated_game = Game.objects.get(id=parent_game.id)
        return Response(self.serializer_class(updated_game).data)

    def get_queryset(self):
        queryset = Game.objects.all()
        date_str = self.request.query_params.get('date', None)

        if date_str:
            # 指定された日付の0時から24時までの範囲で検索
            target_date = datetime.strptime(date_str, '%Y-%m-%d')
            start_of_day = timezone.make_aware(target_date)
            end_of_day = timezone.make_aware(target_date.replace(hour=23, minute=59, second=59))

            queryset = queryset.filter(
                Q(hunt_start_time__date=target_date) |  # その日に開始されたゲーム
                Q(hunt_start_time__lte=end_of_day, deadline__gte=start_of_day)  # その日に実行中のゲーム
            )

        return queryset.order_by('hunt_start_time')

    @action(detail=False)
    def active(self, request):
        """現在アクティブなゲームを取得"""
        active_game = Game.objects.filter(is_active=True).first()
        if active_game:
            serializer = GameSerializer(active_game)
            return Response(serializer.data)
        return Response(
            {'detail': 'No active game found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=True, methods=['post'])
    def start_hunting(self, request, pk=None):
        """狩猟を開始"""
        game = self.get_object()
        if game.status != 'NOT_STARTED':
            return Response(
                {'detail': 'Game already started.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        game.status = 'HUNTING'
        game.hunt_start_time = timezone.now()
        game.save()
        serializer = GameSerializer(game)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete_hunting(self, request, pk=None):
        """狩猟を完了"""
        game = self.get_object()
        if game.status != 'HUNTING':
            return Response(
                {'detail': 'Game is not in hunting state.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        game.status = 'CAPTURED'
        game.actual_hunting_time = timezone.now() - game.hunt_start_time
        game.save()
        serializer = GameSerializer(game)
        return Response(serializer.data)
