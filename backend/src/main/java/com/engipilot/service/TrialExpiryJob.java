package com.engipilot.service;
import com.engipilot.domain.Organisation;
import com.engipilot.domain.PlanType;
import com.engipilot.domain.User;
import com.engipilot.repository.OrganisationRepository;
import com.engipilot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.util.List;
@Component @RequiredArgsConstructor @Slf4j
public class TrialExpiryJob {
    private final OrganisationRepository organisationRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}") private String fromEmail;
    @Value("${app.frontend-url:https://www.engipilot.ma}") private String frontendUrl;

    @Scheduled(cron = "0 0 2 * * *")
    public void checkExpiredTrials() {
        LocalDate today = LocalDate.now(); int count = 0;
        for (Organisation org : organisationRepository.findAll()) {
            if (org.getPlan() != PlanType.TRIAL || org.getTrialExpiresAt() == null) continue;
            if (!org.getTrialExpiresAt().isBefore(today) || !org.isActif()) continue;
            log.warn("[TrialExpiry] '{}' expiré le {}", org.getNom(), org.getTrialExpiresAt());
            sendEmailToAdmins(org, "Votre période d'essai ENGIPILOT a expiré",
                "Bonjour,\n\nVotre période d'essai pour \"" + org.getNom() + "\" a expiré le " + org.getTrialExpiresAt() + ".\n\n" +
                "Vos données sont conservées 30 jours. Souscrivez ici :\n" + frontendUrl + "/facturation\n\nL'équipe ENGIPILOT");
            count++;
        }
        if (count > 0) log.info("[TrialExpiry] {} org(s) expirée(s) notifiées", count);
    }

    @Scheduled(cron = "0 0 8 * * *")
    public void alertSoonExpiringTrials() {
        LocalDate in3 = LocalDate.now().plusDays(3);
        for (Organisation org : organisationRepository.findAll()) {
            if (org.getPlan() != PlanType.TRIAL || !in3.equals(org.getTrialExpiresAt())) continue;
            sendEmailToAdmins(org, "Plus que 3 jours d'essai ENGIPILOT",
                "Bonjour,\n\nIl vous reste 3 jours d'essai pour \"" + org.getNom() + "\" (expire le " + org.getTrialExpiresAt() + ").\n\n" +
                "Passez au Pro maintenant :\n" + frontendUrl + "/facturation\n\nL'équipe ENGIPILOT");
        }
    }

    private void sendEmailToAdmins(Organisation org, String subject, String body) {
        List<User> admins = userRepository.findAllByOrganisation_IdAndActiveTrue(org.getId())
            .stream().filter(u -> u.getRole().name().startsWith("ADMIN")).toList();
        if (admins.isEmpty()) { log.warn("[TrialExpiry] Aucun admin pour '{}'", org.getNom()); return; }
        for (User admin : admins) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(fromEmail); msg.setTo(admin.getEmail());
                msg.setSubject(subject); msg.setText(body);
                mailSender.send(msg);
                log.info("[TrialExpiry] Email envoyé à {}", admin.getEmail());
            } catch (Exception e) { log.error("[TrialExpiry] Échec email {} : {}", admin.getEmail(), e.getMessage()); }
        }
    }
}
