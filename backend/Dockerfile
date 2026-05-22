# ── Stage 1 : Build ──────────────────────────────────────────────
FROM eclipse-temurin:21.0.5_11-jdk-alpine AS builder
# Version épinglée : temurin 21.0.5

WORKDIR /app
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline -q
COPY src ./src
RUN ./mvnw clean package -DskipTests -q

# Layer extraction pour cache Docker optimal
RUN java -Djarmode=layertools -jar target/*.jar extract

# ── Stage 2 : Runtime (image finale légère) ──────────────────────
FROM eclipse-temurin:21.0.5_11-jre-alpine
# Version épinglée identique au stage build

WORKDIR /app

# Utilisateur non-root
RUN addgroup -S engipilot && adduser -S engipilot -G engipilot

# Copier les layers Spring Boot (du plus stable au plus volatile)
COPY --from=builder /app/dependencies/         ./
COPY --from=builder /app/spring-boot-loader/   ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/          ./

USER engipilot
EXPOSE 8080

# HEALTHCHECK intégré dans l'image
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:+UseG1GC", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "org.springframework.boot.loader.launch.JarLauncher"]
