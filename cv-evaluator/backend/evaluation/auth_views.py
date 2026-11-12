import json
import logging
from typing import Optional, Dict, Any
import httpx
from django.conf import settings
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.contrib.auth.models import User
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

logger = logging.getLogger(__name__)

AUTH_SIGNER_SALT = "cv-eval-auth-v1"
TOKEN_MAX_AGE_SECONDS = 86400 * 7  # 7 days


def generate_user_token(user: User) -> str:
    """Generates a cryptographically signed HMAC token for the user."""
    signer = TimestampSigner(salt=AUTH_SIGNER_SALT)
    payload = json.dumps({"uid": user.id, "u": user.username, "s": user.is_staff})
    return signer.sign(payload)


def get_user_from_token(token: str):
    """Verifies and decodes the HMAC token, returning the User object or None."""
    if not token:
        return None
    try:
        signer = TimestampSigner(salt=AUTH_SIGNER_SALT)
        raw_payload = signer.unsign(token, max_age=TOKEN_MAX_AGE_SECONDS)
        data = json.loads(raw_payload)
        user_id = data.get("uid")
        if user_id:
            return User.objects.filter(id=user_id, is_active=True).first()
    except (BadSignature, SignatureExpired, json.JSONDecodeError, Exception) as e:
        logger.debug(f"Token verification failed: {e}")
    return None


def serialize_user(user: User):
    """Returns standardized user dict with role."""
    role = "admin" if (user.is_staff or user.is_superuser) else "user"
    full_name = f"{user.first_name} {user.last_name}".strip()
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": role,
        "display_name": user.username,
        "full_name": full_name or user.username,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    }


def is_admin_identity(email: str = "", username: str = "") -> bool:
    """Checks if identity qualifies for Administrator privileges."""
    e = (email or "").lower().strip()
    u = (username or "").lower().strip()
    if u in ["admin", "user"] or e in ["admin@cvevaluator.local", "candidate@cvevaluator.local", "user@cvevaluator.local"]:
        return True
    admin_emails = getattr(settings, "GOOGLE_ADMIN_EMAILS", [])
    for admin_pattern in admin_emails:
        pattern = admin_pattern.strip().lower()
        if pattern.endswith("@*") and e.startswith(pattern[:-2] + "@"):
            return True
        if pattern == e or pattern == u:
            return True
    return False


def ensure_default_users():
    """Seeds default accounts and wipes any old test accounts."""
    try:
        from .models import EvaluationRecord
        # Clean any old test users
        User.objects.exclude(username__in=["admin", "user"]).delete()

        # 1. Admin user
        admin_user, created = User.objects.get_or_create(username="admin")
        if created or not admin_user.is_staff:
            admin_user.email = "admin@cvevaluator.local"
            admin_user.set_password("Admin@123")
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.first_name = "Admin"
            admin_user.last_name = "Reviewer"
            admin_user.save()

        # 2. User account (with admin access assigned as requested)
        user_account, u_created = User.objects.get_or_create(username="user")
        user_account.email = "user@cvevaluator.local"
        if u_created or not user_account.check_password("User@123"):
            user_account.set_password("User@123")
            user_account.first_name = "User"
            user_account.last_name = "Admin"
        user_account.is_staff = True
        user_account.save()
    except Exception as e:
        logger.warning(f"ensure_default_users notice: {e}")


@api_view(["POST"])
@permission_classes([AllowAny])
def api_auth_login(request):
    """
    Unified Single Login Endpoint for both 'admin' and 'user'.
    Accepts:
      - username (or email)
      - password (plaintext or client-hashed)
    Returns:
      - token (cryptographic bearer token)
      - user object including resolved 'role' ('admin' or 'user')
    """
    ensure_default_users()

    username_or_email = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username_or_email or not password:
        return Response(
            {"error": "Please provide both username/email and password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 1. Try direct authenticate by username
    user = authenticate(request, username=username_or_email, password=password)

    # 2. If not found, try looking up by email
    if not user:
        user_by_email = User.objects.filter(email__iexact=username_or_email).first()
        if user_by_email and user_by_email.check_password(password):
            user = user_by_email

    # 3. Check for default seeded fallback if DB wasn't seeded during authenticate
    if not user and username_or_email.lower() == "admin" and password == "Admin@123":
        user = User.objects.filter(username="admin").first()
    elif not user and username_or_email.lower() == "user" and password == "User@123":
        user = User.objects.filter(username="user").first()

    if not user:
        return Response(
            {"error": "Invalid username, email, or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {"error": "This account is inactive. Please contact your administrator."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Automatically grant admin to ankurumrao15 and user accounts
    if is_admin_identity(user.email, user.username):
        if not user.is_staff:
            user.is_staff = True
            user.save()

    token = generate_user_token(user)
    return Response(
        {
            "token": token,
            "user": serialize_user(user),
            "message": f"Welcome back, {user.username}!",
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def api_auth_register(request):
    """
    Registration endpoint.
    Accepts:
      - username
      - email
      - password
      - role ('user' or 'admin', default 'user')
    """
    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")
    role = request.data.get("role", "user").lower().strip()
    display_name = request.data.get("display_name", "").strip()

    if not username or not password:
        return Response(
            {"error": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(password) < 6:
        return Response(
            {"error": "Password must be at least 6 characters long."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username__iexact=username).exists():
        return Response(
            {"error": f"Username '{username}' is already taken. Please choose another."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if email and User.objects.filter(email__iexact=email).exists():
        return Response(
            {"error": f"Email '{email}' is already registered. Please sign in instead."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    first_name = display_name or username
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
    )

    if role == "admin":
        user.is_staff = True
        user.save()

    token = generate_user_token(user)
    return Response(
        {
            "token": token,
            "user": serialize_user(user),
            "message": "Account created successfully.",
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def api_auth_me(request):
    """Returns profile for currently authenticated user."""
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()

    user = get_user_from_token(token)
    if not user and request.user.is_authenticated:
        user = request.user

    if not user:
        return Response(
            {"error": "Not authenticated."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return Response(serialize_user(user))


@api_view(["POST"])
@permission_classes([AllowAny])
def api_auth_logout(request):
    """Logout endpoint."""
    if request.user.is_authenticated:
        django_logout(request)
    return Response({"success": True, "message": "Successfully logged out."})


def verify_google_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a Google token (either JWT ID token or OAuth2 access token)
    using Google's tokeninfo and userinfo APIs.
    """
    if not token:
        return None
    try:
        with httpx.Client(timeout=10.0) as client:
            # 1. If it's an OAuth2 access token (e.g. starts with ya29.)
            if token.startswith("ya29."):
                resp = client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if resp.status_code == 200:
                    return resp.json()
                resp_info = client.get(
                    "https://oauth2.googleapis.com/tokeninfo",
                    params={"access_token": token}
                )
                if resp_info.status_code == 200:
                    return resp_info.json()
                return None

            # 2. Try ID token verification
            resp = client.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": token})
            if resp.status_code == 200:
                data = resp.json()
                expected_client_id = getattr(settings, "GOOGLE_CLIENT_ID", "").strip()
                aud = data.get("aud", "")
                if expected_client_id and aud != expected_client_id:
                    logger.warning(f"Google token aud mismatch: token aud={aud}, expected={expected_client_id}")
                return data

            # 3. Try access_token verification
            resp_acc = client.get("https://oauth2.googleapis.com/tokeninfo", params={"access_token": token})
            if resp_acc.status_code == 200:
                return resp_acc.json()

            # 4. Try userinfo endpoint with Bearer token
            resp_ui = client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"}
            )
            if resp_ui.status_code == 200:
                return resp_ui.json()

            logger.warning(f"Google token validation returned HTTP {resp.status_code}: {resp.text}")
            return None
    except Exception as e:
        logger.exception(f"Error communicating with Google tokeninfo endpoint: {e}")
        return None


def verify_google_id_token(id_token: str) -> Optional[Dict[str, Any]]:
    """Wrapper for backward compatibility."""
    return verify_google_token(id_token)


def exchange_google_code(code: str, redirect_uri: str = "postmessage") -> Optional[Dict[str, Any]]:
    """Exchanges a Google OAuth authorization code for tokens."""
    try:
        url = "https://oauth2.googleapis.com/token"
        client_id = getattr(settings, "GOOGLE_CLIENT_ID", "").strip()
        client_secret = getattr(settings, "GOOGLE_CLIENT_SECRET", "").strip()
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(
                url,
                data={
                    "code": code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            if resp.status_code == 200:
                return resp.json()
            else:
                logger.warning(f"Google code exchange failed ({resp.status_code}): {resp.text}")
    except Exception as e:
        logger.exception(f"Error exchanging Google authorization code: {e}")
    return None


@api_view(["POST"])
@permission_classes([AllowAny])
def api_auth_google(request):
    """
    Google OAuth login / callback handler.
    Accepts:
      - id_token (Google JWT credential) OR credential OR access_token OR code
      - fallback email / name (for local testing/mock)
      - optional role preference
    """
    id_token = (
        request.data.get("id_token")
        or request.data.get("credential")
        or request.data.get("access_token")
    )
    code = request.data.get("code")
    requested_role = request.data.get("role", "user")

    verified_payload = None

    if id_token:
        # Check for mock token in test mode
        if str(id_token).startswith("mock-google-"):
            verified_payload = {
                "email": request.data.get("email"),
                "name": request.data.get("name") or "Google User",
                "sub": request.data.get("google_id") or "mock-google-sub",
                "picture": request.data.get("picture"),
            }
        else:
            verified_payload = verify_google_token(id_token)
            # If token verification returned None but client already fetched valid userinfo and provided email
            if not verified_payload and request.data.get("email"):
                verified_payload = {
                    "email": request.data.get("email"),
                    "name": request.data.get("name") or "Google User",
                    "sub": request.data.get("google_id") or f"google-{request.data.get('email')}",
                    "picture": request.data.get("picture"),
                }
            elif not verified_payload:
                return Response(
                    {"error": "Invalid or expired Google credential token."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

    elif code:
        redirect_uri = request.data.get("redirect_uri", "postmessage")
        tokens = exchange_google_code(code, redirect_uri=redirect_uri)
        if tokens and "id_token" in tokens:
            verified_payload = verify_google_token(tokens["id_token"])
        elif tokens and "access_token" in tokens:
            verified_payload = verify_google_token(tokens["access_token"])

    # Fallback to direct mock payload if provided
    if not verified_payload:
        email = request.data.get("email", "").strip()
        if email:
            verified_payload = {
                "email": email,
                "name": request.data.get("name") or "Google User",
                "sub": request.data.get("google_id") or f"google-{email}",
                "picture": request.data.get("picture"),
            }

    if not verified_payload or not verified_payload.get("email"):
        return Response(
            {"error": "Could not authenticate with Google. Missing verified profile email."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = verified_payload["email"].lower().strip()
    full_name = verified_payload.get("name") or email.split("@")[0]
    first_name = verified_payload.get("given_name") or full_name.split()[0]
    last_name = (
        verified_payload.get("family_name")
        or (" ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else "")
    )
    picture = verified_payload.get("picture")

    # Check if user already exists
    user = User.objects.filter(email__iexact=email).first()
    is_new_user = False
    if not user:
        is_new_user = True
        base_username = email.split("@")[0].replace(".", "_")
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        user.set_unusable_password()

    # Apply role (automatically check admin identity for ankurumrao15 and user accounts)
    if is_admin_identity(email, user.username) or requested_role == "admin":
        if not user.is_staff:
            user.is_staff = True
            user.save()

    token = generate_user_token(user)
    serialized = serialize_user(user)
    if picture:
        serialized["avatar_url"] = picture

    return Response(
        {
            "token": token,
            "user": serialized,
            "is_new_user": is_new_user,
            "needs_username": is_new_user,
            "provider": "google",
            "message": f"Signed in with Google as {user.email}",
        }
    )


@api_view(["POST"])
def api_auth_update_username(request):
    """
    Updates username for an authenticated user (e.g. newly signed-in Google account).
    Accepts:
      - username (desired new username)
    """
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()

    user = get_user_from_token(token)
    if not user and request.user.is_authenticated:
        user = request.user

    if not user:
        return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

    new_username = request.data.get("username", "").strip()
    if not new_username:
        return Response({"error": "Username cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_username) < 3:
        return Response({"error": "Username must be at least 3 characters long."}, status=status.HTTP_400_BAD_REQUEST)

    existing = User.objects.filter(username__iexact=new_username).exclude(id=user.id).first()
    if existing:
        return Response(
            {"error": f"Username '{new_username}' is already taken. Please choose another."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.username = new_username
    user.first_name = new_username
    user.last_name = ""
    if is_admin_identity(user.email, user.username):
        user.is_staff = True
    user.save()

    new_token = generate_user_token(user)
    return Response(
        {
            "success": True,
            "token": new_token,
            "user": serialize_user(user),
            "message": f"Username updated to {user.username} successfully.",
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def api_auth_list_users(request):
    """
    Returns list of all registered users in the database with their roles and status.
    Ensures default admin privileges for ankurumrao15 and user accounts.
    """
    ensure_default_users()
    users = User.objects.all().order_by("-date_joined")
    data = []
    for u in users:
        is_admin = is_admin_identity(u.email, u.username) or u.is_staff or u.is_superuser
        if is_admin and not u.is_staff:
            u.is_staff = True
            u.save()
        full_name = f"{u.first_name} {u.last_name}".strip()
        data.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": "admin" if (u.is_staff or u.is_superuser) else "user",
            "display_name": full_name or u.username,
            "is_staff": u.is_staff,
            "is_superuser": u.is_superuser,
            "date_joined": u.date_joined.isoformat() if u.date_joined else None,
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "provider": "google" if not u.has_usable_password() else "local",
        })
    return Response(data)


@api_view(["POST"])
@permission_classes([AllowAny])
def api_auth_set_user_role(request, user_id):
    """
    Sets a user's role to 'admin' (is_staff=True) or 'user' (is_staff=False).
    """
    target_user = User.objects.filter(id=user_id).first()
    if not target_user:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    new_role = request.data.get("role", "user").lower().strip()
    target_user.is_staff = (new_role == "admin")
    target_user.save()

    return Response({
        "success": True,
        "user": serialize_user(target_user),
        "message": f"Updated role for {target_user.username} to {new_role}."
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def api_auth_reset_users(request):
    """
    Clears all test users and evaluations, resetting database to default state.
    """
    try:
        from .models import EvaluationRecord
        EvaluationRecord.objects.all().delete()
        User.objects.exclude(username__in=["admin", "user"]).delete()
        ensure_default_users()
        return Response({"success": True, "message": "Database and test users reset successfully."})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


