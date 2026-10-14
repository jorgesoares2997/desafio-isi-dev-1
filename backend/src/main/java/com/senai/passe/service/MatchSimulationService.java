package com.senai.passe.service;

import com.senai.passe.service.dto.DueloResult;
import com.senai.passe.service.dto.PartidaSimulacaoResult;
import com.senai.passe.service.dto.TitularInfo;
import com.senai.passe.util.NameNormalizationUtils;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class MatchSimulationService {

    /**
     * RN20: Efeito da condição física MAL_CONDICIONADO no atributo:
     * titular MAL_CONDICIONADO joga com 15% a menos em cada atributo (atributo * 0.85,
     * arredondado para o inteiro mais próximo com meio para cima).
     */
    public int calcularAtributoEfetivo(int atributoOriginal, String condicao) {
        if ("MAL_CONDICIONADO".equalsIgnoreCase(condicao)) {
            return new BigDecimal(atributoOriginal)
                    .multiply(new BigDecimal("0.85"))
                    .setScale(0, RoundingMode.HALF_UP)
                    .intValue();
        }
        return atributoOriginal;
    }

    /**
     * RN11 e RN20: Ordenação dos 5 titulares.
     * Retorna uma lista com exatamente 5 elementos:
     * - Index 0: Goleiro (GOL)
     * - Index 1: 1º jogador de linha (o mais recuado)
     * - Index 2: 2º jogador de linha
     * - Index 3: 3º jogador de linha
     * - Index 4: 4º jogador de linha (o mais avançado)
     *
     * Ordem dos jogadores de linha: ZAG, LAT, MEI, ATA.
     * Dois titulares na mesma posição seguem ordem alfabética Unicode e depois ID crescente.
     */
    public List<TitularInfo> ordenarTitulares(List<TitularInfo> titulares) {
        if (titulares == null || titulares.size() != 5) {
            throw new IllegalArgumentException("A escalação deve conter exatamente 5 titulares.");
        }

        TitularInfo goleiro = null;
        List<TitularInfo> jogadoresLinha = new ArrayList<>();

        for (TitularInfo t : titulares) {
            if ("DOENTE".equalsIgnoreCase(t.condicao())) {
                throw new IllegalStateException("Jogador DOENTE não pode participar da partida: " + t.nome());
            }
            if ("GOL".equalsIgnoreCase(t.posicao())) {
                if (goleiro != null) {
                    throw new IllegalArgumentException("A escalação só pode conter exatamente 1 goleiro.");
                }
                goleiro = t;
            } else {
                jogadoresLinha.add(t);
            }
        }

        if (goleiro == null || jogadoresLinha.size() != 4) {
            throw new IllegalArgumentException("A escalação deve conter 1 goleiro e 4 jogadores de linha.");
        }

        Comparator<TitularInfo> linhaComparator = Comparator
                .comparingInt((TitularInfo t) -> getPrioridadeLinha(t.posicao()))
                .thenComparing(t -> NameNormalizationUtils.normalizeForComparison(t.nome()))
                .thenComparing(TitularInfo::id, Comparator.nullsLast(Long::compareTo));

        jogadoresLinha.sort(linhaComparator);

        List<TitularInfo> ordenados = new ArrayList<>(5);
        ordenados.add(goleiro); // index 0
        ordenados.addAll(jogadoresLinha); // index 1 a 4

        return ordenados;
    }

    private int getPrioridadeLinha(String posicao) {
        if (posicao == null) return 99;
        switch (posicao.toUpperCase().trim()) {
            case "ZAG": return 1;
            case "LAT": return 2;
            case "MEI": return 3;
            case "ATA": return 4;
            default: return 99;
        }
    }

    /**
     * RN20: Simulação dos 6 duelos determinísticos da partida.
     */
    public PartidaSimulacaoResult simularPartida(
            Long mandanteId,
            List<TitularInfo> titularesMandante,
            Long visitanteId,
            List<TitularInfo> titularesVisitante
    ) {
        List<TitularInfo> ordemMandante = ordenarTitulares(titularesMandante);
        List<TitularInfo> ordemVisitante = ordenarTitulares(titularesVisitante);

        TitularInfo golMandante = ordemMandante.get(0);
        TitularInfo l1Mandante = ordemMandante.get(1); // 1º de linha
        TitularInfo l2Mandante = ordemMandante.get(2); // 2º de linha
        TitularInfo l3Mandante = ordemMandante.get(3); // 3º de linha
        TitularInfo l4Mandante = ordemMandante.get(4); // 4º de linha

        TitularInfo golVisitante = ordemVisitante.get(0);
        TitularInfo l1Visitante = ordemVisitante.get(1); // 1º de linha
        TitularInfo l2Visitante = ordemVisitante.get(2); // 2º de linha
        TitularInfo l3Visitante = ordemVisitante.get(3); // 3º de linha
        TitularInfo l4Visitante = ordemVisitante.get(4); // 4º de linha

        List<DueloResult> duelos = new ArrayList<>(6);

        // Duelos 1 a 3: Ataque Mandante
        duelos.add(criarDuelo(1, mandanteId, l4Mandante, golVisitante));
        duelos.add(criarDuelo(2, mandanteId, l3Mandante, l1Visitante));
        duelos.add(criarDuelo(3, mandanteId, l2Mandante, l2Visitante));

        // Duelos 4 a 6: Ataque Visitante
        duelos.add(criarDuelo(4, visitanteId, l4Visitante, golMandante));
        duelos.add(criarDuelo(5, visitanteId, l3Visitante, l1Mandante));
        duelos.add(criarDuelo(6, visitanteId, l2Visitante, l2Mandante));

        int golsMandante = 0;
        int golsVisitante = 0;

        for (int i = 0; i < 3; i++) {
            if (duelos.get(i).gol()) {
                golsMandante++;
            }
        }
        for (int i = 3; i < 6; i++) {
            if (duelos.get(i).gol()) {
                golsVisitante++;
            }
        }

        String resultado;
        if (golsMandante > golsVisitante) {
            resultado = "MANDANTE";
        } else if (golsVisitante > golsMandante) {
            resultado = "VISITANTE";
        } else {
            resultado = "EMPATE";
        }

        return new PartidaSimulacaoResult(golsMandante, golsVisitante, resultado, duelos);
    }

    private DueloResult criarDuelo(int ordem, Long clubeAtacanteId, TitularInfo atacante, TitularInfo defensor) {
        String atributoAtaqueNome = getAtributoAtaqueNome(atacante.posicao());
        int valorAtaqueBase = getAtributoAtaqueValor(atacante);
        int valorAtaqueEfetivo = calcularAtributoEfetivo(valorAtaqueBase, atacante.condicao());

        String atributoDefesaNome = "defending";
        int valorDefesaBase = defensor.defesa();
        int valorDefesaEfetivo = calcularAtributoEfetivo(valorDefesaBase, defensor.condicao());

        // Gol se ataque for estritamente MAIOR que a defesa (empate não é gol)
        boolean gol = valorAtaqueEfetivo > valorDefesaEfetivo;

        return new DueloResult(
                ordem,
                clubeAtacanteId,
                atacante.id(),
                defensor.id(),
                atacante.nome(),
                defensor.nome(),
                atacante.posicao(),
                defensor.posicao(),
                atacante.condicao(),
                defensor.condicao(),
                atributoAtaqueNome,
                atributoDefesaNome,
                valorAtaqueEfetivo,
                valorDefesaEfetivo,
                gol
        );
    }

    private String getAtributoAtaqueNome(String posicao) {
        switch (posicao.toUpperCase().trim()) {
            case "ATA": return "shooting";
            case "MEI": return "passing";
            case "ZAG":
            case "LAT": return "dribbling";
            default: return "shooting";
        }
    }

    private int getAtributoAtaqueValor(TitularInfo jogador) {
        switch (jogador.posicao().toUpperCase().trim()) {
            case "ATA": return jogador.finalizacao();
            case "MEI": return jogador.passe();
            case "ZAG":
            case "LAT": return jogador.drible();
            default: return jogador.finalizacao();
        }
    }
}
