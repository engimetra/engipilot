package com.engipilot.controller;

import com.engipilot.dto.request.LoginRequest;
import com.engipilot.dto.request.RegisterRequest;
import com.engipilot.dto.response.AuthResponse;
import com.engipilot.service.AuthService;
import com.engipilot.service.PasswordResetService;
import com.engipilot.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentification JWT")
public class AuthController {

    private final AuthService          authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/login")
    @Operation(summary = "Connexion — retourne un token JWT")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer un nouveau compte")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Demande de réinitialisation du mot de passe")
    public ResponseEntity<Void> forgotPassword(@RequestParam @Email @NotBlank String email) {
        passwordResetService.requestReset(email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Réinitialiser le mot de passe avec un token")
    public ResponseEntity<Void> resetPassword(
            @RequestParam @NotBlank String token,
            @RequestParam @NotBlank @Size(min = 8, max = 100) String newPassword) {
        try {
            passwordResetService.resetPassword(token, newPassword);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/me")
    @Operation(summary = "Profil utilisateur connecté")
    public ResponseEntity<?> me() {
        return ResponseEntity.ok(authService.getMe(SecurityUtils.getCurrentUserId()));
    }
}
