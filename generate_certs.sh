#!/bin/sh
mkdir -p server/certs
openssl req -x509 -newkey rsa:2048 \
  -keyout server/certs/server.key \
  -out server/certs/server.crt \
  -days 365 -nodes \
  -subj "/CN=localhost"
echo "Certs generated in server/certs/"
