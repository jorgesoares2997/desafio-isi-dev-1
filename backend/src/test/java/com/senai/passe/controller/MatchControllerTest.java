package com.senai.passe.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.senai.passe.dto.BuyPlayerRequest;
import com.senai.passe.dto.ClubCreateRequest;
import com.senai.passe.dto.LineupRequest;
import com.senai.passe.dto.MatchCreateRequest;
import com.senai.passe.dto.PlayerCreateRequest;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class MatchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Deve simular a partida oficial Águias FC 1 x 2 Delta FC (RN20) e retornar 201 com Location e 6 duelos")
    void deveSimularPartidaOficialAguiasVsDelta() throws Exception {
        // 1. Cadastrar os clubes
        Long aguiasId = cadastrarClube("Águias FC", "AGU");
        Long deltaId = cadastrarClube("Delta FC", "DEL");

        // 2. Cadastrar e escalar titulares do Águias FC (mandante)
        Long rui = cadastrarJogadorComAtributos("Rui Prado", "GOL", 60, 28, 60, 20, 60, 30, 77, 70, 77);
        Long teo = cadastrarJogadorComAtributos("Téo Brandão", "ZAG", 55, 27, 55, 30, 50, 40, 84, 80, 84);
        Long davi = cadastrarJogadorComAtributos("Davi Lins", "LAT", 75, 24, 75, 50, 65, 74, 66, 65, 80);
        Long lauro = cadastrarJogadorComAtributos("Lauro Neves", "MEI", 65, 25, 65, 60, 82, 75, 45, 60, 82);
        Long otto = cadastrarJogadorComAtributos("Otto Rangel", "ATA", 70, 23, 70, 75, 60, 70, 40, 60, 75);

        // Comprar para o Águias
        comprarJogador(aguiasId, rui);
        comprarJogador(aguiasId, teo);
        comprarJogador(aguiasId, davi);
        comprarJogador(aguiasId, lauro);
        comprarJogador(aguiasId, otto);

        // Davi Lins -> MAL_CONDICIONADO
        mockMvc.perform(patch("/players/" + davi + "/condition")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"condition\": \"MAL_CONDICIONADO\"}"))
                .andExpect(status().isOk());

        // Escalar Águias no 2-1-1
        mockMvc.perform(put("/clubs/" + aguiasId + "/lineup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LineupRequest("2-1-1", List.of(rui, teo, davi, lauro, otto)))))
                .andExpect(status().isOk());

        // 3. Cadastrar e escalar titulares do Delta FC (visitante)
        Long ivo = cadastrarJogadorComAtributos("Ivo Teles", "GOL", 60, 28, 60, 20, 60, 30, 72, 70, 72);
        Long hugo = cadastrarJogadorComAtributos("Hugo Vaz", "ZAG", 55, 27, 55, 30, 50, 40, 84, 80, 84);
        Long lino = cadastrarJogadorComAtributos("Lino Matos", "LAT", 75, 24, 75, 50, 65, 79, 63, 65, 79);
        Long nei = cadastrarJogadorComAtributos("Nei Soares", "MEI", 65, 25, 65, 60, 70, 75, 45, 60, 75);
        Long ugo = cadastrarJogadorComAtributos("Ugo Falcão", "ATA", 70, 23, 70, 81, 60, 70, 40, 60, 81);

        comprarJogador(deltaId, ivo);
        comprarJogador(deltaId, hugo);
        comprarJogador(deltaId, lino);
        comprarJogador(deltaId, nei);
        comprarJogador(deltaId, ugo);

        mockMvc.perform(put("/clubs/" + deltaId + "/lineup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LineupRequest("2-1-1", List.of(ivo, hugo, lino, nei, ugo)))))
                .andExpect(status().isOk());

        // 4. Executar POST /matches
        MatchCreateRequest matchReq = new MatchCreateRequest(aguiasId, deltaId);

        mockMvc.perform(post("/matches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(matchReq)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", matchesPattern("^/api/v1/matches/\\d+$")))
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.home.club_name", is("Águias FC")))
                .andExpect(jsonPath("$.home.goals", is(1)))
                .andExpect(jsonPath("$.away.club_name", is("Delta FC")))
                .andExpect(jsonPath("$.away.goals", is(2)))
                .andExpect(jsonPath("$.result", is("VISITANTE")))
                .andExpect(jsonPath("$.duels", hasSize(6)))
                // Duelo 1: Otto vs Ivo -> Gol
                .andExpect(jsonPath("$.duels[0].order", is(1)))
                .andExpect(jsonPath("$.duels[0].goal", is(true)))
                // Duelo 2: Lauro vs Hugo -> Não Gol
                .andExpect(jsonPath("$.duels[1].order", is(2)))
                .andExpect(jsonPath("$.duels[1].goal", is(false)))
                // Duelo 3: Davi vs Lino -> Não Gol (empate)
                .andExpect(jsonPath("$.duels[2].order", is(3)))
                .andExpect(jsonPath("$.duels[2].goal", is(false)))
                // Duelo 4: Ugo vs Rui -> Gol
                .andExpect(jsonPath("$.duels[3].order", is(4)))
                .andExpect(jsonPath("$.duels[3].goal", is(true)))
                // Duelo 5: Nei vs Téo -> Não Gol
                .andExpect(jsonPath("$.duels[4].order", is(5)))
                .andExpect(jsonPath("$.duels[4].goal", is(false)))
                // Duelo 6: Lino vs Davi -> Gol
                .andExpect(jsonPath("$.duels[5].order", is(6)))
                .andExpect(jsonPath("$.duels[5].goal", is(true)));

        // 5. Verificar GET /standings após a partida
        mockMvc.perform(get("/standings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                // 1º lugar: Delta FC (3 pontos, saldo +1)
                .andExpect(jsonPath("$[0].position", is(1)))
                .andExpect(jsonPath("$[0].club_name", is("Delta FC")))
                .andExpect(jsonPath("$[0].points", is(3)))
                .andExpect(jsonPath("$[0].goal_difference", is(1)))
                // 2º lugar: Águias FC (0 pontos, saldo -1)
                .andExpect(jsonPath("$[1].position", is(2)))
                .andExpect(jsonPath("$[1].club_name", is("Águias FC")))
                .andExpect(jsonPath("$[1].points", is(0)))
                .andExpect(jsonPath("$[1].goal_difference", is(-1)));
    }

    @Test
    @DisplayName("Deve rejeitar partida quando mandante e visitante são o mesmo clube (400 Bad Request)")
    void deveRejeitarMesmoClube() throws Exception {
        MatchCreateRequest matchReq = new MatchCreateRequest(1L, 1L);

        mockMvc.perform(post("/matches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(matchReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("diferente")));
    }

    @Test
    @DisplayName("Deve rejeitar partida quando algum clube não possui escalação completa (409 Conflict)")
    void deveRejeitarClubeSemEscalacaoCompleta() throws Exception {
        Long aguiasId = cadastrarClube("Águias FC", "AGU");
        Long deltaId = cadastrarClube("Delta FC", "DEL");

        MatchCreateRequest matchReq = new MatchCreateRequest(aguiasId, deltaId);

        mockMvc.perform(post("/matches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(matchReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("escalação completa")));
    }

    private Long cadastrarClube(String nome, String sigla) throws Exception {
        ClubCreateRequest req = new ClubCreateRequest(nome, sigla);
        String res = mockMvc.perform(post("/clubs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(res).get("id").asLong();
    }

    private Long cadastrarJogadorComAtributos(String nome, String posicao, int agilidade, int idade,
                                              int vel, int fin, int pas, int dri, int def, int fis, int pot) throws Exception {
        PlayerCreateRequest req = new PlayerCreateRequest(
                nome, posicao, agilidade, idade,
                vel, fin, pas, dri, def, fis, pot
        );

        String res = mockMvc.perform(post("/players")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(res).get("id").asLong();
    }

    private void comprarJogador(Long clubeId, Long playerId) throws Exception {
        BuyPlayerRequest buyReq = new BuyPlayerRequest(clubeId, "2027-03-02T10:15-03:00");
        mockMvc.perform(post("/players/" + playerId + "/buy")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyReq)))
                .andExpect(status().isOk());
    }
}
