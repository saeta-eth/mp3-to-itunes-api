
## api.mp3-to-itunes.com

> The API for [mp3-to-itunes.com](https://mp3-to-itunes.com) project.

## Getting Started

```sh
# clone it
git clone https://github.com/slorenzo/api-mp3-to-itunes.git
cd api-mp3-to-itunes

# Build your docker image
docker build -t es6/api-mp3-to-itunes .
#            ^      ^           ^
#          tag  tag name      Dockerfile location

# Run your docker image
docker run -p 8080:80 es6/api-mp3-to-itunes
#                 ^              ^
#          bind the port      container tag
#          to your host
#          machine port   

```

## REST API

 - > ***POST `/upload`***

This only accepts a `.zip` file attached as a parameter. 
It saves the zip file in the server in order to analyze.

Example request
```shell
curl -X POST \
  http://localhost:8080/api/upload
  -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
  -F 'file=@1989 Cómo Conseguir Chicas.zip'
```

Example response
```js
{
  "id": "5ef01b40-2d8e-11e8-9a92-9bd7886fe54c" // uuid
}
```
 - >  ***PUT `api/upload/{id}`***

This only accepts an `id` as a parameter.
With this, analyze the file to find possible non-albums files.

Example request
```shell
curl -X PUT \
  http://localhost:8080/api/upload/5ef01b40-2d8e-11e8-9a92-9bd7886fe54c
```

Example response
```js
{
    "message": "The .zip was successfully loaded"
}
```

 - > ***DELETE `api/upload/{id}`***

This only accepts an `id` as a parameter.
Remove files related to the `id`

Example request
```shell
curl -X DELETE \
  http://localhost:8080/api/upload/5ef01b40-2d8e-11e8-9a92-9bd7886fe54c
```

Example response
```js
{
    "message": "All about 5ef01b40-2d8e-11e8-9a92-9bd7886fe54c were removed"
}
```

 - > ***PUT `api/converter/{id}`***
 
This only accepts an `id` as a parameter.
Fill the album related to the `id` with metadata.
Itunes uses this metadata to get the organized albums

Example request
```shell
curl -X PUT \
  http://localhost:8080/api/converter/8f82abd0-2d96-11e8-9f92-2ff77e3251b1
```

Example response
```js
{
  "message": "The tracks of this album has been filled"
}
```

 - > ***GET `api/converter`***
 
Download album for itunes.

```shell
curl -X GET \
  http://localhost:8080/api/converter/8f82abd0-2d96-11e8-9f92-2ff77e3251b1
```


## Made with ❤ by

- Sebastian Lorenzo (Javascript developer)
- E-mail: [SebastianLorenzo@gmail.com](mailto:SebastianLorenzo@gmail.com)
- StackOverflow: [sebastian-lorenzo](http://stackoverflow.com/users/1741027/sebastian-lorenzo?tab=profile)

## License

MIT license. Copyright © 2018.
