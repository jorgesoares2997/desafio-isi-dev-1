package com.senai.passe.service.dto;

import java.util.List;

public record PartidaSimulacaoResult(
        int golsMandante,
        int golsVisitante,
        String resultado,
        List<DueloResult> duelos
) {}
