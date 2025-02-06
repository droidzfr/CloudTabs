const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuration
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const extensionName = "CloudTabs";
const version = manifest.version;
const outputFile = `${extensionName}_v${version}.zip`;
const tempDir = "build_temp";

// Files and directories to include
const includes = [
    "manifest.json",
    "background",
    "popup",
    "_locales",
    "assets"
];

// Files to exclude
const excludePatterns = [
    "*.md",
    "*.log",
    "*.js",
    "*.zip",
    ".git*",
    ".vs*",
    "node_modules",
    "build_temp"
];

console.log("📦 Building extension package...");

// Create output stream
const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
});

// Listen for all archive data to be written
output.on('close', function() {
    const size = archive.pointer() / 1024 / 1024; // Convert to MB
    console.log(`✅ Package created successfully!`);
    console.log(`📦 File: ${outputFile}`);
    console.log(`📏 Size: ${size.toFixed(2)} MB`);
    console.log(`🌐 Ready for the Chrome Web Store!`);
});

archive.on('error', function(err) {
    console.error('❌ Error while creating archive:', err);
    process.exit(1);
});

// Pipe archive data to the file
archive.pipe(output);

// Add files to the archive
includes.forEach(item => {
    if (fs.existsSync(item)) {
        const stat = fs.statSync(item);
        if (stat.isDirectory()) {
            archive.directory(item, item);
        } else {
            archive.file(item, { name: path.basename(item) });
        }
    } else {
        console.warn(`⚠️ Warning: ${item} not found`);
    }
});

// Finalize the archive
archive.finalize();
