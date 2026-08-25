FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY ml_service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ml_service/predict.py ./
COPY ml_service/logistic_model.pkl ./
COPY ml_service/random_forest_model.pkl ./
COPY ml_service/scaler.pkl ./
COPY ml_service/feature_columns.pkl ./
COPY ml_service/admission_map.pkl ./
COPY ml_service/app.py ./app.py

EXPOSE 5001

CMD ["python", "app.py"]
