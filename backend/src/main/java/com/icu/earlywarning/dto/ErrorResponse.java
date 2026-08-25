package com.icu.earlywarning.dto;

import java.util.Map;

public record ErrorResponse(String error, Map<String, String> details) {
    public ErrorResponse(String error) {
        this(error, null);
    }
}
