
FROM python:3.11-slim

WORKDIR /app
COPY . /app

RUN pip install --no-cache-dir flask fpdf

EXPOSE 10000
CMD ["python", "app.py"]
