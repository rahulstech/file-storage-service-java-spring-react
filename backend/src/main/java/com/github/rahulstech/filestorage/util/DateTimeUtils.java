package com.github.rahulstech.filestorage.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

public class DateTimeUtils {

    public static LocalDateTime instantToLocalDateTimeAtUTC(Instant instant) {
        return LocalDateTime.ofInstant(instant, ZoneOffset.UTC);
    }
}
