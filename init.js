const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class Log {
    static colors = {
        reset: "\x1b[0m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
    };

    // Method for logging success messages
    static success(message) {
        console.log(`${this.colors.green}%s${this.colors.reset}`, message);
    }

    // Method for logging error messages
    static error(message) {
        console.log(`${this.colors.red}%s${this.colors.reset}`, message);
    }

    // Method for logging warning messages
    static warning(message) {
        console.log(`${this.colors.yellow}%s${this.colors.reset}`, message);
    }
}

/**
 * Add the supportFullBleed to the manifest.
 */
function addSupportFullBleed(path) {

    fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
            Log.error(err);
            return;
        }

        // Split the content by new line to insert the new property on a specific line
        let lines = data.split('\n');

        // Your specific line number where to add the new property
        const lineNumber = 12; // Arrays are zero-indexed, so line 13 is at index 12

        let flag = data.includes(`"supportsFullBleed": true,`)

        if (flag) {
            Log.warning("supportsFullBleed already exist.")
            return
        }
        // Check if the line number is within the bounds of the current file
        if (lineNumber >= 0 && lineNumber <= lines.length && !flag) {
            // Insert the new property at the specified line number
            lines[lineNumber] = `${lines[lineNumber]} \n  "supportsFullBleed": true,`

            // Convert the array of lines back into a single string
            let modifiedData = lines.join('\n');

            // Write the modified data back to the file
            fs.writeFile(path, modifiedData, 'utf8', (err) => {
                if (err) {
                    Log.error(err);
                } else {
                    Log.success('File updated successfully.');
                }
            });
        } else {
            Log.warning('Specified line number is out of bounds.');
        }
    });
}

/**
 * Get the manifest path and then calls addSupportFullBleed().
 */
function getManifestInDirectory(directoryPath) {
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            Log.error(`Error reading directory: ${directoryPath}`, err);
            return;
        }

        // Filter and sort .manifest.json files
        const manifestFiles = files
            .filter(file => file.endsWith('.manifest.json'))
            .sort(); // Sorts alphabetically by default

        if (manifestFiles.length === 0) {
            Log.error('No .manifest.json files found.');
            return;
        }

        // Select the last file based on alphabetical order
        const lastManifestFile = manifestFiles[manifestFiles.length - 1];
        const fullPath = path.join(directoryPath, lastManifestFile);

        // Call your function to update the selected manifest file
        addSupportFullBleed(fullPath);
    });
}

/**
 * Add the solution.version.
 */
function updateWebPartFile(filePath) {

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            Log.error('Error reading the file:', err);
            return;
        }

        // Flags to check if modifications are necessary
        let needsSolutionImport = !data.includes('const { solution } = require("../../../config/package-solution.json");');
        let needsVersionUpdate = !data.includes('return Version.parse(solution.version);');

        // Modify the content if necessary
        if (needsSolutionImport || needsVersionUpdate) {
            let updatedData = data;

            if (needsSolutionImport) {
                // Insert the require statement after the last import
                const lastImportIndex = updatedData.lastIndexOf('import');
                const insertionIndex = updatedData.indexOf('\n', lastImportIndex) + 1;
                updatedData = updatedData.slice(0, insertionIndex) + 'const { solution } = require("../../../config/package-solution.json");\n' + updatedData.slice(insertionIndex);
            }

            if (needsVersionUpdate) {
                updatedData = updatedData.replace("return Version.parse('1.0');".trim(), 'return Version.parse(solution.version);');
            }

            // Write the updated content back to the file
            fs.writeFile(filePath, updatedData, 'utf8', (writeErr) => {
                if (writeErr) {
                    Log.error('Error writing the updated file:', writeErr);
                    return;
                }
                Log.success('File has been updated successfully.');
            });
        } else {
            Log.success('No updates are necessary.');
        }
    });
}

/**
 * Get the main web part path and then calls updateWebPartFile().
 */
function getMainWebPartFileInDirectory(directoryPath, filePattern) {
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            Log.error(`Error reading directory: ${directoryPath}`, err);
            return;
        }

        // Filter files by the provided pattern and sort them
        const filteredFiles = files.filter(file => filePattern.test(file)).sort();

        if (filteredFiles.length === 0) {
            Log.error(`No files matching the pattern ${filePattern} found.`);
            return;
        }

        // Select the last file based on the sorting
        const lastFile = filteredFiles[filteredFiles.length - 1];
        const fullPath = path.join(directoryPath, lastFile);

        // Apply updates to the selected file
        updateWebPartFile(fullPath);
    });
}

/**
 * Delete the eslintrc.js file.
 */
function deleteEslintrc() {
    // Convert to absolute path to avoid confusion
    const absolutePath = "./.eslintrc.js";

    fs.access(absolutePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File does not exist
            Log.error(`File does not exist: ${absolutePath}`);
            return;
        }

        // File exists, proceed to delete
        fs.unlink(absolutePath, (err) => {
            if (err) {
                Log.error(`Error deleting file: ${absolutePath}`);
                return;
            }
            Log.success(`File deleted successfully: ${absolutePath}`);
        });
    });
}

/**
 * Copies a file or recursively copies a directory from source to destination.
 * @param {string} source - The path to the source file or directory.
 * @param {string} destination - The path to the destination directory.
 */
function copyFileOrDirectory(source, destination) {
    fs.stat(source, function (err, stats) {
        if (err) {
            Log.error(`Error accessing source: ${source}`);
            return;
        }

        if (stats.isFile()) {
            // Ensure the destination directory exists before copying a file
            const destDir = path.dirname(destination);
            fs.mkdir(destDir, { recursive: true }, (err) => {
                if (err) {
                    Log.error(`Error creating directory: ${destDir}`);
                    return;
                }

                // Copy the file
                const fileName = path.basename(source);
                const dest = path.join(destination, fileName);

                fs.copyFile(source, dest, (err) => {
                    if (err) {
                        Log.error(`Error copying file from ${source} to ${destination}`);
                        return;
                    }
                    Log.success(`File copied from ${source} to ${destination}`);
                });
            });
        } else if (stats.isDirectory()) {
            // Create the destination directory if it doesn't exist
            fs.mkdir(destination, { recursive: true }, (err) => {
                if (err) {
                    Log.error(`Error creating directory: ${destination}`);
                    return;
                }

                // Read and copy all items in the directory
                fs.readdir(source, (err, files) => {
                    if (err) {
                        Log.error(`Error reading directory: ${source}`);
                        return;
                    }

                    files.forEach((file) => {
                        const newSourcePath = path.join(source, file);
                        const newDestinationPath = path.join(destination, file); // Corrected destination path
                        copyFileOrDirectory(newSourcePath, newDestinationPath);
                    });
                });
            });
        }
    });
}

/**
 * Replaces the "scripts" section in package.json with a new set of scripts.
 * @param {string} packageJsonPath - The path to the package.json file.
 */
function replacePackageJsonScripts(packageJsonPath) {
    fs.readFile(packageJsonPath, 'utf8', (err, data) => {
        if (err) {
            Log.error(`Error reading ${packageJsonPath}:`, err);
            return;
        }

        try {
            const packageJson = JSON.parse(data);

            // New scripts to be inserted
            const newScripts = {
                "build": "node ./services/updateVersion.service.js npm run clean && npm run bundle && npm run package-solution && npm run deploy",
                "clean": "gulp clean",
                "bundle": "gulp bundle --ship --continueOnError",
                "package-solution": "gulp package-solution --ship",
                "open-explorer": "start sharepoint\\solution",
                "deploy": "powershell -ExecutionPolicy Bypass -File ./services/deployApp.service.ps1",
                "start": "gulp bundle --custom-serve --max_old_space_size=4096 && fast-serve",
                "serve": "fast-serve"
            };

            // Replace the scripts section
            packageJson.scripts = newScripts;

            // Write the modified package.json back to file
            fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8', (err) => {
                if (err) {
                    Log.error(`Error writing ${packageJsonPath}:`, err);
                    return;
                }
                Log.success(`Scripts section in ${packageJsonPath} replaced successfully.`);
            });
        } catch (error) {
            Log.error('Error parsing JSON from package.json:', error);
        }
    });
}

/**
 * Runs a list of commands sequentially, with support for interactive input.
 * @param {Array.<{command: string, args: string[]}>} commands - An array of objects containing the command and its arguments.
 * @param {number} [index=0] - The current index of the command to run.
 */
function runCommandsWithInput(commands, index = 0) {
    if (index >= commands.length) {
        console.log('All commands executed successfully.');
        return; // All commands have been executed
    }

    const { command, args, input } = commands[index];
    console.log(`Executing command: ${command} ${args.join(' ')}`);

    // Corrected stdio configuration for interaction and output capture
    const spawnedProcess = spawn(command, args, { stdio: ['pipe', 'inherit', 'inherit'], shell: true });

    if (input) {
        spawnedProcess.stdin.write(input);
        spawnedProcess.stdin.end(); // Ensure to close the stdin to continue execution
    }

    spawnedProcess.on('close', (code) => {
        console.log(`Command "${command}" exited with code ${code}.`);
        // Recursively call the next command in the sequence
        runCommandsWithInput(commands, index + 1);
    });

    spawnedProcess.on('error', (error) => {
        Log.error(`Error with command "${command}": ${error}`);
    });
}

function WrtieToTSConfig(filePath) {
    fs.readFile(filePath, "utf-8", (err, data) => {

        if (err) {
            Log.error(`Error: ${err}`)
            return;
        }

        // Flags to check if modifications are necessary
        let needsNoImplicitAny = !data.includes('"noImplicitAny": true,');
        let needsNoUnusedLocals = !data.includes('"noUnusedLocals": false,');

        // Modify the content if necessary
        if (needsNoImplicitAny || needsNoUnusedLocals) {
            let updatedData = data;

            if (needsNoImplicitAny) {
                // Write the updated content back to the file
                fs.writeFile(filePath, updatedData, 'utf8', (writeErr) => {
                    if (writeErr) {
                        Log.error('Error writing the updated file:', writeErr);
                        return;
                    }
                    Log.success('File has been updated successfully.');
                });
            }
        }
    })
}

const directoryPath = './src/webparts/jobsList'; // Adjust the path to your directory
const filePattern = /\.ts$/; // Regex pattern to match .ts files

const commandsToRun = [
    { command: 'npm', args: ['i', 'spfx-fast-serve', '-g'] },
    { command: 'spfx-fast-serve', args: [], input: '\n' }, // Simulate pressing Enter
    { command: 'npm', args: ['i'] }
];

// Example usage:
// getManifestInDirectory(directoryPath);
// getMainWebPartFileInDirectory(directoryPath, filePattern);
// deleteEslintrc()
// copyFileOrDirectory("./../../AssetsFiles/PnPjsConfig.ts", "./src/webparts")
// copyFileOrDirectory("./../../AssetsFiles/services", "./services")
// copyFileOrDirectory("./../../AssetsFiles/fast-serve", "./fast-serve")
// copyFileOrDirectory("./../../AssetsFiles/createCmp.js", "./")
// const packageJsonPath = path.join(__dirname, 'package.json'); // Adjust the path as necessary
// replacePackageJsonScripts(packageJsonPath);
// runCommandsWithInput(commandsToRun);
