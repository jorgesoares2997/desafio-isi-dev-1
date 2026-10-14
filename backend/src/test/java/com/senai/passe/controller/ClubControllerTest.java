package com.senai.passe.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.senai.passe.dto.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
class ClubControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Nested
    @DisplayName("POST /clubs - Cadastro de Clubes e Validações")
    class CadastroClubesTests {

        @Test
        @DisplayName("Deve cadastrar clube com sucesso, 201 Created, Location e caixa 300.00")
        void deveCadastrarClubeComSucesso() throws Exception {
            ClubCreateRequest req = new ClubCreateRequest("Águias FC", "AGU");

            mockMvc.perform(post("/clubs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated())
                    .andExpect(header().string("Location", matchesPattern("^/api/v1/clubs/\\d+$")))
                    .andExpect(jsonPath("$.id", notNullValue()))
                    .andExpect(jsonPath("$.name", is("Águias FC")))
                    .andExpect(jsonPath("$.acronym", is("AGU")))
                    .andExpect(jsonPath("$.cash", is(300.0)))
                    .andExpect(jsonPath("$.squad_value", is(0.0)))
                    .andExpect(jsonPath("$.net_worth", is(300.0)));
        }

        @Test
        @DisplayName("Deve rejeitar sigla cujas letras não aparecem na ordem no nome do clube (400)")
        void deveRejeitarSiglaForaDeOrdem() throws Exception {
            ClubCreateRequest req = new ClubCreateRequest("Águias FC", "AUG"); // U antes de G

            mockMvc.perform(post("/clubs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", not(emptyOrNullString())));
        }

        @Test
        @DisplayName("Deve rejeitar sigla com 3 letras iguais (400)")
        void deveRejeitarSiglaTresLetrasIguais() throws Exception {
            ClubCreateRequest req = new ClubCreateRequest("América Atlético", "AAA");

            mockMvc.perform(post("/clubs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("iguais")));
        }

        @Test
        @DisplayName("Deve rejeitar nome duplicado ignorando maiúsculas e minúsculas (409 Conflict)")
        void deveRejeitarNomeDuplicadoCaseInsensitive() throws Exception {
            ClubCreateRequest req1 = new ClubCreateRequest("Águias FC", "AGU");
            mockMvc.perform(post("/clubs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req1)))
                    .andExpect(status().isCreated());

            ClubCreateRequest req2 = new ClubCreateRequest("  águias   fc ", "AFC");
            mockMvc.perform(post("/clubs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req2)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message", containsString("Nome de clube já cadastrado.")));
        }

        @Test
        @DisplayName("Deve rejeitar sigla duplicada (409 Conflict)")
        void deveRejeitarSiglaDuplicada() throws Exception {
            ClubCreateRequest req1 = new ClubCreateRequest("Águias FC", "AGU");
            mockMvc.perform(post("/clubs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req1)))
                    .andExpect(status().isCreated());

            ClubCreateRequest req2 = new ClubCreateRequest("Atlético Guanabara", "AGU");
            mockMvc.perform(post("/clubs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req2)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message", containsString("Sigla de clube já cadastrada.")));
        }
    }

    @Nested
    @DisplayName("GET /clubs e GET /clubs/{id} - Listagem e Detalhes")
    class ConsultaClubesTests {

        @Test
        @DisplayName("Deve listar clubes ordenados por nome ou patrimônio")
        void deveListarClubesOrdenados() throws Exception {
            cadastrarClube("Delta FC", "DEL");
            cadastrarClube("Águias FC", "AGU");

            mockMvc.perform(get("/clubs?sort=name"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(2)))
                    .andExpect(jsonPath("$[0].name", is("Águias FC")))
                    .andExpect(jsonPath("$[1].name", is("Delta FC")));
        }
    }

    @Nested
    @DisplayName("Mercado: Compra, Venda, Histórico e Exportação CSV")
    class MercadoTransacoesTests {

        @Test
        @DisplayName("Deve executar compra e venda completas do Meia Lua no Águias FC e exportar CSV (RN18)")
        void deveExecutarFluxoCompletoMercado() throws Exception {
            Long clubeId = cadastrarClube("Águias FC", "AGU");
            Long jogadorId = cadastrarJogador("Meia Lua", "MEI", 85, 25);

            // Condição -> MAL_CONDICIONADO
            mockMvc.perform(patch("/players/" + jogadorId + "/condition")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"condition\": \"MAL_CONDICIONADO\"}"))
                    .andExpect(status().isOk());

            // 1. Compra (Exemplo 2.3.1 do edital: valor 37.00, taxa 1.85, custo 38.85, novo caixa 261.15)
            BuyPlayerRequest buyReq = new BuyPlayerRequest(clubeId, "2027-03-02T10:15-03:00");
            mockMvc.perform(post("/players/" + jogadorId + "/buy")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(buyReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.type", is("COMPRA")))
                    .andExpect(jsonPath("$.value", is(37.0)))
                    .andExpect(jsonPath("$.fee", is(1.85)))
                    .andExpect(jsonPath("$.cash_change", is(-38.85)))
                    .andExpect(jsonPath("$.club_cash", is(261.15)))
                    .andExpect(jsonPath("$.contract.status", is("ATIVO")));

            // Verifica GET /clubs/{id} após a compra: elenco ordenado pela RN11 com contrato
            mockMvc.perform(get("/clubs/" + clubeId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.cash", is(261.15)))
                    .andExpect(jsonPath("$.squad_value", is(37.0)))
                    .andExpect(jsonPath("$.net_worth", is(298.15)))
                    .andExpect(jsonPath("$.players", hasSize(1)))
                    .andExpect(jsonPath("$.players[0].contract.purchase_value", is(37.0)));

            // 2. Retorna para APTO
            mockMvc.perform(patch("/players/" + jogadorId + "/condition")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"condition\": \"APTO\"}"))
                    .andExpect(status().isOk());

            // 3. Venda (Exemplo 2.3.2 do edital)
            mockMvc.perform(post("/players/" + jogadorId + "/sell"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.type", is("VENDA")))
                    .andExpect(jsonPath("$.value", is(40.0)))
                    .andExpect(jsonPath("$.contract_status", is("RESCINDIDO")))
                    .andExpect(jsonPath("$.club_cash", notNullValue()));

            // 4. Consulta histórico de transações
            mockMvc.perform(get("/clubs/" + clubeId + "/transactions"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(2)))
                    .andExpect(jsonPath("$.summary.total_spent", is(38.85)))
                    .andExpect(jsonPath("$.summary.total_received", notNullValue()));

            // 5. Exportação CSV (RN18)
            mockMvc.perform(get("/clubs/" + clubeId + "/transactions/export"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Type", containsString("text/csv")))
                    .andExpect(content().string(startsWith("data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n")))
                    .andExpect(content().string(containsString(";COMPRA;Meia Lua;37,00;1,85;0,00;;-38,85\n")));
        }
    }

    @Nested
    @DisplayName("Escalação do Clube - PUT e GET /clubs/{id}/lineup")
    class EscalaçãoTests {

        @Test
        @DisplayName("Deve definir escalação válida na formação 2-1-1 com 5 titulares")
        void deveDefinirEscalacao211() throws Exception {
            Long clubeId = cadastrarClube("Águias FC", "AGU");

            Long gol = cadastrarJogadorEComprar(clubeId, "Rui Prado", "GOL", 60, 28);
            Long zag = cadastrarJogadorEComprar(clubeId, "Téo Brandão", "ZAG", 55, 27);
            Long lat = cadastrarJogadorEComprar(clubeId, "Davi Lins", "LAT", 75, 24);
            Long mei = cadastrarJogadorEComprar(clubeId, "Lauro Neves", "MEI", 65, 25);
            Long ata = cadastrarJogadorEComprar(clubeId, "Otto Rangel", "ATA", 70, 23);

            LineupRequest req = new LineupRequest("2-1-1", List.of(ata, lat, gol, mei, zag));

            mockMvc.perform(put("/clubs/" + clubeId + "/lineup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.formation", is("2-1-1")))
                    .andExpect(jsonPath("$.complete", is(true)))
                    .andExpect(jsonPath("$.players", hasSize(5)))
                    // Ordem RN11: GOL, ZAG, LAT, MEI, ATA
                    .andExpect(jsonPath("$.players[0].position", is("GOL")))
                    .andExpect(jsonPath("$.players[1].position", is("ZAG")))
                    .andExpect(jsonPath("$.players[2].position", is("LAT")))
                    .andExpect(jsonPath("$.players[3].position", is("MEI")))
                    .andExpect(jsonPath("$.players[4].position", is("ATA")));
        }

        @Test
        @DisplayName("Deve rejeitar escalação quando posições não fecham a formação informada (409 Conflict)")
        void deveRejeitarPosicoesQueNaoFechamFormacao() throws Exception {
            Long clubeId = cadastrarClube("Águias FC", "AGU");

            Long gol = cadastrarJogadorEComprar(clubeId, "Goleiro Um", "GOL", 60, 28);
            Long zag1 = cadastrarJogadorEComprar(clubeId, "Zagueiro Um", "ZAG", 55, 27);
            Long zag2 = cadastrarJogadorEComprar(clubeId, "Zagueiro Dois", "ZAG", 55, 27);
            Long mei = cadastrarJogadorEComprar(clubeId, "Meio Um", "MEI", 65, 25);
            Long mei2 = cadastrarJogadorEComprar(clubeId, "Meio Dois", "MEI", 65, 25);

            // Formação 2-1-1 exige 2 defesas, 1 meio, 1 ataque. Aqui temos 2 defesas, 2 meios e 0 ataques!
            LineupRequest req = new LineupRequest("2-1-1", List.of(gol, zag1, zag2, mei, mei2));

            mockMvc.perform(put("/clubs/" + clubeId + "/lineup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message", containsString("não fecham a formação 2-1-1")));
        }
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

    private Long cadastrarJogador(String nome, String posicao, int agilidade, int idade) throws Exception {
        PlayerCreateRequest req = new PlayerCreateRequest(
                nome, posicao, agilidade, idade,
                70, 68, 82, 79, 55, 64, 86
        );

        String res = mockMvc.perform(post("/players")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(res).get("id").asLong();
    }

    private Long cadastrarJogadorEComprar(Long clubeId, String nome, String posicao, int agilidade, int idade) throws Exception {
        Long playerId = cadastrarJogador(nome, posicao, agilidade, idade);
        BuyPlayerRequest buyReq = new BuyPlayerRequest(clubeId, "2027-03-02T10:15-03:00");
        mockMvc.perform(post("/players/" + playerId + "/buy")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyReq)))
                .andExpect(status().isOk());
        return playerId;
    }
}
