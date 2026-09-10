package com.weatherpulse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the WeatherPulse backend application.
 * Bootstraps Spring context, enables background scheduling, and initializes data tier.
 */
@SpringBootApplication
@EnableScheduling
public class WeatherPulseApplication {

    public static void main(String[] args) {
        SpringApplication.run(WeatherPulseApplication.class, args);
    }
}
