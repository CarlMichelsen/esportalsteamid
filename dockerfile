FROM alpine

WORKDIR /app

RUN apk update
RUN apk add --update nodejs
RUN apk add --update npm
RUN apk add --update chromium

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_BIN=/usr/bin/chromium-browser

COPY . .

RUN npm install
RUN npm run lint
RUN npm run build

ENTRYPOINT [ "npm", "run", "start" ]