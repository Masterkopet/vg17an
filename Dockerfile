# Alternatif deploy Coolify (Build Pack: Dockerfile). Port yang di-expose: 80.
# Pakai ini bila Build Pack "Static" bermasalah. Menyajikan situs statis via Nginx.
FROM nginx:alpine
COPY index.html qr.html /usr/share/nginx/html/
EXPOSE 80
