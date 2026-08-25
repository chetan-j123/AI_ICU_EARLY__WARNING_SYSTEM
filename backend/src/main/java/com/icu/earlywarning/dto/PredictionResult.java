package com.icu.earlywarning.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PredictionResult(
        @JsonProperty("logistic_prob") double logisticProb,
        @JsonProperty("rf_prob") double rfProb,
        @JsonProperty("final_prob") double finalProb,
        @JsonProperty("final_pred") int finalPred
) {
}
