FROM node:16.3.0-alpine AS base
LABEL Description="Dockerfile for Moffitt Projects using NodeJS"
WORKDIR "/app"

FROM base AS deps
COPY package.json /app/
COPY package-lock.json /app/
RUN npm i

FROM deps AS prodbase
COPY . /app/
RUN npm i

FROM deps AS dev
COPY . /app/
RUN npm run build

FROM prodbase AS prod
COPY config/config.js /app/config/config.js
COPY --from=dev --chown=node /app/dist/ /app/dist/
COPY --from=prodbase --chown=node /app/node_modules/ /app/node_modules/

USER node
CMD ["npm", "run", "start:prod"]
EXPOSE 3000
