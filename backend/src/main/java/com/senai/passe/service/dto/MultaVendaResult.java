package com.senai.passe.service.dto;

import java.math.BigDecimal;

public record MultaVendaResult(
        int diasRestantes,
        BigDecimal percentualMulta,
        BigDecimal multa,
        String situacaoContrato
) {}
