package com.engipilot.security.subscription;
import com.engipilot.domain.Organisation;
import com.engipilot.domain.PlanType;
import com.engipilot.repository.OrganisationRepository;
import com.engipilot.repository.ProjetRepository;
import com.engipilot.repository.UserRepository;
import com.engipilot.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.UUID;
@Aspect @Component @RequiredArgsConstructor @Slf4j
public class SubscriptionAspect {
    private final OrganisationRepository organisationRepository;
    private final ProjetRepository projetRepository;
    private final UserRepository userRepository;
    private static final int TRIAL_MAX_PROJETS=3, STARTER_MAX_PROJETS=5, PRO_MAX_PROJETS=20;
    private static final int TRIAL_MAX_USERS=5, STARTER_MAX_USERS=10, PRO_MAX_USERS=50;
    @Around("@annotation(planRequired)")
    public Object checkPlan(ProceedingJoinPoint pjp, PlanRequired planRequired) throws Throwable {
        UUID orgId = SecurityUtils.getCurrentOrganisationId();
        if (orgId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Organisation org = organisationRepository.findById(orgId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organisation introuvable"));
        if (org.getPlan() == PlanType.TRIAL && org.getTrialExpiresAt() != null
                && org.getTrialExpiresAt().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
                "Votre période d'essai a expiré. Veuillez souscrire à un abonnement.");
        }
        String resource = planRequired.resource();
        if (!resource.isEmpty()) checkResourceLimit(org, resource, orgId);
        return pjp.proceed();
    }
    private void checkResourceLimit(Organisation org, String resource, UUID orgId) {
        PlanType plan = org.getPlan();
        if ("projet".equals(resource)) {
            long count = projetRepository.countByOrganisationId(orgId);
            int limit = switch (plan) {
                case TRIAL -> TRIAL_MAX_PROJETS; case STARTER -> STARTER_MAX_PROJETS;
                case PROFESSIONAL -> PRO_MAX_PROJETS; case ENTERPRISE -> Integer.MAX_VALUE;
            };
            if (count >= limit) throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
                String.format("Limite de %d projet(s) atteinte pour le plan %s.", limit, plan));
        }
        if ("user".equals(resource)) {
            long count = userRepository.countByOrganisationId(orgId);
            int limit = switch (plan) {
                case TRIAL -> TRIAL_MAX_USERS; case STARTER -> STARTER_MAX_USERS;
                case PROFESSIONAL -> PRO_MAX_USERS; case ENTERPRISE -> Integer.MAX_VALUE;
            };
            if (count >= limit) throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
                String.format("Limite de %d utilisateur(s) atteinte pour le plan %s.", limit, plan));
        }
    }
}
