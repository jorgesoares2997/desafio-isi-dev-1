package com.senai.passe.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PlayerValuationServiceTest {

    private PlayerValuationService valuationService;

    @BeforeEach
    void setUp() {
        valuationService = new PlayerValuationService();
    }

    @Nested
    @DisplayName("RN06 - Cálculo de Overall por Posição")
    class OverallTests {

        @Test
        @DisplayName("Deve calcular overall de MEI (peso: pas 35%, dri 25%, fin 15%, vel 10%, fis 10%, def 5%)")
        void deveCalcularOverallMeioCampo() {
            // MEI: vel 68, fin 65, pas 80, dri 78, def 52, fis 60 -> 7.265 / 100 = 72.65 -> 73
            int overall = valuationService.calcularOverall("MEI", 68, 65, 80, 78, 52, 60);
            assertEquals(73, overall);
        }

        @Test
        @DisplayName("Deve calcular overall de ATA (peso: fin 40%, vel 20%, dri 20%, fis 10%, pas 10%, def 0%)")
        void deveCalcularOverallAtacante() {
            // ATA: vel 78, fin 75, pas 73, dri 82, def 48, fis 68 -> 7.610 / 100 = 76.10 -> 76
            int overall = valuationService.calcularOverall("ATA", 78, 75, 73, 82, 48, 68);
            assertEquals(76, overall);
        }

        @Test
        @DisplayName("Deve calcular overall de LAT (peso: def 25%, vel 25%, pas 20%, dri 15%, fis 15%, fin 0%)")
        void deveCalcularOverallLateral() {
            // LAT: vel 72, fin 70, pas 78, dri 76, def 70, fis 66 -> 7.240 / 100 = 72.40 -> 72
            int overall = valuationService.calcularOverall("LAT", 72, 70, 78, 76, 70, 66);
            assertEquals(72, overall);
        }

        @Test
        @DisplayName("Deve calcular overall de ZAG com arredondamento meio para cima (peso: def 45%, fis 30%, pas 15%, vel 10%, fin 0%, dri 0%)")
        void deveCalcularOverallZagueiro() {
            // ZAG: vel 50, fin 90, pas 60, dri 40, def 80, fis 75 -> 7.250 / 100 = 72.50 -> 73 (meio para cima)
            int overall = valuationService.calcularOverall("ZAG", 50, 90, 60, 40, 80, 75);
            assertEquals(73, overall);
        }

        @Test
        @DisplayName("Deve calcular overall de GOL (peso: def 40%, fis 30%, pas 20%, vel 10%, fin 0%, dri 0%)")
        void deveCalcularOverallGoleiro() {
            // GOL: vel 55, fin 30, pas 65, dri 40, def 72, fis 68 -> 6.770 / 100 = 67.70 -> 68
            int overall = valuationService.calcularOverall("GOL", 55, 30, 65, 40, 72, 68);
            assertEquals(68, overall);
        }
    }

    @Nested
    @DisplayName("RN06 - Cálculo do Valor Base")
    class ValorBaseTests {

        @Test
        @DisplayName("Deve calcular valor base para jogador acima de 21 anos na faixa 2 (overall 75, pot 86, idade 25)")
        void deveCalcularValorBaseExemplo1() {
            // 20 * 0.50 + 15 * 2.00 = 40.00
            BigDecimal valorBase = valuationService.calcularValorBase(75, 86, 25);
            assertEquals(new BigDecimal("40.00"), valorBase);
        }

        @Test
        @DisplayName("Deve calcular valor base no fim da primeira faixa (overall 60, pot 70, idade 30)")
        void deveCalcularValorBaseFimFaixa1() {
            // 20 * 0.50 = 10.00
            BigDecimal valorBase = valuationService.calcularValorBase(60, 70, 30);
            assertEquals(new BigDecimal("10.00"), valorBase);
        }

        @Test
        @DisplayName("Deve calcular valor base no início da segunda faixa (overall 61, pot 70, idade 30)")
        void deveCalcularValorBaseInicioFaixa2() {
            // 10.00 + 1 * 2.00 = 12.00
            BigDecimal valorBase = valuationService.calcularValorBase(61, 70, 30);
            assertEquals(new BigDecimal("12.00"), valorBase);
        }

        @Test
        @DisplayName("Deve calcular valor base no início da terceira faixa (overall 76, pot 80, idade 22)")
        void deveCalcularValorBaseInicioFaixa3() {
            // 10.00 + 30.00 + 1 * 6.00 = 46.00
            BigDecimal valorBase = valuationService.calcularValorBase(76, 80, 22);
            assertEquals(new BigDecimal("46.00"), valorBase);
        }

        @Test
        @DisplayName("Deve calcular valor base na terceira faixa avançada (overall 85, pot 92, idade 27)")
        void deveCalcularValorBaseFaixa3Avancada() {
            // 10.00 + 30.00 + 10 * 6.00 = 100.00
            BigDecimal valorBase = valuationService.calcularValorBase(85, 92, 27);
            assertEquals(new BigDecimal("100.00"), valorBase);
        }

        @Test
        @DisplayName("Deve aplicar multiplicador de jovem promessa para idade <= 21 anos (overall 70, pot 84, idade 21)")
        void deveAplicarJovemPromessaIdade21() {
            // parte: 10.00 + 10 * 2.00 = 30.00. Multiplicador: (100 + 14) / 100 = 1.14 -> 34.20
            BigDecimal valorBase = valuationService.calcularValorBase(70, 84, 21);
            assertEquals(new BigDecimal("34.20"), valorBase);
        }

        @Test
        @DisplayName("Não deve aplicar multiplicador de jovem promessa para idade 22 anos")
        void naoDeveAplicarJovemPromessaIdade22() {
            // parte: 30.00 (sem multiplicador)
            BigDecimal valorBase = valuationService.calcularValorBase(70, 84, 22);
            assertEquals(new BigDecimal("30.00"), valorBase);
        }

        @Test
        @DisplayName("Deve arredondar meio para longe do zero no multiplicador de jovem promessa (overall 45, pot 90, idade 18)")
        void deveArredondarMeioLongeZeroJovemPromessa() {
            // parte: 5 * 0.50 = 2.50. Multiplicador: (100 + 45) / 100 = 1.45 -> 3.625 -> 3.63
            BigDecimal valorBase = valuationService.calcularValorBase(45, 90, 18);
            assertEquals(new BigDecimal("3.63"), valorBase);
        }

        @Test
        @DisplayName("Deve garantir piso de 1.00 quando parte do overall for zero (overall <= 40)")
        void deveGarantirPisoMinimo() {
            // overall 40 -> 0.00 -> sobe para o piso 1.00
            BigDecimal valorBase = valuationService.calcularValorBase(40, 66, 36);
            assertEquals(new BigDecimal("1.00"), valorBase);
        }
    }

    @Nested
    @DisplayName("RN02 a RN05 - Cálculo do Valor de Mercado (Tabela Oficial)")
    class ValorMercadoTests {

        @Test
        @DisplayName("Linha 1: 82.00, APTO, agilidade 20, idade 25 -> 82.00")
        void linha1() {
            BigDecimal resultado = valuationService.calcularValorMercado(new BigDecimal("82.00"), "APTO", 20, 25);
            assertEquals(new BigDecimal("82.00"), resultado);
        }

        @Test
        @DisplayName("Linha 2: 82.00, APTO, agilidade 50, idade 19 -> 90.20 (+10% jovem promessa)")
        void linha2() {
            BigDecimal resultado = valuationService.calcularValorMercado(new BigDecimal("82.00"), "APTO", 50, 19);
            assertEquals(new BigDecimal("90.20"), resultado);
        }

        @Test
        @DisplayName("Linha 3: 82.00, MAL_CONDICIONADO, agilidade 50, idade 25 -> 69.70 (-15%)")
        void linha3() {
            BigDecimal resultado = valuationService.calcularValorMercado(new BigDecimal("82.00"), "MAL_CONDICIONADO", 50, 25);
            assertEquals(new BigDecimal("69.70"), resultado);
        }

        @Test
        @DisplayName("Linha 4: 82.00, MAL_CONDICIONADO, agilidade 80, idade 21 -> 84.05 (-7.5% + 10% = +2.5%)")
        void linha4() {
            BigDecimal resultado = valuationService.calcularValorMercado(new BigDecimal("82.00"), "MAL_CONDICIONADO", 80, 21);
            assertEquals(new BigDecimal("84.05"), resultado);
        }

        @Test
        @DisplayName("Linha 5: 82.00, MAL_CONDICIONADO, agilidade 30, idade 33 -> 53.30 (-25% - 10% = -35%)")
        void linha5() {
            BigDecimal resultado = valuationService.calcularValorMercado(new BigDecimal("82.00"), "MAL_CONDICIONADO", 30, 33);
            assertEquals(new BigDecimal("53.30"), resultado);
        }

        @Test
        @DisplayName("Linha 6: 82.00, DOENTE, agilidade 90, idade 25 -> 69.70 (-15%)")
        void linha6() {
            BigDecimal resultado = valuationService.calcularValorMercado(new BigDecimal("82.00"), "DOENTE", 90, 25);
            assertEquals(new BigDecimal("69.70"), resultado);
        }

        @Test
        @DisplayName("Linha 7: 82.00, DOENTE, agilidade 30, idade 25 -> 49.20 (-40% exatamente no teto)")
        void linha7() {
            BigDecimal resultado = valuationService.calcularValorMercado(new BigDecimal("82.00"), "DOENTE", 30, 25);
            assertEquals(new BigDecimal("49.20"), resultado);
        }

        @Test
        @DisplayName("Linha 8: 82.00, DOENTE, agilidade 10, idade 40 -> 49.20 (-50% limitado ao teto de -40%)")
        void linha8() {
            BigDecimal resultado = valuationService.calcularValorMercado(new BigDecimal("82.00"), "DOENTE", 10, 40);
            assertEquals(new BigDecimal("49.20"), resultado);
        }

        @Test
        @DisplayName("Linha 9: 9.50, MAL_CONDICIONADO, agilidade 85, idade 25 -> 8.79 (8.7875 arredondado)")
        void linha9() {
            BigDecimal resultado = valuationService.calcularValorMercado(new BigDecimal("9.50"), "MAL_CONDICIONADO", 85, 25);
            assertEquals(new BigDecimal("8.79"), resultado);
        }

        @Test
        @DisplayName("Linha 10: 1.00, MAL_CONDICIONADO, agilidade 50, idade 35 -> 1.00 (0.75 sobe para o piso)")
        void linha10() {
            BigDecimal resultado = valuationService.calcularValorMercado(new BigDecimal("1.00"), "MAL_CONDICIONADO", 50, 35);
            assertEquals(new BigDecimal("1.00"), resultado);
        }
    }
}
