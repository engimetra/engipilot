package com.engipilot.util;

import com.engipilot.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /** Surcharge pratique — extrait les claims depuis l'entité User. */
    public String generateToken(User user) {
        return generateToken(
            user.getId(),
            user.getEmail(),
            user.getRole().name(),
            user.getOrganisation().getId()
        );
    }

    /**
     * Génère un token JWT avec les claims ENGIPILOT
     */
    public String generateToken(UUID userId, String email, String role, UUID orgId) {
        return Jwts.builder()
            // jjwt 0.12.x : subject() et non setSubject()
            .subject(userId.toString())
            .claim("email", email)
            .claim("role", role)
            .claim("organisationId", orgId.toString())
            // jjwt 0.12.x : issuedAt() et non setIssuedAt()
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            // jjwt 0.12.x : signWith(key) sans spécifier l'algo
            .signWith(getKey())
            .compact();
    }

    /**
     * Extrait les claims du token (jjwt 0.12.x API)
     */
    public Claims extractClaims(String token) {
        return Jwts.parser()                    // 0.12.x : parser() non parserBuilder()
            .verifyWith(getKey())               // 0.12.x : verifyWith() non setSigningKey()
            .build()
            .parseSignedClaims(token)           // 0.12.x : parseSignedClaims() non parseClaimsJws()
            .getPayload();
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(extractClaims(token).getSubject());
    }

    public String extractEmail(String token) {
        return extractClaims(token).get("email", String.class);
    }

    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }

    public UUID extractOrganisationId(String token) {
        return UUID.fromString(
            extractClaims(token).get("organisationId", String.class)
        );
    }

    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractClaims(token).getExpiration().before(new Date());
        } catch (JwtException e) {
            return true;
        }
    }
}
