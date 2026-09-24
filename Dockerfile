# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Base: PHP 8.3 FPM + extensiones que usa la app
# ---------------------------------------------------------------------------
FROM php:8.3-fpm-alpine AS base

COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions bcmath intl opcache pcntl pdo_mysql pdo_pgsql zip

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /var/www/html

# ---------------------------------------------------------------------------
# Build: dependencias PHP + assets (Wayfinder necesita PHP y Node juntos)
# ---------------------------------------------------------------------------
FROM base AS build

COPY --from=node:22-alpine /usr/local/bin/node /usr/local/bin/node
COPY --from=node:22-alpine /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --no-autoloader --prefer-dist

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && APP_ENV=production APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= npm run build \
    && rm -rf node_modules

# ---------------------------------------------------------------------------
# Runtime: nginx + php-fpm
# ---------------------------------------------------------------------------
FROM base AS runtime

RUN apk add --no-cache nginx \
    && ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

COPY <<'EOF' /etc/nginx/http.d/default.conf
server {
    listen 80 default_server;
    server_name _;
    root /var/www/html/public;
    index index.php;
    charset utf-8;
    client_max_body_size 20M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

COPY <<'EOF' /usr/local/etc/php/conf.d/zz-app.ini
memory_limit = 256M
upload_max_filesize = 20M
post_max_size = 20M
expose_php = Off
opcache.enable = 1
opcache.validate_timestamps = 0
opcache.memory_consumption = 128
opcache.max_accelerated_files = 20000
EOF

COPY <<'EOF' /usr/local/etc/php-fpm.d/zz-app.conf
[www]
clear_env = no
EOF

COPY <<'EOF' /usr/local/bin/start-container
#!/bin/sh
set -e

cd /var/www/html

php artisan storage:link --force || true

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    php artisan migrate --force
fi

php artisan optimize

chown -R www-data:www-data storage bootstrap/cache

php-fpm -D
exec nginx -g 'daemon off;'
EOF

RUN chmod +x /usr/local/bin/start-container

COPY --from=build --chown=www-data:www-data /var/www/html /var/www/html

EXPOSE 80

CMD ["start-container"]
