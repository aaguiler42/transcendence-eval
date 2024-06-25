#!/bin/bash

ln -s /media media
echo "POSTGRES_DB_NAME=${POSTGRES_DB_NAME}" > .env
echo "POSTGRES_DB_USER=${POSTGRES_DB_USER}" >> .env
echo "POSTGRES_DB_PASSWORD=${POSTGRES_DB_PASSWORD}" >> .env
echo "POSTGRES_DB_HOST=${POSTGRES_DB_HOST}" >> .env
echo "POSTGRES_DB_PORT=${POSTGRES_DB_PORT}" >> .env

echo "CLIENT_ID=${CLIENT_ID}" >> .env
echo "CLIENT_SECRET=${CLIENT_SECRET}" >> .env
echo "FERNET_KEY=${FERNET_KEY}" >> .env
echo "BASE_URL=https://${IP_BACKEND}" >> .env
echo "SECRET_KEY=${SECRET_KEY}" >> .env
echo "DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}" >> .env

echo ".env is created for Django!"
sleep 10
if [ -d "media/venv" ]; then
    echo "Virtual enviroment already config!"
    source /media/venv/bin/activate
else
    pip install --upgrade pip
    python3 -m venv /media/venv
    source /media/venv/bin/activate
    echo "Creating Virtual enviroment!"
    pip install python-dotenv
    pip install psycopg
    pip install --upgrade setuptools 
    pip install cryptography==42.0.5
    pip install -r requirements.txt
    python3 manage.py migrate
fi

echo "DJANGO configuration complete!"
daphne -e ssl:8000:privateKey=${CERTS_KEY}:certKey=${CERTS_} transcendence.asgi:application
