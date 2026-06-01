# ── Stage 1 : Build ──────────────────────────────────────────────
FROM eclipse-temurin:21.0.5_11-jdk-alpine AS builder

WORKDIR /app

# Copier wrapper Maven + permissions correctes
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN chmod +x mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline -q

# Build application
COPY src ./src
RUN ./mvnw clean package -DskipTests -q

# Extraction Spring Boot layers
RUN java -Djarmode=layertools -jar target/*.jar extract


# ── Stage 2 : Runtime (image légère) ────────────────────────────
FROM eclipse-temurin:21.0.5_11-jre-alpine

WORKDIR /app

# Utilisateur non-root (sécurité)
RUN addgroup -S engipilot && adduser -S engipilot -G engipilot

# Copier layers Spring Boot
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

USER engipilot

EXPOSE 8080

# Healthcheck (important pour nginx / docker)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

# ✅ ENTRYPOINT FIXÉ (CORRECT JSON 100%)
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-XX:+UseG1GC", "-Djava.security.egd=file:/dev/./urandom", "org.springframework.boot.loader.launch.JarLauncher"]