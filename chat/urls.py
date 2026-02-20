from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('users/', views.user_list, name='user_list'),
    path('chat/<int:user_id>/', views.chat_room, name='chat_room'),
    path('delete_message/<int:msg_id>/', views.delete_message, name='delete_message'),

]
