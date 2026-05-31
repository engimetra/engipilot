# =========================
# STAGE 1 : BUILD BACKEND
# =========================
FROM eclipse-temurin:21.0.5_11-jdk-alpine AS builder

WORKDIR /app

# Copier Maven wrapper + config
COPY pom.xml mvnw ./
COPY .mvn .mvn

# 🔥 FIX IMPORTANT : rendre mvnw exécutable dans Docker
RUN chmod +x mvnw

# Télécharger dépendances
RUN ./mvnw dependency:go-offline -q

# Copier le code source
COPY src ./src

# Build Spring Boot
RUN ./mvnw clean package -DskipTests -q


# =========================
# STAGE 2 : RUNTIME
# =========================
FROM eclipse-temurin:21.0.5_11-jre-alpine

WORKDIR /app

# Créer user non-root (sécurité)
RUN addgroup -S engipilot && adduser -S engipilot -G engipilot

USER engipilot

# Copier le jar buildé
COPY --from=builder /app/target/*.jar app.jar

# Port Spring Boot (ajuste si besoin)
EXPOSE 8080

# Lancer application
ENTRYPOINT ["java", "-jar", "app.jar"]