package com.engipilot.controller;

import com.engipilot.dto.request.LoginRequest;
import com.engipilot.dto.request.RegisterRequest;
import com.engipilot.dto.response.AuthResponse;
import com.engipilot.service.AuthService;
import com.engipilot.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth") // CORRIGÉ : Suppression du /v1 pour correspondre au frontend
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentification JWT")
public class AuthController {

    private final AuthService authService;

    // --- TEST DE DIAGNOSTIC ---
    // Appelable via : POST /api/auth/simple-test
    @PostMapping("/simple-test")
    public ResponseEntity<String> simpleTest(@RequestBody Map<String, String> creds) {
        System.out.println("--- TEST : Connexion reçue pour : " + creds.get("email") + " ---");
        return ResponseEntity.ok("Le contrôleur AuthController est bien accessible.");
    }

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

    @GetMapping("/me")
    @Operation(summary = "Profil utilisateur connecté")
    public ResponseEntity<?> me() {
        return ResponseEntity.ok(authService.getMe(SecurityUtils.getCurrentUserId()));
    }
}