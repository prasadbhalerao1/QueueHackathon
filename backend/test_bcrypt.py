import bcrypt
password = b"password"
hashed = bcrypt.hashpw(password, bcrypt.gensalt())
print(hashed.decode())
