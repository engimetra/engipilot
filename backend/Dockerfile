# =========================
# BUILD STAGE
# =========================
FROM eclipse-temurin:21.0.5_11-jdk-alpine AS builder

WORKDIR /app

# Copier fichiers Maven wrapper
COPY pom.xml mvnw ./
COPY .mvn .mvn

# 🔥 IMPORTANT : rendre mvnw exécutable (FIX 502 + permission denied)
RUN chmod +x mvnw

# Télécharger dépendances
RUN ./mvnw dependency:go-offline -q

# Copier le code source
COPY src ./src

# Build du projet
RUN ./mvnw clean package -DskipTests -q

# Extraire le jar Spring Boot
RUN java -Djarmode=layertools -jar target/*.jar extract


# =========================
# RUNTIME STAGE
# =========================
FROM eclipse-temurin:21.0.5_11-jre-alpine

WORKDIR /app

# créer utilisateur non-root
RUN addgroup -S engipilot && adduser -S engipilot -G engipilot

# copier artefacts build
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

USER engipilot

EXPOSE 8080

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]