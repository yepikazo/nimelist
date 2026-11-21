#!/bin/sh
set -eu

psql \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=catalog_password="$CATALOG_DB_PASSWORD" \
  --set=schedule_password="$SCHEDULE_DB_PASSWORD" \
  --set=search_password="$SEARCH_DB_PASSWORD" <<'SQL'
CREATE ROLE nimelist_catalog LOGIN PASSWORD :'catalog_password';
CREATE ROLE nimelist_schedule LOGIN PASSWORD :'schedule_password';
CREATE ROLE nimelist_search LOGIN PASSWORD :'search_password';

CREATE DATABASE nimelist_catalog OWNER nimelist_catalog;
CREATE DATABASE nimelist_schedule OWNER nimelist_schedule;
CREATE DATABASE nimelist_search OWNER nimelist_search;
SQL
