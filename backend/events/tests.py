from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from django.urls import reverse
import datetime
from .models import Event, EventRegistration

class EventAPITests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', email='user1@example.com', password='password123')
        self.user2 = User.objects.create_user(username='user2', email='user2@example.com', password='password123')

        self.event1 = Event.objects.create(
            title='Tech Symposium 2026',
            description='Annual computer science tech fest.',
            date=datetime.date.today() + datetime.timedelta(days=7),
            time=datetime.time(10, 0),
            location='Main Auditorium',
            organizer=self.user1
        )

    def test_user_registration_api(self):
        url = reverse('api_register')
        data = {
            'username': 'newstudent',
            'email': 'newstudent@example.com',
            'password': 'password123',
            'confirm_password': 'password123'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newstudent').exists())

    def test_user_login_api(self):
        url = reverse('api_login')
        data = {'username': 'user1', 'password': 'password123'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['username'], 'user1')

    def test_event_listing_api(self):
        url = reverse('api_event_list_create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Tech Symposium 2026')

    def test_event_detail_api(self):
        url = reverse('api_event_detail', args=[self.event1.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Tech Symposium 2026')

    def test_create_event_authenticated_api(self):
        self.client.login(username='user1', password='password123')
        url = reverse('api_event_list_create')
        data = {
            'title': 'AI Workshop',
            'description': 'Intro to machine learning',
            'date': '2026-10-10',
            'time': '14:00:00',
            'location': 'Lab 2'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Event.objects.filter(title='AI Workshop').exists())

    def test_create_event_unauthenticated_api(self):
        url = reverse('api_event_list_create')
        data = {
            'title': 'Unauthorized Workshop',
            'description': 'Test',
            'date': '2026-10-10',
            'time': '14:00:00',
            'location': 'Lab 2'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_event_registration_api(self):
        self.client.login(username='user2', password='password123')
        url = reverse('api_register_event', args=[self.event1.pk])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(EventRegistration.objects.filter(user=self.user2, event=self.event1).exists())

    def test_duplicate_registration_prevention_api(self):
        self.client.login(username='user2', password='password123')
        url = reverse('api_register_event', args=[self.event1.pk])
        self.client.post(url)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthorized_update_protection_api(self):
        self.client.login(username='user2', password='password123')
        url = reverse('api_event_detail', args=[self.event1.pk])
        data = {
            'title': 'Hacked Title',
            'description': 'Hacked',
            'date': '2026-10-10',
            'time': '14:00:00',
            'location': 'Hacked'
        }
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.event1.refresh_from_db()
        self.assertEqual(self.event1.title, 'Tech Symposium 2026')

    def test_unauthorized_delete_protection_api(self):
        self.client.login(username='user2', password='password123')
        url = reverse('api_event_detail', args=[self.event1.pk])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Event.objects.filter(pk=self.event1.pk).exists())
