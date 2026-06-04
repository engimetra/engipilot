package com.engipilot.service;

import com.engipilot.domain.Organisation;
import com.engipilot.domain.PlanType;
import com.engipilot.domain.User;
import com.engipilot.dto.request.LoginRequest;
import com.engipilot.dto.request.RegisterRequest;
import com.engipilot.dto.response.AuthResponse;
import com.engipilot.exception.ConflictException;
import com.engipilot.exception.ResourceNotFoundException;
import com.engipilot.repository.OrganisationRepository;
import com.engipilot.repository.UserRepository;
import com.engipilot.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final OrganisationRepository organisationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // ── LOGIN ──────────────────────────────────────────────────────────────
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> {
                log.warn("Tentative de login avec email inconnu : {}", request.email());
                return new BadCredentialsException("Email ou mot de passe incorrect");
            });

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            log.warn("Mot de passe incorrect pour : {}", request.email());
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }

        if (!user.isActive()) {
            throw new DisabledException("Compte désactivé. Contactez le support.");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user);
        return AuthResponse.of(token, user);
    }

    // ── REGISTER ───────────────────────────────────────────────────────────
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Cet email est déjà utilisé");
        }

        try {
            // Création de l'organisation
            Organisation org = organisationRepository.save(
                Organisation.builder()
                    .nom(request.organisationName())
                    .plan(PlanType.TRIAL)
                    .trialExpiresAt(LocalDate.now().plusDays(14))
                    .build()
            );

            // Hashage du mot de passe
            String hashedPassword = passwordEncoder.encode(request.password());

            // Création de l'utilisateur avec initialisation explicite des champs obligatoires
            User user = userRepository.save(
                User.builder()
                    .email(request.email())
                    .passwordHash(hashedPassword)
                    .fullName(request.fullName())
                    .role(User.Role.ADMIN)
                    .organisation(org)
                    .build()
            );

            String token = jwtUtil.generateToken(user);
            log.info("Register OK — user:{} org:{}", user.getEmail(), org.getId());
            return AuthResponse.of(token, user);

        } catch (Exception e) {
            log.error("ERREUR CRITIQUE DANS REGISTER : ", e);
            throw e; // Relance l'exception pour que Spring la gère
        }
    }

    // ── GET ME ─────────────────────────────────────────────────────────────
    public User getMe(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", userId));
    }
}
