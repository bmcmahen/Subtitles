Subtitles
=========

Easily create subtitles (SRT files) in your web browser. Built using [Meteor](http://www.meteor.com), Components, Canvas, d3, and HTML 5. It works using the latest versions of Chrome, Firefox, and Internet Explorer.

[Try it out](http://subtitles.fiddleware.com).

[Watch a demonstration](http://vimeo.com/53719196).

## On Using Components

This project uses [Components](https://github.com/component/component) to manage some of the client-side libraries. If you want to add, build, or remove components to the application, you'll need to install Component:

	npm install -g component

Then navigate to the `/packages/component` directory, and type:

	component build

This generates a `build.js` file in the `build` folder. Unfortunately, as of version 0.6, Meteor wraps every document in a closure, so the `require` variable in `build.js` isn't exposed. You need to alter the file by changing the require function:

	require = function(path, parent, orgin) ...

Now, in your client code, you can important the components using `var emitter = require('component-emitter');`.

## License

GPL
