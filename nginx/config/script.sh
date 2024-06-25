#! /bin/bash

echo "Starting Nginx..."

sed -i -r "s/localhost/${IP_BACKEND}/g" /app/constants.js

openssl req ${CERTS_REQ}                            \
    -keyout ${CERTS_KEY}                            \
    -out ${CERTS_}                                  \
    -subj ${CERTS_OPT}

sed -i -r "s@certificate_dir@${CERTS_}@g" /etc/nginx/nginx.conf
sed -i -r "s@key_dir@${CERTS_KEY}@g" /etc/nginx/nginx.conf

echo "NGINX configuration complete!"

nginx -g "daemon off;"