package com.engipilot.service;

import com.engipilot.domain.Tache;
import com.engipilot.dto.request.TacheCreateRequest;
import com.engipilot.dto.response.TacheResponse;
import com.engipilot.exception.ResourceNotFoundException;
import com.engipilot.repository.TacheRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor
public class TacheService {

    private final TacheRepository tacheRepository;

    public Page<TacheResponse> listerParProjet(UUID projetId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return tacheRepository.findAllByProjetIdOrderByCreatedAtDesc(projetId, pageable)
            .map(this::toResponse);
    }

    @Transactional
    public TacheResponse creer(UUID projetId, TacheCreateRequest req) {
        Tache t = Tache.builder()
            .titre(req.titre()).description(req.description())
            .priorite(req.priorite() != null ? req.priorite() : Tache.Priorite.NORMALE)
            .responsable(req.responsable())
            .dateEcheance(req.dateEcheance())
            .projetId(projetId).lotId(req.lotId())
            .createdAt(LocalDateTime.now())
            .build();
        return toResponse(tacheRepository.save(t));
    }

    @Transactional
    public TacheResponse changerStatut(UUID id, Tache.Statut nouveauStatut) {
        Tache t = tacheRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Tache", id));
        t.setStatut(nouveauStatut);
        if (nouveauStatut == Tache.Statut.TERMINE) t.setAvancement(BigDecimal.valueOf(100));
        return toResponse(tacheRepository.save(t));
    }

    @Transactional
    public TacheResponse updateAvancement(UUID id, int avancement) {
        Tache t = tacheRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Tache", id));
        t.setAvancement(BigDecimal.valueOf(avancement));
        return toResponse(tacheRepository.save(t));
    }

    @Transactional
    public void supprimer(UUID id) {
        tacheRepository.deleteById(id);
    }

    private TacheResponse toResponse(Tache t) {
        return new TacheResponse(t.getId(), t.getTitre(), t.getDescription(),
            t.getStatut(), t.getPriorite(), t.getResponsable(), t.getDateEcheance(),
            t.getAvancement(), t.getProjetId(), t.getLotId(), t.getCreatedAt());
    }
}
