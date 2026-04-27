
pip install --upgrade pip
pip install -r requirements.txt

pip install joblib scikit-learn

cd app
uvicorn main:app --host 0.0.0.0 --port 8000

