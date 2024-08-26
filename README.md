# [Aphex Workshop] Race Condition

## Develop

```sh
docker run --rm -d -p 6379:6379 redis
docker run --rm -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password mysql
npm run dev
```

## Build

```sh
docker compose build
```

## Run

```sh
docker compose up
```

## Default Credentials

`john:ripper`
