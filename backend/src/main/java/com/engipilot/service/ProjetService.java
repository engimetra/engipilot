package com.engipilot.service;

import com.engipilot.domain.Projet;
import com.engipilot.dto.request.ProjetCreateRequest;
import com.engipilot.dto.response.ProjetResponse;
import com.engipilot.exception.ResourceNotFoundException;
import com.engipilot.repository.ProjetRepository;
import com.engipilot.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.UUID;

@Service @RequiredArgsConstructor @Slf4j
public class ProjetService {

    private final ProjetRepository projetRepository;

    public Page<ProjetResponse> lister(int page, int size, String statut) {
        UUID orgId = SecurityUtils.getCurrentOrganisationId();
        if (orgId == null) orgId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        return projetRepository.findAllByOrganisationId(orgId, pageable).map(this::toResponse);
    }

    public ProjetResponse getById(UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganisationId();
        if (orgId == null) orgId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        Projet p = projetRepository.findByIdAndOrganisationId(id, orgId)
            .orElseThrow(() -> new ResourceNotFoundException("Projet", id));
        return toResponse(p);
    }

    @Transactional
    public ProjetResponse creer(ProjetCreateRequest req) {
        UUID orgId = SecurityUtils.getCurrentOrganisationId();
        if (orgId == null) orgId = UUID.fromString("00000000-0000-0000-0000-000000000001");

        if (projetRepository.existsByCodeProjetAndOrganisationId(req.codeProjet(), orgId)) {
            throw new IllegalArgumentException("Code projet déjà existant: " + req.codeProjet());
        }

        Projet p = Projet.builder()
            .codeProjet(req.codeProjet()).nom(req.nom()).description(req.description())
            .priorite(req.priorite() != null ? req.priorite() : Projet.Priorite.NORMALE)
            .budgetPrevisionnel(req.budgetPrevisionnel())
            .dateDebut(req.dateDebut()).dateFinPrevue(req.dateFinPrevue())
            .ville(req.ville()).client(req.client()).chefChantier(req.chefChantier())
            .organisationId(orgId)
            .build();

        projetRepository.save(p);
        log.info("Projet créé: {} org:{}", p.getCodeProjet(), orgId);
        return toResponse(p);
    }

    @Transactional
    public ProjetResponse mettreAJour(UUID id, ProjetCreateRequest req) {
        UUID orgId = SecurityUtils.getCurrentOrganisationId();
        if (orgId == null) orgId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        Projet p = projetRepository.findByIdAndOrganisationId(id, orgId)
            .orElseThrow(() -> new ResourceNotFoundException("Projet", id));
        p.setNom(req.nom()); p.setDescription(req.description());
        if (req.priorite() != null) p.setPriorite(req.priorite());
        p.setBudgetPrevisionnel(req.budgetPrevisionnel());
        p.setDateFinPrevue(req.dateFinPrevue());
        p.setVille(req.ville()); p.setClient(req.client()); p.setChefChantier(req.chefChantier());
        return toResponse(projetRepository.save(p));
    }

    @Transactional
    public ProjetResponse updateAvancement(UUID id, double avancement) {
        UUID orgId = SecurityUtils.getCurrentOrganisationId();
        if (orgId == null) orgId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        Projet p = projetRepository.findByIdAndOrganisationId(id, orgId)
            .orElseThrow(() -> new ResourceNotFoundException("Projet", id));
        p.setAvancementPhysique(BigDecimal.valueOf(avancement));
        return toResponse(projetRepository.save(p));
    }

    @Transactional
    public void supprimer(UUID id) {
        UUID orgId = SecurityUtils.getCurrentOrganisationId();
        if (orgId == null) orgId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        Projet p = projetRepository.findByIdAndOrganisationId(id, orgId)
            .orElseThrow(() -> new ResourceNotFoundException("Projet", id));
        projetRepository.delete(p);
    }

    private ProjetResponse toResponse(Projet p) {
        return ProjetResponse.builder()
            .id(p.getId()).codeProjet(p.getCodeProjet()).nom(p.getNom())
            .description(p.getDescription()).statut(p.getStatut()).priorite(p.getPriorite())
            .avancementPhysique(p.getAvancementPhysique()).avancementTheorique(p.getAvancementTheorique())
            .budgetPrevisionnel(p.getBudgetPrevisionnel()).coutReel(p.getCoutReel())
            .dateDebut(p.getDateDebut()).dateFinPrevue(p.getDateFinPrevue()).dateFinReelle(p.getDateFinReelle())
            .ville(p.getVille()).client(p.getClient()).chefChantier(p.getChefChantier())
            .createdAt(p.getCreatedAt()).build();
    }
}
