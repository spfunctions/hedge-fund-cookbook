FROM node:22-slim

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src

ENV SF_API_URL=https://simplefunctions.dev
EXPOSE 8787
CMD ["npm", "run", "server"]
