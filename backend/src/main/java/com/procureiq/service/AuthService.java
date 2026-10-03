package com.procureiq.service;

import com.procureiq.entity.User;
import com.procureiq.dto.AuthResponse;
import com.procureiq.repository.UserRepository;
import com.procureiq.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(String name, String email, String password) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email must not be empty");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password must not be empty");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name must not be empty");
        }

        String normalizedEmail = email.trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email is already registered: " + normalizedEmail);
        }

        String hashedPassword = passwordEncoder.encode(password);
        User user = new User(name.trim(), normalizedEmail, hashedPassword, "PROCUREMENT_OFFICER");
        User savedUser = userRepository.save(user);
        return toAuthResponse(savedUser, "User registered successfully", null);
    }

    public AuthResponse login(String email, String password) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String normalizedEmail = email.trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return toAuthResponse(user, "Login successful", jwtService.generateToken(user));
    }

    private AuthResponse toAuthResponse(User user, String message, String token) {
        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), message, token);
    }
}
