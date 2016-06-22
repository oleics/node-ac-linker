
ac-linker
==========

Symlink directories and packages.

Install
-------

For command-line

```sh
npm install ac-linker -g
```

For another package

```sh
npm install ac-linker --save
```

Usage
-----

### Commandline

Create `linker.json` in current folder

```sh
ac-linker init
```

Use `linker.json` in current folder

```sh
ac-linker
```

##### linker.json

```json
{
  "packages": [
    "path/to/a/package",
    "path/to/an/other/package"
  ],
  "packageFolders": [
    "path/to/a/folder/with/packages",
    "path/to/an/other/folder/with/other/packages"
  ],
  "folders": [
    "path/to/foo",
    "path/to/bar"
  ],
  "allInFolders": [
    "path/to/a/folder/with/more/folders"
  ]
}
```

### Class: Linker

#### Example

```js

var Linker = require('ac-linker');

var linker = new Linker('path/to/folder');

// Scan for all symlinks in 'path/to/folder'
linker.scan()
  .then(function(){
    // Create a symlink named 'foo' in 'path/to/folder'
    return linker.link('some/other/foo');
  })
  .then(function(){
    // Create a symlink named 'bar' in 'path/to/folder'
    return linker.link('some/other/foo', 'bar');
  })
  .then(function(){
    // Remove the 'bar' symlink
    return linker.unlink('bar');
  })
  .then(function(){
    // Remove all symlinks in `linker.map`
    return linker.unlinkAll();
  })
;

```

#### Properties

##### .folder

The folder in which the linker generates symbolic links.

##### .map

Map of symlink-name to linkString.

#### Methods

##### .scan()

Map all symlinks in `linker.map`.

Returns a promise that resolves to `linker.map`.

##### .link(linkTo [, name])

Create a symlink and adds to `linker.map`.

Returns a promise.

##### .unlink(linkToOrName)

Remove a symlink. Removes from `linker.map`. Returns a promise.

Returns a promise.

##### .unlinkAll()

Unlinks all symlinks in `linker.map`. Returns a promise.

Returns a promise that resolves to an array containing the names of removed symlinks.

##### .linkFolders(folder)

Symlinks all folders in `folder`

Returns a promise that resolves to an array containing the symlinked folders.

##### .unlinkFolders(folder)

Unlinks all symlinks to folders in `folder`

Returns a promise that resolves to an array containing the unlinked folders.

##### .linkPackage(folder[, packageFilename [, nameField]])

Creates a symlink named like `nameField` in `packageFilename` (which is a json-file).

`packageFilename` defaults to 'package.json'.

`nameField` defaults to 'name'.

Returns a promise.

##### .linkPackageFolders(folder[, packageFilename [, nameField]])

Creates symlinks to all folders in `folder` containing a package-file.

`packageFilename` defaults to 'package.json'.

`nameField` defaults to 'name'.

Returns a promise that resolves to an array of all symlinked folders.

##### .getNames(folder)

Returns an array of all names pointing to `folder`.

Notice
------

On windows-platforms `ac-linker` generates junctions.
See [fs.symlink()](https://nodejs.org/api/fs.html#fs_fs_symlink_target_path_type_callback).

MIT License
-----------

Copyright (c) 2016 Oliver Leics <oliver.leics@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
