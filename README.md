# Pong

A Pong implementation in TypeScript with no other dependencies.

The goal of this project is to get experience with game development using HTML
5 Canvas & TypeScript, without any other dependencies.

All assets in this project are free for non-commercial use. I've used graphical
and audio assets from [Kenney](https://kenney.nl/) and the Jumpman font from
[Pixel Saga](http://www.pixelsagas.com).

The lib/ directory contains code that I plan to share across my own projects.
Hopefully in time this code will be part of a proper library that is at least
well suited to my own needs. Included in the lib/ directory are the following
modules:

- SceneManager: manages scene drawing, updates and transitions.
- ServiceLocator: register and use services everywhere in the app.
- Renderer: centralized rendering in order to keep track of draw calls.
- Shape: shapes used for basic collision detection.
- Tidy: UI layout library [based on this Python example](https://forums.4fips.com/viewtopic.php?f=3&t=6896).
- Timer: a timer that schedules actions to run in the future.
- Heap: a collection used in Timer, to order actions based on time.
- Runloop: manages the game runloop, ensuring updates are called at regular
  intervals regardless of frame drops.
- AssetLoader: load audio and image assets automatically using a manifest.json
  file that contains file paths.
- Vector: a 2D vector class with some mathematical functions.
- Size: a class that represents a width & height.

For convenience with regards to AssetLoader, the scripts/ directory includes a
script that can be used to generate a manifest.json file from the public/assets/
directory contents.
