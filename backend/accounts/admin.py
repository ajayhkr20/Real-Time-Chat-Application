from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'is_online', 'last_seen')
    fieldsets = UserAdmin.fieldsets + (('Profile', {'fields': ('bio', 'avatar', 'is_online')}),)
