from dataclasses import dataclass
from typing import Optional


@dataclass
class User:
    id: int
    name: str
    email: str
    password_hash: str
    is_active: bool
    created_at: Optional[str] = None

    @classmethod
    def from_row(cls, row):
        """Convert a SQLite database row into a User object."""

        return cls(
            id=row["id"],
            name=row["name"],
            email=row["email"],
            password_hash=row["password_hash"],
            is_active=bool(row["is_active"]),
            created_at=row["created_at"],
        )

    def to_public_dict(self):
        """Return user information without exposing the password hash."""

        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "is_active": self.is_active,
            "created_at": self.created_at,
        }