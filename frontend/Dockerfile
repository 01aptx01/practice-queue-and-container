FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

# Next.js starts on port 3000
EXPOSE 3000
CMD ["npm", "start"]
