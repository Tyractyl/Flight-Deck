FROM node:20-alpine AS builder
WORKDIR /app
# The playwright devDependency must not pull browser binaries into the image
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 17000
CMD ["nginx", "-g", "daemon off;"]
