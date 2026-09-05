package com.github.rahulstech.filestorage.util;

import java.util.concurrent.TimeUnit;

public class Constants {

    public static final long DELETE_FROM_TRASH_AFTER_DAYS = 15;

    public static final long DELETE_FROM_TRASH_AFTER_MILLIS = TimeUnit.DAYS.toMillis(DELETE_FROM_TRASH_AFTER_DAYS);

}
