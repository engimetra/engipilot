package com.engipilot.service;
import com.engipilot.domain.Organisation;
import com.engipilot.domain.PlanType;
import com.engipilot.repository.OrganisationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.util.List;
@Component @RequiredArgsConstructor @Slf4j
public class TrialExpiryJob {
    private final OrganisationRepository organisationRepository;
    @Scheduled(cron = "0 0 2 * * *")
    public void checkExpiredTrials() {
        List<Organisation> orgs = organisationRepository.findAll();
        LocalDate today = LocalDate.now();
        int expiredCount = 0;
        for (Organisation org : orgs) {
            if (org.getPlan() != PlanType.TRIAL || org.getTrialExpiresAt() == null) continue;
            if (!org.getTrialExpiresAt().isBefore(today)) continue;
            if (org.isActif()) { log.warn("[TrialExpiry] '{}' expiré le {}", org.getNom(), org.getTrialExpiresAt()); expiredCount++; }
        }
        if (expiredCount > 0) log.info("[TrialExpiry] {} organisation(s) expirée(s)", expiredCount);
    }
    @Scheduled(cron = "0 0 8 * * *")
    public void alertSoonExpiringTrials() {
        LocalDate warningDate = LocalDate.now().plusDays(3);
        organisationRepository.findAll().stream()
            .filter(o -> o.getPlan() == PlanType.TRIAL && warningDate.equals(o.getTrialExpiresAt()))
            .forEach(o -> log.info("[TrialExpiry] Alerte J-3 : '{}' expire le {}", o.getNom(), o.getTrialExpiresAt()));
    }
}
