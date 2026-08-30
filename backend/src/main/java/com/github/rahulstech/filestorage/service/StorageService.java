package com.github.rahulstech.filestorage.service;

import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.nio.file.Paths;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
public class StorageService {

    public static final String STORAGE_TEMP_KEY_PREFIX = "temp";

    public static final String STORAGE_PUBLIC_KEY_PREFIX = "file-storage-service";


    public record GetSignedPutUrlParams(
            String key,
            long contentLength,
            String contentType
    ) {}


    private final Region awsS3Region;

    private final String awsS3Bucket;

    private final String awsCDNBaseUrl;

    private final S3Client s3Client;

    public StorageService(
            @Value("${aws.s3.region}") String region,
            @Value("${aws.s3.bucket}") String bucket,
            @Value("${aws.cdn.base_url}") String baseUrl
    ) {
        this.awsS3Region = Region.of(region);
        this.awsS3Bucket = bucket;
        this.awsCDNBaseUrl = baseUrl;

        this.s3Client = S3Client.builder()
                .region(awsS3Region)
                .build();
    }

    @PreDestroy
    public void onPreDestroy() {
        S3Client client = this.s3Client;
        if (null != client) {
            try {
                client.close();
            }
            catch (Exception ignore) {}
        }
    }

    public String getSingedPutUrl(GetSignedPutUrlParams params) {

        try (S3Presigner presigner = S3Presigner.builder()
                .region(awsS3Region)
                .build()
        ) {
            PutObjectRequest cmd = PutObjectRequest.builder()
                    .bucket(awsS3Bucket)
                    .key(params.key())
                    .contentLength(params.contentLength())
                    .contentType(params.contentType())
                    .build();

            PutObjectPresignRequest presignedcmd = PutObjectPresignRequest.builder()
                    .putObjectRequest(cmd)
                    .signatureDuration(Duration.ofDays(1))
                    .build();

            return presigner.presignPutObject(presignedcmd).url().toString();
        }
    }

    public void copyObject(String srcKey, String dstKey) {
        CopyObjectRequest cmd = CopyObjectRequest.builder()
                .sourceBucket(this.awsS3Bucket)
                .sourceKey(srcKey)
                .destinationBucket(this.awsS3Bucket)
                .destinationKey(dstKey)
                .build();

        this.s3Client.copyObject(cmd);
    }

    public void removeObject(String key) {}

    public void removeMultipleObjects(List<String> uris) {}

    public String createTempStorageKey() {
        return createKey(STORAGE_TEMP_KEY_PREFIX, UUID.randomUUID().toString());
    }

    public String createUserPrivateStorageKey(String userId) {
        return createKey(STORAGE_PUBLIC_KEY_PREFIX, userId, "private", UUID.randomUUID().toString());
    }

    private String createKey(String first, String... more) {
        return Paths.get(first,more).toString();
    }

    public String getCDNUriForKey(String key) {
        if (key.startsWith(STORAGE_PUBLIC_KEY_PREFIX)) {
            key = key.substring(STORAGE_PUBLIC_KEY_PREFIX.length());
            return awsCDNBaseUrl + key;
        }

        throw new RuntimeException("object for key '"+key+"' is not publicly available");
    }
}
