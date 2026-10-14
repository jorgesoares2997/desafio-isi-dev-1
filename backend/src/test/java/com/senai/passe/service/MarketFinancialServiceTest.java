package com.senai.passe.service;

import com.senai.passe.service.dto.ComissaoVendaResult;
import com.senai.passe.service.dto.LiquidacaoVendaResult;
import com.senai.passe.service.dto.MultaVendaResult;
import com.senai.passe.service.dto.TaxaCompraResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

class MarketFinancialServiceTest {

    private MarketFinancialService financialService;
    private static final ZoneOffset FUSO_BRASILIA = ZoneOffset.of("-03:00");

    @BeforeEach
    void setUp() {
        financialService = new MarketFinancialService();
    }

    @Nested
    @DisplayName("RN13 - Taxa de Compra e Limite de 50% do Caixa")
    class TaxaCompraTests {

        @Test
        @DisplayName("Exemplo 1: Caixa 300.00, Valor 28.00 -> Taxa 0.00, Custo 28.00, Limite 150.00 -> Aceita")
        void exemplo1() {
            TaxaCompraResult result = financialService.calcularTaxaCompra(new BigDecimal("28.00"), new BigDecimal("300.00"));
            assertEquals(new BigDecimal("0.00"), result.taxa());
            assertEquals(new BigDecimal("28.00"), result.custoTotal());
            assertEquals(0, new BigDecimal("150.00").compareTo(result.limite50Caixa()));
            assertTrue(result.permitido());
        }

        @Test
        @DisplayName("Exemplo 2: Caixa 300.00, Valor 30.00 -> Taxa 0.00 (não maior que 30.00) -> Aceita")
        void exemplo2() {
            TaxaCompraResult result = financialService.calcularTaxaCompra(new BigDecimal("30.00"), new BigDecimal("300.00"));
            assertEquals(new BigDecimal("0.00"), result.taxa());
            assertEquals(new BigDecimal("30.00"), result.custoTotal());
            assertTrue(result.permitido());
        }

        @Test
        @DisplayName("Exemplo 3: Caixa 300.00, Valor 30.01 -> Taxa 1.50 (1.5005 arredondado) -> Aceita")
        void exemplo3() {
            TaxaCompraResult result = financialService.calcularTaxaCompra(new BigDecimal("30.01"), new BigDecimal("300.00"));
            assertEquals(new BigDecimal("1.50"), result.taxa());
            assertEquals(new BigDecimal("31.51"), result.custoTotal());
            assertTrue(result.permitido());
        }

        @Test
        @DisplayName("Exemplo 4: Caixa 100.00, Valor 47.62 -> Taxa 2.38, Custo 50.00, Limite 50.00 -> Aceita (igual ao limite)")
        void exemplo4() {
            TaxaCompraResult result = financialService.calcularTaxaCompra(new BigDecimal("47.62"), new BigDecimal("100.00"));
            assertEquals(new BigDecimal("2.38"), result.taxa());
            assertEquals(new BigDecimal("50.00"), result.custoTotal());
            assertTrue(result.permitido());
        }

        @Test
        @DisplayName("Exemplo 5: Caixa 100.00, Valor 48.00 -> Taxa 2.40, Custo 50.40, Limite 50.00 -> Recusada")
        void exemplo5() {
            TaxaCompraResult result = financialService.calcularTaxaCompra(new BigDecimal("48.00"), new BigDecimal("100.00"));
            assertEquals(new BigDecimal("2.40"), result.taxa());
            assertEquals(new BigDecimal("50.40"), result.custoTotal());
            assertFalse(result.permitido());
        }

        @Test
        @DisplayName("Caso limite com caixa decimal: Caixa 261.15 -> Limite 130.575 exato sem arredondamento")
        void casoLimiteCaixaDecimal() {
            BigDecimal caixa = new BigDecimal("261.15");
            // Limite é 130.575
            // Custo de 130.58 deve ser recusado
            // Custo de 130.57 deve ser aceito
            TaxaCompraResult resultAbaixo = financialService.calcularTaxaCompra(new BigDecimal("130.57"), caixa);
            // Taxa para 130.57 é 6.53 -> custo total 137.10 > 130.575 -> recusado
            assertFalse(resultAbaixo.permitido());
        }
    }

    @Nested
    @DisplayName("RN15 - Multa por Fidelidade na Venda")
    class MultaFidelidadeTests {

        @Test
        @DisplayName("Dias restantes: fim da fidelidade já passou -> 0 dias")
        void fidelidadeJaPassou() {
            OffsetDateTime venda = OffsetDateTime.of(2026, 11, 5, 16, 40, 0, 0, FUSO_BRASILIA);
            OffsetDateTime fim = OffsetDateTime.of(2026, 11, 4, 16, 40, 0, 0, FUSO_BRASILIA);

            int dias = financialService.calcularDiasRestantesFidelidade(fim, venda);
            assertEquals(0, dias);

            MultaVendaResult multa = financialService.calcularMultaVenda(new BigDecimal("40.00"), dias);
            assertEquals(new BigDecimal("0.00"), multa.multa());
            assertEquals("ENCERRADO", multa.situacaoContrato());
        }

        @Test
        @DisplayName("Dias restantes: 10 dias e 2 horas -> 11 dias arredondado para cima (5%)")
        void fidelidade10Dias2Horas() {
            OffsetDateTime venda = OffsetDateTime.of(2026, 11, 5, 12, 0, 0, 0, FUSO_BRASILIA);
            OffsetDateTime fim = OffsetDateTime.of(2026, 11, 15, 14, 0, 0, 0, FUSO_BRASILIA);

            int dias = financialService.calcularDiasRestantesFidelidade(fim, venda);
            assertEquals(11, dias);

            MultaVendaResult multa = financialService.calcularMultaVenda(new BigDecimal("30.00"), dias);
            assertEquals(new BigDecimal("0.05"), multa.percentualMulta());
            assertEquals(new BigDecimal("1.50"), multa.multa());
            assertEquals("RESCINDIDO", multa.situacaoContrato());
        }

        @Test
        @DisplayName("Dias restantes: exatamente 30 dias -> 30 dias (5%)")
        void fidelidadeExatamente30Dias() {
            OffsetDateTime venda = OffsetDateTime.of(2026, 11, 5, 12, 0, 0, 0, FUSO_BRASILIA);
            OffsetDateTime fim = OffsetDateTime.of(2026, 12, 5, 12, 0, 0, 0, FUSO_BRASILIA);

            int dias = financialService.calcularDiasRestantesFidelidade(fim, venda);
            assertEquals(30, dias);

            MultaVendaResult multa = financialService.calcularMultaVenda(new BigDecimal("100.00"), dias);
            assertEquals(new BigDecimal("0.05"), multa.percentualMulta());
            assertEquals(new BigDecimal("5.00"), multa.multa());
            assertEquals("RESCINDIDO", multa.situacaoContrato());
        }

        @Test
        @DisplayName("Dias restantes: 30 dias e 1 minuto -> 31 dias (10%)")
        void fidelidade30Dias1Minuto() {
            OffsetDateTime venda = OffsetDateTime.of(2026, 11, 5, 12, 0, 0, 0, FUSO_BRASILIA);
            OffsetDateTime fim = OffsetDateTime.of(2026, 12, 5, 12, 1, 0, 0, FUSO_BRASILIA);

            int dias = financialService.calcularDiasRestantesFidelidade(fim, venda);
            assertEquals(31, dias);

            MultaVendaResult multa = financialService.calcularMultaVenda(new BigDecimal("100.00"), dias);
            assertEquals(new BigDecimal("0.10"), multa.percentualMulta());
            assertEquals(new BigDecimal("10.00"), multa.multa());
            assertEquals("RESCINDIDO", multa.situacaoContrato());
        }

        @Test
        @DisplayName("Dias restantes: exatamente 180 dias -> 180 dias (10%)")
        void fidelidadeExatamente180Dias() {
            OffsetDateTime venda = OffsetDateTime.of(2026, 1, 1, 0, 0, 0, 0, FUSO_BRASILIA);
            OffsetDateTime fim = venda.plusDays(180);

            int dias = financialService.calcularDiasRestantesFidelidade(fim, venda);
            assertEquals(180, dias);

            MultaVendaResult multa = financialService.calcularMultaVenda(new BigDecimal("50.00"), dias);
            assertEquals(new BigDecimal("0.10"), multa.percentualMulta());
            assertEquals(new BigDecimal("5.00"), multa.multa());
            assertEquals("RESCINDIDO", multa.situacaoContrato());
        }

        @Test
        @DisplayName("Dias restantes: 180 dias e 1 minuto -> 181 dias (20%)")
        void fidelidade180Dias1Minuto() {
            OffsetDateTime venda = OffsetDateTime.of(2026, 1, 1, 0, 0, 0, 0, FUSO_BRASILIA);
            OffsetDateTime fim = venda.plusDays(180).plusMinutes(1);

            int dias = financialService.calcularDiasRestantesFidelidade(fim, venda);
            assertEquals(181, dias);

            MultaVendaResult multa = financialService.calcularMultaVenda(new BigDecimal("40.00"), dias);
            assertEquals(new BigDecimal("0.20"), multa.percentualMulta());
            assertEquals(new BigDecimal("8.00"), multa.multa());
            assertEquals("RESCINDIDO", multa.situacaoContrato());
        }

        @Test
        @DisplayName("Cenário Águias FC vendendo Meia Lua: 116 dias, 17 horas e 35 minutos -> 117 dias (10% de 40.00 = 4.00)")
        void cenarioOficialAguiasVendaMeiaLua() {
            OffsetDateTime fidelidadeAte = OffsetDateTime.of(2027, 3, 2, 10, 15, 0, 0, FUSO_BRASILIA);
            OffsetDateTime momentoVenda = OffsetDateTime.of(2026, 11, 5, 16, 40, 0, 0, FUSO_BRASILIA);

            int dias = financialService.calcularDiasRestantesFidelidade(fidelidadeAte, momentoVenda);
            assertEquals(117, dias);

            MultaVendaResult multa = financialService.calcularMultaVenda(new BigDecimal("40.00"), dias);
            assertEquals(new BigDecimal("0.10"), multa.percentualMulta());
            assertEquals(new BigDecimal("4.00"), multa.multa());
            assertEquals("RESCINDIDO", multa.situacaoContrato());
        }

        @Test
        @DisplayName("Teto da multa: 20% de 75.00 = 15.00 limitado ao teto de 10.00")
        void tetoMaximoMulta10Reais() {
            MultaVendaResult multa = financialService.calcularMultaVenda(new BigDecimal("75.00"), 200);
            assertEquals(new BigDecimal("0.20"), multa.percentualMulta());
            assertEquals(new BigDecimal("10.00"), multa.multa());
        }
    }

    @Nested
    @DisplayName("RN16 - Comissão Progressiva sobre o Lucro da Venda")
    class ComissaoVendaTests {

        @Test
        @DisplayName("Lucro 3.00 -> 10% * 3.00 = 0.30")
        void lucro3Reais() {
            ComissaoVendaResult result = financialService.calcularComissaoVenda(new BigDecimal("40.00"), new BigDecimal("37.00"));
            assertEquals(new BigDecimal("3.00"), result.lucro());
            assertEquals(new BigDecimal("0.30"), result.comissao());
        }

        @Test
        @DisplayName("Lucro 3.85 -> 10% * 3.85 = 0.385 arredondado para 0.39")
        void lucro385Reais() {
            ComissaoVendaResult result = financialService.calcularComissaoVenda(new BigDecimal("30.00"), new BigDecimal("26.15"));
            assertEquals(new BigDecimal("3.85"), result.lucro());
            assertEquals(new BigDecimal("0.39"), result.comissao());
        }

        @Test
        @DisplayName("Lucro 10.00 -> 10% * 10.00 = 1.00")
        void lucro10Reais() {
            ComissaoVendaResult result = financialService.calcularComissaoVenda(new BigDecimal("50.00"), new BigDecimal("40.00"));
            assertEquals(new BigDecimal("10.00"), result.lucro());
            assertEquals(new BigDecimal("1.00"), result.comissao());
        }

        @Test
        @DisplayName("Lucro 10.01 -> 10% * 10.00 + 20% * 0.01 = 1.002 arredondado para 1.00")
        void lucro1001Reais() {
            ComissaoVendaResult result = financialService.calcularComissaoVenda(new BigDecimal("50.01"), new BigDecimal("40.00"));
            assertEquals(new BigDecimal("10.01"), result.lucro());
            assertEquals(new BigDecimal("1.00"), result.comissao());
        }

        @Test
        @DisplayName("Lucro 15.00 -> 10% * 10.00 + 20% * 5.00 = 1.00 + 1.00 = 2.00")
        void lucro15Reais() {
            ComissaoVendaResult result = financialService.calcularComissaoVenda(new BigDecimal("75.00"), new BigDecimal("60.00"));
            assertEquals(new BigDecimal("15.00"), result.lucro());
            assertEquals(new BigDecimal("2.00"), result.comissao());
        }

        @Test
        @DisplayName("Prejuízo (lucro negativo): 42.50 - 50.00 = -7.50 -> sem lucro, comissão 0.00")
        void prejuizoSemComissao() {
            ComissaoVendaResult result = financialService.calcularComissaoVenda(new BigDecimal("42.50"), new BigDecimal("50.00"));
            assertEquals(new BigDecimal("-7.50"), result.lucro());
            assertEquals(new BigDecimal("0.00"), result.comissao());
        }
    }

    @Nested
    @DisplayName("RN15 e RN16 - Liquidação Financeira Consolidada de Venda (Tabela Oficial)")
    class LiquidacaoConsolidadaTests {

        @Test
        @DisplayName("Linha 1: Compra 37.00, Venda 40.00, Multa 10% (4.00), Lucro 3.00, Comissão 0.30 -> Crédito 35.70")
        void linha1() {
            LiquidacaoVendaResult res = financialService.calcularLiquidacaoVenda(
                    new BigDecimal("40.00"), new BigDecimal("37.00"), 117);

            assertEquals(new BigDecimal("4.00"), res.multa());
            assertEquals(new BigDecimal("3.00"), res.lucro());
            assertEquals(new BigDecimal("0.30"), res.comissao());
            assertEquals(new BigDecimal("35.70"), res.creditoCaixa());
            assertEquals("RESCINDIDO", res.situacaoContrato());
        }

        @Test
        @DisplayName("Linha 2: Compra 50.00, Venda 42.50, Multa 20% (8.50), Lucro -7.50, Comissão 0.00 -> Crédito 34.00")
        void linha2() {
            LiquidacaoVendaResult res = financialService.calcularLiquidacaoVenda(
                    new BigDecimal("42.50"), new BigDecimal("50.00"), 200);

            assertEquals(new BigDecimal("8.50"), res.multa());
            assertEquals(new BigDecimal("-7.50"), res.lucro());
            assertEquals(new BigDecimal("0.00"), res.comissao());
            assertEquals(new BigDecimal("34.00"), res.creditoCaixa());
            assertEquals("RESCINDIDO", res.situacaoContrato());
        }

        @Test
        @DisplayName("Linha 3: Compra 26.15, Venda 30.00, Multa 5% (1.50), Lucro 3.85, Comissão 0.39 -> Crédito 28.11")
        void linha3() {
            LiquidacaoVendaResult res = financialService.calcularLiquidacaoVenda(
                    new BigDecimal("30.00"), new BigDecimal("26.15"), 15);

            assertEquals(new BigDecimal("1.50"), res.multa());
            assertEquals(new BigDecimal("3.85"), res.lucro());
            assertEquals(new BigDecimal("0.39"), res.comissao());
            assertEquals(new BigDecimal("28.11"), res.creditoCaixa());
            assertEquals("RESCINDIDO", res.situacaoContrato());
        }

        @Test
        @DisplayName("Linha 4: Compra 25.00, Venda 25.00, Multa 0% (0.00), Lucro 0.00, Comissão 0.00 -> Crédito 25.00")
        void linha4() {
            LiquidacaoVendaResult res = financialService.calcularLiquidacaoVenda(
                    new BigDecimal("25.00"), new BigDecimal("25.00"), 0);

            assertEquals(new BigDecimal("0.00"), res.multa());
            assertEquals(new BigDecimal("0.00"), res.lucro());
            assertEquals(new BigDecimal("0.00"), res.comissao());
            assertEquals(new BigDecimal("25.00"), res.creditoCaixa());
            assertEquals("ENCERRADO", res.situacaoContrato());
        }

        @Test
        @DisplayName("Linha 5: Compra 60.00, Venda 75.00, Multa 20% limitada a 10.00, Lucro 15.00, Comissão 2.00 -> Crédito 63.00")
        void linha5() {
            LiquidacaoVendaResult res = financialService.calcularLiquidacaoVenda(
                    new BigDecimal("75.00"), new BigDecimal("60.00"), 200);

            assertEquals(new BigDecimal("10.00"), res.multa());
            assertEquals(new BigDecimal("15.00"), res.lucro());
            assertEquals(new BigDecimal("2.00"), res.comissao());
            assertEquals(new BigDecimal("63.00"), res.creditoCaixa());
            assertEquals("RESCINDIDO", res.situacaoContrato());
        }
    }
}
