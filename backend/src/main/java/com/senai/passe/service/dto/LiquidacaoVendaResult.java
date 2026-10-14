package com.senai.passe.service.dto;

import java.math.BigDecimal;

public record LiquidacaoVendaResult(
        BigDecimal valorCompra,
        BigDecimal valorMercado,
        int diasRestantes,
        BigDecimal percentualMulta,
        BigDecimal multa,
        BigDecimal lucro,
        BigDecimal comissao,
        BigDecimal creditoCaixa,
        String situacaoContrato
) {}
