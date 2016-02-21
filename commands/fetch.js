var consoleUtils = require('./consoleUtils');
var cli = require('commander');
var serverList = require('../servers');
var PromiseFtp = require('promise-ftp');
var chalk = require('chalk');
var moment = require('moment');
var filesize = require('filesize');
var fs = require('fs');
var path = require('path');

cli
	.command('fetch <name>')
	.action(function(serverName) {
		
		serverList.get(serverName).then(server =>
		{
			if (!server) {
				consoleUtils.showErrorAndExit('Server not found');
			}
			else {
				var ftp = new PromiseFtp();
				
				var options = {
					host: server.url,
					user: server.credentials.userName,
					password: server.credentials.password
				};
				
				var lastDownloadModifiedDate = /*server.lastDownloadModifiedDate ||*/ new Date(2016, 1, 17);
				
				var remotePath = server.paths.remote || '/';
				var localPath = server.paths.local || '';
				
				console.log('Connecting to ' + server.name + '...');
				
				function getLocalFileName(entry) {
					return localPath + entry.path.substr(remotePath.length) + path.sep + entry.name;
				}
				
				function disconnectThenShowErrorAndExit(err) {
					ftp.end(() => {
						consoleUtils.showErrorAndExit(err);
					});
				}
				
				ftp
					.connect(options)
					.catch(consoleUtils.showErrorAndExit)
					.then(showConnectedMessage)
					.then(() => getNewFiles(ftp, remotePath, lastDownloadModifiedDate))
					.catch(disconnectThenShowErrorAndExit)
					.then(listFiles)
					.then(listing => downloadFiles(ftp, listing, getLocalFileName))
					.catch(disconnectThenShowErrorAndExit)
					.then(result => {
						console.log('');
						console.log(chalk.green('Done and done'));
						ftp.end().then(() => {
							process.exit(0);
						});
					});
			}
		}).catch(consoleUtils.showErrorAndExit);
		
	});
	
function showConnectedMessage(serverMessage) {
	return new Promise((resolve, reject) =>
	{
		console.log(chalk.green('Connected'));
		console.log('Server message: ', serverMessage);
		console.log('');
		
		resolve();
	});
}

function getNewFiles(ftp, remotePath, afterDate) {
	return new Promise((resolve, reject) => {
		console.log(`Searching for files newer than ${formatDate(afterDate)}...`)
		console.log('');
		
		function isNew(entry) {
			return entry.date.getTime() > afterDate.getTime();
		}
		
		var queue = [];
		var files = [];
		
		queue.push(remotePath);
		
		processQueue();
		
		function processQueue() {
			if (queue.length == 0) {
				return resolve(files);
			}
			
			var currentPath = queue.shift();
			
			ftp
				.list(currentPath).then(entries => {
					entries.forEach(entry => {
						if (isNew(entry)) {
							if (entry.type.toLowerCase() == 'd') {
								queue.push(currentPath + '/' + entry.name);
							}
							else {
								entry.path = currentPath;
								files.push(entry);
							}
						}
					});
					processQueue();
				}).catch(err => {
					reject(err);
				});
		}
	});
}

function formatDate(date) {
	return moment(date).format('YYYY-MM-DD HH:mm:ss');
}

function listFiles(list) {
	return new Promise((resolve, reject) => {
		var result = {
			totalCount: 0,
			totalSize: 0,
			files: list
		};
		
		if (list) {
			result.totalCount = list.length;
			
			list.forEach(entry => {
				result.totalSize += entry.size;
				//console.log(`${formatDate(entry.date)} ${chalk.white(entry.path + '/' + entry.name)}`);
			});
			
			console.log('');
			console.log(
				'Found ' + chalk.yellow(result.totalCount) + 
				' new files totaling ' + chalk.yellow(filesize(result.totalSize)));
		}
		
		resolve(result);
	});
}

function downloadFiles(ftp, listing, getLocalFileName) {
	return new Promise((resolve, reject) => {
		var todo = [].concat(listing.files);
		
		var result = {
			downloaded: 0,
			skipped: 0
		};
		
		function downloadFile(file, localFileName) {
			return new Promise((resolve, reject) => {
				// First ensure the directory the file resides in exists
				// before we try creating the file
				var parentPath = path.dirname(localFileName);
				
				fs.mkdir(parentPath, () => {
					console.log('Downloading: ' + localFileName);
					ftp.get(file.fileName)
					.catch(reject)
					.then(remoteStream => {
						var localStream = fs.createWriteStream(localFileName);
						
						remoteStream.once('close', () => {
							console.log('Downloaded');
							console.log('');
							resolve();
						});
						
						remoteStream.once('error', err => {
							console.log('Oh oh, spaghettiohs');
							reject(err);
						});
						
						remoteStream.pipe(localStream);
					});
				});
			});
		}
		
		function processQueue() {
			if (todo.length == 0) {
				return resolve(result);
			}
			
			var file = todo.shift();
			
			var localFileName = getLocalFileName(file);
			
			fs.stat(localFileName, (err, stat) => {
				
				if (err != null) {
					// The local file doesn't exist
					// so let's download it
					downloadFile(file, localFileName)
						.catch(reject)
						.then(processQueue);
				}
				else if (stat.isFile()) {
					if (stat.size == file.size) {
						// The local file is same size, which means 
						// we've already downloaded it, so let's skip it
						console.log('Already downloaded: ' + file.fileName);
						processQueue();
					}
					else if (stat.size > file.size) {
						// The local file is larger than the remote file
						// Wierd...let's just delete the local file and
						// redownload the remote file
						console.log("Local exists but larger than remote - deleting local: " + localFileName);
						fs.unlink(localFileName, err => {
							if (err) {
								reject(err);
							}
							else {
								downloadFile(file, localFileName)
									.catch(reject)
									.then(processQueue);
							}
						});
					}
					else if (stat.size > 0) {
						// The local file exists but is smaller than remote
						// That means we haven't finished downloading it, so 
						// let's try to resume downloading
						fs
							.restart(stat.size)
							.catch(() => {
								// Damn, the command to resume from an offset failed
								// Most likely the ftp server doesn't support this 
								// extended feature of the protocol. Our best course
								// of action will be to delete our local file and
								// restart the download from scratch
								fs.unlink(localFileName, err => {
									if (err) {
										reject(err);
									}
									else {
										downloadFile(file, localFileName)
											.catch(reject)
											.then(processQueue);
									}
								});
							})
							.then(() => {
								downloadFile(file, localFileName)
									.catch(reject)
									.then(processQueue);
							});
					}
					else {
						downloadFile(file, localFileName)
							.catch(reject)
							.then(processQueue);
					}
				}
			});
		}
		
		processQueue();
	});
}
