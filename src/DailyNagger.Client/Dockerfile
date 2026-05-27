FROM node:24.11.1 AS development
WORKDIR /app

COPY src/DailyNagger.Client/package*.json ./
RUN npm ci

COPY src/DailyNagger.Client ./

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
