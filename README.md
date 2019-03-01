# Ignitial.io bootsraper

Creates application and services bootstrap code based on Ignitial.io framework.

```bash
$> iio  

Usage:  [options] <command>

 Options:

   -v, --version              output the version number
   -p, --path <path>          set destination directory path. defaults to ./<name>
   -a, --author <author>      set author
   -l, --lang <language>      set programming language: py, js (default: js)
   -h, --help                 output usage information

 Commands:

   create <what> <name>       initialize new iio application or service project
   update [options] <name>    updates library for all child folders. Useful for iio-services update for all services
   build <name1>,...,<nameN>  builds Docker containers for named services

```

# Install

```bash
npm install -g @ignitial/iio-cli
```
