package com.icu.earlywarning.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PredictionRequest(
        @NotNull @JsonProperty("heart_rate") Double heartRate,
        @NotNull @JsonProperty("spo2_pct") Double spo2Pct,
        @NotNull @JsonProperty("systolic_bp") Double systolicBp,
        @NotNull @JsonProperty("diastolic_bp") Double diastolicBp,
        @NotNull @JsonProperty("respiratory_rate") Double respiratoryRate,
        @NotNull @JsonProperty("temperature_c") Double temperatureC,
        @NotNull @JsonProperty("oxygen_flow") Double oxygenFlow,
        @NotNull @JsonProperty("mobility_score") Integer mobilityScore,
        @NotNull @JsonProperty("nurse_alert") Integer nurseAlert,
        @NotNull @JsonProperty("wbc_count") Double wbcCount,
        @NotNull Double lactate,
        @NotNull Double creatinine,
        @NotNull @JsonProperty("crp_level") Double crpLevel,
        @NotNull Double hemoglobin,
        @NotNull @JsonProperty("sepsis_risk_score") Integer sepsisRiskScore,
        @NotNull Integer age,
        @NotNull @JsonProperty("comorbidity_index") Integer comorbidityIndex,
        @NotNull @JsonProperty("hour_from_admission") Integer hourFromAdmission,
        @NotBlank String gender,
        @NotBlank @JsonProperty("oxygen_device") String oxygenDevice,
        @NotBlank @JsonProperty("admission_type") String admissionType
) {
}
