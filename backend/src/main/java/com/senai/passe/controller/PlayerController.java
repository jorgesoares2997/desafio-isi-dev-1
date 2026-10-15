package com.senai.passe.controller;

import com.senai.passe.dto.*;
import com.senai.passe.service.MarketService;
import com.senai.passe.service.PlayerService;
import com.senai.passe.util.ValidationUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;

@RestController
@RequestMapping({"/players", "/api/v1/players"})
@Tag(name = "Jogadores", description = "Endpoints de gerenciamento e ciclo de vida de atletas")
public class PlayerController {

    private final PlayerService playerService;
    private final MarketService marketService;

    public PlayerController(PlayerService playerService, MarketService marketService) {
        this.playerService = playerService;
        this.marketService = marketService;
    }

    @PostMapping
    @Operation(summary = "Cadastra um novo jogador", description = "Cadastra um atleta livre calculando base_value, overall e market_value.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Jogador criado com sucesso (Location no cabeçalho)"),
            @ApiResponse(responseCode = "400", description = "Erro de validação nos atributos, idade ou formato do nome",
                    content = @Content(schema = @Schema(example = "{\"message\":\"Dados inválidos.\"}")))
    })
    public ResponseEntity<PlayerResponse> createPlayer(@RequestBody PlayerCreateRequest req) {
        PlayerResponse resp = playerService.createPlayer(req);
        URI location = URI.create("/api/v1/players/" + resp.id());
        return ResponseEntity.created(location).body(resp);
    }

    @GetMapping
    @Operation(summary = "Lista jogadores de forma paginada", description = "Suporta busca textual insensível a acentos (NFD), filtros por posição, condição, clube, idade, valor e até duas ordenações.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listagem retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parâmetros de filtro ou ordenação inválidos")
    })
    public ResponseEntity<PagedResponse<PlayerResponse>> listPlayers(
            @Parameter(description = "Busca no nome (insensível a maiúsculas e acentos)") @RequestParam(name = "search", required = false) String search,
            @Parameter(description = "Posição (GOL, ZAG, LAT, MEI, ATA)") @RequestParam(name = "position", required = false) String position,
            @Parameter(description = "Condição física (APTO, MAL_CONDICIONADO, DOENTE)") @RequestParam(name = "condition", required = false) String condition,
            @Parameter(description = "Apenas jogadores livres (true/false)") @RequestParam(name = "free", required = false) String free,
            @Parameter(description = "ID do clube") @RequestParam(name = "club_id", required = false) Long clubId,
            @Parameter(description = "Idade mínima") @RequestParam(name = "min_age", required = false) Integer minAge,
            @Parameter(description = "Idade máxima") @RequestParam(name = "max_age", required = false) Integer maxAge,
            @Parameter(description = "Valor de mercado mínimo") @RequestParam(name = "min_value", required = false) BigDecimal minValue,
            @Parameter(description = "Valor de mercado máximo") @RequestParam(name = "max_value", required = false) BigDecimal maxValue,
            @Parameter(description = "Critério de ordenação (ex: name, value_desc)") @RequestParam(name = "sort", required = false, defaultValue = "name") String sort,
            @Parameter(description = "Número da página (base 1)") @RequestParam(name = "page", required = false, defaultValue = "1") int page,
            @Parameter(description = "Limite por página (máx 50)") @RequestParam(name = "limit", required = false, defaultValue = "10") int limit
    ) {
        PagedResponse<PlayerResponse> response = playerService.listPlayers(
                search, position, condition, free, clubId, minAge, maxAge, minValue, maxValue, sort, page, limit
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulta detalhes de um jogador", description = "Retorna os dados do atleta ativo com overall e valor de mercado calculados.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detalhes do jogador encontrados"),
            @ApiResponse(responseCode = "404", description = "Jogador não encontrado ou excluído logicamente")
    })
    public ResponseEntity<PlayerResponse> getPlayer(@Parameter(description = "ID do jogador") @PathVariable("id") String idStr) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        PlayerResponse resp = playerService.getPlayer(id);
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edita jogador", description = "Permite alterar nome, posição, agilidade e idade. Não permite regressão de idade nem troca de posição se vinculado a clube.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Jogador atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Jogador não encontrado"),
            @ApiResponse(responseCode = "409", description = "Regressão de idade ou troca de posição com vínculo ativo")
    })
    public ResponseEntity<PlayerResponse> updatePlayer(
            @Parameter(description = "ID do jogador") @PathVariable("id") String idStr,
            @RequestBody PlayerUpdateRequest req
    ) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        PlayerResponse resp = playerService.updatePlayer(id, req);
        return ResponseEntity.ok(resp);
    }

    @PatchMapping("/{id}/condition")
    @Operation(summary = "Altera a condição física", description = "Atualiza condição para APTO, MAL_CONDICIONADO ou DOENTE. Proibido transição direta de DOENTE para APTO.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Condição física atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Condição física inválida"),
            @ApiResponse(responseCode = "404", description = "Jogador não encontrado"),
            @ApiResponse(responseCode = "409", description = "Transição inválida de DOENTE diretamente para APTO")
    })
    public ResponseEntity<PlayerResponse> updateCondition(
            @Parameter(description = "ID do jogador") @PathVariable("id") String idStr,
            @RequestBody PlayerConditionRequest req
    ) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        PlayerResponse resp = playerService.updateCondition(id, req);
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclusão lógica de jogador", description = "Realiza a exclusão lógica preenchendo excluido_em. Exige que o jogador seja livre.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Jogador excluído com sucesso (sem corpo)"),
            @ApiResponse(responseCode = "404", description = "Jogador não encontrado"),
            @ApiResponse(responseCode = "409", description = "Jogador vinculado a clube não pode ser excluído")
    })
    public ResponseEntity<Void> deletePlayer(@Parameter(description = "ID do jogador") @PathVariable("id") String idStr) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        playerService.deletePlayer(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/buy")
    @Operation(summary = "Compra jogador livre", description = "Operação atômica que debita caixa, cria contrato ativo e gera registro em transacoes.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Jogador comprado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados de compra ou data de fidelidade inválidos"),
            @ApiResponse(responseCode = "404", description = "Jogador ou clube não encontrados"),
            @ApiResponse(responseCode = "409", description = "Jogador não livre, caixa insuficiente, elenco cheio ou recompra proibida")
    })
    public ResponseEntity<BuyResponse> buyPlayer(
            @Parameter(description = "ID do jogador") @PathVariable("id") String idStr,
            @RequestBody BuyPlayerRequest req
    ) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        BuyResponse resp = marketService.buyPlayer(id, req);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{id}/sell")
    @Operation(summary = "Vende jogador do clube", description = "Operação atômica de liquidação com cálculo de multa rescisória, comissão sobre lucro e desvinculação da escalação.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Jogador vendido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Jogador não encontrado"),
            @ApiResponse(responseCode = "409", description = "Jogador livre não pode ser vendido")
    })
    public ResponseEntity<SellResponse> sellPlayer(@Parameter(description = "ID do jogador") @PathVariable("id") String idStr) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        SellResponse resp = marketService.sellPlayer(id);
        return ResponseEntity.ok(resp);
    }
}
