FROM python:3.10.6-buster

WORKDIR /app

RUN apt-get update && apt-get install -y python3-dev libffi-dev openssl

COPY ./project/ ./
COPY ./config/script.sh ./script.sh

RUN chmod 775 script.sh

EXPOSE 8000

CMD ["./script.sh"]