from rest_framework import generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserProfileSerializer, PublicUserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    serializer_class = PublicUserSerializer

    def get_queryset(self):
        qs = User.objects.exclude(id=self.request.user.id)
        search = self.request.query_params.get('search', '')
        if search:
            qs = qs.filter(username__icontains=search)
        return qs


class UserDetailView(generics.RetrieveAPIView):
    serializer_class = PublicUserSerializer
    queryset = User.objects.all()
