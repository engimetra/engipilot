package com.engipilot.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.UUID;

@Service @RequiredArgsConstructor @Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifierOrganisation(UUID orgId, String type, Object payload) {
        String dest = "/topic/org/" + orgId;
        messagingTemplate.convertAndSend(dest, Map.of("type", type, "data", payload));
        log.debug("WS notif → {} : {}", dest, type);
    }

    public void alerteIA(UUID orgId, String titre, String description, String niveau) {
        notifierOrganisation(orgId, "IA_ALERTE", Map.of(
            "titre", titre, "description", description, "niveau", niveau
        ));
    }

    public void rapportValide(UUID orgId, String numero) {
        notifierOrganisation(orgId, "RAPPORT_VALIDE", Map.of("numero", numero));
    }

    public void incidentHSE(UUID orgId, String description) {
        notifierOrganisation(orgId, "INCIDENT_HSE", Map.of("description", description));
    }
}
