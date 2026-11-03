import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request, Response, status

from app.database.connection import get_db_connection
from app.core.security import (
    SESSION_COOKIE_NAME,
    SESSION_DURATION_HOURS,
    generate_session_token,
    hash_session_token,
    hash_password,
    verify_password,
)
from app.schemas.auth import SignupRequest, LoginRequest


router = APIRouter(
    prefix="/v1/auth",
    tags=["Authentication"],
)


# ============================================================
# CONFIGURATION
# ============================================================

COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"


# ============================================================
# USER RESPONSE
# ============================================================

def create_user_response(row):
    """Return public user information without exposing password hashes."""

    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
    }


# ============================================================
# SESSION MANAGEMENT
# ============================================================

def set_session_cookie(response: Response, token: str):
    """Set a secure, HTTP-only session cookie."""

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_DURATION_HOURS * 60 * 60,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


def get_authenticated_user(request: Request):
    """Validate the session and return the authenticated user."""

    token = request.cookies.get(SESSION_COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in to continue.",
        )

    token_hash = hash_session_token(token)

    current_time = datetime.now(timezone.utc).isoformat()

    with get_db_connection() as connection:
        row = connection.execute(
            """
            SELECT
                users.id,
                users.name,
                users.email,
                users.is_active,
                users.created_at
            FROM sessions
            JOIN users
                ON users.id = sessions.user_id
            WHERE sessions.token_hash = ?
              AND sessions.expires_at > ?
              AND users.is_active = 1
            """,
            (token_hash, current_time),
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please log in again.",
        )

    return create_user_response(row)


# ============================================================
# SIGNUP
# ============================================================

@router.post(
    "/signup",
    status_code=status.HTTP_201_CREATED,
)
def signup(
    payload: SignupRequest,
    response: Response,
):
    """Register a new user and create a session."""

    name = payload.name.strip()
    email = str(payload.email).strip().lower()
    password = payload.password

    if len(name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid name.",
        )

    try:
        password_hash = hash_password(password)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    token = generate_session_token()

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(hours=SESSION_DURATION_HOURS)
    ).isoformat()

    with get_db_connection() as connection:

        existing_user = connection.execute(
            """
            SELECT id
            FROM users
            WHERE email = ?
            """,
            (email,),
        ).fetchone()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        cursor = connection.execute(
            """
            INSERT INTO users (
                name,
                email,
                password_hash
            )
            VALUES (?, ?, ?)
            """,
            (name, email, password_hash),
        )

        user_id = cursor.lastrowid

        connection.execute(
            """
            INSERT INTO sessions (
                user_id,
                token_hash,
                expires_at
            )
            VALUES (?, ?, ?)
            """,
            (
                user_id,
                hash_session_token(token),
                expires_at,
            ),
        )

        row = connection.execute(
            """
            SELECT
                id,
                name,
                email,
                is_active,
                created_at
            FROM users
            WHERE id = ?
            """,
            (user_id,),
        ).fetchone()

        user = create_user_response(row)

    set_session_cookie(response, token)

    return {
        "message": "Account created successfully.",
        "user": user,
    }


# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
def login(
    payload: LoginRequest,
    response: Response,
):
    """Authenticate an existing user and create a session."""

    email = str(payload.email).strip().lower()

    with get_db_connection() as connection:

        row = connection.execute(
            """
            SELECT
                id,
                name,
                email,
                password_hash,
                is_active,
                created_at
            FROM users
            WHERE email = ?
            """,
            (email,),
        ).fetchone()

        if (
            row is None
            or not verify_password(
                payload.password,
                row["password_hash"],
            )
            or not row["is_active"]
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        token = generate_session_token()

        expires_at = (
            datetime.now(timezone.utc)
            + timedelta(hours=SESSION_DURATION_HOURS)
        ).isoformat()

        connection.execute(
            """
            INSERT INTO sessions (
                user_id,
                token_hash,
                expires_at
            )
            VALUES (?, ?, ?)
            """,
            (
                row["id"],
                hash_session_token(token),
                expires_at,
            ),
        )

        user = create_user_response(row)

    set_session_cookie(response, token)

    return {
        "message": "Login successful.",
        "user": user,
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get("/me")
def current_user(request: Request):
    """Return the currently authenticated user."""

    return {
        "user": get_authenticated_user(request),
    }


# ============================================================
# LOGOUT
# ============================================================

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
):
    """Invalidate the session and clear the session cookie."""

    token = request.cookies.get(SESSION_COOKIE_NAME)

    if token:
        with get_db_connection() as connection:
            connection.execute(
                """
                DELETE FROM sessions
                WHERE token_hash = ?
                """,
                (hash_session_token(token),),
            )

    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
    )

    return {
        "message": "Logged out successfully.",
    }