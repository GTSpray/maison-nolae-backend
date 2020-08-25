# maison-nolae-backend

![CircleCI](https://circleci.com/gh/GTSpray/maison-nolae-backend/tree/develop.svg?style=svg "CircleCI")
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)

## Installation

```bash
yarn install
cp .env.sample .env
yarn run preset:env
```

## Run

Standalone: 

```bash
yarn start
```

or 

In background: 

```bash
yarn run start:deamon
```

### Linter

This project use [StandardJS](https://standardjs.com) as linter with a ci hook.

To configure text editor, see [this link](https://standardjs.com/#are-there-text-editor-plugins).

To run linter : `yarn run lint`

To run linter with auto-fix : `yarn run lint:fix`

### Tests

Standalone: 
```bash
yarn test
```

Watch: 
```bash
yarn run test:watch
```

In docker (watch): 
```bash
docker-compose up
```
