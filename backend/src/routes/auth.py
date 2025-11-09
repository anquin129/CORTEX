import os
import jwt
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from azure.cosmos import CosmosClient
from pydantic import BaseModel

# --- Config ---
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

router = APIRouter(prefix="/auth", tags=["auth"])

# --- Cosmos connection ---
client = CosmosClient(os.getenv("COSMOS_URL"), credential=os.getenv("COSMOS_KEY"))
database = client.get_database_client(os.getenv("COSMOS_DB"))
users_container = database.get_container_client("users")

# --- Models ---
class UserIn(BaseModel):
    email: str
    password: str

# --- Helper: JWT creation ---
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- Signup Route ---
@router.post("/signup")
async def signup(user: UserIn):
    email = user.email
    password = user.password

    # Check if user already exists
    query = f"SELECT * FROM c WHERE c.email = '{email}'"
    users = list(users_container.query_items(query, enable_cross_partition_query=True))
    if users:
        raise HTTPException(status_code=400, detail="Email already registered")
    if not isinstance(password, str):
        raise HTTPException(status_code=400, detail="Invalid password format")

    if len(password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="Password too long (max 72 bytes)")



    hashed_pw = pwd_context.hash(password)
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "hashed_password": hashed_pw,
        "created_at": datetime.utcnow().isoformat(),
    }
    users_container.create_item(user_doc)

    token = create_access_token({"sub": email})
    return {"access_token": token, "token_type": "bearer"}

# --- Login Route ---
@router.post("/login")
async def login(user: UserIn):
    email = user.email
    password = user.password

    query = f"SELECT * FROM c WHERE c.email = '{email}'"
    users = list(users_container.query_items(query, enable_cross_partition_query=True))
    if not users or not pwd_context.verify(password, users[0]["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": email})
    return {"access_token": token, "token_type": "bearer"}

# --- Auth Dependency for Protected Routes ---
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]  # user's email
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
