package com.senai.passe.service;

import com.senai.passe.dto.LineupRequest;
import com.senai.passe.dto.LineupResponse;
import com.senai.passe.dto.PlayerResponse;
import com.senai.passe.exception.BadRequestException;
import com.senai.passe.exception.BusinessRuleException;
import com.senai.passe.exception.ResourceNotFoundException;
import com.senai.passe.model.Clube;
import com.senai.passe.model.Escalacao;
import com.senai.passe.model.Jogador;
import com.senai.passe.repository.ClubeRepository;
import com.senai.passe.repository.EscalacaoRepository;
import com.senai.passe.repository.JogadorRepository;
import com.senai.passe.util.ValidationUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LineupService {

    private static final Set<String> FORMACOES_VALIDAS = Set.of("3-1", "2-2", "2-1-1", "1-2-1");

    private final ClubeRepository clubeRepository;
    private final JogadorRepository jogadorRepository;
    private final EscalacaoRepository escalacaoRepository;
    private final PlayerValuationService valuationService;

    public LineupService(ClubeRepository clubeRepository,
                         JogadorRepository jogadorRepository,
                         EscalacaoRepository escalacaoRepository,
                         PlayerValuationService valuationService) {
        this.clubeRepository = clubeRepository;
        this.jogadorRepository = jogadorRepository;
        this.escalacaoRepository = escalacaoRepository;
        this.valuationService = valuationService;
    }

    @Transactional
    public LineupResponse updateLineup(Long clubId, LineupRequest req) {
        if (req == null) {
            throw new BadRequestException("Corpo da requisição ausente.");
        }

        if (req.formation() == null || !FORMACOES_VALIDAS.contains(req.formation())) {
            throw new BadRequestException("Formação tática inválida. Deve ser uma de: 3-1, 2-2, 2-1-1, 1-2-1.");
        }

        if (req.playerIds() == null || req.playerIds().size() != 5) {
            throw new BadRequestException("A lista player_ids deve conter exatamente 5 identificadores.");
        }

        Set<Long> uniqueIds = new HashSet<>(req.playerIds());
        if (uniqueIds.size() != 5) {
            throw new BadRequestException("A lista player_ids não pode conter IDs repetidos.");
        }

        for (Long pid : req.playerIds()) {
            if (pid == null || pid <= 0) {
                throw new BadRequestException("Todos os IDs de jogadores devem ser inteiros positivos.");
            }
        }

        Clube clube = clubeRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Clube não encontrado para o ID: " + clubId));

        List<Jogador> titulares = new ArrayList<>(5);
        for (Long pid : req.playerIds()) {
            Jogador j = jogadorRepository.findByIdAndExcluidoEmIsNull(pid)
                    .orElseThrow(() -> new ResourceNotFoundException("Jogador não encontrado para o ID: " + pid));
            titulares.add(j);
        }

        for (Jogador j : titulares) {
            if (j.getClubeId() == null || !j.getClubeId().equals(clubId)) {
                throw new BusinessRuleException("Jogador '" + j.getNome() + "' não pertence ao elenco do clube.");
            }
            if ("DOENTE".equals(j.getCondicao())) {
                throw new BusinessRuleException("Jogador DOENTE não pode ser escalado: " + j.getNome());
            }
        }

        validarFormacao(req.formation(), titulares);

        // Substituição atômica da escalação inteira
        escalacaoRepository.deleteByIdClubeId(clubId);
        for (Jogador j : titulares) {
            escalacaoRepository.save(new Escalacao(clubId, j.getId()));
        }

        clube.setFormacao(req.formation());
        clubeRepository.save(clube);

        List<PlayerResponse> playersDto = titulares.stream()
                .map(j -> {
                    int overall = valuationService.calcularOverall(j.getPosicao(), j.getVelocidade(), j.getFinalizacao(),
                            j.getPasse(), j.getDrible(), j.getDefesa(), j.getFisico());
                    BigDecimal mv = valuationService.calcularValorMercado(j.getValorBase(), j.getCondicao(), j.getAgilidade(), j.getIdade());
                    return toPlayerResponse(j, overall, mv);
                })
                .sorted(Comparator
                        .comparingInt((PlayerResponse p) -> getPositionOrder(p.position()))
                        .thenComparing(p -> ValidationUtils.normalizeUnaccented(p.name().toLowerCase()))
                        .thenComparing(PlayerResponse::id))
                .collect(Collectors.toList());

        return new LineupResponse(clubId, req.formation(), true, playersDto);
    }

    @Transactional(readOnly = true)
    public LineupResponse getLineup(Long clubId) {
        Clube clube = clubeRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Clube não encontrado para o ID: " + clubId));

        String formacao = clube.getFormacao();
        if (formacao == null) {
            return new LineupResponse(clubId, null, false, Collections.emptyList());
        }

        List<Escalacao> escalacoes = escalacaoRepository.findByIdClubeId(clubId);
        if (escalacoes.isEmpty()) {
            return new LineupResponse(clubId, formacao, false, Collections.emptyList());
        }

        List<PlayerResponse> playersDto = new ArrayList<>();
        for (Escalacao e : escalacoes) {
            Optional<Jogador> jOpt = jogadorRepository.findByIdAndExcluidoEmIsNull(e.getId().getJogadorId());
            if (jOpt.isPresent()) {
                Jogador j = jOpt.get();
                if (clubId.equals(j.getClubeId()) && !"DOENTE".equals(j.getCondicao())) {
                    int overall = valuationService.calcularOverall(j.getPosicao(), j.getVelocidade(), j.getFinalizacao(),
                            j.getPasse(), j.getDrible(), j.getDefesa(), j.getFisico());
                    BigDecimal mv = valuationService.calcularValorMercado(j.getValorBase(), j.getCondicao(), j.getAgilidade(), j.getIdade());
                    playersDto.add(toPlayerResponse(j, overall, mv));
                }
            }
        }

        playersDto.sort(Comparator
                .comparingInt((PlayerResponse p) -> getPositionOrder(p.position()))
                .thenComparing(p -> ValidationUtils.normalizeUnaccented(p.name().toLowerCase()))
                .thenComparing(PlayerResponse::id));

        boolean complete = (playersDto.size() == 5);

        return new LineupResponse(clubId, formacao, complete, playersDto);
    }

    private void validarFormacao(String formation, List<Jogador> jogadores) {
        int golCount = 0;
        int defCount = 0; // ZAG ou LAT
        int meiCount = 0; // MEI
        int ataCount = 0; // ATA

        for (Jogador j : jogadores) {
            switch (j.getPosicao().toUpperCase().trim()) {
                case "GOL":
                    golCount++;
                    break;
                case "ZAG":
                case "LAT":
                    defCount++;
                    break;
                case "MEI":
                    meiCount++;
                    break;
                case "ATA":
                    ataCount++;
                    break;
                default:
                    throw new BusinessRuleException("Posição desconhecida: " + j.getPosicao());
            }
        }

        if (golCount != 1) {
            throw new BusinessRuleException("A escalação deve conter exatamente 1 goleiro (GOL).");
        }

        boolean confere;
        switch (formation) {
            case "3-1":
                confere = (defCount == 3 && meiCount == 0 && ataCount == 1);
                break;
            case "2-2":
                confere = (defCount == 2 && meiCount == 0 && ataCount == 2);
                break;
            case "2-1-1":
                confere = (defCount == 2 && meiCount == 1 && ataCount == 1);
                break;
            case "1-2-1":
                confere = (defCount == 1 && meiCount == 2 && ataCount == 1);
                break;
            default:
                confere = false;
        }

        if (!confere) {
            throw new BusinessRuleException(String.format(
                    "As posições dos jogadores (GOL: %d, Defesa: %d, MEI: %d, ATA: %d) não fecham a formação %s.",
                    golCount, defCount, meiCount, ataCount, formation
            ));
        }
    }

    private int getPositionOrder(String pos) {
        if (pos == null) return 99;
        switch (pos.toUpperCase().trim()) {
            case "GOL": return 0;
            case "ZAG": return 1;
            case "LAT": return 2;
            case "MEI": return 3;
            case "ATA": return 4;
            default: return 99;
        }
    }

    private PlayerResponse toPlayerResponse(Jogador j, int overall, BigDecimal marketValue) {
        return new PlayerResponse(
                j.getId(),
                j.getNome(),
                j.getPosicao(),
                j.getAgilidade(),
                j.getIdade(),
                j.getCondicao(),
                j.getValorBase(),
                marketValue,
                j.getVelocidade(),
                j.getFinalizacao(),
                j.getPasse(),
                j.getDrible(),
                j.getDefesa(),
                j.getFisico(),
                j.getPotencial(),
                overall,
                j.getClubeId()
        );
    }
}
