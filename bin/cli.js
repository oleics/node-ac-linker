#!/usr/bin/env node

var LINKER_JSON = 'linker.json';

var fs = require('fs');
var path = require('path');
var Linker = require('../linker');

console.log('CWD: %s', process.cwd());
var p = path.resolve(process.cwd(), LINKER_JSON);

readLinkerJson(p)
  .then(function(d){
    if(d != null) {
      if(process.argv[2] === 'init') {
        exitWithErrorMessage('File "'+path.relative(process.cwd(), p)+'" already exists.');
        return Promise.reject();
      }
      console.log('Using: '+path.relative(process.cwd(), p));
      return d;
    }

    if(process.argv[2] !== 'init') {
      exitWithErrorMessage('File "'+path.relative(process.cwd(), p)+'" not found.');
      return Promise.reject();
    }

    // Create
    return new Promise(function(resolve, reject) {
      var d = {
        packages: [],
        packageFolders: [],
        folders: [],
        allInFolders: []
      };
      fs.writeFile(p, JSON.stringify(d, null, '  '), function(err){
        if(err) return reject(err);
        console.log('Created: '+path.relative(process.cwd(), p));
        resolve(d);
      });
    });
  })
  .then(function(d){
    return runLinker(d);
  })
  .then(onSuccess)
  .catch(onError)
;

function readLinkerJson(p) {
  return new Promise(function(resolve, reject) {
    fs.readFile(p, function(err, d) {
      if(err && err.code !== 'ENOENT') return onError(err);
      if(err) return resolve(d);
      d = JSON.parse(d.toString());
      resolve(d);
    });
  });
}

function runLinker(d) {
  return new Promise(function(resolve, reject) {
    var linker = new Linker('./node_modules');
    console.log('Folder: %s', path.relative(process.cwd(), linker.folder));
    linker.scan()
      .then(function(){
        // unlink all
        return linker.unlinkAll();
      })
      .then(function(r){
        console.log('Unlinked');
        r.forEach(function(name){
          console.log('  %s', name);
        });
      })
      .then(function(){
        // Link packages
        if(d.packages == null) return;
        var promise = Promise.resolve();
        d.packages.forEach(function(folder){
          promise = promise.then(function(){
            return linker.linkPackage(folder);
          });
        });
        return promise;
      })
      .then(function(){
        // Link packageFolders
        if(d.packageFolders == null) return;
        var promise = Promise.resolve();
        d.packageFolders.forEach(function(folder){
          promise = promise.then(function(){
            return linker.linkPackageFolders(folder);
          });
        });
        return promise;
      })
      .then(function(){
        // Link folders
        if(d.folders == null) return;
        var promise = Promise.resolve();
        d.folders.forEach(function(folder){
          promise = promise.then(function(){
            return linker.link(folder);
          });
        });
        return promise;
      })
      .then(function(){
        // Link allInFolders
        if(d.allInFolders == null) return;
        var promise = Promise.resolve();
        d.allInFolders.forEach(function(folder){
          promise = promise.then(function(){
            return linker.linkFolders(folder);
          });
        });
        return promise;
      })
      .then(function(){
        console.log('Linked');
        Object.keys(linker.map).forEach(function(name){
          console.log('  %s > %s', name, path.relative(process.cwd(), linker.map[name]));
        });
      })
      .then(function(){
        resolve(linker);
      })
      .catch(reject)
    ;
  });
}

function onSuccess(err) {
  console.log('OK');
  process.exit(0);
}

function onError(err) {
  console.error(err.stack||err);
  process.exit(1);
}

function exitWithErrorMessage(msg) {
  console.error('ERROR: %s', msg);
  process.exit(1);
}
