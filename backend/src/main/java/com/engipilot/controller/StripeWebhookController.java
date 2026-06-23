package com.engipilot.controller;
import com.engipilot.domain.Organisation;
import com.engipilot.domain.PlanType;
import com.engipilot.repository.OrganisationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
@RestController @RequestMapping("/api/v1/stripe") @RequiredArgsConstructor @Slf4j
public class StripeWebhookController {
    private final OrganisationRepository organisationRepository;
    @Value("${app.webhook.internal-secret:internal-webhook-secret}") private String internalSecret;
    private boolean ok(String h) { return internalSecret.equals(h); }
    @PostMapping("/subscription-activated")
    public ResponseEntity<Void> activated(@RequestHeader("X-Internal-Secret") String s, @RequestBody Map<String,String> b) {
        if (!ok(s)) return ResponseEntity.status(403).build();
        try {
            Organisation org = organisationRepository.findById(UUID.fromString(b.get("organisationId"))).orElseThrow();
            org.setPlan(PlanType.valueOf(b.get("plan")));
            org.setTrialExpiresAt(null);
            org.setStripeCustomerId(b.get("stripeCustomerId"));
            org.setStripeSubscriptionId(b.get("stripeSubscriptionId"));
            org.setSubscriptionExpiresAt(LocalDate.now().plusYears(1));
            organisationRepository.save(org);
            log.info("[Stripe] org {} -> plan {}", b.get("organisationId"), b.get("plan"));
        } catch (Exception e) { log.error("[Stripe] activated error: {}", e.getMessage()); return ResponseEntity.internalServerError().build(); }
        return ResponseEntity.ok().build();
    }
    @PostMapping("/subscription-updated")
    public ResponseEntity<Void> updated(@RequestHeader("X-Internal-Secret") String s, @RequestBody Map<String,String> b) {
        if (!ok(s)) return ResponseEntity.status(403).build();
        organisationRepository.findByStripeSubscriptionId(b.get("stripeSubscriptionId")).ifPresent(org -> {
            if ("active".equals(b.get("status")) && b.get("currentPeriodEnd") != null)
                org.setSubscriptionExpiresAt(LocalDate.parse(b.get("currentPeriodEnd").substring(0,10)));
            organisationRepository.save(org);
        });
        return ResponseEntity.ok().build();
    }
    @PostMapping("/subscription-cancelled")
    public ResponseEntity<Void> cancelled(@RequestHeader("X-Internal-Secret") String s, @RequestBody Map<String,String> b) {
        if (!ok(s)) return ResponseEntity.status(403).build();
        organisationRepository.findByStripeSubscriptionId(b.get("stripeSubscriptionId")).ifPresent(org -> {
            org.setPlan(PlanType.TRIAL); org.setStripeSubscriptionId(null); org.setSubscriptionExpiresAt(null);
            organisationRepository.save(org);
            log.info("[Stripe] org {} annulé -> TRIAL", org.getId());
        });
        return ResponseEntity.ok().build();
    }
    @PostMapping("/payment-failed")
    public ResponseEntity<Void> failed(@RequestHeader("X-Internal-Secret") String s, @RequestBody Map<String,Object> b) {
        if (!ok(s)) return ResponseEntity.status(403).build();
        log.warn("[Stripe] Paiement échoué customer={}", b.get("stripeCustomerId"));
        return ResponseEntity.ok().build();
    }
    @PostMapping("/payment-succeeded")
    public ResponseEntity<Void> succeeded(@RequestHeader("X-Internal-Secret") String s, @RequestBody Map<String,String> b) {
        if (!ok(s)) return ResponseEntity.status(403).build();
        log.info("[Stripe] Paiement reçu customer={}", b.get("stripeCustomerId"));
        return ResponseEntity.ok().build();
    }
}
