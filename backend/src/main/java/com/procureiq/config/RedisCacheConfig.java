package com.procureiq.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.beans.factory.annotation.Value;

import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
@EnableCaching
@ConditionalOnProperty(name = "app.cache.redis.enabled", havingValue = "true", matchIfMissing = true)
public class RedisCacheConfig {

    private static final Set<String> CACHE_NAMES = Set.of(
            "standards:all",
            "standards:byIsNumber",
            "standards:byCategory",
            "standards:byStatus",
            "standards:byCertificationStatus"
    );

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration cacheConfiguration = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()));

        Map<String, RedisCacheConfiguration> cacheConfigurations = CACHE_NAMES.stream()
                .collect(Collectors.toMap(name -> name, name -> cacheConfiguration));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(cacheConfiguration)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }

    @Bean
    public ApplicationRunner verifyRedisAvailability(RedisConnectionFactory connectionFactory,
                                                     @Value("${spring.data.redis.host}") String host,
                                                     @Value("${spring.data.redis.port}") int port) {
        return args -> {
            try (RedisConnection connection = connectionFactory.getConnection()) {
                String response = connection.ping();
                if (!"PONG".equalsIgnoreCase(response)) {
                    throw new IllegalStateException("Unexpected Redis ping response");
                }
            } catch (RuntimeException exception) {
                throw new IllegalStateException(
                        "Redis caching is enabled but Redis is unavailable at " + host + ":" + port,
                        exception
                );
            }
        };
    }
}
