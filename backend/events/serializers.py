from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Event, EventRegistration

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Username already exists."})
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class EventSerializer(serializers.ModelSerializer):
    organizer_username = serializers.ReadOnlyField(source='organizer.username')
    registration_count = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()
    is_organizer = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'date', 'time', 'location',
            'organizer', 'organizer_username', 'registration_count',
            'is_registered', 'is_organizer', 'created_at', 'updated_at'
        ]
        read_only_fields = ['organizer', 'created_at', 'updated_at']

    def get_registration_count(self, obj):
        return obj.registrations.count()

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.registrations.filter(user=request.user).exists()
        return False

    def get_is_organizer(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.organizer == request.user
        return False

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        return value.strip()

    def validate_location(self, value):
        if not value.strip():
            raise serializers.ValidationError("Location cannot be empty.")
        return value.strip()


class EventRegistrationSerializer(serializers.ModelSerializer):
    event_detail = EventSerializer(source='event', read_only=True)
    user_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = EventRegistration
        fields = ['id', 'user', 'user_username', 'event', 'event_detail', 'registered_at']
        read_only_fields = ['user', 'registered_at']
