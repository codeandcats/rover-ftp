# rover-ftp

#### Rover FTP will fetch new files from an FTP Server for you!

<img src="https://raw.githubusercontent.com/codeandcats/rover-ftp/master/rover-ftp.png" width="500px" />

## Installation

```
npm install rover-ftp --global
```

## Add a server

```
rover-ftp set-server <name> --url <url> --username <username> --password <password> --remote <path> --local <path>
```

e.g.

```
rover-ftp set-server MyFtp --url myftpserver.net --username rsanchez --password "WubbaLubbaDubDub" --remote "downloads/completed" --local "c:\downloads"
```

## Fetch downloads

```
rover-ftp fetch [name]
```

e.g.

```
rover-ftp fetch MyFtp
```
