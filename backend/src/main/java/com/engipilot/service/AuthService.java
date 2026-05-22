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

    private final UserRepository         userRepository;
    private final OrganisationRepository organisationRepository;
    private final PasswordEncoder        passwordEncoder;
    private final JwtUtil                jwtUtil;

    // ── LOGIN ──────────────────────────────────────────────────────────────
    @Transactional
    public AuthResponse login(LoginRequest request) {

        // 1. Chercher l'utilisateur — orElseThrow évite le null check manuel
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> {
                // log.warn et pas log.error : tentative normale, pas une erreur système
                log.warn("Tentative de login avec email inconnu : {}", request.email());
                // BadCredentialsException et pas NotFoundException :
                // ne pas révéler si l'email existe ou non (sécurité OWASP A07)
                return new BadCredentialsException("Email ou mot de passe incorrect");
            });

        // 2. Vérifier BCrypt
        // passwordEncoder.matches() compare le mot de passe clair avec le hash
        // Impossible de décoder le hash — vérification one-way uniquement
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            log.warn("Mot de passe incorrect pour : {}", request.email());
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }

        // 3. Vérifier que le compte n'est pas désactivé
        if (!user.isActive()) {
            throw new DisabledException("Compte désactivé. Contactez le support.");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user);
        log.info("Login réussi pour : {}", user.getEmail());

        return AuthResponse.of(token, user);
    }

    // ── REGISTER ───────────────────────────────────────────────────────────
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        // 1. Email unique
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Cet email est déjà utilisé");
        }

        // 2. Créer l'organisation (multi-tenant : chaque client = une org)
        Organisation org = organisationRepository.save(
            Organisation.builder()
                .nom(request.organisationName())
                .plan(PlanType.TRIAL)
                .trialExpiresAt(LocalDate.now().plusDays(14))
                .build()
        );

        // 3. Hasher le mot de passe AVANT de stocker
        // La responsabilité du hashing appartient au service, pas au modèle
        String hashedPassword = passwordEncoder.encode(request.password());

        // 4. Créer le premier utilisateur = ADMIN de son organisation
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
    }

    // ── GET ME ─────────────────────────────────────────────────────────────
    public User getMe(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", userId));
    }
}
