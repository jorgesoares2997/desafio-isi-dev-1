package com.senai.passe.service;

import com.senai.passe.service.dto.DueloResult;
import com.senai.passe.service.dto.PartidaSimulacaoResult;
import com.senai.passe.service.dto.TitularInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MatchSimulationServiceTest {

    private MatchSimulationService matchService;

    @BeforeEach
    void setUp() {
        matchService = new MatchSimulationService();
    }

    @Nested
    @DisplayName("RN20 - Redução de Atributos para MAL_CONDICIONADO (-15%)")
    class CondicaoFisicaTests {

        @Test
        @DisplayName("Deve calcular redução de 15% para MAL_CONDICIONADO com arredondamento meio para cima")
        void deveCalcularReducaoMalCondicionado() {
            // 74 * 0.85 = 62.9 -> 63
            assertEquals(63, matchService.calcularAtributoEfetivo(74, "MAL_CONDICIONADO"));

            // 50 * 0.85 = 42.5 -> 43 (meio para cima)
            assertEquals(43, matchService.calcularAtributoEfetivo(50, "MAL_CONDICIONADO"));

            // 66 * 0.85 = 56.1 -> 56
            assertEquals(56, matchService.calcularAtributoEfetivo(66, "MAL_CONDICIONADO"));
        }

        @Test
        @DisplayName("Jogador APTO não sofre redução no atributo")
        void jogadorAptoSemReducao() {
            assertEquals(80, matchService.calcularAtributoEfetivo(80, "APTO"));
            assertEquals(99, matchService.calcularAtributoEfetivo(99, "APTO"));
        }
    }

    @Nested
    @DisplayName("RN11 e RN20 - Ordenação Canônica de Titulares")
    class OrdenacaoTitularesTests {

        @Test
        @DisplayName("Deve ordenar corretamente os 5 titulares na formação 2-1-1 (GOL, ZAG, LAT, MEI, ATA)")
        void deveOrdenar211() {
            TitularInfo ata = new TitularInfo(34L, "Otto Rangel", "ATA", "APTO", 70, 75, 60, 70, 40, 60);
            TitularInfo gol = new TitularInfo(30L, "Rui Prado", "GOL", "APTO", 60, 20, 60, 30, 77, 70);
            TitularInfo mei = new TitularInfo(33L, "Lauro Neves", "MEI", "APTO", 65, 60, 82, 75, 45, 60);
            TitularInfo lat = new TitularInfo(31L, "Davi Lins", "LAT", "MAL_CONDICIONADO", 75, 50, 65, 74, 66, 65);
            TitularInfo zag = new TitularInfo(32L, "Téo Brandão", "ZAG", "APTO", 55, 30, 50, 40, 84, 80);

            List<TitularInfo> ordenados = matchService.ordenarTitulares(List.of(ata, gol, mei, lat, zag));

            assertEquals(5, ordenados.size());
            assertEquals("Rui Prado", ordenados.get(0).nome()); // Index 0: Goleiro
            assertEquals("Téo Brandão", ordenados.get(1).nome()); // Index 1: 1º de linha (ZAG)
            assertEquals("Davi Lins", ordenados.get(2).nome()); // Index 2: 2º de linha (LAT)
            assertEquals("Lauro Neves", ordenados.get(3).nome()); // Index 3: 3º de linha (MEI)
            assertEquals("Otto Rangel", ordenados.get(4).nome()); // Index 4: 4º de linha (ATA)
        }

        @Test
        @DisplayName("Deve desempatar mesma posição por ordem alfabética Unicode no nome (formação 1-2-1 com 2 MEI)")
        void deveDesempatarPorNome() {
            TitularInfo gol = new TitularInfo(1L, "Goleiro", "GOL", "APTO", 60, 20, 60, 30, 75, 70);
            TitularInfo zag = new TitularInfo(2L, "Zagueiro", "ZAG", "APTO", 55, 30, 50, 40, 80, 80);
            TitularInfo meiZ = new TitularInfo(3L, "Zico", "MEI", "APTO", 70, 70, 85, 80, 50, 65);
            TitularInfo meiA = new TitularInfo(4L, "Ademir", "MEI", "APTO", 70, 70, 80, 80, 50, 65);
            TitularInfo ata = new TitularInfo(5L, "Atacante", "ATA", "APTO", 80, 80, 60, 75, 40, 65);

            List<TitularInfo> ordenados = matchService.ordenarTitulares(List.of(meiZ, ata, gol, meiA, zag));

            assertEquals("Goleiro", ordenados.get(0).nome());
            assertEquals("Zagueiro", ordenados.get(1).nome());
            assertEquals("Ademir", ordenados.get(2).nome()); // 2º de linha (vem antes alfabeticamente)
            assertEquals("Zico", ordenados.get(3).nome());   // 3º de linha
            assertEquals("Atacante", ordenados.get(4).nome()); // 4º de linha
        }

        @Test
        @DisplayName("Deve rejeitar jogador DOENTE na escalação")
        void deveRejeitarJogadorDoente() {
            TitularInfo gol = new TitularInfo(1L, "Goleiro", "GOL", "APTO", 60, 20, 60, 30, 75, 70);
            TitularInfo zag = new TitularInfo(2L, "Zagueiro", "ZAG", "DOENTE", 55, 30, 50, 40, 80, 80);
            TitularInfo lat = new TitularInfo(3L, "Lateral", "LAT", "APTO", 70, 50, 60, 70, 65, 60);
            TitularInfo mei = new TitularInfo(4L, "Meia", "MEI", "APTO", 70, 70, 80, 80, 50, 65);
            TitularInfo ata = new TitularInfo(5L, "Atacante", "ATA", "APTO", 80, 80, 60, 75, 40, 65);

            assertThrows(IllegalStateException.class, () -> matchService.ordenarTitulares(List.of(gol, zag, lat, mei, ata)));
        }
    }

    @Nested
    @DisplayName("RN20 - Simulação Completa da Partida Oficial (Águias FC 1 x 2 Delta FC)")
    class PartidaOficialTests {

        @Test
        @DisplayName("Deve simular com exatidão todos os 6 duelos do exemplo oficial da RN20")
        void deveSimularPartidaOficialAguiasVsDelta() {
            // Mandante: Águias FC (id 1)
            TitularInfo ruiPrado = new TitularInfo(30L, "Rui Prado", "GOL", "APTO", 60, 20, 60, 30, 77, 70);
            TitularInfo teoBrandao = new TitularInfo(32L, "Téo Brandão", "ZAG", "APTO", 55, 30, 50, 40, 84, 80);
            TitularInfo daviLins = new TitularInfo(31L, "Davi Lins", "LAT", "MAL_CONDICIONADO", 75, 50, 65, 74, 66, 65);
            TitularInfo lauroNeves = new TitularInfo(33L, "Lauro Neves", "MEI", "APTO", 65, 60, 82, 75, 45, 60);
            TitularInfo ottoRangel = new TitularInfo(34L, "Otto Rangel", "ATA", "APTO", 70, 75, 60, 70, 40, 60);

            List<TitularInfo> titularesMandante = List.of(ottoRangel, ruiPrado, lauroNeves, daviLins, teoBrandao);

            // Visitante: Delta FC (id 2)
            TitularInfo ivoTeles = new TitularInfo(40L, "Ivo Teles", "GOL", "APTO", 60, 20, 60, 30, 72, 70);
            TitularInfo hugoVaz = new TitularInfo(41L, "Hugo Vaz", "ZAG", "APTO", 55, 30, 50, 40, 84, 80);
            TitularInfo linoMatos = new TitularInfo(42L, "Lino Matos", "LAT", "APTO", 75, 50, 65, 79, 63, 65);
            TitularInfo neiSoares = new TitularInfo(43L, "Nei Soares", "MEI", "APTO", 65, 60, 70, 75, 45, 60);
            TitularInfo ugoFalcao = new TitularInfo(44L, "Ugo Falcão", "ATA", "APTO", 70, 81, 60, 70, 40, 60);

            List<TitularInfo> titularesVisitante = List.of(ugoFalcao, ivoTeles, neiSoares, linoMatos, hugoVaz);

            // Executar simulação
            PartidaSimulacaoResult resultado = matchService.simularPartida(1L, titularesMandante, 2L, titularesVisitante);

            // Conferência do placar e resultado
            assertEquals(1, resultado.golsMandante(), "Águias FC deve marcar 1 gol");
            assertEquals(2, resultado.golsVisitante(), "Delta FC deve marcar 2 gols");
            assertEquals("VISITANTE", resultado.resultado(), "Resultado deve ser VISITANTE");

            List<DueloResult> duelos = resultado.duelos();
            assertEquals(6, duelos.size(), "Devem ocorrer exatamente 6 duelos");

            // Duelo 1: Otto Rangel (4º Mandante, ATA, shooting 75) vs Ivo Teles (GOL Visitante, defending 72) -> GOL
            DueloResult d1 = duelos.get(0);
            assertEquals(1, d1.ordem());
            assertEquals(1L, d1.clubeAtacanteId());
            assertEquals("Otto Rangel", d1.nomeAtacante());
            assertEquals("Ivo Teles", d1.nomeDefensor());
            assertEquals("shooting", d1.atributoAtaque());
            assertEquals("defending", d1.atributoDefesa());
            assertEquals(75, d1.valorAtaque());
            assertEquals(72, d1.valorDefesa());
            assertTrue(d1.gol(), "Duelo 1 deve ser gol (75 > 72)");

            // Duelo 2: Lauro Neves (3º Mandante, MEI, passing 82) vs Hugo Vaz (1º Linha Visitante, ZAG, defending 84) -> NÃO GOL
            DueloResult d2 = duelos.get(1);
            assertEquals(2, d2.ordem());
            assertEquals(1L, d2.clubeAtacanteId());
            assertEquals("Lauro Neves", d2.nomeAtacante());
            assertEquals("Hugo Vaz", d2.nomeDefensor());
            assertEquals("passing", d2.atributoAtaque());
            assertEquals("defending", d2.atributoDefesa());
            assertEquals(82, d2.valorAtaque());
            assertEquals(84, d2.valorDefesa());
            assertFalse(d2.gol(), "Duelo 2 não deve ser gol (82 <= 84)");

            // Duelo 3: Davi Lins (2º Mandante, LAT, dribbling 63) vs Lino Matos (2º Linha Visitante, LAT, defending 63) -> NÃO GOL (empate)
            DueloResult d3 = duelos.get(2);
            assertEquals(3, d3.ordem());
            assertEquals(1L, d3.clubeAtacanteId());
            assertEquals("Davi Lins", d3.nomeAtacante());
            assertEquals("Lino Matos", d3.nomeDefensor());
            assertEquals("dribbling", d3.atributoAtaque());
            assertEquals("defending", d3.atributoDefesa());
            assertEquals(63, d3.valorAtaque(), "Davi Lins MAL_CONDICIONADO deve ter drible 74 * 0.85 = 62.9 -> 63");
            assertEquals(63, d3.valorDefesa(), "Lino Matos APTO tem defesa 63");
            assertFalse(d3.gol(), "Duelo 3 empatado não é gol (63 == 63)");

            // Duelo 4: Ugo Falcão (4º Visitante, ATA, shooting 81) vs Rui Prado (GOL Mandante, defending 77) -> GOL
            DueloResult d4 = duelos.get(3);
            assertEquals(4, d4.ordem());
            assertEquals(2L, d4.clubeAtacanteId());
            assertEquals("Ugo Falcão", d4.nomeAtacante());
            assertEquals("Rui Prado", d4.nomeDefensor());
            assertEquals("shooting", d4.atributoAtaque());
            assertEquals("defending", d4.atributoDefesa());
            assertEquals(81, d4.valorAtaque());
            assertEquals(77, d4.valorDefesa());
            assertTrue(d4.gol(), "Duelo 4 deve ser gol (81 > 77)");

            // Duelo 5: Nei Soares (3º Visitante, MEI, passing 70) vs Téo Brandão (1º Linha Mandante, ZAG, defending 84) -> NÃO GOL
            DueloResult d5 = duelos.get(4);
            assertEquals(5, d5.ordem());
            assertEquals(2L, d5.clubeAtacanteId());
            assertEquals("Nei Soares", d5.nomeAtacante());
            assertEquals("Téo Brandão", d5.nomeDefensor());
            assertEquals("passing", d5.atributoAtaque());
            assertEquals("defending", d5.atributoDefesa());
            assertEquals(70, d5.valorAtaque());
            assertEquals(84, d5.valorDefesa());
            assertFalse(d5.gol(), "Duelo 5 não deve ser gol (70 <= 84)");

            // Duelo 6: Lino Matos (2º Visitante, LAT, dribbling 79) vs Davi Lins (2º Linha Mandante, LAT, defending 56) -> GOL
            DueloResult d6 = duelos.get(5);
            assertEquals(6, d6.ordem());
            assertEquals(2L, d6.clubeAtacanteId());
            assertEquals("Lino Matos", d6.nomeAtacante());
            assertEquals("Davi Lins", d6.nomeDefensor());
            assertEquals("dribbling", d6.atributoAtaque());
            assertEquals("defending", d6.atributoDefesa());
            assertEquals(79, d6.valorAtaque());
            assertEquals(56, d6.valorDefesa(), "Davi Lins MAL_CONDICIONADO deve ter defesa 66 * 0.85 = 56.1 -> 56");
            assertTrue(d6.gol(), "Duelo 6 deve ser gol (79 > 56)");
        }
    }
}
