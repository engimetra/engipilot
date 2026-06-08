package com.engipilot.service;

import com.engipilot.domain.User;
import com.engipilot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository   userRepository;
    private final PasswordEncoder  passwordEncoder;
    private final JavaMailSender   mailSender;

    @Value("${app.frontend-url:https://www.engipilot.ma}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Transactional
    public void requestReset(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            sendResetEmail(user, token);
        });
        // Always return success — don't reveal if email exists (OWASP A07)
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Lien invalide ou expiré"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Ce lien de réinitialisation a expiré");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
        log.info("Mot de passe réinitialisé pour : {}", user.getEmail());
    }

    private void sendResetEmail(User user, String token) {
        try {
            String link = frontendUrl + "/reset-password?token=" + token;
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(user.getEmail());
            msg.setSubject("Réinitialisation de votre mot de passe ENGIPILOT");
            msg.setText(
                "Bonjour " + user.getFullName() + ",\n\n" +
                "Vous avez demandé à réinitialiser votre mot de passe.\n\n" +
                "Cliquez sur ce lien (valable 1 heure) :\n" + link + "\n\n" +
                "Si vous n'avez pas fait cette demande, ignorez cet email.\n\n" +
                "L'équipe ENGIPILOT"
            );
            mailSender.send(msg);
            log.info("Email de réinitialisation envoyé à : {}", user.getEmail());
        } catch (Exception e) {
            log.error("Échec envoi email reset à {} : {}", user.getEmail(), e.getMessage());
        }
    }
}
