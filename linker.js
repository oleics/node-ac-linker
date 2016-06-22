
// Link folders into a folder

var fs = require('fs');
var path = require('path');

module.exports = Linker;

function Linker(folder) {
  if(!(this instanceof Linker)) return new Linker(folder);

  this.folder = path.resolve(folder);
  this.map = {};
}

//

Linker.prototype.scan = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    fs.readdir(self.folder, function(err, files){
      if(err) return reject(err);

      var map = {};
      var promise = Promise.resolve();

      files.forEach(function(name){
        var filepath = path.join(self.folder, name);
        promise = promise.then(function(){
          return getSymlinkString(filepath);
        }).then(function(linkTo){
          if(linkTo == null) return;
          map[name] = linkTo;
        });
      });

      promise.then(function(){
        self.map = map;
        resolve(map);
      });
    });
  });
};

//

Linker.prototype.link = function(linkTo, name) {
  linkTo = path.resolve(linkTo);
  if(name == null) name = path.basename(linkTo);
  var p = path.join(this.folder, name);
  var map = this.map;
  return new Promise(function(resolve, reject) {
    fs.symlink(linkTo, p, 'junction', function(err){
      if(err && ! (err.code === 'EEXIST' && map[name] === linkTo)) {
        return reject(err);
      }
      map[name] = linkTo;
      resolve();
    });
  });
};

Linker.prototype.unlink = function(linkToOrName) {
  linkToOrName = path.basename(linkToOrName);
  var p = path.join(this.folder, linkToOrName);
  var map = this.map;
  return new Promise(function(resolve, reject) {
    fs.unlink(p, function(err){
      if(err) return reject(err);
      delete map[linkToOrName];
      resolve();
    });
  });
};

Linker.prototype.unlinkAll = function() {
  var self = this;
  var r = [];
  var promise = Promise.resolve();

  Object.keys(this.map).forEach(function(name){
    promise = promise.then(function(){
      return self.unlink(name);
    }).then(function(){
      r.push(name);
    });
  });

  return promise.then(function(){
    return r;
  });
};

//

Linker.prototype.linkFolders = function(folder) {
  var self = this;
  folder = path.resolve(folder);
  return new Promise(function(resolve, reject) {
    fs.readdir(folder, function(err, files){
      if(err) return reject(err);

      var r = [];
      var promise = Promise.resolve();

      files.forEach(function(name){
        var filepath = path.join(folder, name);
        promise = promise.then(function(){
          return isFolder(filepath);
        }).then(function(yes){
          if(!yes) return;
          return self.link(filepath).then(function(){
            r.push(filepath);
          });
        });
      });

      promise.then(function(){
        resolve(r);
      });
    });
  });
};

Linker.prototype.unlinkFolders = function(folder) {
  var self = this;
  folder = path.resolve(folder);
  return new Promise(function(resolve, reject) {
    fs.readdir(folder, function(err, files){
      if(err) return reject(err);

      var r = [];
      var promise = Promise.resolve();

      files.forEach(function(name){
        var filepath = path.join(folder, name);
        promise = promise.then(function(){
          return isFolder(filepath);
        }).then(function(yes){
          if(!yes) return;

          var names = self.getNames(filepath);
          var promise = Promise.resolve();

          names.forEach(function(name){
            promise = promise.then(function(){
              return self.unlink(name);
            });
          });

          return promise.then(function(){
            r.push(filepath);
          });
        });
      });

      promise.then(function(){
        resolve(r);
      });
    });
  });
};

//

Linker.prototype.linkPackage = function(folder, packageFilename, nameField) {
  folder = path.resolve(folder);
  if(packageFilename == null) packageFilename = 'package.json';
  if(nameField == null) nameField = 'name';
  var p = path.join(folder, packageFilename);
  var self = this;
  return readJsonFile(p).then(function(d){
    if(d[nameField] == null) return Promise.reject(new Error('Missing '+nameField+'-field in "'+p+'".'));
    return self.link(folder, d[nameField]);
  });
};

Linker.prototype.linkPackageFolders = function(folder, packageFilename, nameField) {
  folder = path.resolve(folder);
  if(packageFilename == null) packageFilename = 'package.json';
  if(nameField == null) nameField = 'name';
  var self = this;
  return new Promise(function(resolve, reject) {
    fs.readdir(folder, function(err, files){
      if(err) return reject(err);

      var r = [];
      var promise = Promise.resolve();

      files.forEach(function(name){
        var filepath = path.join(folder, name);
        promise = promise.then(function(){
          return isFolder(filepath);
        }).then(function(yes){
          if(!yes) return;
          var p = path.join(filepath, packageFilename);
          return fileExists(p).then(function(yes){
            if(!yes) return;
            return self.linkPackage(filepath, packageFilename, nameField).then(function(){
              r.push(filepath);
            });
          });
        });
      });

      promise.then(function(){
        resolve(r);
      });
    });
  });
};

//

Linker.prototype.getNames = function(folder) {
  folder = path.resolve(folder);
  return Object.keys(this.map).filter(function(name){
    return this.map[name] === folder;
  }, this);
};

//

function getSymlinkString(p) {
  return new Promise(function(resolve, reject) {
    fs.lstat(p, function(err, s){
      if(err) return reject(err);
      if(!s.isSymbolicLink()) return resolve();
      fs.readlink(p, function(err, linkTo){
        if(err) return reject(err);
        resolve(linkTo);
      });
    });
  });
}

function isFolder(p) {
  return new Promise(function(resolve, reject) {
    fs.stat(p, function(err, s){
      if(err) return reject(err);
      resolve(s.isDirectory());
    });
  });
}

function fileExists(p) {
  return new Promise(function(resolve, reject) {
    fs.exists(p, function(exists){
      resolve(exists);
    });
  });
}

function readJsonFile(p) {
  return new Promise(function(resolve, reject) {
    fs.readFile(p, function(err, d){
      if(err) return reject(err);
      resolve(JSON.parse(d.toString()));
    });
  });
}
