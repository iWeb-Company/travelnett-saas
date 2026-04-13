FROM node:latest

WORKDIR /app

# Variables de entorno de build (NEXT_PUBLIC_* se hornean en el bundle en tiempo de build)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DATA_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DATA_URL=$NEXT_PUBLIC_DATA_URL

COPY . .

RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]