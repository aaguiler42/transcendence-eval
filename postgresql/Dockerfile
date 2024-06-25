# PostgreSQL

FROM postgres:16.1-bookworm

WORKDIR /home

RUN apt-get update 
RUN pg_createcluster 16 main --start

COPY ./config/config.sh ./config.sh

RUN chmod 700 /var/lib/postgresql/16/main
RUN chmod 775 /etc/postgresql/16/main/pg_hba.conf 
RUN chmod +x ./config.sh

EXPOSE 5432

CMD ["./config.sh"]