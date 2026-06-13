package com.engipilot.controller;

import com.engipilot.domain.User;
import com.engipilot.repository.UserRepository;
import com.engipilot.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class UserAdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private User currentUser() {
        UUID id = SecurityUtils.getCurrentUserId();
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_ENTREPRISE','SUPER_ADMIN')")
    public List<Map<String,Object>> listUsers() {
        User me = currentUser();
        return userRepository.findAllByOrganisation_IdAndActiveTrue(me.getOrganisation().getId())
            .stream().map(u -> Map.<String,Object>of(
                "id", u.getId().toString(),
                "fullName", u.getFullName(),
                "email", u.getEmail(),
                "role", u.getRole().name(),
                "active", u.isActive()
            )).toList();
    }

    @PostMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_ENTREPRISE','SUPER_ADMIN')")
    public ResponseEntity<Map<String,Object>> createUser(@RequestBody Map<String,String> body) {
        User me = currentUser();

        String email    = body.get("email");
        String fullName = body.get("fullName");
        String password = body.get("password");
        String roleStr  = body.get("role");

        if (userRepository.existsByEmail(email))
            return ResponseEntity.badRequest().body(Map.of("error","Email déjà utilisé"));

        User.Role role;
        try { role = User.Role.valueOf(roleStr); }
        catch (Exception e) { role = User.Role.CHEF_PROJET; }

        User user = userRepository.save(User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(password))
            .fullName(fullName)
            .role(role)
            .organisation(me.getOrganisation())
            .active(true)
            .build());

        return ResponseEntity.ok(Map.of(
            "id", user.getId().toString(),
            "fullName", user.getFullName(),
            "email", user.getEmail(),
            "role", user.getRole().name(),
            "active", true
        ));
    }

    @PatchMapping("/users/{id}/role")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_ENTREPRISE','SUPER_ADMIN')")
    public ResponseEntity<?> changeRole(@PathVariable UUID id, @RequestBody Map<String,String> body) {
        return userRepository.findById(id).map(u -> {
            try { u.setRole(User.Role.valueOf(body.get("role"))); }
            catch (Exception ignored) {}
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("ok", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_ENTREPRISE','SUPER_ADMIN')")
    public ResponseEntity<?> deactivateUser(@PathVariable UUID id) {
        userRepository.findById(id).ifPresent(u -> { u.setActive(false); userRepository.save(u); });
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
