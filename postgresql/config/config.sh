#!/bin/bash

echo "host ${POSTGRES_DB_NAME} ${POSTGRES_DB_USER} ${POSTGRES_DB_IN_IP} md5" >> /etc/postgresql/16/main/pg_hba.conf
if [ -f "/var/lib/postgresql/check" ]; then
    cat /var/lib/postgresql/check
else
    service postgresql start
    su - ${POSTGRES_DB_SU} << EOF
    echo "CREATE USER ${POSTGRES_DB_USER} WITH PASSWORD '${POSTGRES_DB_PASSWORD}';" >> sql
    echo "CREATE DATABASE ${POSTGRES_DB_NAME};" >> sql
    echo "GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB_NAME} TO ${POSTGRES_DB_USER};" >> sql
    echo "ALTER USER ${POSTGRES_DB_USER} WITH SUPERUSER;" >> sql
    psql < sql
EOF
    service postgresql stop
    echo "Database is already config!" > /var/lib/postgresql/check
fi

echo "POSTGRESQL configuration complete!"

su - postgres -c '/usr/lib/postgresql/16/bin/postgres -D /var/lib/postgresql/16/main -c config_file=/etc/postgresql/16/main/postgresql.conf'