package com.senai.passe.service;

import com.senai.passe.service.dto.ComissaoVendaResult;
import com.senai.passe.service.dto.LiquidacaoVendaResult;
import com.senai.passe.service.dto.MultaVendaResult;
import com.senai.passe.service.dto.TaxaCompraResult;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.OffsetDateTime;

@Service
public class MarketFinancialService {

    private static final BigDecimal LIMITE_VALOR_TAXA = new BigDecimal("30.00");
    private static final BigDecimal TAXA_COMPRA_PERCENTUAL = new BigDecimal("0.05");
    private static final BigDecimal TETO_MULTA = new BigDecimal("10.00");
    private static final BigDecimal FAIXA1_LUCRO = new BigDecimal("10.00");
    private static final BigDecimal COMISSAO_FAIXA1 = new BigDecimal("0.10");
    private static final BigDecimal COMISSAO_FAIXA2 = new BigDecimal("0.20");

    /**
     * RN13: Taxa de compra e limite de 50% do caixa.
     * Taxa = 5% do valor de mercado arredondada, cobrada SOMENTE quando valor de mercado > 30.00.
     * Custo total = valor de mercado + taxa.
     * Limite = exatamente 50% do caixa (sem arredondamento).
     */
    public TaxaCompraResult calcularTaxaCompra(BigDecimal valorMercado, BigDecimal caixaClube) {
        if (valorMercado == null || caixaClube == null) {
            throw new IllegalArgumentException("Valor de mercado e caixa do clube não podem ser nulos.");
        }

        BigDecimal taxa;
        if (valorMercado.compareTo(LIMITE_VALOR_TAXA) > 0) {
            taxa = valorMercado.multiply(TAXA_COMPRA_PERCENTUAL).setScale(2, RoundingMode.HALF_UP);
        } else {
            taxa = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal custoTotal = valorMercado.add(taxa).setScale(2, RoundingMode.HALF_UP);
        // Limite exato da metade do caixa, sem arredondar
        BigDecimal limite50Caixa = caixaClube.multiply(new BigDecimal("0.5"));

        boolean permitido = custoTotal.compareTo(limite50Caixa) <= 0;

        return new TaxaCompraResult(valorMercado, taxa, custoTotal, limite50Caixa, permitido);
    }

    /**
     * RN15: Dias restantes de fidelidade.
     * Diferença entre fidelidadeAte e momentoVenda em dias fracionados, arredondado para cima (Math.ceil).
     * Se já passou ou for o mesmo instante, 0.
     */
    public int calcularDiasRestantesFidelidade(OffsetDateTime fidelidadeAte, OffsetDateTime momentoVenda) {
        if (fidelidadeAte == null || momentoVenda == null) {
            return 0;
        }

        Duration duration = Duration.between(momentoVenda, fidelidadeAte);
        if (duration.isNegative() || duration.isZero()) {
            return 0;
        }

        long totalSeconds = duration.toSeconds();
        int nanoPart = duration.toNanosPart();
        long fullDays = totalSeconds / 86400;
        long remainderSeconds = totalSeconds % 86400;

        if (remainderSeconds > 0 || nanoPart > 0) {
            return (int) (fullDays + 1);
        } else {
            return (int) fullDays;
        }
    }

    /**
     * RN15: Multa por fidelidade na venda.
     * 0 dias: 0% -> ENCERRADO
     * 1 a 30 dias: 5% -> RESCINDIDO
     * 31 a 180 dias: 10% -> RESCINDIDO
     * >= 181 dias: 20% -> RESCINDIDO
     * Multa = valorMercado * percentual, arredondada e limitada ao teto de 10.00.
     */
    public MultaVendaResult calcularMultaVenda(BigDecimal valorMercado, int diasRestantes) {
        if (valorMercado == null) {
            throw new IllegalArgumentException("Valor de mercado não pode ser nulo.");
        }

        BigDecimal percentual;
        String situacao;

        if (diasRestantes <= 0) {
            percentual = BigDecimal.ZERO;
            situacao = "ENCERRADO";
        } else if (diasRestantes <= 30) {
            percentual = new BigDecimal("0.05");
            situacao = "RESCINDIDO";
        } else if (diasRestantes <= 180) {
            percentual = new BigDecimal("0.10");
            situacao = "RESCINDIDO";
        } else {
            percentual = new BigDecimal("0.20");
            situacao = "RESCINDIDO";
        }

        BigDecimal multaCalculada = valorMercado.multiply(percentual).setScale(2, RoundingMode.HALF_UP);
        if (multaCalculada.compareTo(TETO_MULTA) > 0) {
            multaCalculada = TETO_MULTA;
        }

        return new MultaVendaResult(diasRestantes, percentual, multaCalculada, situacao);
    }

    /**
     * RN16: Comissão progressiva sobre o lucro da venda.
     * Lucro = valorMercado - valorCompra.
     * Se lucro <= 0: comissão = 0.00.
     * Se lucro > 0: 10% sobre a parte até 10.00 + 20% sobre a parte acima de 10.00,
     * somadas e arredondadas UMA ÚNICA VEZ ao final.
     */
    public ComissaoVendaResult calcularComissaoVenda(BigDecimal valorMercado, BigDecimal valorCompra) {
        if (valorMercado == null || valorCompra == null) {
            throw new IllegalArgumentException("Valores de venda e compra não podem ser nulos.");
        }

        BigDecimal lucro = valorMercado.subtract(valorCompra).setScale(2, RoundingMode.HALF_UP);

        if (lucro.compareTo(BigDecimal.ZERO) <= 0) {
            return new ComissaoVendaResult(lucro, BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        }

        BigDecimal parteAte10 = lucro.min(FAIXA1_LUCRO);
        BigDecimal parteAcima10 = lucro.subtract(parteAte10).max(BigDecimal.ZERO);

        BigDecimal comissaoExata = parteAte10.multiply(COMISSAO_FAIXA1)
                .add(parteAcima10.multiply(COMISSAO_FAIXA2));

        BigDecimal comissaoFinal = comissaoExata.setScale(2, RoundingMode.HALF_UP);

        return new ComissaoVendaResult(lucro, comissaoFinal);
    }

    /**
     * RN15 e RN16: Consolidação da liquidação financeira de venda.
     * Crédito no caixa = valorMercado - multa - comissao.
     */
    public LiquidacaoVendaResult calcularLiquidacaoVenda(BigDecimal valorMercado, BigDecimal valorCompra, int diasRestantes) {
        MultaVendaResult multaResult = calcularMultaVenda(valorMercado, diasRestantes);
        ComissaoVendaResult comissaoResult = calcularComissaoVenda(valorMercado, valorCompra);

        BigDecimal creditoCaixa = valorMercado
                .subtract(multaResult.multa())
                .subtract(comissaoResult.comissao())
                .setScale(2, RoundingMode.HALF_UP);

        return new LiquidacaoVendaResult(
                valorCompra,
                valorMercado,
                diasRestantes,
                multaResult.percentualMulta(),
                multaResult.multa(),
                comissaoResult.lucro(),
                comissaoResult.comissao(),
                creditoCaixa,
                multaResult.situacaoContrato()
        );
    }

    /**
     * Sobrecarga aceitando as datas de fidelidade e momento da venda.
     */
    public LiquidacaoVendaResult calcularLiquidacaoVenda(BigDecimal valorMercado, BigDecimal valorCompra,
                                                        OffsetDateTime fidelidadeAte, OffsetDateTime momentoVenda) {
        int diasRestantes = calcularDiasRestantesFidelidade(fidelidadeAte, momentoVenda);
        return calcularLiquidacaoVenda(valorMercado, valorCompra, diasRestantes);
    }
}
