# microservices-project

This project is the first exercise for the course "Continuous Development and Deployment – DevOps" at Tampere University, Finland 🇫🇮. The assignment details are provided in the `exercise.pdf` file.

## Disclaimer

All information was sourced from the Docker documentation and my own research. AI assistance was used for implementation purposes, and details of this can be found in the `llm.txt` file.

## Informations

The primary goal of this exercise was to create two different log files in persistent storage, both containing the same content. The first log file is mounted on the user's host system and is accessible by both `service1` and `service2`. The second log file is managed by a custom service called `storage`.

## Rest Endpoints

`localhost:8199/status`

It provides two records, one from each of the main services (`service1` and `service2`). The records should be identical, with only minor differences in the calculation of remaining space—these differences should be less than 1 MByte.

---

`localhost:8199/log`

It provides the log file entries managed by the `storage` service.

---

The endpoints can be easily accessed using standard UNIX commands.

```
curl localhost:8199/status
```

```
curl localhost:8199/log
```

## Log Files

The log file maintained by the `storage` service is not directly accessible. It can be deleted along with the container by running the following command in the command line.

```
docker compose down --volume  
```

---

The second log file, `vstorage`, is mounted at the container’s base directory on the host machine. It can be accessed by running the following UNIX command from the container host directory:

```
cat ./vstorage
```

## Run

To test/run this docker container you can follow these UNIX commands:

### Clone Git Repository

```
git clone -b exercise1 https://github.com/Flotschii999/microservices-project.git
```

### Enter Git Directory

Before running the following commands, make sure to first navigate into the newly generated directory. Then wait for 10 seconds to allow the system to start up completely.

```
cd microservices-project
```

You can then build the container by executing the following command:
```
docker-compose up --build
```

### Accessing the Endpoints

```
curl localhost:8199/status
```

```
curl localhost:8199/log
```

## Remove the Docker Container

### Students Instructions for Cleaning Up

To perform a complete cleanup, you can add the `--volumes` option to the command, which will also remove all volumes created by Docker Compose.

```
docker compose down --volumes
```

### Alternative: Keeping Volumes

Removing containers while keeping volumes intact.

```
docker-compose down
```
