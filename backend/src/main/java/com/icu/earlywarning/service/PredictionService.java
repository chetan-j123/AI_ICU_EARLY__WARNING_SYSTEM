package com.icu.earlywarning.service;

import com.icu.earlywarning.dto.PredictionRequest;
import com.icu.earlywarning.dto.PredictionResult;
import com.icu.earlywarning.exception.MlServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Service
public class PredictionService {
    private final RestTemplate restTemplate;
    private final String mlServiceUrl;

    public PredictionService(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${ml.service.url:http://localhost:5001}") String mlServiceUrl
    ) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(30))
                .build();
        this.mlServiceUrl = mlServiceUrl;
    }

    public PredictionResult predict(PredictionRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<PredictionRequest> entity = new HttpEntity<>(request, headers);
            MlPredictionResponse response = restTemplate.postForObject(
                    mlServiceUrl + "/predict",
                    entity,
                    MlPredictionResponse.class
            );

            if (response == null || response.prediction() == null) {
                throw new MlServiceException("ML service returned an empty response");
            }
            return response.prediction();
        } catch (RestClientException ex) {
            throw new MlServiceException("ML service request failed: " + ex.getMessage(), ex);
        }
    }

    private record MlPredictionResponse(boolean success, PredictionResult prediction, String error) {
    }
}
