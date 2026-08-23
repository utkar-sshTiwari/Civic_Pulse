from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone

from jose import jwt

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)


SECRET_KEY = "dev-secret-change-this-later"
ALGORITHM = "HS256"



def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)





def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=1)

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
