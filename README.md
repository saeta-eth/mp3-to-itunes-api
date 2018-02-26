## Getting Started

```sh
# clone it
git clone https://github.com/slorenzo/api-mp3-to-itunes.git
cd api-mp3-to-itunes

# Install dependencies
npm install

# Start development live-reload server
PORT=8080 npm run dev

# Start production server:
PORT=8080 npm start
```

## Docker Support

```sh
cd api-mp3-to-itunes

# Build your docker
docker build -t es6/api-mp3-to-itunes .
#            ^      ^           ^
#          tag  tag name      Dockerfile location

# run your docker
docker run -p 8080:8080 es6/api-mp3-to-itunes
#                 ^            ^
#          bind the port    container tag
#          to your host
#          machine port   

```

## Made with ❤ by

- Sebastian Lorenzo (Javascript developer)
- E-mail: [SebastianLorenzo@gmail.com](mailto:SebastianLorenzo@gmail.com)
- StackOverflow: [sebastian-lorenzo](http://stackoverflow.com/users/1741027/sebastian-lorenzo?tab=profile)

## License

MIT license. Copyright © 2018.
