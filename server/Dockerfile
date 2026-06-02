FROM python:3.11-alpine
WORKDIR /app
COPY requirements.txt .
RUN apk add --no-cache gcc musl-dev libpq-dev \
    && pip install --no-cache-dir -r requirements.txt \
    && apk del gcc musl-dev
COPY . .
CMD ["python", "main.py"]
