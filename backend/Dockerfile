FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app/backend
COPY backend/pom.xml .
COPY backend/src ./src
COPY frontend ../frontend
RUN mvn -B package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/backend/target/early-warning-system-0.0.1-SNAPSHOT.jar app.jar

ENV SERVER_PORT=7860
ENV ML_SERVICE_URL=http://ml-service:5001

EXPOSE 7860

CMD ["java", "-jar", "app.jar"]
