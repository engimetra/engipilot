package com.engipilot.dto.response;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EVMResponse {
    private UUID projetId;
    private UUID orgId;
    private BigDecimal bat, va, vp, cr;
    private BigDecimal spi, cpi, sv, cv;
    private BigDecimal eac, etc, vac, tcpi;
    private String interpretationSPI;
    private String interpretationCPI;
    private String niveauAlerte;
}
