import jwt
from datetime import datetime, timedelta

                                     
secret = "da26ee4395ddf17721ff931a45f997fe7f5d729f4292cda1b3848ff6c0eb8e8a"                                

                    
payload = {
    "sub": "test_user",                             
    "exp": datetime.utcnow() + timedelta(hours=2),                                      
}

                    
token = jwt.encode(payload, secret, algorithm="HS256")
print("Generated JWT Token:", token)