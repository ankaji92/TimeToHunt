from rest_framework import serializers
from .models import Genus, Species, Game


class GenusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genus
        fields = '__all__'


class SpeciesSerializer(serializers.ModelSerializer):
    genus_name = serializers.CharField(source='genus.name', read_only=True)
    is_leaf_species = serializers.BooleanField(read_only=True)

    class Meta:
        model = Species
        fields = [
            'id', 'title', 'description', 'genus', 'parent_species', 'genus_name',
            'priority', 'estimated_hunting_time',
            'is_leaf_species', 'created_at', 'updated_at'
        ]

    def validate(self, data):
        if not data.get('is_leaf_species', True) and data.get('estimated_hunting_time'):
            raise serializers.ValidationError({
                'estimated_hunting_time': 'Cannot set hunting time directly for parent species.'
            })
        return data


class GameSerializer(serializers.ModelSerializer):
    species_title = serializers.CharField(source='species.title', read_only=True)
    species_parent_species = serializers.PrimaryKeyRelatedField(source='species.parent_species', read_only=True)
    estimated_hunting_time = serializers.DurationField(read_only=True)
    remaining_time = serializers.DurationField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = Game
        fields = '__all__'