from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
try:
    print(pwd_context.hash("password"))
except Exception as e:
    print(f"Error: {e}")
