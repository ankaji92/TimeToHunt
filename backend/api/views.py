from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Genus, Species, Game
from .serializers import GenusSerializer, SpeciesSerializer, GameSerializer


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

    def get_queryset(self):
        queryset = Game.objects.all()
        species_id = self.request.query_params.get('species', None)
        status = self.request.query_params.get('status', None)
        is_active = self.request.query_params.get('is_active', None)

        if species_id is not None:
            queryset = queryset.filter(species_id=species_id)
        if status is not None:
            queryset = queryset.filter(status=status)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active == 'true')

        return queryset

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
