# mse-player

[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg?style=flat-square)](https://gitter.im/mse-player/)
[![License](https://img.shields.io/github/license/mashape/apistatus.svg?style=flat-square)](https://github.com/bunch-of-friends/mse-player/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/%40mse-player%2Fmain.svg)](https://badge.fury.io/js/%40mse-player%2Fmain)
[![CircleCI](https://circleci.com/gh/bunch-of-friends/mse-player/tree/master.svg?style=svg)](https://circleci.com/gh/bunch-of-friends/mse-player/tree/master)

Modular and extensible video player built on [Media Source Extensions](https://en.wikipedia.org/wiki/Media_Source_Extensions) and [Encrypted Media extensions](https://en.wikipedia.org/wiki/Encrypted_Media_Extensions), written in TypeScript.

Currently in very early stage of development.

## Contributing

As the project is only just starting and no documentation of even high level architecture, we suggest getting in touch first, if you wish to contribute.
Please visit our Gitter channel https://gitter.im/mse-player/

## Development

### Key tools

If you are not familiar with these three development tools, it might be difficult to work with this repo.
- [TypeScript](http://www.typescriptlang.org/)
- [Lerna](https://lernajs.io/)
- [Jest](https://facebook.github.io/jest/)

This project is based on the [lerna-typescript-jest-boilerplate](https://github.com/bunch-of-friends/lerna-typescript-jest-boilerplate).

### Scripts

After you clone the repo, simply run `npm install` in the root to install the dependencies and bootstrap lerna.
Then you can run `npm run demo` which starts the demo application. When you start coding, you might preffer `npm run demo:watch`, which rebuilds the TypeScript code on changes and the demo app as well.

See all the script in the root `package.json`, they are quite self explanatory.
You should always run the root scripts, you are not intended to run individual scripts in each packages.