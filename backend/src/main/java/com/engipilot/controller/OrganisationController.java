package com.engipilot.controller;
import com.engipilot.domain.Organisation;
import com.engipilot.domain.PlanType;
import com.engipilot.repository.OrganisationRepository;
import com.engipilot.repository.ProjetRepository;
import com.engipilot.repository.UserRepository;
import com.engipilot.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;
@RestController @RequestMapping("/api/v1/organisations") @RequiredArgsConstructor
@Tag(name = "Organisations")
public class OrganisationController {
    private final OrganisationRepository organisationRepository;
    private final ProjetRepository projetRepository;
    private final UserRepository userRepository;
    @GetMapping("/{id}/usage") @Operation(summary = "Usage organisation")
    public ResponseEntity<Map<String, Object>> getUsage(@PathVariable UUID id) {
        UUID currentOrgId = SecurityUtils.getCurrentOrganisationId();
        String currentRole = SecurityUtils.getCurrentRole();
        if (!"SUPER_ADMIN".equals(currentRole) && !id.equals(currentOrgId))
            return ResponseEntity.status(403).build();
        Organisation org = organisationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Organisation introuvable"));
        long chantiersCount = projetRepository.countByOrganisationId(id);
        long usersCount = userRepository.countByOrganisationId(id);
        PlanType plan = org.getPlan();
        boolean isTrialExpired = plan == PlanType.TRIAL && org.getTrialExpiresAt() != null
            && org.getTrialExpiresAt().isBefore(LocalDate.now());
        Map<String, Object> result = new HashMap<>();
        result.put("plan", plan.name());
        result.put("trialEndsAt", org.getTrialExpiresAt() != null ? org.getTrialExpiresAt().toString() : null);
        result.put("isTrialExpired", isTrialExpired);
        result.put("chantiersCount", chantiersCount);
        result.put("usersCount", usersCount);
        result.put("storageGb", 0);
        return ResponseEntity.ok(result);
    }
    @GetMapping("/{id}") @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN_ENTREPRISE','ADMIN')")
    public ResponseEntity<Organisation> getById(@PathVariable UUID id) {
        UUID currentOrgId = SecurityUtils.getCurrentOrganisationId();
        String currentRole = SecurityUtils.getCurrentRole();
        if (!"SUPER_ADMIN".equals(currentRole) && !id.equals(currentOrgId))
            return ResponseEntity.status(403).build();
        return organisationRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
