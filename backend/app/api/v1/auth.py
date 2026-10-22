from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from backend.app.models.user import User, UserRole
from backend.app.schemas.auth import Token, UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

# Seed default demo users for each role if not present
def get_or_create_default_users(db: Session):
    roles = [
        ("admin@smarttraffic.pune.gov.in", "Admin@123", "PMRDA Senior Traffic Architect", UserRole.ADMIN),
        ("operator@smarttraffic.pune.gov.in", "Operator@123", "Hinjawadi Control Room Operator", UserRole.OPERATOR),
        ("commuter@punecity.in", "Commuter@123", "Daily Tech Park Commuter", UserRole.COMMUTER),
        ("emergency@ems.pune.gov.in", "Emergency@123", "Pune Rapid Emergency Response 108", UserRole.EMERGENCY),
    ]
    for email, pwd, name, role in roles:
        existing = db.query(User).filter(User.email == email).first()
        if not existing:
            u = User(
                email=email,
                hashed_password=hash_password(pwd),
                full_name=name,
                role=role,
                is_active=True
            )
            db.add(u)
    db.commit()

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        # Fallback to demo commuter if no token provided in development/demo mode
        demo_user = db.query(User).filter(User.role == UserRole.COMMUTER).first()
        if demo_user:
            return demo_user
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    email = payload.get("sub") or payload.get("email")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def require_roles(allowed_roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires role in {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    get_or_create_default_users(db)
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token({"sub": user.email, "role": user.role.value, "user_id": user.id})
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        full_name=user.full_name
    )

@router.post("/register", response_model=UserResponse)
def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
