package com.senai.passe.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class PlayerValuationService {

    /**
     * RN06: Cálculo do Overall
     * Baseado na média ponderada dos 6 atributos conforme a posição.
     * Arredondamento para o inteiro mais próximo (meio para cima: 72.5 -> 73).
     */
    public int calcularOverall(String posicao, int pace, int shooting, int passing, int dribbling, int defending, int physical) {
        if (posicao == null) {
            return 0;
        }

        int pesoPace;
        int pesoShooting;
        int pesoPassing;
        int pesoDribbling;
        int pesoDefending;
        int pesoPhysical;

        switch (posicao.toUpperCase().trim()) {
            case "GOL":
                pesoPace = 10;
                pesoShooting = 0;
                pesoPassing = 20;
                pesoDribbling = 0;
                pesoDefending = 40;
                pesoPhysical = 30;
                break;
            case "ZAG":
                pesoPace = 10;
                pesoShooting = 0;
                pesoPassing = 15;
                pesoDribbling = 0;
                pesoDefending = 45;
                pesoPhysical = 30;
                break;
            case "LAT":
                pesoPace = 25;
                pesoShooting = 0;
                pesoPassing = 20;
                pesoDribbling = 15;
                pesoDefending = 25;
                pesoPhysical = 15;
                break;
            case "MEI":
                pesoPace = 10;
                pesoShooting = 15;
                pesoPassing = 35;
                pesoDribbling = 25;
                pesoDefending = 5;
                pesoPhysical = 10;
                break;
            case "ATA":
                pesoPace = 20;
                pesoShooting = 40;
                pesoPassing = 10;
                pesoDribbling = 20;
                pesoDefending = 0;
                pesoPhysical = 10;
                break;
            default:
                throw new IllegalArgumentException("Posição desconhecida para cálculo de overall: " + posicao);
        }

        int somaProdutos = (pace * pesoPace)
                + (shooting * pesoShooting)
                + (passing * pesoPassing)
                + (dribbling * pesoDribbling)
                + (defending * pesoDefending)
                + (physical * pesoPhysical);

        return new BigDecimal(somaProdutos)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP)
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();
    }

    /**
     * RN06: Cálculo do Valor Base
     * Calculado uma única vez no cadastro com base no overall, potencial e idade no cadastro.
     */
    public BigDecimal calcularValorBase(int overall, int potential, int idadeCadastro) {
        BigDecimal parteOverall = BigDecimal.ZERO;

        // Faixa 1: 41 a 60 (0,50 por ponto)
        if (overall > 40) {
            int pontosFaixa1 = Math.min(overall, 60) - 40;
            parteOverall = parteOverall.add(new BigDecimal(pontosFaixa1).multiply(new BigDecimal("0.50")));
        }

        // Faixa 2: 61 a 75 (2,00 por ponto)
        if (overall > 60) {
            int pontosFaixa2 = Math.min(overall, 75) - 60;
            parteOverall = parteOverall.add(new BigDecimal(pontosFaixa2).multiply(new BigDecimal("2.00")));
        }

        // Faixa 3: 76 a 99 (6,00 por ponto)
        if (overall > 75) {
            int pontosFaixa3 = overall - 75;
            parteOverall = parteOverall.add(new BigDecimal(pontosFaixa3).multiply(new BigDecimal("6.00")));
        }

        BigDecimal valorCalculado = parteOverall;

        // Jovem promessa: idade no cadastro até 21 anos
        if (idadeCadastro <= 21) {
            int fator = 100 + potential - overall;
            BigDecimal multiplicador = new BigDecimal(fator).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            valorCalculado = parteOverall.multiply(multiplicador);
        }

        // Arredondamento final de moeda (uma única vez, HALF_UP para 2 casas)
        BigDecimal valorFinal = valorCalculado.setScale(2, RoundingMode.HALF_UP);

        // Piso mínimo de 1.00
        if (valorFinal.compareTo(new BigDecimal("1.00")) < 0) {
            return new BigDecimal("1.00");
        }

        return valorFinal;
    }

    /**
     * RN02, RN03, RN04, RN05: Cálculo do Valor de Mercado
     * Calculado sob demanda a cada consulta (nunca persistido).
     */
    public BigDecimal calcularValorMercado(BigDecimal valorBase, String condicao, int agilidade, int idadeAtual) {
        if (valorBase == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        // 1. Desconto por condição física (RN02)
        BigDecimal descontoCondicao;
        if ("MAL_CONDICIONADO".equalsIgnoreCase(condicao)) {
            descontoCondicao = new BigDecimal("15.0");
        } else if ("DOENTE".equalsIgnoreCase(condicao)) {
            descontoCondicao = new BigDecimal("30.0");
        } else {
            descontoCondicao = BigDecimal.ZERO;
        }

        // RN03: Efeito da agilidade (somente quando não está APTO)
        if (!"APTO".equalsIgnoreCase(condicao) && descontoCondicao.compareTo(BigDecimal.ZERO) > 0) {
            if (agilidade >= 80 && agilidade <= 100) {
                // Desconto cai pela metade
                descontoCondicao = descontoCondicao.divide(new BigDecimal("2"), 4, RoundingMode.HALF_UP);
            } else if (agilidade >= 1 && agilidade <= 30) {
                // Desconto aumenta 10 pontos percentuais
                descontoCondicao = descontoCondicao.add(new BigDecimal("10.0"));
            }
        }

        // 2. Ajuste por idade atual (RN04)
        BigDecimal ajusteIdade;
        if (idadeAtual <= 21) {
            ajusteIdade = new BigDecimal("10.0");
        } else if (idadeAtual <= 31) {
            ajusteIdade = BigDecimal.ZERO;
        } else {
            ajusteIdade = new BigDecimal("-10.0");
        }

        // 3. Percentual total = ajuste idade - desconto condição (RN05)
        BigDecimal percentualTotal = ajusteIdade.subtract(descontoCondicao);

        // Teto de desconto: no máximo -40%
        BigDecimal tetoDesconto = new BigDecimal("-40.0");
        if (percentualTotal.compareTo(tetoDesconto) < 0) {
            percentualTotal = tetoDesconto;
        }

        // 4. Valor de mercado = valorBase * (100 + percentualTotal) / 100
        BigDecimal multiplicador = new BigDecimal("100.0").add(percentualTotal)
                .divide(new BigDecimal("100.0"), 6, RoundingMode.HALF_UP);
        BigDecimal valorCalculado = valorBase.multiply(multiplicador)
                .setScale(2, RoundingMode.HALF_UP);

        // 5. Piso mínimo de 1.00
        if (valorCalculado.compareTo(new BigDecimal("1.00")) < 0) {
            return new BigDecimal("1.00");
        }

        return valorCalculado;
    }
}
