<p align="center">
  <img src="./rll-phases-1.svg" alt="react-loosely-lazy logo variation 1" height="120" style="margin:0 8px;" />
  <img src="./rll-phases-2.svg" alt="react-loosely-lazy logo variation 2" height="120" style="margin:0 8px;" />
  <img src="./rll-phases-3.svg" alt="react-loosely-lazy logo variation 3" height="120" style="margin:0 8px;" />
</p>
<h1 align="center">react-loosely-lazy</h1>
<p align="center">
  <a href="https://www.npmjs.com/package/react-loosely-lazy"><img src="https://img.shields.io/npm/v/react-loosely-lazy.svg"></a>
  <a href="https://bundlephobia.com/result?p=react-loosely-lazy"><img src="https://img.shields.io/bundlephobia/minzip/react-loosely-lazy.svg" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" /></a>
</p>

A future focused async component loading library for React. Comes packed with loading phases to enable fine-grained performance optimisations.

## Logo design
These minimalist logo variations aim to capture the core idea of react-loosely-lazy: asynchronous, phased loading with simple, elegant motion.

- Variation 1 (rll-phases-1.svg): Concentric circular arcs form a "progress ring" around a core dot, suggesting staged loading phases (for paint / after-paint / lazy). The negative space between arcs implies waiting and reveal. Uses an Atlassian-inspired blue gradient for a modern, trustworthy feel.
- Variation 2 (rll-phases-2.svg): Three progressive "step" bars show forward progress and phase escalation. A subtle arc hints at motion and direction while maintaining a clean, geometric composition.
- Variation 3 (rll-phases-3.svg): Stacked rounded cards represent deferred layers that progressively reveal. A triangular cut creates intentional negative space to indicate a lazy "bite" or reveal.

Design constraints followed:
- No text; geometry only with intentional use of negative space
- Limited palette per logo (2–3 colors), primarily Atlassian blues and one alternative green variant
- Scales from favicon to banner via a square 128×128 viewBox
- Clean, modern shapes inspired by Apple/Google design minimalism


## Installation
```sh
# npm
npm i react-loosely-lazy

# yarn
yarn add react-loosely-lazy
```

## Documentation
All documentation can be found at: https://atlassian-labs.github.io/react-loosely-lazy

## Playground
See `react-loosely-lazy` in action: run `npm run start` and then go and check: `http://localhost:8080/`

## Contributing
Thank you for considering a contribution to `react-loosely-lazy`! Before doing so, please make sure to read our [contribution guidelines](CONTRIBUTING.md).

## Development
To test your changes you can run the examples (with `npm run start`).
Also, make sure you run `npm run preversion` before creating you PR so you will double check that linting, types and tests are fine.

## License
Copyright (c) 2020 Atlassian and others.
Apache 2.0 licensed, see [LICENSE](LICENSE) file.

[![With ❤️ from Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers-light.png)](https://www.atlassian.com)
