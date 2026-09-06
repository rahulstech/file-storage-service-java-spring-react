# Render requires the linux/amd64 architecture docker image for deploy
# but don't mention it here with --platform=linux/amd64. because it forces
# the image to always use the linux/amd64 os no matter where it will finally run
# which can lead to slow run or total failure.
# if linux/amd64 image is required the mention it during build like this
#
# docker build --platform linux/amd64 -t smart-erp
#
# it will create exact image for linux/amd64.
FROM eclipse-temurin:21-jre-alpine-3.23

WORKDIR /app

# use ./gradlew bootJar to create jar file for the application
COPY ./build/libs/file-storage-*.jar app.jar

COPY ./secrets/ca.pem /secrets/ca.pem

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]