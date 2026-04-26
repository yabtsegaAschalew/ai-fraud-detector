from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import numpy as np
import joblib
from dotenv import load_dotenv
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
from fastapi.middleware.cors import CORSMiddleware


                            
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path)

DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://192.168.139.132:3001").split(",")

                        
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

                                                                              
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
iso_forest = joblib.load(os.path.join(BASE_DIR, 'iso_forest_model.pkl'))
encoder = joblib.load(os.path.join(BASE_DIR, 'onehot_encoder.pkl'))

                                
conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

                                    
try:
    redis_client = redis.StrictRedis.from_url(REDIS_URL) if REDIS_URL else None
except Exception:
    redis_client = None


                                            
class Transaction(BaseModel):
    account_id: str = Field(..., min_length=1, max_length=100)
    TransactionAmount: float = Field(..., ge=0)
    CustomerAge: int = Field(..., ge=18, le=120)
    TransactionDuration: float = Field(..., ge=0)
    LoginAttempts: int = Field(..., ge=0)
    AccountBalance: float
    user_transaction_count: float = Field(..., ge=0)
    user_avg_transaction_amount: float = Field(..., ge=0)
    deviation_from_user_avg: float
    transaction_hour: int = Field(..., ge=0, le=23)
    transaction_day_of_week: int = Field(..., ge=0, le=6)
    TransactionType: str = Field(..., min_length=1, max_length=50)
    Location: str = Field(..., min_length=1, max_length=100)
    Channel: str = Field(..., min_length=1, max_length=50)
    CustomerOccupation: str = Field(..., min_length=1, max_length=100)
    user_primary_location: str = Field(..., min_length=1, max_length=100)
    is_unusual_location: str = Field(..., min_length=1, max_length=10)

                                  
@app.post("/transactions/ingest")
async def ingest_transaction(transaction: Transaction):
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO transactions (
                    account_id, amount, location, event_time, is_fraud, fraud_probability,
                    user_transaction_count, user_avg_transaction_amount, deviation_from_user_avg,
                    transaction_hour, transaction_day_of_week, transaction_type, channel,
                    customer_age, customer_occupation, login_attempts, account_balance, user_primary_location, is_unusual_location
                )
                VALUES (%s, %s, %s, NOW(), NULL, NULL, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    str(transaction.account_id),
                    float(transaction.TransactionAmount),
                    str(transaction.Location),
                    float(transaction.user_transaction_count),
                    float(transaction.user_avg_transaction_amount),
                    float(transaction.deviation_from_user_avg),
                    int(transaction.transaction_hour),
                    int(transaction.transaction_day_of_week),
                    str(transaction.TransactionType),
                    str(transaction.Channel),
                    int(transaction.CustomerAge),
                    str(transaction.CustomerOccupation),
                    int(transaction.LoginAttempts),
                    float(transaction.AccountBalance),
                    str(transaction.user_primary_location),
                    str(transaction.is_unusual_location)
                ),
            )
        conn.commit()
        return {"message": "Transaction ingested successfully", "data": transaction.model_dump()}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

                                                
@app.post("/transactions/score")
async def score_transaction(transaction: Transaction):
    try:
                                     
        numeric_features = np.array([
            transaction.TransactionAmount,
            transaction.CustomerAge,
            transaction.TransactionDuration,
            transaction.LoginAttempts,
            transaction.AccountBalance,
            transaction.user_transaction_count,
            transaction.user_avg_transaction_amount,
            transaction.deviation_from_user_avg,
            transaction.transaction_hour,
            transaction.transaction_day_of_week,
        ]).reshape(1, -1)

        categorical_features = encoder.transform([[
            transaction.TransactionType,
            transaction.Location,
            transaction.Channel,
            transaction.CustomerOccupation,
            transaction.user_primary_location,
            transaction.is_unusual_location
        ]])

        features = np.hstack((numeric_features, categorical_features)).astype(np.float32)

                                                           
        anomaly_score = float(-iso_forest.decision_function(features)[0])
        is_fraud = bool(iso_forest.predict(features)[0] == -1)

                                      
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO transactions (
                    account_id, amount, location, event_time, is_fraud, fraud_probability,
                    user_transaction_count, user_avg_transaction_amount, deviation_from_user_avg,
                    transaction_hour, transaction_day_of_week, transaction_type, channel,
                    customer_age, customer_occupation, login_attempts, account_balance, user_primary_location, is_unusual_location
                )
                VALUES (%s, %s, %s, NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    str(transaction.account_id),
                    float(transaction.TransactionAmount),
                    str(transaction.Location),
                    is_fraud,
                    anomaly_score,
                    float(transaction.user_transaction_count),
                    float(transaction.user_avg_transaction_amount),
                    float(transaction.deviation_from_user_avg),
                    int(transaction.transaction_hour),
                    int(transaction.transaction_day_of_week),
                    str(transaction.TransactionType),
                    str(transaction.Channel),
                    int(transaction.CustomerAge),
                    str(transaction.CustomerOccupation),
                    int(transaction.LoginAttempts),
                    float(transaction.AccountBalance),
                    str(transaction.user_primary_location),
                    str(transaction.is_unusual_location)
                ),
            )
        conn.commit()

        return {"anomaly_score": anomaly_score, "is_fraud": is_fraud}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/transactions/history")
async def get_transaction_history():
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM transactions ORDER BY event_time DESC LIMIT 50")
            rows = cur.fetchall()
        return rows
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")