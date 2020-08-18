# maison-nolae-backend

![CircleCI](https://circleci.com/gh/GTSpray/maison-nolae-backend/tree/master.svg?style=svg "CircleCI")


## Installation

```bash
cp .env.sample .env
yarn run preset:env
```

### Linter

This project use [StandardJS](https://standardjs.com) as linter with a ci hook.

To configure text editor, see [this link](https://standardjs.com/#are-there-text-editor-plugins).

To run linter : `yarn run lint`

To run linter with auto-fix : `yarn run lint:fix`

### Tests

`npm test`