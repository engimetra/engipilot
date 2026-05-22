package com.engipilot.service;

import com.engipilot.domain.IncidentHSE;
import com.engipilot.domain.Projet;
import com.engipilot.dto.request.IncidentCreateRequest;
import com.engipilot.dto.response.IncidentResponse;
import com.engipilot.exception.ResourceNotFoundException;
import com.engipilot.repository.IncidentHSERepository;
import com.engipilot.repository.ProjetRepository;
import com.engipilot.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor
public class HSEService {

    private final IncidentHSERepository incidentRepository;
    private final ProjetRepository      projetRepository;

    public Page<IncidentResponse> listerParProjet(UUID projetId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateIncident").descending());
        return incidentRepository.findAllByProjetIdOrderByDateIncidentDesc(projetId, pageable)
            .map(this::toResponse);
    }

    @Transactional
    public IncidentResponse declarer(UUID projetId, IncidentCreateRequest req) {
        Projet projet = projetRepository.findById(projetId)
            .orElseThrow(() -> new ResourceNotFoundException("Projet", projetId));

        IncidentHSE incident = IncidentHSE.builder()
            .type(req.type())
            .description(req.description())
            .dateIncident(req.dateIncident())
            .lieu(req.lieu())
            .gravite(req.gravite() != null ? req.gravite() : IncidentHSE.Gravite.MINEUR)
            .statut(IncidentHSE.Statut.EN_COURS)
            .nombreJoursArret(req.nombreJoursArret() != null ? req.nombreJoursArret() : 0)
            .nombreBlesses(req.nombreBlesses() != null ? req.nombreBlesses() : 0)
            .mesuresPrises(req.mesuresPrises())
            .projet(projet)
            .organisationId(SecurityUtils.getCurrentOrganisationId())
            .createdAt(LocalDateTime.now())
            .build();

        return toResponse(incidentRepository.save(incident));
    }

    @Transactional
    public IncidentResponse changerStatut(UUID incidentId, IncidentHSE.Statut statut) {
        IncidentHSE incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new ResourceNotFoundException("Incident", incidentId));
        incident.setStatut(statut);
        return toResponse(incidentRepository.save(incident));
    }

    public Map<String, Object> getKPIsHSE(UUID projetId) {
        long accidents = incidentRepository.countByProjetIdAndType(projetId, IncidentHSE.TypeIncident.ACCIDENT_ARRET);
        long presquAccidents = incidentRepository.countByProjetIdAndType(projetId, IncidentHSE.TypeIncident.PRESQU_ACCIDENT);
        List<IncidentHSE> incidents = incidentRepository.findAllByProjetIdOrderByDateIncidentDesc(projetId);
        long totalJoursArret = incidents.stream().mapToLong(i -> i.getNombreJoursArret() != null ? i.getNombreJoursArret() : 0).sum();
        long enCours = incidents.stream().filter(i -> i.getStatut() == IncidentHSE.Statut.EN_COURS).count();
        long heuresTravaillees = 24500L;
        double tf = heuresTravaillees > 0 ? (accidents * 1_000_000.0 / heuresTravaillees) : 0;
        double tg = heuresTravaillees > 0 ? (totalJoursArret * 1_000.0 / heuresTravaillees) : 0;
        return Map.of(
            "tf", Math.round(tf * 10.0) / 10.0,
            "tg", Math.round(tg * 100.0) / 100.0,
            "accidents", accidents,
            "presquAccidents", presquAccidents,
            "enCours", enCours,
            "heuresSansAccident", heuresTravaillees
        );
    }

    private IncidentResponse toResponse(IncidentHSE i) {
        return new IncidentResponse(
            i.getId(), i.getType(), i.getDescription(),
            i.getDateIncident(), i.getLieu(),
            i.getGravite(), i.getStatut(),
            i.getNombreJoursArret(), i.getNombreBlesses(),
            i.getMesuresPrises(),
            i.getProjet() != null ? i.getProjet().getId() : null,
            i.getCreatedAt()
        );
    }
}
