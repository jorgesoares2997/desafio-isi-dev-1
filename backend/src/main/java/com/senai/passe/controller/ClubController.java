package com.senai.passe.controller;

import com.senai.passe.dto.*;
import com.senai.passe.service.ClubService;
import com.senai.passe.service.LineupService;
import com.senai.passe.service.MarketService;
import com.senai.passe.util.ValidationUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping({"/clubs", "/api/v1/clubs"})
@Tag(name = "Clubes", description = "Endpoints de gerenciamento de clubes, finanças, escalações e transações")
public class ClubController {

    private final ClubService clubService;
    private final LineupService lineupService;
    private final MarketService marketService;

    public ClubController(ClubService clubService, LineupService lineupService, MarketService marketService) {
        this.clubService = clubService;
        this.lineupService = lineupService;
        this.marketService = marketService;
    }

    @PostMapping
    @Operation(summary = "Cadastra um novo clube", description = "Cria um clube com caixa inicial de R$ 300,00 (RN10). Valida acrônimo ordenado e teto de 20 clubes.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Clube criado com sucesso (Location no cabeçalho)"),
            @ApiResponse(responseCode = "400", description = "Nome ou sigla com formato inválido"),
            @ApiResponse(responseCode = "409", description = "Nome ou sigla já existente ou limite de 20 clubes atingido")
    })
    public ResponseEntity<ClubResponse> createClub(@RequestBody ClubCreateRequest req) {
        ClubResponse resp = clubService.createClub(req);
        URI location = URI.create("/api/v1/clubs/" + resp.id());
        return ResponseEntity.created(location).body(resp);
    }

    @GetMapping
    @Operation(summary = "Lista todos os clubes", description = "Retorna clubes cadastrados com saldo em caixa, valor de elenco e patrimônio líquido. Ordenação por name (default), net_worth_asc ou net_worth_desc.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listagem de clubes realizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Critério de ordenação inválido")
    })
    public ResponseEntity<List<ClubResponse>> listClubs(
            @Parameter(description = "Critério de ordenação (name, net_worth_asc, net_worth_desc)")
            @RequestParam(name = "sort", required = false, defaultValue = "name") String sort
    ) {
        List<ClubResponse> resp = clubService.listClubs(sort);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulta detalhes do clube", description = "Retorna dados do clube e elenco ordenado conforme RN11 (GOL, ZAG, LAT, MEI, ATA, nome, id) com detalhes de contrato.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detalhes do clube retornados com sucesso"),
            @ApiResponse(responseCode = "404", description = "Clube não encontrado")
    })
    public ResponseEntity<ClubDetailResponse> getClub(@Parameter(description = "ID do clube") @PathVariable("id") String idStr) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        ClubDetailResponse resp = clubService.getClub(id);
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/{id}/lineup")
    @Operation(summary = "Define escalação tática do clube", description = "Define a formação tática (3-1, 2-2, 2-1-1, 1-2-1) e escala exatamente 5 jogadores titulares sem condição DOENTE.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Escalação definida com sucesso"),
            @ApiResponse(responseCode = "400", description = "Formato ou lista de IDs inválidos"),
            @ApiResponse(responseCode = "404", description = "Clube não encontrado"),
            @ApiResponse(responseCode = "409", description = "Jogador DOENTE, jogador de outro clube ou formação incompatível com as posições")
    })
    public ResponseEntity<LineupResponse> updateLineup(
            @Parameter(description = "ID do clube") @PathVariable("id") String idStr,
            @RequestBody LineupRequest req
    ) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        LineupResponse resp = lineupService.updateLineup(id, req);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}/lineup")
    @Operation(summary = "Consulta escalação titular do clube", description = "Retorna a formação, estado de completude e os titulares ordenados conforme RN11.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Escalação consultada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Clube não encontrado")
    })
    public ResponseEntity<LineupResponse> getLineup(@Parameter(description = "ID do clube") @PathVariable("id") String idStr) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        LineupResponse resp = lineupService.getLineup(id);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}/transactions")
    @Operation(summary = "Extrato de transações do clube", description = "Retorna histórico de compras e vendas com sumário financeiro consolidado de gastos, receitas, taxas, multas e lucros.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Histórico de transações retornado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Filtro inválido"),
            @ApiResponse(responseCode = "404", description = "Clube não encontrado")
    })
    public ResponseEntity<TransactionsListResponse> listTransactions(
            @Parameter(description = "ID do clube") @PathVariable("id") String idStr,
            @Parameter(description = "Filtro de tipo (COMPRA ou VENDA)") @RequestParam(name = "type", required = false) String type,
            @Parameter(description = "Filtro por ID do jogador") @RequestParam(name = "player_id", required = false) String playerId
    ) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        TransactionsListResponse resp = marketService.listTransactions(id, type, playerId);
        return ResponseEntity.ok(resp);
    }

    @GetMapping(value = "/{id}/transactions/export", produces = "text/csv")
    @Operation(summary = "Exporta transações em CSV (RN18)", description = "Exporta histórico em CSV UTF-8 sem BOM, delimitador ponto e vírgula e decimais em vírgula.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Arquivo CSV exportado com sucesso",
                    content = @Content(schema = @Schema(type = "string", format = "binary"))),
            @ApiResponse(responseCode = "400", description = "Filtro inválido"),
            @ApiResponse(responseCode = "404", description = "Clube não encontrado")
    })
    public ResponseEntity<String> exportTransactions(
            @Parameter(description = "ID do clube") @PathVariable("id") String idStr,
            @Parameter(description = "Filtro por tipo") @RequestParam(name = "type", required = false) String type,
            @Parameter(description = "Filtro por ID do jogador") @RequestParam(name = "player_id", required = false) String playerId
    ) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        String csv = marketService.exportTransactionsCsv(id, type, playerId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=utf-8")
                .body(csv);
    }
}
