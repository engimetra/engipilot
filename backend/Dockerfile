# ===== STAGE 1 : BUILD =====
FROM eclipse-temurin:21.0.5_11-jdk-alpine AS builder

WORKDIR /app

# Copier les fichiers Maven
COPY pom.xml mvnw ./
COPY .mvn .mvn

# 🔥 FIX CRITIQUE : permissions + format Linux
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Télécharger dépendances
RUN ./mvnw dependency:go-offline -q

# Copier le code source
COPY src ./src

# Build application
RUN ./mvnw clean package -DskipTests -q

# Extract Spring Boot layers
RUN java -Djarmode=layertools -jar target/*.jar extract


# ===== STAGE 2 : RUN =====
FROM eclipse-temurin:21.0.5_11-jre-alpine

WORKDIR /app

RUN addgroup -S engipilot && adduser -S engipilot -G engipilot

COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

USER engipilot

EXPOSE 8080

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]