FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build -- --configuration production

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN find /usr/share/nginx/html -mindepth 1 -delete

COPY --from=build /app/dist/frontend/browser/ /usr/share/nginx/html/

RUN if [ -f /usr/share/nginx/html/index.csr.html ]; then cp /usr/share/nginx/html/index.csr.html /usr/share/nginx/html/index.html; fi

EXPOSE 80
