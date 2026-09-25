from django.contrib import admin
from .models import Event, EventRegistration

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'organizer', 'date', 'time', 'location', 'created_at')
    search_fields = ('title', 'location', 'organizer__username', 'description')
    list_filter = ('date', 'location')
    ordering = ('-date',)


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'registered_at')
    search_fields = ('event__title', 'user__username')
    list_filter = ('registered_at',)
    ordering = ('-registered_at',)
