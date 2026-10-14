package com.senai.passe.controller;

import com.senai.passe.dto.*;
import com.senai.passe.service.ClubService;
import com.senai.passe.service.LineupService;
import com.senai.passe.service.MarketService;
import com.senai.passe.util.ValidationUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping({"/clubs", "/api/v1/clubs"})
@Tag(name = "Clubes", description = "Endpoints de gerenciamento de clubes, escalação e histórico de transações")
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
    @Operation(summary = "Cadastra um novo clube")
    public ResponseEntity<ClubResponse> createClub(@RequestBody ClubCreateRequest req) {
        ClubResponse resp = clubService.createClub(req);
        URI location = URI.create("/api/v1/clubs/" + resp.id());
        return ResponseEntity.created(location).body(resp);
    }

    @GetMapping
    @Operation(summary = "Lista todos os clubes com ordenação por nome ou patrimônio")
    public ResponseEntity<List<ClubResponse>> listClubs(
            @RequestParam(name = "sort", required = false, defaultValue = "name") String sort
    ) {
        List<ClubResponse> resp = clubService.listClubs(sort);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulta detalhes de um clube e seu elenco na ordem da RN11")
    public ResponseEntity<ClubDetailResponse> getClub(@PathVariable("id") String idStr) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        ClubDetailResponse resp = clubService.getClub(id);
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/{id}/lineup")
    @Operation(summary = "Define a formação e escala os 5 titulares do clube")
    public ResponseEntity<LineupResponse> updateLineup(
            @PathVariable("id") String idStr,
            @RequestBody LineupRequest req
    ) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        LineupResponse resp = lineupService.updateLineup(id, req);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}/lineup")
    @Operation(summary = "Consulta a escalação atual do clube")
    public ResponseEntity<LineupResponse> getLineup(@PathVariable("id") String idStr) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        LineupResponse resp = lineupService.getLineup(id);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}/transactions")
    @Operation(summary = "Consulta o histórico de transações do clube com resumo financeiro")
    public ResponseEntity<TransactionsListResponse> listTransactions(
            @PathVariable("id") String idStr,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "player_id", required = false) String playerId
    ) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        TransactionsListResponse resp = marketService.listTransactions(id, type, playerId);
        return ResponseEntity.ok(resp);
    }

    @GetMapping(value = "/{id}/transactions/export", produces = "text/csv")
    @Operation(summary = "Exporta o histórico de transações do clube em formato CSV delimitado por ponto e vírgula")
    public ResponseEntity<String> exportTransactions(
            @PathVariable("id") String idStr,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "player_id", required = false) String playerId
    ) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        String csv = marketService.exportTransactionsCsv(id, type, playerId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=utf-8")
                .body(csv);
    }
}
