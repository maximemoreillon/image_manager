# Image manager

![pipeline](https://gitlab.com/moreillon_k8s/image_manager/badges/master/pipeline.svg)
![coverage](https://gitlab.com/moreillon_k8s/image_manager/badges/master/coverage.svg)

[![dockeri.co](https://dockeri.co/image/moreillon/image-manager)](https://hub.docker.com/r/moreillon/image-manager)

A simple service to upload and serve images

More details about the design of the service available on the [project page](https://articles.maximemoreillon.com/articles/112)

## API

| Route                       | Method | query/body          | Description                        |
| --------------------------- | ------ | ------------------- | ---------------------------------- |
| /                           | GET    | -                   | Show application info              |
| /images                     | GET    | limit               | Get the list of images             |
| /images                     | POST   | multipart/form-data | Image upload                       |
| /images/{image_id}          | GET    | -                   | Get the image with the given ID    |
| /images/{image_id}          | DELETE | -                   | Delete the image with the given ID |
| /images/{user_id}/thumbnail | GET    | -                   | Get the image thumbnail            |
| /images/{user_id}/details   | GET    | -                   | Get details about the upload       |

## Environment variables

| Variable                  | Description                             |
| ------------------------- | --------------------------------------- |
| MONGODB_CONNECTION_STRING | Connection stering for MongoDB          |
| IDENTIFICATION_URL        | URL of the user authentication endpoint |
| LOGIN_URL                 | URL for login, used for TDD             |
| TEST_USER_USERNAME        | Username for TDD                        |
| TEST_USER_PASSWORD        | Password for TDD                        |
