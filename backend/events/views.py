from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Event, EventRegistration
from .serializers import EventSerializer, EventRegistrationSerializer, UserSerializer, UserRegisterSerializer

# --- Authentication APIs ---

@api_view(['POST'])
@permission_classes([AllowAny])
def register_api(request):
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        login(request, user)
        return Response({
            "message": "User registered successfully.",
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({"detail": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({
            "message": "Login successful.",
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)
    return Response({"detail": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_api(request):
    logout(request)
    return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def current_user_api(request):
    if request.user.is_authenticated:
        return Response({
            "is_authenticated": True,
            "user": UserSerializer(request.user).data
        })
    return Response({
        "is_authenticated": False,
        "user": None
    })


# --- Event CRUD APIs ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def event_list_create_api(request):
    if request.method == 'GET':
        query = request.query_params.get('search', request.query_params.get('q', '')).strip()
        time_filter = request.query_params.get('filter', 'all')
        today = timezone.now().date()

        events = Event.objects.all()

        if query:
            events = events.filter(
                Q(title__icontains=query) | Q(location__icontains=query) | Q(description__icontains=query)
            )

        if time_filter == 'upcoming':
            events = events.filter(date__gte=today)
        elif time_filter == 'past':
            events = events.filter(date__lt=today)

        serializer = EventSerializer(events, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = EventSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(organizer=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticatedOrReadOnly])
def event_detail_api(request, pk):
    event = get_object_or_404(Event, pk=pk)

    if request.method == 'GET':
        serializer = EventSerializer(event, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        if event.organizer != request.user:
            return Response({"detail": "You do not have permission to edit this event."}, status=status.HTTP_403_FORBIDDEN)

        serializer = EventSerializer(event, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if event.organizer != request.user:
            return Response({"detail": "You do not have permission to delete this event."}, status=status.HTTP_403_FORBIDDEN)

        event.delete()
        return Response({"message": "Event deleted successfully."}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_events_api(request):
    events = Event.objects.filter(organizer=request.user)
    serializer = EventSerializer(events, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


# --- Registration APIs ---

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_event_api(request, pk):
    event = get_object_or_404(Event, pk=pk)
    registration, created = EventRegistration.objects.get_or_create(user=request.user, event=event)
    if created:
        return Response({"message": f"Successfully registered for '{event.title}'."}, status=status.HTTP_201_CREATED)
    return Response({"detail": f"You are already registered for '{event.title}'."}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_registrations_api(request):
    registrations = EventRegistration.objects.filter(user=request.user).select_related('event', 'event__organizer')
    serializer = EventRegistrationSerializer(registrations, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['DELETE', 'POST'])
@permission_classes([IsAuthenticated])
def cancel_registration_api(request, pk):
    event = get_object_or_404(Event, pk=pk)
    registration = EventRegistration.objects.filter(user=request.user, event=event).first()
    if registration:
        registration.delete()
        return Response({"message": f"Registration for '{event.title}' cancelled."}, status=status.HTTP_200_OK)
    return Response({"detail": "Registration not found."}, status=status.HTTP_404_NOT_FOUND)
