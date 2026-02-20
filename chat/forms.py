from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User
from django.contrib.auth.forms import AuthenticationForm


class UserRegisterForm(UserCreationForm):

    class Meta:
        model = User
        fields = ['email', 'username', 'password1', 'password2']
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].help_text = None
        self.fields['password2'].help_text = None

class UserLoginForm(AuthenticationForm):
    username = forms.EmailField(label="Email")
