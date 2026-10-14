package com.senai.passe.service.dto;

import java.math.BigDecimal;

public record ComissaoVendaResult(
        BigDecimal lucro,
        BigDecimal comissao
) {}
