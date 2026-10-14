package com.senai.passe.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CalculoServiceTest {

    private final CalculoService calculoService = new CalculoService();

    @Test
    @DisplayName("RN02 a RN05: Deve calcular corretamente os exemplos da tabela oficial do regulamento")
    void deveCalcularValorMercadoExemplosOficiais() {
        // Exemplo 1: 82.00, APTO, agilidade 20, idade 25 -> 82.00
        assertEquals(
                new BigDecimal("82.00"),
                calculoService.calcularValorMercado(new BigDecimal("82.00"), "APTO", 20, 25)
        );

        // Exemplo 2: 82.00, APTO, agilidade 50, idade 19 -> 90.20
        assertEquals(
                new BigDecimal("90.20"),
                calculoService.calcularValorMercado(new BigDecimal("82.00"), "APTO", 50, 19)
        );

        // Exemplo 3: 82.00, MAL_CONDICIONADO, agilidade 50, idade 25 -> 69.70
        assertEquals(
                new BigDecimal("69.70"),
                calculoService.calcularValorMercado(new BigDecimal("82.00"), "MAL_CONDICIONADO", 50, 25)
        );

        // Exemplo 4: 82.00, MAL_CONDICIONADO, agilidade 80, idade 21 -> 84.05
        assertEquals(
                new BigDecimal("84.05"),
                calculoService.calcularValorMercado(new BigDecimal("82.00"), "MAL_CONDICIONADO", 80, 21)
        );

        // Exemplo 5: 82.00, MAL_CONDICIONADO, agilidade 30, idade 33 -> 53.30
        assertEquals(
                new BigDecimal("53.30"),
                calculoService.calcularValorMercado(new BigDecimal("82.00"), "MAL_CONDICIONADO", 30, 33)
        );

        // Exemplo 6: 82.00, DOENTE, agilidade 90, idade 25 -> 69.70
        assertEquals(
                new BigDecimal("69.70"),
                calculoService.calcularValorMercado(new BigDecimal("82.00"), "DOENTE", 90, 25)
        );

        // Exemplo 7: 82.00, DOENTE, agilidade 30, idade 25 -> 49.20 (teto -40%)
        assertEquals(
                new BigDecimal("49.20"),
                calculoService.calcularValorMercado(new BigDecimal("82.00"), "DOENTE", 30, 25)
        );

        // Exemplo 8: 82.00, DOENTE, agilidade 10, idade 40 -> 49.20 (limitado a -40%)
        assertEquals(
                new BigDecimal("49.20"),
                calculoService.calcularValorMercado(new BigDecimal("82.00"), "DOENTE", 10, 40)
        );

        // Exemplo 9: 9.50, MAL_CONDICIONADO, agilidade 85, idade 25 -> 8.79 (8.7875 arredondado)
        assertEquals(
                new BigDecimal("8.79"),
                calculoService.calcularValorMercado(new BigDecimal("9.50"), "MAL_CONDICIONADO", 85, 25)
        );

        // Exemplo 10: 1.00, MAL_CONDICIONADO, agilidade 50, idade 35 -> 1.00 (piso)
        assertEquals(
                new BigDecimal("1.00"),
                calculoService.calcularValorMercado(new BigDecimal("1.00"), "MAL_CONDICIONADO", 50, 35)
        );
    }
}
