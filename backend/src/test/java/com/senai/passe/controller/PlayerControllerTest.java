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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class PlayerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Nested
    @DisplayName("POST /players - Cadastro de Jogadores e Validações")
    class CadastroTests {

        @Test
        @DisplayName("Deve cadastrar jogador com sucesso, retornar 201 com cabeçalho Location e calcular overall e market_value")
        void deveCadastrarJogadorComSucesso() throws Exception {
            PlayerCreateRequest req = new PlayerCreateRequest(
                    "  Meia   Lua  ", "MEI", 85, 25,
                    70, 68, 82, 79, 55, 64, 86
            );

            mockMvc.perform(post("/players")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated())
                    .andExpect(header().string("Location", matchesPattern("^/api/v1/players/\\d+$")))
                    .andExpect(jsonPath("$.id", notNullValue()))
                    .andExpect(jsonPath("$.name", is("Meia Lua")))
                    .andExpect(jsonPath("$.position", is("MEI")))
                    .andExpect(jsonPath("$.condition", is("APTO")))
                    .andExpect(jsonPath("$.overall", is(75)))
                    .andExpect(jsonPath("$.base_value", is(40.0)))
                    .andExpect(jsonPath("$.market_value", is(40.0)))
                    .andExpect(jsonPath("$.club_id").value(nullValue()));
        }

        @Test
        @DisplayName("Deve ignorar campos controlados enviados no corpo (Regra V7)")
        void deveIgnorarCamposControladosNoCadastro() throws Exception {
            String jsonComCamposIgnorados = """
                    {
                      "name": "Carlos Silva",
                      "position": "ATA",
                      "agility": 80,
                      "age": 20,
                      "pace": 80,
                      "shooting": 80,
                      "passing": 70,
                      "dribbling": 75,
                      "defending": 40,
                      "physical": 65,
                      "potential": 88,
                      "overall": 99,
                      "base_value": 999.00,
                      "market_value": 999.00,
                      "condition": "DOENTE",
                      "club_id": 999
                    }
                    """;

            mockMvc.perform(post("/players")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(jsonComCamposIgnorados))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.condition", is("APTO")))
                    .andExpect(jsonPath("$.club_id").value(nullValue()))
                    .andExpect(jsonPath("$.overall", not(99)));
        }

        @Test
        @DisplayName("Deve rejeitar nome com apenas uma palavra com 400")
        void deveRejeitarNomeUmaPalavra() throws Exception {
            PlayerCreateRequest req = new PlayerCreateRequest(
                    "Neymar", "ATA", 80, 25,
                    70, 70, 70, 70, 50, 60, 80
            );

            mockMvc.perform(post("/players")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", not(emptyOrNullString())));
        }

        @Test
        @DisplayName("Deve rejeitar nome com dígitos numéricos com 400")
        void deveRejeitarNomeComDigitos() throws Exception {
            PlayerCreateRequest req = new PlayerCreateRequest(
                    "João Silva 7", "ATA", 80, 25,
                    70, 70, 70, 70, 50, 60, 80
            );

            mockMvc.perform(post("/players")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", not(emptyOrNullString())));
        }

        @Test
        @DisplayName("Deve rejeitar posição inválida ou em minúsculas com 400 (Regra V5)")
        void deveRejeitarPosicaoMinuscula() throws Exception {
            String json = """
                    {
                      "name": "Pedro Santos",
                      "position": "mei",
                      "agility": 80,
                      "age": 25,
                      "pace": 70, "shooting": 70, "passing": 70, "dribbling": 70, "defending": 50, "physical": 60, "potential": 80
                    }
                    """;

            mockMvc.perform(post("/players")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", not(emptyOrNullString())));
        }

        @Test
        @DisplayName("Deve rejeitar se a soma dos 6 atributos técnicos for maior que 480")
        void deveRejeitarSomaAtributosMaiorQue480() throws Exception {
            PlayerCreateRequest req = new PlayerCreateRequest(
                    "Super Craque", "ATA", 80, 25,
                    90, 90, 90, 90, 60, 70, 95 // soma = 490 > 480
            );

            mockMvc.perform(post("/players")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("480")));
        }

        @Test
        @DisplayName("Deve rejeitar se potencial for menor que o maior atributo")
        void deveRejeitarPotencialMenorQueMaiorAtributo() throws Exception {
            PlayerCreateRequest req = new PlayerCreateRequest(
                    "Lucas Moura", "ATA", 80, 25,
                    70, 85, 70, 70, 50, 60, 80 // max = 85, pot = 80
            );

            mockMvc.perform(post("/players")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", not(emptyOrNullString())));
        }

        @Test
        @DisplayName("Deve rejeitar se jogador com idade >= 33 tiver potencial diferente do maior atributo")
        void deveRejeitarPotencialDiferenteParaIdade33() throws Exception {
            PlayerCreateRequest req = new PlayerCreateRequest(
                    "Veterano Silva", "ATA", 75, 34,
                    70, 80, 70, 70, 50, 60, 85 // max = 80, pot = 85 (deveria ser 80)
            );

            mockMvc.perform(post("/players")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", not(emptyOrNullString())));
        }

        @Test
        @DisplayName("Deve rejeitar agilidade maior que 85 para jogador com idade >= 35")
        void deveRejeitarAgilidadeMaior85ParaIdade35() throws Exception {
            PlayerCreateRequest req = new PlayerCreateRequest(
                    "Veterano Veloz", "ATA", 86, 36,
                    70, 75, 70, 70, 50, 60, 75
            );

            mockMvc.perform(post("/players")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("85")));
        }
    }

    @Nested
    @DisplayName("GET /players - Listagem, Busca, Filtros e Ordenação")
    class ListagemTests {

        @Test
        @DisplayName("Deve listar jogadores paginados com data e meta")
        void deveListarJogadoresPaginados() throws Exception {
            cadastrarJogador("Jogador Um", "MEI", 80, 25);
            cadastrarJogador("Jogador Dois", "ATA", 75, 22);

            mockMvc.perform(get("/players?page=1&limit=10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(2)))
                    .andExpect(jsonPath("$.meta.page", is(1)))
                    .andExpect(jsonPath("$.meta.limit", is(10)))
                    .andExpect(jsonPath("$.meta.total_items", is(2)))
                    .andExpect(jsonPath("$.meta.total_pages", is(1)));
        }

        @Test
        @DisplayName("Deve buscar insensível a maiúsculas e acentos (Unicode NFD)")
        void deveBuscarInsensivelAcentos() throws Exception {
            cadastrarJogador("João Silva", "MEI", 80, 25);
            cadastrarJogador("Meia Lua", "ATA", 75, 22);

            mockMvc.perform(get("/players?search=joao"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].name", is("João Silva")));

            mockMvc.perform(get("/players?search=LUA"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].name", is("Meia Lua")));
        }

        @Test
        @DisplayName("Deve rejeitar filtros contraditórios (free=true e club_id)")
        void deveRejeitarFiltrosContraditorios() throws Exception {
            mockMvc.perform(get("/players?free=true&club_id=1"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", not(emptyOrNullString())));
        }
    }

    @Nested
    @DisplayName("GET /players/{id} - Consulta de Detalhes e Regra V8")
    class ConsultaTests {

        @Test
        @DisplayName("Deve retornar 404 para ID inválido na URL (abc, 0, -1, 01 - Regra V8)")
        void deveRetornar404ParaIdInvalido() throws Exception {
            mockMvc.perform(get("/players/abc")).andExpect(status().isNotFound());
            mockMvc.perform(get("/players/0")).andExpect(status().isNotFound());
            mockMvc.perform(get("/players/-1")).andExpect(status().isNotFound());
            mockMvc.perform(get("/players/01")).andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Deve retornar 404 para jogador inexistente")
        void deveRetornar404JogadorInexistente() throws Exception {
            mockMvc.perform(get("/players/999999"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message", not(emptyOrNullString())));
        }
    }

    @Nested
    @DisplayName("PUT /players/{id} - Edição de Jogador")
    class EdicaoTests {

        @Test
        @DisplayName("Deve atualizar jogador livre com sucesso")
        void deveAtualizarJogadorLivre() throws Exception {
            Long id = cadastrarJogador("Davi Melo", "MEI", 70, 23);

            PlayerUpdateRequest updateReq = new PlayerUpdateRequest("Davi Melo Silva", "ATA", 75, 24);

            mockMvc.perform(put("/players/" + id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name", is("Davi Melo Silva")))
                    .andExpect(jsonPath("$.position", is("ATA")))
                    .andExpect(jsonPath("$.age", is(24)))
                    .andExpect(jsonPath("$.agility", is(75)));
        }

        @Test
        @DisplayName("Deve rejeitar diminuição de idade com 409")
        void deveRejeitarDiminuicaoDeIdade() throws Exception {
            Long id = cadastrarJogador("Davi Melo", "MEI", 70, 25);

            PlayerUpdateRequest updateReq = new PlayerUpdateRequest("Davi Melo", "MEI", 70, 24);

            mockMvc.perform(put("/players/" + id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateReq)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message", not(emptyOrNullString())));
        }
    }

    @Nested
    @DisplayName("PATCH /players/{id}/condition - Alteração de Condição")
    class CondicaoTests {

        @Test
        @DisplayName("Deve alterar condição para MAL_CONDICIONADO e atualizar market_value")
        void deveAlterarParaMalCondicionado() throws Exception {
            Long id = cadastrarJogador("Meia Lua", "MEI", 85, 25);

            mockMvc.perform(patch("/players/" + id + "/condition")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"condition\": \"MAL_CONDICIONADO\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.condition", is("MAL_CONDICIONADO")))
                    .andExpect(jsonPath("$.market_value", is(37.0)));
        }

        @Test
        @DisplayName("Deve aceitar a condição atual sem alteração (200 OK)")
        void deveAceitarCondicaoAtual() throws Exception {
            Long id = cadastrarJogador("Meia Lua", "MEI", 85, 25);

            mockMvc.perform(patch("/players/" + id + "/condition")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"condition\": \"APTO\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.condition", is("APTO")));
        }

        @Test
        @DisplayName("Deve rejeitar transição direta de DOENTE para APTO com 409")
        void deveRejeitarDoenteParaApto() throws Exception {
            Long id = cadastrarJogador("Meia Lua", "MEI", 85, 25);

            // APTO -> DOENTE
            mockMvc.perform(patch("/players/" + id + "/condition")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"condition\": \"DOENTE\"}"))
                    .andExpect(status().isOk());

            // DOENTE -> APTO (deve falhar com 409)
            mockMvc.perform(patch("/players/" + id + "/condition")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"condition\": \"APTO\"}"))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message", containsString("DOENTE")));
        }
    }

    @Nested
    @DisplayName("DELETE /players/{id} - Exclusão Lógica")
    class ExclusaoTests {

        @Test
        @DisplayName("Deve excluir jogador livre com sucesso (204 No Content)")
        void deveExcluirJogadorLivre() throws Exception {
            Long id = cadastrarJogador("Jogador Livre", "ATA", 70, 20);

            mockMvc.perform(delete("/players/" + id))
                    .andExpect(status().isNoContent());

            // Consulta posterior deve responder 404 (Regra V8)
            mockMvc.perform(get("/players/" + id))
                    .andExpect(status().isNotFound());
        }
    }

    private Long cadastrarJogador(String nome, String posicao, int agilidade, int idade) throws Exception {
        PlayerCreateRequest req = new PlayerCreateRequest(
                nome, posicao, agilidade, idade,
                70, 68, 82, 79, 55, 64, 86
        );

        String responseJson = mockMvc.perform(post("/players")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(responseJson).get("id").asLong();
    }
}
