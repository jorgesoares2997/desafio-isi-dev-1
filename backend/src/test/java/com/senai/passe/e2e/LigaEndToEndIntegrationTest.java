package com.senai.passe.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.senai.passe.dto.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class LigaEndToEndIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("E2E: Fluxo completo de Transferências (Compra, Taxa 5%, Venda com Multa, Comissão e Bloqueio de Recompra)")
    void fluxoCompletoTransferencias() throws Exception {
        // 1. Cadastra clube com caixa inicial de R$ 300,00
        ClubCreateRequest clubReq = new ClubCreateRequest("Clube Atletico Porto", "CAP");
        String clubJson = mockMvc.perform(post("/api/v1/clubs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clubReq)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/clubs/1"))
                .andExpect(jsonPath("$.cash", is(300.0)))
                .andReturn().getResponse().getContentAsString();
        ClubResponse club = objectMapper.readValue(clubJson, ClubResponse.class);

        // 2. Cadastra jogador com base_value e market_value = 40.00 (> 30.00 para gerar taxa de 5%)
        PlayerCreateRequest playerReq = new PlayerCreateRequest(
                "Carlos Alberto", "MEI", 85, 25,
                70, 68, 82, 79, 55, 64, 86
        );
        String playerJson = mockMvc.perform(post("/api/v1/players")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(playerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.market_value", is(40.0)))
                .andReturn().getResponse().getContentAsString();
        PlayerResponse player = objectMapper.readValue(playerJson, PlayerResponse.class);

        // 3. Compra jogador: Custo = 40.00 + 5% taxa (2.00) = 42.00 <= 50% de 300.00 (150.00)
        BuyPlayerRequest buyReq = new BuyPlayerRequest(club.id(), "2027-01-01T12:00:00-03:00");
        mockMvc.perform(post("/api/v1/players/" + player.id() + "/buy")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type", is("COMPRA")))
                .andExpect(jsonPath("$.value", is(40.0)))
                .andExpect(jsonPath("$.fee", is(2.0)))
                .andExpect(jsonPath("$.cash_change", is(-42.0)))
                .andExpect(jsonPath("$.club_cash", is(258.0)));

        // 4. Verifica que clube tem saldo 258.00 e squad_value 40.00
        mockMvc.perform(get("/api/v1/clubs/" + club.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cash", is(258.0)))
                .andExpect(jsonPath("$.squad_value", is(40.0)))
                .andExpect(jsonPath("$.net_worth", is(298.0)))
                .andExpect(jsonPath("$.players", hasSize(1)));

        // 5. Vende o jogador
        mockMvc.perform(post("/api/v1/players/" + player.id() + "/sell"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type", is("VENDA")))
                .andExpect(jsonPath("$.value", is(40.0)))
                .andExpect(jsonPath("$.contract_status", is("RESCINDIDO")))
                .andExpect(jsonPath("$.penalty", is(4.0))); // 10% de 40.00 pois faltam dias

        // 6. Tentar recomprar o jogador vendido pelo mesmo clube deve falhar com 409 (RN13)
        mockMvc.perform(post("/api/v1/players/" + player.id() + "/buy")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("já vendeu")));

        // 7. Consulta extrato de transações
        mockMvc.perform(get("/api/v1/clubs/" + club.id() + "/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.summary.total_fees", is(2.0)))
                .andExpect(jsonPath("$.summary.total_penalties", is(4.0)));

        // 8. Exporta transações para CSV e valida cabeçalho e separadores
        String csv = mockMvc.perform(get("/api/v1/clubs/" + club.id() + "/transactions/export"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("text/csv")))
                .andReturn().getResponse().getContentAsString();

        assertThat(csv).contains("data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa");
        assertThat(csv).contains("COMPRA");
        assertThat(csv).contains("VENDA");
    }

    @Test
    @DisplayName("E2E: Desvinculação imediata de jogador da escalação ao mudar condição para DOENTE (RN19)")
    void desvinculacaoAoMudarCondicaoParaDoente() throws Exception {
        // 1. Cria clube
        ClubCreateRequest clubReq = new ClubCreateRequest("Belo Jardim Sport", "BJS");
        String cJson = mockMvc.perform(post("/api/v1/clubs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clubReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        ClubResponse club = objectMapper.readValue(cJson, ClubResponse.class);

        // 2. Cria e compra 5 jogadores para preencher a formação 3-1 (1 GOL, 3 ZAG, 1 ATA)
        Long golId = criarEComprarJogador("Goleiro Um", "GOL", club.id());
        Long zag1Id = criarEComprarJogador("Zagueiro Um", "ZAG", club.id());
        Long zag2Id = criarEComprarJogador("Zagueiro Dois", "ZAG", club.id());
        Long zag3Id = criarEComprarJogador("Zagueiro Tres", "ZAG", club.id());
        Long ataId = criarEComprarJogador("Atacante Um", "ATA", club.id());

        // 3. Escala o time
        LineupRequest lineupReq = new LineupRequest("3-1", List.of(golId, zag1Id, zag2Id, zag3Id, ataId));
        mockMvc.perform(put("/api/v1/clubs/" + club.id() + "/lineup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(lineupReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.complete", is(true)))
                .andExpect(jsonPath("$.players", hasSize(5)));

        // 4. Muda condição de um dos zagueiros para DOENTE
        mockMvc.perform(patch("/api/v1/players/" + zag2Id + "/condition")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"condition\":\"DOENTE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.condition", is("DOENTE")));

        // 5. Consulta escalação: o jogador doente deve ter sido removido imediatamente
        mockMvc.perform(get("/api/v1/clubs/" + club.id() + "/lineup"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.complete", is(false)))
                .andExpect(jsonPath("$.players", hasSize(4)))
                .andExpect(jsonPath("$.players[*].id", not(hasItem(zag2Id.intValue()))));
    }

    @Test
    @DisplayName("E2E: Simulação oficial da partida Águias FC vs Delta FC (RN20) e classificação dinâmica (RN21)")
    void simulacaoOficialPartidaEClassificacao() throws Exception {
        // 1. Cria Clubes
        ClubCreateRequest aguiasReq = new ClubCreateRequest("Aguias Futebol Clube", "AFC");
        String aguiasJson = mockMvc.perform(post("/api/v1/clubs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(aguiasReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        ClubResponse aguias = objectMapper.readValue(aguiasJson, ClubResponse.class);

        ClubCreateRequest deltaReq = new ClubCreateRequest("Delta Futebol Clube", "DFC");
        String deltaJson = mockMvc.perform(post("/api/v1/clubs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deltaReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        ClubResponse delta = objectMapper.readValue(deltaJson, ClubResponse.class);

        // 2. Cria e escala elenco do Águias FC (Formação 2-1-1 com Davi MAL_CONDICIONADO)
        Long rui = criarEComprarJogadorComAtributos("Rui Prado", "GOL", aguias.id(), 60, 28, 60, 20, 60, 30, 77, 70, 77, "APTO");
        Long teo = criarEComprarJogadorComAtributos("Teo Brandao", "ZAG", aguias.id(), 55, 27, 55, 30, 50, 40, 84, 80, 84, "APTO");
        Long davi = criarEComprarJogadorComAtributos("Davi Lins", "LAT", aguias.id(), 75, 24, 75, 50, 65, 74, 66, 65, 80, "MAL_CONDICIONADO");
        Long lauro = criarEComprarJogadorComAtributos("Lauro Neves", "MEI", aguias.id(), 65, 25, 65, 60, 82, 75, 45, 60, 82, "APTO");
        Long otto = criarEComprarJogadorComAtributos("Otto Rangel", "ATA", aguias.id(), 70, 23, 70, 75, 60, 70, 40, 60, 75, "APTO");

        mockMvc.perform(put("/api/v1/clubs/" + aguias.id() + "/lineup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LineupRequest("2-1-1", List.of(rui, teo, davi, lauro, otto)))))
                .andExpect(status().isOk());

        // 3. Tentar realizar partida com o Delta incompleto deve responder 409
        mockMvc.perform(post("/api/v1/matches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new MatchCreateRequest(aguias.id(), delta.id()))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("5 titulares")));

        // 4. Cria e escala elenco do Delta FC (Formação 2-1-1)
        Long ivo = criarEComprarJogadorComAtributos("Ivo Teles", "GOL", delta.id(), 60, 28, 60, 20, 60, 30, 72, 70, 72, "APTO");
        Long hugo = criarEComprarJogadorComAtributos("Hugo Vaz", "ZAG", delta.id(), 55, 27, 55, 30, 50, 40, 84, 80, 84, "APTO");
        Long lino = criarEComprarJogadorComAtributos("Lino Matos", "LAT", delta.id(), 75, 24, 75, 50, 65, 79, 63, 65, 79, "APTO");
        Long nei = criarEComprarJogadorComAtributos("Nei Soares", "MEI", delta.id(), 65, 25, 65, 60, 70, 75, 45, 60, 75, "APTO");
        Long ugo = criarEComprarJogadorComAtributos("Ugo Falcao", "ATA", delta.id(), 70, 23, 70, 81, 60, 70, 40, 60, 81, "APTO");

        mockMvc.perform(put("/api/v1/clubs/" + delta.id() + "/lineup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LineupRequest("2-1-1", List.of(ivo, hugo, lino, nei, ugo)))))
                .andExpect(status().isOk());

        // 5. Realiza a partida oficial
        String matchJson = mockMvc.perform(post("/api/v1/matches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new MatchCreateRequest(aguias.id(), delta.id()))))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", matchesPattern("^/api/v1/matches/\\d+$")))
                .andExpect(jsonPath("$.home.goals", is(1)))
                .andExpect(jsonPath("$.away.goals", is(2)))
                .andExpect(jsonPath("$.result", is("VISITANTE")))
                .andExpect(jsonPath("$.duels", hasSize(6)))
                .andReturn().getResponse().getContentAsString();

        MatchDetailResponse match = objectMapper.readValue(matchJson, MatchDetailResponse.class);
        assertThat(match.duels()).hasSize(6);

        // 6. Valida classificação dinâmica (RN21)
        mockMvc.perform(get("/api/v1/standings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].club_name", is("Delta Futebol Clube")))
                .andExpect(jsonPath("$[0].points", is(3)))
                .andExpect(jsonPath("$[0].goal_difference", is(1)))
                .andExpect(jsonPath("$[0].goals_for", is(2)))
                .andExpect(jsonPath("$[1].club_name", is("Aguias Futebol Clube")))
                .andExpect(jsonPath("$[1].points", is(0)))
                .andExpect(jsonPath("$[1].goal_difference", is(-1)));
    }

    private Long criarEComprarJogador(String nome, String posicao, Long clubeId) throws Exception {
        PlayerCreateRequest req = new PlayerCreateRequest(nome, posicao, 70, 22, 50, 50, 50, 50, 50, 50, 50);
        String pJson = mockMvc.perform(post("/api/v1/players")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        PlayerResponse player = objectMapper.readValue(pJson, PlayerResponse.class);

        BuyPlayerRequest buyReq = new BuyPlayerRequest(clubeId, "2027-01-01T10:00:00-03:00");
        mockMvc.perform(post("/api/v1/players/" + player.id() + "/buy")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyReq)))
                .andExpect(status().isOk());

        return player.id();
    }

    private Long criarEComprarJogadorComAtributos(
            String nome, String posicao, Long clubeId,
            int agilidade, int idade, int vel, int fin, int pas, int dri, int def, int fis, int pot, String cond
    ) throws Exception {
        PlayerCreateRequest req = new PlayerCreateRequest(nome, posicao, agilidade, idade, vel, fin, pas, dri, def, fis, pot);
        org.springframework.test.web.servlet.MvcResult res = mockMvc.perform(post("/api/v1/players")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andReturn();
        if (res.getResponse().getStatus() != 201) {
            throw new RuntimeException("Falha ao criar jogador: " + res.getResponse().getContentAsString());
        }
        String pJson = res.getResponse().getContentAsString();
        PlayerResponse player = objectMapper.readValue(pJson, PlayerResponse.class);

        if (!"APTO".equals(cond)) {
            mockMvc.perform(patch("/api/v1/players/" + player.id() + "/condition")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"condition\":\"" + cond + "\"}"))
                    .andExpect(status().isOk());
        }

        BuyPlayerRequest buyReq = new BuyPlayerRequest(clubeId, "2027-01-01T10:00:00-03:00");
        mockMvc.perform(post("/api/v1/players/" + player.id() + "/buy")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyReq)))
                .andExpect(status().isOk());

        return player.id();
    }
}
