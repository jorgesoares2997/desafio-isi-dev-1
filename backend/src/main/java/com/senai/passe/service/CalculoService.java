package com.senai.passe.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class CalculoService {

    private final PlayerValuationService playerValuationService;

    public CalculoService() {
        this(new PlayerValuationService());
    }

    public CalculoService(PlayerValuationService playerValuationService) {
        this.playerValuationService = playerValuationService;
    }

    /**
     * RN02, RN03, RN04, RN05 - Cálculo do valor de mercado
     */
    public BigDecimal calcularValorMercado(BigDecimal valorBase, String condicao, int agilidade, int idade) {
        return playerValuationService.calcularValorMercado(valorBase, condicao, agilidade, idade);
    }
}
