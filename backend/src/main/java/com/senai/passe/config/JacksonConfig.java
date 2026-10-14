package com.senai.passe.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.TimeZone;

@Configuration
public class JacksonConfig {

    public static final ZoneId BRASILIA_ZONE = ZoneId.of("America/Sao_Paulo");
    public static final DateTimeFormatter BRASILIA_FORMATTER = DateTimeFormatter
            .ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX")
            .withZone(BRASILIA_ZONE);

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> {
            builder.timeZone(TimeZone.getTimeZone(BRASILIA_ZONE));
            builder.simpleDateFormat("yyyy-MM-dd'T'HH:mm:ss-03:00");

            // Serializers
            builder.serializerByType(Instant.class, new InstantBrasiliaSerializer());
            builder.serializerByType(OffsetDateTime.class, new OffsetDateTimeBrasiliaSerializer());
            builder.serializerByType(ZonedDateTime.class, new ZonedDateTimeBrasiliaSerializer());

            // Deserializers
            builder.deserializerByType(Instant.class, new InstantBrasiliaDeserializer());
            builder.deserializerByType(OffsetDateTime.class, new OffsetDateTimeBrasiliaDeserializer());
        };
    }

    public static class InstantBrasiliaSerializer extends JsonSerializer<Instant> {
        @Override
        public void serialize(Instant value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
            if (value == null) {
                gen.writeNull();
            } else {
                gen.writeString(BRASILIA_FORMATTER.format(value));
            }
        }
    }

    public static class OffsetDateTimeBrasiliaSerializer extends JsonSerializer<OffsetDateTime> {
        @Override
        public void serialize(OffsetDateTime value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
            if (value == null) {
                gen.writeNull();
            } else {
                OffsetDateTime adjusted = value.atZoneSameInstant(BRASILIA_ZONE).toOffsetDateTime();
                gen.writeString(adjusted.format(BRASILIA_FORMATTER));
            }
        }
    }

    public static class ZonedDateTimeBrasiliaSerializer extends JsonSerializer<ZonedDateTime> {
        @Override
        public void serialize(ZonedDateTime value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
            if (value == null) {
                gen.writeNull();
            } else {
                ZonedDateTime adjusted = value.withZoneSameInstant(BRASILIA_ZONE);
                gen.writeString(adjusted.format(BRASILIA_FORMATTER));
            }
        }
    }

    public static class InstantBrasiliaDeserializer extends JsonDeserializer<Instant> {
        @Override
        public Instant deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            String text = p.getText();
            if (text == null || text.isBlank()) {
                return null;
            }
            return OffsetDateTime.parse(text).toInstant();
        }
    }

    public static class OffsetDateTimeBrasiliaDeserializer extends JsonDeserializer<OffsetDateTime> {
        @Override
        public OffsetDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            String text = p.getText();
            if (text == null || text.isBlank()) {
                return null;
            }
            return OffsetDateTime.parse(text);
        }
    }
}
