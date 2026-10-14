package com.senai.passe.controller;

import com.senai.passe.dto.*;
import com.senai.passe.service.MarketService;
import com.senai.passe.service.PlayerService;
import com.senai.passe.util.ValidationUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;

@RestController
@RequestMapping({"/players", "/api/v1/players"})
@Tag(name = "Jogadores", description = "Endpoints de gerenciamento e mercado de jogadores")
public class PlayerController {

    private final PlayerService playerService;
    private final MarketService marketService;

    public PlayerController(PlayerService playerService, MarketService marketService) {
        this.playerService = playerService;
        this.marketService = marketService;
    }

    @PostMapping
    @Operation(summary = "Cadastra um novo jogador")
    public ResponseEntity<PlayerResponse> createPlayer(@RequestBody PlayerCreateRequest req) {
        PlayerResponse resp = playerService.createPlayer(req);
        URI location = URI.create("/api/v1/players/" + resp.id());
        return ResponseEntity.created(location).body(resp);
    }

    @GetMapping
    @Operation(summary = "Lista jogadores de forma paginada com busca, filtros e ordenação")
    public ResponseEntity<PagedResponse<PlayerResponse>> listPlayers(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "position", required = false) String position,
            @RequestParam(name = "condition", required = false) String condition,
            @RequestParam(name = "free", required = false) String free,
            @RequestParam(name = "club_id", required = false) Long clubId,
            @RequestParam(name = "min_age", required = false) Integer minAge,
            @RequestParam(name = "max_age", required = false) Integer maxAge,
            @RequestParam(name = "min_value", required = false) BigDecimal minValue,
            @RequestParam(name = "max_value", required = false) BigDecimal maxValue,
            @RequestParam(name = "sort", required = false, defaultValue = "name") String sort,
            @RequestParam(name = "page", required = false, defaultValue = "1") int page,
            @RequestParam(name = "limit", required = false, defaultValue = "10") int limit
    ) {
        PagedResponse<PlayerResponse> response = playerService.listPlayers(
                search, position, condition, free, clubId, minAge, maxAge, minValue, maxValue, sort, page, limit
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulta detalhes de um jogador")
    public ResponseEntity<PlayerResponse> getPlayer(@PathVariable("id") String idStr) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        PlayerResponse resp = playerService.getPlayer(id);
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edita nome, posição, agilidade e idade de um jogador")
    public ResponseEntity<PlayerResponse> updatePlayer(
            @PathVariable("id") String idStr,
            @RequestBody PlayerUpdateRequest req
    ) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        PlayerResponse resp = playerService.updatePlayer(id, req);
        return ResponseEntity.ok(resp);
    }

    @PatchMapping("/{id}/condition")
    @Operation(summary = "Altera a condição física de um jogador")
    public ResponseEntity<PlayerResponse> updateCondition(
            @PathVariable("id") String idStr,
            @RequestBody PlayerConditionRequest req
    ) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        PlayerResponse resp = playerService.updateCondition(id, req);
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclusão lógica de um jogador livre")
    public ResponseEntity<Void> deletePlayer(@PathVariable("id") String idStr) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        playerService.deletePlayer(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/buy")
    @Operation(summary = "Compra um jogador livre para um clube")
    public ResponseEntity<BuyResponse> buyPlayer(
            @PathVariable("id") String idStr,
            @RequestBody BuyPlayerRequest req
    ) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        BuyResponse resp = marketService.buyPlayer(id, req);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{id}/sell")
    @Operation(summary = "Vende um jogador do clube atual")
    public ResponseEntity<SellResponse> sellPlayer(@PathVariable("id") String idStr) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        SellResponse resp = marketService.sellPlayer(id);
        return ResponseEntity.ok(resp);
    }
}
