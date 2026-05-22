package com.engipilot.service;

import com.engipilot.domain.RapportJournalier;
import com.engipilot.dto.request.RapportCreateRequest;
import com.engipilot.dto.response.RapportResponse;
import com.engipilot.exception.ResourceNotFoundException;
import com.engipilot.repository.RapportJournalierRepository;
import com.engipilot.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor
public class RapportService {

    private final RapportJournalierRepository rapportRepository;

    public List<RapportResponse> listerParProjet(UUID projetId) {
        return rapportRepository.findAllByProjetIdOrderByDateRapportDesc(projetId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public RapportResponse creer(UUID projetId, RapportCreateRequest req) {
        String numero = genererNumero(projetId);

        RapportJournalier r = RapportJournalier.builder()
            .dateRapport(req.dateRapport())
            .numeroRapport(numero)
            .meteo(req.meteo())
            .temperatureCelsius(req.temperatureCelsius())
            .effectifTotal(req.effectifTotal())
            .travauxRealises(req.travauxRealises())
            .betonCouleM3(req.betonCouleM3())
            .acierKg(req.acierKg())
            .avancementJournalier(req.avancementJournalier())
            .problemes(req.problemes())
            .redacteurId(SecurityUtils.getCurrentUserId())
            .createdAt(LocalDateTime.now())
            .build();

        // Set projet via join
        return toResponse(rapportRepository.save(r));
    }

    @Transactional
    public RapportResponse valider(UUID id) {
        RapportJournalier r = rapportRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Rapport", id));
        r.setStatut(RapportJournalier.Statut.VALIDE);
        return toResponse(rapportRepository.save(r));
    }

    private String genererNumero(UUID projetId) {
        long count = rapportRepository.count() + 1;
        return String.format("RJ-%d-%04d", java.time.Year.now().getValue(), count);
    }

    private RapportResponse toResponse(RapportJournalier r) {
        return new RapportResponse(r.getId(), r.getDateRapport(), r.getNumeroRapport(),
            r.getMeteo(), r.getEffectifTotal(), r.getTravauxRealises(),
            r.getBetonCouleM3(), r.getAcierKg(), r.getAvancementJournalier(),
            r.getProblemes(), r.getStatut(), null, r.getCreatedAt());
    }
}
