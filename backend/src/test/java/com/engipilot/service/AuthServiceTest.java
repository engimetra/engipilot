package com.engipilot.service;

import com.engipilot.domain.Organisation;
import com.engipilot.domain.PlanType;
import com.engipilot.domain.User;
import com.engipilot.dto.request.LoginRequest;
import com.engipilot.dto.request.RegisterRequest;
import com.engipilot.dto.response.AuthResponse;
import com.engipilot.exception.ConflictException;
import com.engipilot.repository.OrganisationRepository;
import com.engipilot.repository.UserRepository;
import com.engipilot.util.JwtUtil;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository         userRepository;
    @Mock OrganisationRepository organisationRepository;
    @Mock PasswordEncoder        passwordEncoder;
    @Mock JwtUtil                jwtUtil;
    @InjectMocks AuthService     authService;

    private Organisation demoOrg() {
        return Organisation.builder()
            .id(UUID.randomUUID())
            .nom("Demo Org")
            .plan(PlanType.TRIAL)
            .build();
    }

    private User buildUser(boolean active) {
        return User.builder()
            .id(UUID.randomUUID())
            .email("test@engipilot.ma")
            .passwordHash("$2a$12$hashed")
            .fullName("Test User")
            .role(User.Role.CHEF_CHANTIER)
            .organisation(demoOrg())
            .active(active)
            .build();
    }

    // ── LOGIN ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Login OK avec credentials valides")
    void login_ok_credentials_valides() {
        User user = buildUser(true);
        when(userRepository.findByEmail("test@engipilot.ma")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("demo123", "$2a$12$hashed")).thenReturn(true);
        when(jwtUtil.generateToken(user)).thenReturn("jwt.token.test");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        AuthResponse response = authService.login(new LoginRequest("test@engipilot.ma", "demo123"));

        assertThat(response.token()).isEqualTo("jwt.token.test");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.user().email()).isEqualTo("test@engipilot.ma");
    }

    @Test
    @DisplayName("Exception si email inconnu — ne révèle pas l'existence du compte")
    void exception_email_inconnu() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("inconnu@test.ma", "pass")))
            .isInstanceOf(BadCredentialsException.class)
            .hasMessageContaining("Email ou mot de passe incorrect");
    }

    @Test
    @DisplayName("Exception si mot de passe incorrect — même message que email inconnu (OWASP A07)")
    void exception_mauvais_mot_de_passe() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(buildUser(true)));
        when(passwordEncoder.matches(any(), any())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("test@engipilot.ma", "wrong")))
            .isInstanceOf(BadCredentialsException.class)
            .hasMessageContaining("Email ou mot de passe incorrect");
    }

    @Test
    @DisplayName("DisabledException si compte désactivé")
    void exception_compte_desactive() {
        User inactive = buildUser(false);
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(inactive));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);

        assertThatThrownBy(() -> authService.login(new LoginRequest("test@engipilot.ma", "pass")))
            .isInstanceOf(DisabledException.class);
    }

    // ── REGISTER ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("Register crée organisation + utilisateur ADMIN")
    void register_cree_org_et_utilisateur() {
        Organisation savedOrg = demoOrg();
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(organisationRepository.save(any())).thenReturn(savedOrg);
        when(passwordEncoder.encode(any())).thenReturn("$2a$12$hashed");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(jwtUtil.generateToken(any(User.class))).thenReturn("jwt.token");

        AuthResponse response = authService.register(new RegisterRequest(
            "nouveau@engipilot.ma", "motdepasse123",
            "Prénom Nom", "Ma Société"));

        assertThat(response.token()).isEqualTo("jwt.token");
        assertThat(response.user().email()).isEqualTo("nouveau@engipilot.ma");
        verify(organisationRepository).save(any(Organisation.class));
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("ConflictException si email déjà utilisé")
    void exception_email_deja_utilise() {
        when(userRepository.existsByEmail("test@engipilot.ma")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(new RegisterRequest(
            "test@engipilot.ma", "pass12345", "A B", "Org")))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("déjà utilisé");
    }
}
