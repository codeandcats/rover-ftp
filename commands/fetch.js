var consoleUtils = require('../utils/console');
var cli = require('commander');
var config = require('../config');
var PromiseFtp = require('promise-ftp');
var chalk = require('chalk');
var moment = require('moment');
var filesize = require('filesize');
var fs = require('fs');
var path = require('path');
var fileUtils = require('../utils/file');

cli
	.command('fetch [name]')
	.description('Fetches latest files since the last file was fetched')
	.action(function(serverName) {
		config.process.started()
			.then(() => {
				if (serverName) {
					config.servers.get(serverName)
						.then(fetch)
						.then(() => exit())
						.catch(exit);
				}
				else {
					config.servers.list()
						.then(servers => {
							function processFetchQueue() {
								if (!servers.length) {
									console.log('');
									console.log('Finished');
									exit();
									return;
								}
								
								var server = servers.shift();
								
								fetch(server).then(processFetchQueue, exit);
							}
							
							processFetchQueue();
						})
						.catch(exit);
				}
			})
			.catch(exit);
	});

function exit(err) {
	config.process.stopped()
		.then(() => {
			if (err) {
				consoleUtils.showErrorAndExit(err);
			}
			else {
				process.exit(0);
			}
		});
}

function fetch(server) {
	return new Promise((resolve, reject) => {
		var ftp = new PromiseFtp();
		
		var options = {
			host: server.url,
			user: server.credentials.userName,
			password: server.credentials.password
		};
		
		var lastFileDate = server.lastFileDate || new Date(1981, 4, 14);
		
		var remotePath = server.paths.remote || '/';
		var localPath = server.paths.local || '';
		
		console.log('');
		process.stdout.write('Connecting to ' + server.name + '...');
		
		function getLocalFileName(entry) {
			return localPath + entry.path.substr(remotePath.length) + path.sep + entry.name;
		}
		
		function finished(summary) {
			ftp.end()
				.then(() => {
					// Update the server with the last file date
					server.lastFileDate = summary.lastFileDate;
					config.servers.set(server)
						.then(() => resolve())
						.catch(reject);
				})
				.catch(() => resolve());
		}
		
		function disconnectAndReject(err) {
			ftp.end()
				.then(() => reject(err))
				.catch(() => reject(err));
		}
		
		ftp
			.connect(options)
			.then(showConnectedMessage)
			.catch(reject)
			.then(() => getNewFiles(ftp, remotePath, lastFileDate))
			.then(listFiles)
			.then(listing => downloadFiles(ftp, listing, getLocalFileName))
			.then(finished)
			.catch(disconnectAndReject);
	});
}

function showConnectedMessage(serverMessage) {
	return new Promise((resolve, reject) => {
		console.log(chalk.green('Connected'));
		console.log('');
		console.log('  ', serverMessage);
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
				resolve(files);
				return;
			}
			
			var currentPath = queue.shift();
			
			ftp.list(currentPath)
				.then(entries => {
					entries.forEach(entry => {
						try {
							if (isNew(entry)) {
								if (entry.type.toLowerCase() == 'd') {
									queue.push(currentPath + '/' + entry.name);
								}
								else {
									entry.path = currentPath;
									files.push(entry);
								}
							}
						}
						catch (err) {
							console.error(err);
							reject(err);
						}
					});
					processQueue();
				})
				.catch(reject);
		}
	});
}

function formatDate(date) {
	return moment(date).format('YYYY-MM-DD HH:mm:ss');
}

function listFiles(list) {
	return new Promise((resolve, reject) => {
		var summary = {
			totalCount: 0,
			totalSize: 0,
			files: list
		};
		
		if (list) {
			summary.totalCount = list.length;
			
			list.forEach(entry => {
				summary.totalSize += entry.size;
				//console.log(`${formatDate(entry.date)} ${chalk.white(entry.path + '/' + entry.name)}`);
			});
			
			console.log(
				'Found ' + chalk.yellow(summary.totalCount) + 
				' new files totaling ' + chalk.yellow(filesize(summary.totalSize)));
			console.log('');
		}
		
		resolve(summary);
	});
}

function downloadFiles(ftp, listing, getLocalFileName) {
	return new Promise((resolve, reject) => {
		var todo = [].concat(listing.files);
		
		var summary = {
			downloaded: 0
		};
		
		function downloadFile(remoteFileName, localFileName, fileDate, append) {
			return new Promise((resolveDownload, rejectDownload) => {
				// First ensure the directory the file resides in exists
				// before we try creating the file
				var parentPath = path.dirname(localFileName);
				
				fileUtils.makeDirectory(parentPath)
					.then(() => {
						if (append) {
							console.log('Resuming: ' + remoteFileName);
							console.log('      To: ' + localFileName);
							//console.log('    Date: ' + fileDate);
						}
						else {
							console.log('Downloading: ' + remoteFileName);
							console.log('         To: ' + localFileName);
							//console.log('       Date: ' + fileDate);
						}
						
						ftp
							.binary()
							.then(() => {
								ftp.get(remoteFileName)
									.then(remoteStream => {
										var options = { flags: append ? 'a' : 'w' };
										
										var localStream = fs.createWriteStream(localFileName, options);
										
										remoteStream.once('close', () => {
											summary.downloaded++;
											
											if (!summary.lastFileDate || 
												summary.lastFileDate.getTime() < fileDate.getTime()) {
												summary.lastFileDate = fileDate;
											}
											
											if (append) {
												console.log('          Done');
											}
											else {
												console.log('             Done');
											}
											
											console.log('');
											resolveDownload();
										});
										
										remoteStream.once('error', err => {
											rejectDownload(err);
										});
										
										remoteStream.pipe(localStream);
									})
									.catch(rejectDownload);
							})
							.catch(rejectDownload);
					})
					.catch(rejectDownload);
			});
		}
		
		function processQueue() {
			if (todo.length == 0) {
				return resolve(summary);
			}
			
			var file = todo.shift();
			
			var remoteFileName = file.path + '/' + file.name;
			var localFileName = getLocalFileName(file);
			var fileDate = file.date;
			
			fs.stat(localFileName, (err, stat) => {
				if (err != null) {
					// The local file doesn't exist
					// so let's download it
					downloadFile(remoteFileName, localFileName, fileDate)
						.then(processQueue)
						.catch(reject);
				}
				else if (stat.isFile()) {
					if (stat.size == file.size) {
						// The local file is same size, which means 
						// we've already downloaded it, so let's skip it
						console.log('Already downloaded: ' + remoteFileName);
						processQueue();
					}
					else if (stat.size > file.size) {
						// The local file is larger than the remote file
						// Wierd...let's just delete the local file and
						// redownload the remote file
						console.log("Local file larger than remote - redownloading: " + localFileName);
						fs.unlink(localFileName, err => {
							if (err) {
								reject(err);
							}
							else {
								downloadFile(remoteFileName, localFileName, fileDate)
									.then(processQueue)
									.catch(reject);
							}
						});
					}
					else if (stat.size > 0) {
						// The local file exists but is smaller than remote
						// That means we haven't finished downloading it, so 
						// let's try to resume downloading
						ftp
							.restart(stat.size)
							.then(() => {
								downloadFile(remoteFileName, localFileName, fileDate, true)
									.then(processQueue)
									.catch(reject);
							},
							() => {
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
										downloadFile(remoteFileName, localFileName, fileDate)
											.then(processQueue)
											.catch(reject);
									}
								});
							});
					}
					else {
						downloadFile(remoteFileName, localFileName, fileDate)
							.then(processQueue)
							.catch(reject);
					}
				}
			});
		}
		
		processQueue();
	});
}