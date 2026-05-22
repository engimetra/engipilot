package com.engipilot.service;

import com.engipilot.domain.NonConformite;
import com.engipilot.dto.request.NCCreateRequest;
import com.engipilot.dto.response.NCResponse;
import com.engipilot.exception.ResourceNotFoundException;
import com.engipilot.repository.NonConformiteRepository;
import com.engipilot.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor
public class NCService {

    private final NonConformiteRepository ncRepository;

    public Page<NCResponse> listerParProjet(UUID projetId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ncRepository.findAllByProjetIdOrderByCreatedAtDesc(projetId, pageable)
            .map(this::toResponse);
    }

    @Transactional
    public NCResponse creer(UUID projetId, NCCreateRequest req) {
        String ref = genererReference();
        NonConformite nc = NonConformite.builder()
            .reference(ref)
            .description(req.description())
            .priorite(req.priorite() != null ? req.priorite() : NonConformite.Priorite.MINEURE)
            .lot(req.lot()).zone(req.zone()).responsable(req.responsable())
            .dateConstat(req.dateConstat())
            .organisationId(SecurityUtils.getCurrentOrganisationId())
            .createdAt(LocalDateTime.now())
            .build();
        return toResponse(ncRepository.save(nc));
    }

    @Transactional
    public NCResponse changerStatut(UUID id, NonConformite.Statut statut) {
        NonConformite nc = ncRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("NonConformite", id));
        nc.setStatut(statut);
        if (statut == NonConformite.Statut.RESOLUE) {
            nc.setDateResolution(java.time.LocalDate.now());
        }
        return toResponse(ncRepository.save(nc));
    }

    private String genererReference() {
        return String.format("NC-%03d", ncRepository.count() + 1);
    }

    private NCResponse toResponse(NonConformite nc) {
        return new NCResponse(nc.getId(), nc.getReference(), nc.getDescription(),
            nc.getPriorite(), nc.getStatut(), nc.getLot(), nc.getZone(), nc.getResponsable(),
            nc.getDateConstat(), nc.getDateResolution(),
            nc.getProjet() != null ? nc.getProjet().getId() : null, nc.getCreatedAt());
    }
}
