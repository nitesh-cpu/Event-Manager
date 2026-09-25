from django.urls import path
from . import views

urlpatterns = [
    # Auth APIs
    path('register/', views.register_api, name='api_register'),
    path('login/', views.login_api, name='api_login'),
    path('logout/', views.logout_api, name='api_logout'),
    path('user/', views.current_user_api, name='api_current_user'),

    # Event CRUD APIs
    path('events/', views.event_list_create_api, name='api_event_list_create'),
    path('events/<int:pk>/', views.event_detail_api, name='api_event_detail'),
    path('my-events/', views.my_events_api, name='api_my_events'),

    # Registration APIs
    path('events/<int:pk>/register/', views.register_event_api, name='api_register_event'),
    path('events/<int:pk>/cancel/', views.cancel_registration_api, name='api_cancel_registration'),
    path('registrations/', views.my_registrations_api, name='api_my_registrations'),
    path('registrations/<int:pk>/', views.cancel_registration_api, name='api_cancel_registration_alt'),
]
