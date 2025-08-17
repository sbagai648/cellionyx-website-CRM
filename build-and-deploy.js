const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Generate content hash for cache busting
function generateHash(content) {
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

// Build process
function build() {
    console.log('🔨 Building Cellionyx website...');
    
    // Read the main.js file (use main.min.js as source)
    const mainJsPath = fs.existsSync('js/main.min.js') ? 'js/main.min.js' : 'js/main.js';
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
    const mainJsHash = generateHash(mainJsContent);
    
    // Copy main.js to versioned file
    const versionedMainJs = `js/main.${mainJsHash}.js`;
    fs.writeFileSync(versionedMainJs, mainJsContent);
    console.log(`✅ Created ${versionedMainJs}`);
    
    // Read the style.css file
    const styleCssPath = fs.existsSync('css/style.min.css') ? 'css/style.min.css' : 'css/style.css';
    const styleCssContent = fs.readFileSync(styleCssPath, 'utf8');
    const styleCssHash = generateHash(styleCssContent);
    
    // Copy style.css to versioned file
    const versionedStyleCss = `css/style.${styleCssHash}.css`;
    fs.writeFileSync(versionedStyleCss, styleCssContent);
    console.log(`✅ Created ${versionedStyleCss}`);
    
    // Update index.html with versioned files
    let indexContent = fs.readFileSync('index.html', 'utf8');
    
    // Replace script tag
    indexContent = indexContent.replace(
        /<script src="js\/[^"]*"><\/script>/,
        `<script src="${versionedMainJs}"></script>`
    );
    
    // Replace style tags (both preload and noscript)
    indexContent = indexContent.replace(
        /href="css\/style[^"]*"/g,
        `href="${versionedStyleCss}"`
    );
    
    // Save updated index.html
    fs.writeFileSync('index.html', indexContent);
    console.log('✅ Updated index.html with versioned assets');
    
    // Clean up old versioned files
    const jsFiles = fs.readdirSync('js');
    jsFiles.forEach(file => {
        if (file.match(/^main\.[a-f0-9]{8}\.js$/) && file !== `main.${mainJsHash}.js`) {
            fs.unlinkSync(`js/${file}`);
            console.log(`🗑️  Removed old file: js/${file}`);
        }
    });
    
    const cssFiles = fs.readdirSync('css');
    cssFiles.forEach(file => {
        if (file.match(/^style\.[a-f0-9]{8}\.css$/) && file !== `style.${styleCssHash}.css`) {
            fs.unlinkSync(`css/${file}`);
            console.log(`🗑️  Removed old file: css/${file}`);
        }
    });
    
    return { mainJsHash, styleCssHash };
}

// Deploy process
function deploy() {
    console.log('🚀 Deploying to Firebase...');
    try {
        execSync('firebase deploy --only hosting', { stdio: 'inherit' });
        console.log('✅ Deployment complete!');
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

// Main execution
console.log('=================================');
console.log('Cellionyx Production Build & Deploy');
console.log('=================================\n');

const { mainJsHash, styleCssHash } = build();
deploy();

console.log('\n=================================');
console.log('✅ Build and deployment successful!');
console.log(`Main JS: main.${mainJsHash}.js`);
console.log(`Style CSS: style.${styleCssHash}.css`);
console.log('=================================');
