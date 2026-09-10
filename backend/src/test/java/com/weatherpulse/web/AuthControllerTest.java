package com.weatherpulse.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.weatherpulse.entity.AdminUser;
import com.weatherpulse.repository.AdminUserRepository;
import com.weatherpulse.security.JwtTokenProvider;
import com.weatherpulse.web.dto.LoginRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminUserRepository adminUserRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("POST /api/auth/login: Issues signed JWT on valid credentials")
    void testLogin_Success() throws Exception {
        AdminUser admin = AdminUser.builder()
                .id(1L)
                .username("admin")
                .passwordHash("$2a$10$abcdefghijklmnopqrstuvwxyz123456")
                .role("ROLE_ADMIN")
                .build();

        when(adminUserRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("AdminSecret123!", admin.getPasswordHash())).thenReturn(true);
        when(jwtTokenProvider.generateToken("admin", "ROLE_ADMIN")).thenReturn("mocked.jwt.token");
        when(jwtTokenProvider.getExpirationDurationSeconds()).thenReturn(7200L);

        LoginRequest request = new LoginRequest("admin", "AdminSecret123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mocked.jwt.token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(7200))
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.role").value("ROLE_ADMIN"));
    }

    @Test
    @DisplayName("POST /api/auth/login: Returns 401 Unauthorized on password mismatch")
    void testLogin_PasswordMismatch() throws Exception {
        AdminUser admin = AdminUser.builder()
                .id(1L)
                .username("admin")
                .passwordHash("$2a$10$abcdefghijklmnopqrstuvwxyz123456")
                .role("ROLE_ADMIN")
                .build();

        when(adminUserRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("WrongPassword!", admin.getPasswordHash())).thenReturn(false);

        LoginRequest request = new LoginRequest("admin", "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Unauthorized"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.detail").value("Invalid username or password provided."));
    }

    @Test
    @DisplayName("POST /api/auth/login: Returns 401 Unauthorized on non-existent username")
    void testLogin_UserNotFound() throws Exception {
        when(adminUserRepository.findByUsernameIgnoreCase("unknown")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest("unknown", "AnyPassword123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("POST /api/auth/login: Returns 400 Bad Request on blank username or password")
    void testLogin_BlankFields() throws Exception {
        LoginRequest request = new LoginRequest("", "");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
