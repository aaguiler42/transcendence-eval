FROM debian:bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y nginx openssl

COPY ./config/nginx.conf /etc/nginx/nginx.conf

COPY /config/script.sh ./script.sh
COPY ./project/ ./

RUN chmod 775 script.sh
RUN chmod -R 775 ./

EXPOSE 3000

CMD ["./script.sh"]