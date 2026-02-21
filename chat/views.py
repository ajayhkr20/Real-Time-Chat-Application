from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import get_user_model, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView
from django.db.models import Q
from django.utils import timezone
from .models import *
from .forms import *  
from django.http import JsonResponse
from django.contrib.auth import get_user_model
User = get_user_model()

def home(request):
    return render(request,"chat/index.html")


def register(request):
    if request.method == "POST":
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password1'])
            user.save()
            login(request, user)
            user.is_online = True
            user.last_seen = timezone.now()
            user.save()
            return redirect('/login/')
    else:
        form = UserRegisterForm()
    return render(request, 'chat/register.html', {'form': form})


class UserLoginView(LoginView):
    template_name = "chat/login.html"
    authentication_form = UserLoginForm  
    def form_valid(self, form):
        user = form.get_user()
        user.is_online = True
        user.last_seen = timezone.now()
        user.save()
        return super().form_valid(form)

    def get_success_url(self):
        return "/users/"


@login_required
def user_logout(request):
    user = request.user
    user.is_online = False
    user.last_seen = timezone.now()
    user.save()
    logout(request)
    return redirect('login')


@login_required
def user_list(request):
    users = User.objects.exclude(id=request.user.id).exclude(is_superuser=True)
    return render(request, "chat/user_list.html", {"users": users})


@login_required
def chat_room(request, user_id):
    if request.user.id == user_id:
        return redirect('user_list')
    other_user = get_object_or_404(User, id=user_id)

    # Same room for both users
    ids = sorted([request.user.id, other_user.id])
    room_name = f"{ids[0]}_{ids[1]}"

    messages = Message.objects.filter(
        sender__in=[request.user, other_user],
        receiver__in=[request.user, other_user]
    ).order_by("timestamp")
    messages.filter(receiver=request.user, is_read=False).update(is_read=True)
    return render(request, "chat/chat.html", {"other_user": other_user,"messages": messages,"room_name": room_name})


@login_required
def delete_message(request, msg_id):
    msg = get_object_or_404(Message, id=msg_id, sender=request.user)
    msg.delete()
    return JsonResponse({"status": "success"})