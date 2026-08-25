package com.icu.earlywarning;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import java.time.Duration;
import java.util.Map;

/**
 * Single controller for the whole backend.
 *
 * What this file does, step by step:
 *  1. GET  "/"        -> shows the dashboard page (index.html)
 *  2. GET  "/health"  -> simple check that the backend is alive
 *  3. POST "/predict" -> takes JSON from the frontend, forwards it AS-IS
 *                        to the Python ML service, and forwards the
 *                        Python response back to the frontend.
 *
 * No DTOs, no service layer, no custom exceptions - everything happens
 * right here using plain Map<String, Object> for JSON in/out.
 */
@Controller
public class MainController {

    private final RestTemplate restTemplate;
    private final String mlServiceUrl;

    public MainController(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${ml.service.url:http://localhost:5001}") String mlServiceUrl
    ) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(30))
                .build();
        this.mlServiceUrl = mlServiceUrl;
    }

    // Step 1: serve the dashboard HTML page at "/"
    @GetMapping("/")
    public String home() {
        return "index";
    }

    // Step 2: basic health check used by Docker/monitoring
    @GetMapping("/health")
    @ResponseBody
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    // Step 3: receive the vitals JSON from the frontend, ask Python for a
    // prediction, and send Python's answer straight back to the frontend.
    @PostMapping("/predict")
    @ResponseBody
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> predict(@RequestBody Map<String, Object> vitals) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> mlResponse = restTemplate.postForObject(
                    mlServiceUrl + "/predict",
                    new org.springframework.http.HttpEntity<>(vitals, headers),
                    Map.class
            );

            if (mlResponse == null) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(Map.of("success", false, "error", "ML service returned an empty response"));
            }
            return ResponseEntity.ok(mlResponse);

        } catch (RestClientException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("success", false, "error", "ML service request failed: " + ex.getMessage()));
        }
    }
}
