import hashlib
import secrets
import bcrypt

from datetime import datetime, timedelta, timezone

from itsdangerous import URLSafeTimedSerializer, BadSignature


# Session configuration
SESSION_COOKIE_NAME = "medsearch_session"
SESSION_DURATION_HOURS = 24


def hash_password(password: str) -> str:
    """Hash a password securely using bcrypt."""

    password_bytes = password.encode("utf-8")

    # bcrypt supports passwords up to 72 bytes.
    if len(password_bytes) > 72:
        raise ValueError(
            "Password must not exceed 72 UTF-8 bytes."
        )

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt(rounds=12),
    )

    return hashed.decode("utf-8")


def verify_password(
    password: str,
    password_hash: str,
) -> bool:
    """Verify a password against its stored bcrypt hash."""

    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def generate_session_token() -> str:
    """Generate a cryptographically secure session token."""

    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    """Hash a session token before storing it in SQLite."""

    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def get_session_expiry() -> datetime:
    """Return the session expiration time in UTC."""

    return datetime.now(timezone.utc) + timedelta(
        hours=SESSION_DURATION_HOURS
    )


def create_session_serializer(secret_key: str):
    """Create a serializer for signing session-related data."""

    return URLSafeTimedSerializer(
        secret_key,
        salt="medsearch-ai-session",
    )