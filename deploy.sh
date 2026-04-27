
pip install --upgrade pip
pip install -r requirements.txt

pip install joblib scikit-learn

uvicorn app.main:app --host 0.0.0.0 --port 8000
