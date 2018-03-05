FROM node:8-alpine

# File Author / Maintainer
MAINTAINER Sebastian Lorenzo <sebastianlorenzo@gmail.com>

LABEL name="api-mp3-to-itunes"

# build tools for native dependencies
RUN apk add --update make gcc g++ python git

# install graphicsmagick from source because install via apk not working
ENV PKGNAME=graphicsmagick
ENV PKGVER=1.3.26
ENV PKGSOURCE=http://downloads.sourceforge.net/$PKGNAME/$PKGNAME/$PKGVER/GraphicsMagick-$PKGVER.tar.lz

# Installing graphicsmagick dependencies
RUN apk add --update lzip \
                     wget \
                     ffmpeg \
                     libjpeg-turbo-dev \
                     libpng-dev \
                     libtool \
                     libgomp && \
    wget $PKGSOURCE && \
    lzip -d -c GraphicsMagick-$PKGVER.tar.lz | tar -xvf - && \
    cd GraphicsMagick-$PKGVER && \
    ./configure \
      --build=$CBUILD \
      --host=$CHOST \
      --prefix=/usr \
      --sysconfdir=/etc \
      --mandir=/usr/share/man \
      --infodir=/usr/share/info \
      --localstatedir=/var \
      --enable-shared \
      --disable-static \
      --with-modules \
      --with-threads \
      --with-gs-font-dir=/usr/share/fonts/Type1 \
      --with-quantum-depth=16 && \
    make && \
    make install && \
    cd / && \
    rm -rf GraphicsMagick-$PKGVER && \
    rm GraphicsMagick-$PKGVER.tar.lz

# Set work directory to /www
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/package.json
RUN cd /usr/src/app; npm install

# Copy app source
COPY . /usr/src/app

RUN mkdir -p /usr/src/app/compressed
RUN mkdir -p /usr/src/app/decompressed
RUN mkdir -p /usr/src/app/itunes
RUN mkdir -p /usr/src/app/logs

# Set environment
# ENV NODE_ENV=production
ENV NODE_ENV=development
ENV PORT 80

# expose the port to outside world
EXPOSE  80

# start command as per package.json
CMD ["npm", "start"]
