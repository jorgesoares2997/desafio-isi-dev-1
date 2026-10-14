package com.senai.passe.service;

import com.senai.passe.dto.*;
import com.senai.passe.exception.BadRequestException;
import com.senai.passe.exception.BusinessRuleException;
import com.senai.passe.exception.ResourceNotFoundException;
import com.senai.passe.model.Clube;
import com.senai.passe.model.Contrato;
import com.senai.passe.model.Jogador;
import com.senai.passe.repository.ClubeRepository;
import com.senai.passe.repository.ContratoRepository;
import com.senai.passe.repository.JogadorRepository;
import com.senai.passe.util.ValidationUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ClubService {

    private final ClubeRepository clubeRepository;
    private final JogadorRepository jogadorRepository;
    private final ContratoRepository contratoRepository;
    private final PlayerValuationService valuationService;
    private final MarketFinancialService financialService;

    public ClubService(ClubeRepository clubeRepository,
                       JogadorRepository jogadorRepository,
                       ContratoRepository contratoRepository,
                       PlayerValuationService valuationService,
                       MarketFinancialService financialService) {
        this.clubeRepository = clubeRepository;
        this.jogadorRepository = jogadorRepository;
        this.contratoRepository = contratoRepository;
        this.valuationService = valuationService;
        this.financialService = financialService;
    }

    @Transactional
    public ClubResponse createClub(ClubCreateRequest req) {
        if (req == null) {
            throw new BadRequestException("Corpo da requisição ausente.");
        }

        String name = ValidationUtils.validateClubName(req.name());
        String acronym = ValidationUtils.validateClubAcronym(req.acronym(), name);

        if (clubeRepository.count() >= 20) {
            throw new BusinessRuleException("A liga aceita no máximo 20 clubes.");
        }

        if (clubeRepository.existsByNomeCaseInsensitive(name)) {
            throw new BusinessRuleException("Nome de clube já cadastrado.");
        }

        if (clubeRepository.existsBySigla(acronym)) {
            throw new BusinessRuleException("Sigla de clube já cadastrada.");
        }

        Clube clube = new Clube();
        clube.setNome(name);
        clube.setSigla(acronym);
        clube.setCaixa(new BigDecimal("300.00"));
        clube.setCriadoEm(OffsetDateTime.now());

        Clube salvo = clubeRepository.save(clube);

        return new ClubResponse(
                salvo.getId(),
                salvo.getNome(),
                salvo.getSigla(),
                salvo.getCaixa(),
                new BigDecimal("0.00"),
                salvo.getCaixa()
        );
    }

    @Transactional(readOnly = true)
    public List<ClubResponse> listClubs(String sortStr) {
        String sort = (sortStr == null || sortStr.isBlank()) ? "name" : sortStr.trim();
        if (!Set.of("name", "net_worth_asc", "net_worth_desc").contains(sort)) {
            throw new BadRequestException("Critério de ordenação inválido para clubes: " + sort);
        }

        List<Clube> clubes = clubeRepository.findAll();

        List<ClubResponse> responses = clubes.stream().map(c -> {
            List<Jogador> elenco = jogadorRepository.findByClubeIdAndExcluidoEmIsNull(c.getId());
            BigDecimal squadValue = BigDecimal.ZERO;
            for (Jogador j : elenco) {
                BigDecimal mv = valuationService.calcularValorMercado(j.getValorBase(), j.getCondicao(), j.getAgilidade(), j.getIdade());
                squadValue = squadValue.add(mv);
            }
            squadValue = squadValue.setScale(2, RoundingMode.HALF_UP);
            BigDecimal netWorth = c.getCaixa().add(squadValue).setScale(2, RoundingMode.HALF_UP);

            return new ClubResponse(c.getId(), c.getNome(), c.getSigla(), c.getCaixa(), squadValue, netWorth);
        }).collect(Collectors.toList());

        Comparator<ClubResponse> comparator;
        switch (sort) {
            case "net_worth_asc":
                comparator = Comparator.comparing(ClubResponse::netWorth)
                        .thenComparing(c -> ValidationUtils.normalizeUnaccented(c.name().toLowerCase()));
                break;
            case "net_worth_desc":
                comparator = Comparator.comparing(ClubResponse::netWorth, Comparator.reverseOrder())
                        .thenComparing(c -> ValidationUtils.normalizeUnaccented(c.name().toLowerCase()));
                break;
            case "name":
            default:
                comparator = Comparator.comparing(c -> ValidationUtils.normalizeUnaccented(c.name().toLowerCase()));
                break;
        }

        responses.sort(comparator);
        return responses;
    }

    @Transactional(readOnly = true)
    public ClubDetailResponse getClub(Long id) {
        Clube clube = clubeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Clube não encontrado para o ID: " + id));

        List<Jogador> elenco = jogadorRepository.findByClubeIdAndExcluidoEmIsNull(id);
        OffsetDateTime agora = OffsetDateTime.now();

        BigDecimal squadValue = BigDecimal.ZERO;
        List<PlayerInClubResponse> playersDto = new ArrayList<>();

        for (Jogador j : elenco) {
            int overall = valuationService.calcularOverall(j.getPosicao(), j.getVelocidade(), j.getFinalizacao(),
                    j.getPasse(), j.getDrible(), j.getDefesa(), j.getFisico());
            BigDecimal marketValue = valuationService.calcularValorMercado(j.getValorBase(), j.getCondicao(),
                    j.getAgilidade(), j.getIdade());

            squadValue = squadValue.add(marketValue);

            Optional<Contrato> contratoOpt = contratoRepository.findByJogadorIdAndSituacao(j.getId(), "ATIVO");
            ContractInfoResponse contractDto = null;

            if (contratoOpt.isPresent()) {
                Contrato c = contratoOpt.get();
                int remainingDays = financialService.calcularDiasRestantesFidelidade(c.getFidelidadeAte(), agora);
                int penaltyRate;
                if (remainingDays <= 0) {
                    penaltyRate = 0;
                } else if (remainingDays <= 30) {
                    penaltyRate = 5;
                } else if (remainingDays <= 180) {
                    penaltyRate = 10;
                } else {
                    penaltyRate = 20;
                }
                contractDto = new ContractInfoResponse(c.getValorCompra(), c.getFidelidadeAte(), remainingDays, penaltyRate);
            }

            playersDto.add(new PlayerInClubResponse(
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
                    j.getClubeId(),
                    contractDto
            ));
        }

        // Ordenação RN11: GOL, ZAG, LAT, MEI, ATA, depois nome, depois id
        playersDto.sort(Comparator
                .comparingInt((PlayerInClubResponse p) -> getPositionOrder(p.position()))
                .thenComparing(p -> ValidationUtils.normalizeUnaccented(p.name().toLowerCase()))
                .thenComparing(PlayerInClubResponse::id));

        squadValue = squadValue.setScale(2, RoundingMode.HALF_UP);
        BigDecimal netWorth = clube.getCaixa().add(squadValue).setScale(2, RoundingMode.HALF_UP);

        return new ClubDetailResponse(
                clube.getId(),
                clube.getNome(),
                clube.getSigla(),
                clube.getCaixa(),
                squadValue,
                netWorth,
                playersDto
        );
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
}
