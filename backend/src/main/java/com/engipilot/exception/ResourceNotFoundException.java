package com.engipilot.exception;
import java.util.UUID;
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, UUID id) {
        super(resource + " non trouvé: " + id);
    }
}
