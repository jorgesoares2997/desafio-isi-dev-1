package com.senai.passe.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class CalculoService {

    /**
     * RN02, RN03, RN04, RN05 - Cálculo do valor de mercado
     */
    public BigDecimal calcularValorMercado(BigDecimal valorBase, String condicao, int agilidade, int idade) {
        if (valorBase == null) {
            return BigDecimal.ZERO;
        }

        // 1. Desconto por condição (RN02)
        BigDecimal descontoCondicao;
        if ("MAL_CONDICIONADO".equalsIgnoreCase(condicao)) {
            descontoCondicao = new BigDecimal("15.0");
        } else if ("DOENTE".equalsIgnoreCase(condicao)) {
            descontoCondicao = new BigDecimal("30.0");
        } else {
            descontoCondicao = BigDecimal.ZERO;
        }

        // RN03 - Efeito da agilidade (somente quando não está APTO)
        if (!"APTO".equalsIgnoreCase(condicao) && descontoCondicao.compareTo(BigDecimal.ZERO) > 0) {
            if (agilidade >= 80 && agilidade <= 100) {
                // O desconto cai pela metade
                descontoCondicao = descontoCondicao.divide(new BigDecimal("2"), 4, RoundingMode.HALF_UP);
            } else if (agilidade >= 1 && agilidade <= 30) {
                // O desconto aumenta 10 pontos percentuais
                descontoCondicao = descontoCondicao.add(new BigDecimal("10.0"));
            }
        }

        // 2. Ajuste por idade (RN04)
        BigDecimal ajusteIdade;
        if (idade <= 21) {
            ajusteIdade = new BigDecimal("10.0");
        } else if (idade <= 31) {
            ajusteIdade = BigDecimal.ZERO;
        } else {
            ajusteIdade = new BigDecimal("-10.0");
        }

        // 3. Percentual total = ajuste por idade - desconto por condição (RN05)
        BigDecimal percentualTotal = ajusteIdade.subtract(descontoCondicao);

        // Teto do desconto: se o percentual total ficar abaixo de -40%, usa-se -40%
        BigDecimal tetoDesconto = new BigDecimal("-40.0");
        if (percentualTotal.compareTo(tetoDesconto) < 0) {
            percentualTotal = tetoDesconto;
        }

        // 4. Valor de mercado = valor base * (100 + percentual total) / 100
        BigDecimal multiplicador = new BigDecimal("100.0").add(percentualTotal)
                .divide(new BigDecimal("100.0"), 6, RoundingMode.HALF_UP);
        BigDecimal valorCalculado = valorBase.multiply(multiplicador)
                .setScale(2, RoundingMode.HALF_UP);

        // 5. Piso: mínimo 1.00
        if (valorCalculado.compareTo(new BigDecimal("1.00")) < 0) {
            return new BigDecimal("1.00");
        }

        return valorCalculado;
    }
}
