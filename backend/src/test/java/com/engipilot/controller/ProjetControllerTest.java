package com.engipilot.controller;

import com.engipilot.dto.response.EVMResponse;
import com.engipilot.dto.response.ProjetResponse;
import com.engipilot.service.KPIService;
import com.engipilot.service.ProjetService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.*;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProjetController.class)
class ProjetControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockBean ProjetService projetService;
    @MockBean KPIService kpiService;

    private ProjetResponse buildProjetResponse() {
        return ProjetResponse.builder()
            .id(UUID.randomUUID()).codeProjet("P-001").nom("Résidence Test")
            .statut(com.engipilot.domain.Projet.StatutProjet.EN_COURS)
            .avancementPhysique(BigDecimal.valueOf(63))
            .budgetPrevisionnel(BigDecimal.valueOf(48_500_000))
            .dateDebut(LocalDate.now().minusMonths(3))
            .dateFinPrevue(LocalDate.now().plusMonths(9))
            .build();
    }

    @Test
    @WithMockUser
    @DisplayName("GET /api/v1/projets — retourne page de projets")
    void lister_projets_200() throws Exception {
        Page<ProjetResponse> page = new PageImpl<>(List.of(buildProjetResponse()));
        when(projetService.lister(anyInt(), anyInt(), any())).thenReturn(page);

        mvc.perform(get("/api/v1/projets").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content[0].nom").value("Résidence Test"));
    }

    @Test
    @WithMockUser
    @DisplayName("GET /api/v1/projets/{id}/kpis/evm — retourne EVMResponse")
    void get_evm_200() throws Exception {
        UUID id = UUID.randomUUID();
        EVMResponse evm = EVMResponse.builder()
            .projetId(id).spi(BigDecimal.valueOf(0.87)).cpi(BigDecimal.valueOf(0.91))
            .interpretationSPI("Retard modéré").interpretationCPI("Budget maîtrisé")
            .build();
        when(kpiService.calculerEVM(any(), any())).thenReturn(evm);

        mvc.perform(get("/api/v1/projets/{id}/kpis/evm", id).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.spi").value(0.87))
            .andExpect(jsonPath("$.interpretationSPI").value("Retard modéré"));
    }

    @Test
    @WithMockUser
    @DisplayName("GET projet inexistant — 404 via service")
    void get_projet_inexistant_404() throws Exception {
        when(projetService.getById(any()))
            .thenThrow(new com.engipilot.exception.ResourceNotFoundException("Projet", UUID.randomUUID()));

        mvc.perform(get("/api/v1/projets/{id}", UUID.randomUUID()))
            .andExpect(status().isNotFound());
    }
}
