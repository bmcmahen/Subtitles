Package.describe({
	summary: 'require() components on the client'
});

Package.on_use(function(api){
	api.add_files(['build/build.js', 'build/build.css'], 'client');
});