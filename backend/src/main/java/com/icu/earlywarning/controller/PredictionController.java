package com.icu.earlywarning.controller;

import com.icu.earlywarning.dto.PredictionRequest;
import com.icu.earlywarning.dto.PredictionResponse;
import com.icu.earlywarning.service.PredictionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PredictionController {
    private final PredictionService predictionService;

    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @PostMapping("/predict")
    public ResponseEntity<PredictionResponse> predict(@Valid @RequestBody PredictionRequest request) {
        return ResponseEntity.ok(new PredictionResponse(true, predictionService.predict(request)));
    }
}
